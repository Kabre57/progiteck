import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { sendSuccess, sendError } from '@/utils/response';
import { CreateTypePaiementRequest, UpdateTypePaiementRequest } from '@/types';
import { logger } from '@/config/logger';

export const getTypesPaiement = async (req: Request, res: Response): Promise<void> => {
  try {
    const typesPaiement = await prisma.typePaiement.findMany({
      include: {
        _count: {
          select: {
            clients: true
          }
        }
      },
      orderBy: {
        libelle: 'asc'
      }
    });

    sendSuccess(res, typesPaiement, 'Types de paiement récupérés avec succès');
  } catch (error) {
    logger.error('Error fetching types paiement:', error);
    sendError(res, 'Erreur lors de la récupération des types de paiement');
  }
};

export const getTypePaiementById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const typePaiementId = parseInt(id);

    const typePaiement = await prisma.typePaiement.findUnique({
      where: { id: typePaiementId },
      include: {
        clients: true,
        _count: {
          select: {
            clients: true
          }
        }
      }
    });

    if (!typePaiement) {
      sendError(res, 'Type de paiement non trouvé', 404);
      return;
    }

    sendSuccess(res, typePaiement, 'Type de paiement récupéré avec succès');
  } catch (error) {
    logger.error('Error fetching type paiement:', error);
    sendError(res, 'Erreur lors de la récupération du type de paiement');
  }
};

export const createTypePaiement = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      libelle,
      description,
      delaiPaiement,
      tauxRemise,
      actif
    }: CreateTypePaiementRequest = req.body;

    // Vérifier que le libellé n'existe pas déjà
    const existingType = await prisma.typePaiement.findUnique({
      where: { libelle }
    });

    if (existingType) {
      sendError(res, 'Un type de paiement avec ce libellé existe déjà', 400);
      return;
    }

    const typePaiement = await prisma.typePaiement.create({
      data: {
        libelle,
        description,
        delaiPaiement,
        tauxRemise,
        actif: actif ?? true
      },
      include: {
        _count: {
          select: {
            clients: true
          }
        }
      }
    });

    sendSuccess(res, typePaiement, 'Type de paiement créé avec succès', 201);
  } catch (error) {
    logger.error('Error creating type paiement:', error);
    sendError(res, 'Erreur lors de la création du type de paiement');
  }
};

export const updateTypePaiement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const typePaiementId = parseInt(id);
    const updateData: UpdateTypePaiementRequest = req.body;

    // Vérifier que le type de paiement existe
    const existingType = await prisma.typePaiement.findUnique({
      where: { id: typePaiementId }
    });

    if (!existingType) {
      sendError(res, 'Type de paiement non trouvé', 404);
      return;
    }

    // Si libellé est modifié, vérifier qu'il n'existe pas déjà
    if (updateData.libelle && updateData.libelle !== existingType.libelle) {
      const libelleExists = await prisma.typePaiement.findUnique({
        where: { libelle: updateData.libelle }
      });

      if (libelleExists) {
        sendError(res, 'Un type de paiement avec ce libellé existe déjà', 400);
        return;
      }
    }

    const typePaiement = await prisma.typePaiement.update({
      where: { id: typePaiementId },
      data: updateData,
      include: {
        _count: {
          select: {
            clients: true
          }
        }
      }
    });

    sendSuccess(res, typePaiement, 'Type de paiement mis à jour avec succès');
  } catch (error) {
    logger.error('Error updating type paiement:', error);
    sendError(res, 'Erreur lors de la mise à jour du type de paiement');
  }
};

export const deleteTypePaiement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const typePaiementId = parseInt(id);

    // Vérifier que le type de paiement existe
    const typePaiement = await prisma.typePaiement.findUnique({
      where: { id: typePaiementId },
      include: {
        clients: true
      }
    });

    if (!typePaiement) {
      sendError(res, 'Type de paiement non trouvé', 404);
      return;
    }

    // Vérifier qu'il n'y a pas de clients liés
    if (typePaiement.clients.length > 0) {
      sendError(
        res,
        'Impossible de supprimer un type de paiement avec des clients associés',
        400
      );
      return;
    }

    await prisma.typePaiement.delete({
      where: { id: typePaiementId }
    });

    sendSuccess(res, null, 'Type de paiement supprimé avec succès');
  } catch (error) {
    logger.error('Error deleting type paiement:', error);
    sendError(res, 'Erreur lors de la suppression du type de paiement');
  }
};