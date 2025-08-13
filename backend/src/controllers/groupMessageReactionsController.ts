import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { sendSuccess, sendError } from '@/utils/response';
import { logger } from '@/config/logger';

// PATCH /api/group-messages/:messageId/reactions
export const updateGroupMessageReactions = async (req: Request, res: Response) => {
  try {
          const messageIdParam = req.params.messageId;
          if (!messageIdParam) return sendError(res, 'ID du message manquant');
          const messageId = parseInt(messageIdParam);
    const { reactions } = req.body; // { like: n, emoji: { ... } }
    const message = await prisma.messageGroupe.update({
      where: { id: messageId },
      data: { reactions }
    });
    sendSuccess(res, message, 'Réactions mises à jour');
  } catch (error) {
    logger.error('Error updating reactions:', error);
    sendError(res, 'Erreur lors de la mise à jour des réactions');
  }
};
