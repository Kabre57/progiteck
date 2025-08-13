import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { AuthenticatedRequest } from '@/middleware/auth';
import { sendSuccess, sendSuccessWithPagination, sendError } from '@/utils/response';
import { getPagination, createPaginationMeta } from '@/utils/pagination';

import { logger } from '@/config/logger';

export const getMessages = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { page, limit, type } = req.query;
    const pagination = getPagination({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    const userId = req.user!.id;
    let where: Record<string, unknown> = {};

    if (type === 'sent') {
      where = { senderId: userId };
    } else if (type === 'received') {
      where = { receiverId: userId };
    } else {
      where = {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      };
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true
            }
          },
          receiver: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: pagination.skip,
        take: pagination.take
      }),
      prisma.message.count({ where })
    ]);

    const paginationMeta = createPaginationMeta(total, pagination.page, pagination.limit);

    sendSuccessWithPagination(
      res,
      messages,
      paginationMeta,
      'Messages récupérés avec succès'
    );
  } catch (error) {
    logger.error('Error fetching messages:', error);
    sendError(res, 'Erreur lors de la récupération des messages');
  }
};

export const getConversations = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Récupérer les conversations (derniers messages par utilisateur)
    const conversations = await prisma.$queryRaw<Array<{
      userId: number;
      nom: string;
      prenom: string;
      email: string;
      lastMessage: string;
      lastMessageDate: Date;
      unreadCount: number;
    }>>`
      WITH conversation_users AS (
        SELECT DISTINCT
          CASE 
            WHEN sender_id = ${userId} THEN receiver_id
            ELSE sender_id
          END as user_id
        FROM messages
        WHERE sender_id = ${userId} OR receiver_id = ${userId}
      ),
      last_messages AS (
        SELECT DISTINCT ON (
          CASE 
            WHEN sender_id = ${userId} THEN receiver_id
            ELSE sender_id
          END
        )
          CASE 
            WHEN sender_id = ${userId} THEN receiver_id
            ELSE sender_id
          END as user_id,
          contenu as last_message,
          created_at as last_message_date
        FROM messages
        WHERE sender_id = ${userId} OR receiver_id = ${userId}
        ORDER BY 
          CASE 
            WHEN sender_id = ${userId} THEN receiver_id
            ELSE sender_id
          END,
          created_at DESC
      ),
      unread_counts AS (
        SELECT 
          sender_id as user_id,
          COUNT(*) as unread_count
        FROM messages
        WHERE receiver_id = ${userId} AND lu = false
        GROUP BY sender_id
      )
      SELECT 
        u.id as "userId",
        u.nom,
        u.prenom,
        u.email,
        lm.last_message as "lastMessage",
        lm.last_message_date as "lastMessageDate",
        COALESCE(uc.unread_count, 0) as "unreadCount"
      FROM conversation_users cu
      JOIN utilisateurs u ON u.id = cu.user_id
      JOIN last_messages lm ON lm.user_id = cu.user_id
      LEFT JOIN unread_counts uc ON uc.user_id = cu.user_id
      ORDER BY lm.last_message_date DESC
    `;

    sendSuccess(res, conversations, 'Conversations récupérées avec succès');
  } catch (error) {
    logger.error('Error fetching conversations:', error);
    sendError(res, 'Erreur lors de la récupération des conversations');
  }
};

export const getUnreadCount = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const unreadCount = await prisma.message.count({
      where: {
        receiverId: userId,
        readAt: null
      }
    });

    sendSuccess(res, { unreadCount }, 'Nombre de messages non lus récupéré');
  } catch (error) {
    logger.error('Error fetching unread count:', error);
    sendError(res, 'Erreur lors de la récupération du nombre de messages non lus');
  }
};

export const sendMessage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { contenu, receiverId }: { contenu: string; receiverId: number } = req.body;
    const senderId = req.user!.id;

    // Vérifier que le destinataire existe
    const receiver = await prisma.utilisateur.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      sendError(res, 'Destinataire non trouvé', 404);
      return;
    }

    const message = await prisma.message.create({
      data: {
        contenu,
        senderId,
        receiverId
      },
      include: {
        sender: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        }
      }
    });

    sendSuccess(res, message, 'Message envoyé avec succès', 201);
  } catch (error) {
    logger.error('Error sending message:', error);
    sendError(res, 'Erreur lors de l\'envoi du message');
  }
};

export const markAsRead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) return sendError(res, 'ID du message manquant');
    const messageId = parseInt(id);
    const userId = req.user!.id;

    // Vérifier que le message existe et appartient à l'utilisateur
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      sendError(res, 'Message non trouvé', 404);
      return;
    }

    if (message.receiverId !== userId) {
      sendError(res, 'Vous ne pouvez marquer comme lu que vos propres messages', 403);
      return;
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        readAt: new Date()
      },
      include: {
        sender: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        }
      }
    });

    sendSuccess(res, updatedMessage, 'Message marqué comme lu');
  } catch (error) {
    logger.error('Error marking message as read:', error);
    sendError(res, 'Erreur lors du marquage du message comme lu');
  }
};

export const deleteMessage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) return sendError(res, 'ID du message manquant');
    const messageId = parseInt(id);
    const userId = req.user!.id;

    // Vérifier que le message existe et appartient à l'utilisateur
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      sendError(res, 'Message non trouvé', 404);
      return;
    }

    if (message.senderId !== userId && message.receiverId !== userId) {
      sendError(res, 'Vous ne pouvez supprimer que vos propres messages', 403);
      return;
    }

    await prisma.message.delete({
      where: { id: messageId }
    });

    sendSuccess(res, null, 'Message supprimé avec succès');
  } catch (error) {
    logger.error('Error deleting message:', error);
    sendError(res, 'Erreur lors de la suppression du message');
  }
};