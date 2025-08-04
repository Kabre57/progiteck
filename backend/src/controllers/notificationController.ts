import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { AuthenticatedRequest } from '@/middleware/auth';
import { sendSuccess, sendSuccessWithPagination, sendError } from '@/utils/response';
import { getPagination, createPaginationMeta } from '@/utils/pagination';
import { CreateNotificationRequest, UpdateNotificationPreferencesRequest } from '@/types';
import { logger } from '@/config/logger';

export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { page, limit, unreadOnly } = req.query;
    const pagination = getPagination({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    const userId = req.user!.id;
    const where: Record<string, unknown> = { userId };

    if (unreadOnly === 'true') {
      where.readAt = null;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip: pagination.skip,
        take: pagination.take
      }),
      prisma.notification.count({ where })
    ]);

    const paginationMeta = createPaginationMeta(total, pagination.page, pagination.limit);

    sendSuccessWithPagination(
      res,
      notifications,
      paginationMeta,
      'Notifications récupérées avec succès'
    );
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    sendError(res, 'Erreur lors de la récupération des notifications');
  }
};

export const getUnreadCount = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        readAt: null
      }
    });

    sendSuccess(res, { unreadCount }, 'Nombre de notifications non lues récupéré');
  } catch (error) {
    logger.error('Error fetching unread count:', error);
    sendError(res, 'Erreur lors de la récupération du nombre de notifications non lues');
  }
};

export const getPreferences = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    // Créer des préférences par défaut si elles n'existent pas
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId,
          checkUnusualActivity: true,
          checkNewSignIn: true,
          notifyLatestNews: true,
          notifyFeatureUpdate: true,
          notifyAccountTips: true
        }
      });
    }

    sendSuccess(res, preferences, 'Préférences de notification récupérées');
  } catch (error) {
    logger.error('Error fetching notification preferences:', error);
    sendError(res, 'Erreur lors de la récupération des préférences');
  }
};

export const updatePreferences = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const updateData: UpdateNotificationPreferencesRequest = req.body;

    const preferences = await prisma.notificationPreference.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData
      }
    });

    sendSuccess(res, preferences, 'Préférences mises à jour avec succès');
  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    sendError(res, 'Erreur lors de la mise à jour des préférences');
  }
};

export const markAsRead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const notificationId = parseInt(id);
    const userId = req.user!.id;

    // Vérifier que la notification existe et appartient à l'utilisateur
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      sendError(res, 'Notification non trouvée', 404);
      return;
    }

    if (notification.userId !== userId) {
      sendError(res, 'Vous ne pouvez marquer comme lue que vos propres notifications', 403);
      return;
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        readAt: new Date()
      }
    });

    sendSuccess(res, updatedNotification, 'Notification marquée comme lue');
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    sendError(res, 'Erreur lors du marquage de la notification comme lue');
  }
};

export const markAllAsRead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: {
        userId,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    sendSuccess(res, null, 'Toutes les notifications marquées comme lues');
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    sendError(res, 'Erreur lors du marquage de toutes les notifications comme lues');
  }
};

export const createNotification = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId, type, message, data }: CreateNotificationRequest = req.body;

    // Vérifier que l'utilisateur destinataire existe
    const user = await prisma.utilisateur.findUnique({
      where: { id: userId }
    });

    if (!user) {
      sendError(res, 'Utilisateur destinataire non trouvé', 404);
      return;
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        data
      }
    });

    sendSuccess(res, notification, 'Notification créée avec succès', 201);
  } catch (error) {
    logger.error('Error creating notification:', error);
    sendError(res, 'Erreur lors de la création de la notification');
  }
};

export const deleteNotification = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const notificationId = parseInt(id);
    const userId = req.user!.id;

    // Vérifier que la notification existe et appartient à l'utilisateur
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      sendError(res, 'Notification non trouvée', 404);
      return;
    }

    if (notification.userId !== userId) {
      sendError(res, 'Vous ne pouvez supprimer que vos propres notifications', 403);
      return;
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    });

    sendSuccess(res, null, 'Notification supprimée avec succès');
  } catch (error) {
    logger.error('Error deleting notification:', error);
    sendError(res, 'Erreur lors de la suppression de la notification');
  }
};