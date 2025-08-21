import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { sendSuccess, sendError } from '@/utils/response';
import { logger } from '@/config/logger';
import { Prisma } from '@prisma/client'; // ✅ IMPORTANT : Importer Prisma pour les types JSON

// Récupérer les messages d'un groupe
export const getGroupMessages = async (req: Request, res: Response) => {
  try {
    const groupeId = req.params.groupeId ? parseInt(req.params.groupeId, 10) : undefined;
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
    const groupeId = req.params.groupeId ? parseInt(req.params.groupeId, 10) : undefined;
    if (!groupeId) return sendError(res, 'Groupe ID manquant');

    // ✅ CORRECTION : `req.user` est maintenant reconnu grâce à la déclaration globale
    const userId = req.user?.id;
    if (!userId) return sendError(res, 'Utilisateur non authentifié', 401);

    const { contenu } = req.body;
    let attachmentsJson: Prisma.JsonValue | undefined = undefined;

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const attachmentsData = (req.files as Express.Multer.File[]).map(file => ({
        url: `/uploads/${file.filename}`,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      }));
      // ✅ CORRECTION : On s'assure que c'est un type JSON valide pour Prisma
      attachmentsJson = attachmentsData as unknown as Prisma.JsonValue;
    }

    const message = await prisma.messageGroupe.create({
      data: {
        contenu,
        userId,
        groupeId,
        // ✅ CORRECTION : On passe soit le JSON, soit undefined
        attachments: attachmentsJson
      }
    });
    sendSuccess(res, message, 'Message envoyé au groupe', 201);
  } catch (error) {
    logger.error('Error sending group message:', error);
    sendError(res, 'Erreur lors de l\'envoi du message au groupe');
  }
};
