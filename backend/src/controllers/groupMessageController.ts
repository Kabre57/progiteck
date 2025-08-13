import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { sendSuccess, sendError } from '@/utils/response';
import { logger } from '@/config/logger';
import '@/types';

// Récupérer les messages d'un groupe
export const getGroupMessages = async (req: Request, res: Response) => {
  try {
    const groupeId = req.params.groupeId ? parseInt(req.params.groupeId) : undefined;
    if (!groupeId) return sendError(res, 'Groupe ID manquant');
    const messages = await prisma.messageGroupe.findMany({
      where: { groupeId },
      include: {
        user: { select: { id: true, nom: true, prenom: true } },
        groupe: { select: { id: true, nom: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
    sendSuccess(res, messages, 'Messages du groupe récupérés');
  } catch (error) {
    logger.error('Error fetching group messages:', error);
    sendError(res, 'Erreur lors de la récupération des messages du groupe');
  }
};

// Envoyer un message dans le groupe (avec fichiers)
export const sendGroupMessage = async (req: Request, res: Response) => {
  try {
    const groupeId = req.params.groupeId ? parseInt(req.params.groupeId) : undefined;
    if (!groupeId) return sendError(res, 'Groupe ID manquant');

    const userId = req.user?.id;
    if (!userId) return sendError(res, 'Utilisateur non authentifié');
    const { contenu } = req.body;
    const attachments: Array<{ url: string; originalName: string; mimetype: string }> = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        attachments.push({
          url: `/uploads/${file.filename}`,
          originalName: file.originalname,
          mimetype: file.mimetype
        });
      }
    }
    const message = await prisma.messageGroupe.create({
      data: {
        contenu,
        userId,
        groupeId,
        attachments
      }
    });
    sendSuccess(res, message, 'Message envoyé au groupe', 201);
  } catch (error) {
    logger.error('Error sending group message:', error);
    sendError(res, 'Erreur lors de l\'envoi du message au groupe');
  }
};
