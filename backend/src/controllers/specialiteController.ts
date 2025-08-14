import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { sendSuccess, sendError } from '@/utils/response';
import { logger } from '@/config/logger';

export const getSpecialites = async (_req: Request, res: Response): Promise<void> => {
  // 'req' n'est pas utilisé, conservé uniquement pour la signature Express
  try {
    const specialites = await prisma.specialite.findMany({
      include: {
        _count: {
          select: {
            techniciens: true
          }
        }
      },
      orderBy: {
        libelle: 'asc'
      }
    });

    sendSuccess(res, specialites, 'Spécialités récupérées avec succès');
  } catch (error) {
    logger.error('Error fetching specialites:', error);
    sendError(res, 'Erreur lors de la récupération des spécialités');
  }
};

export const getSpecialiteById = async (req: Request, res: Response): Promise<void> => {
  try {
  const { id } = req.params;
  const specialiteId = parseInt(id ?? '');

    const specialite = await prisma.specialite.findUnique({
      where: { id: specialiteId },
      include: {
        techniciens: {
          include: {
            utilisateur: {
              include: {
                role: true
              }
            }
          }
        },
        _count: {
          select: {
            techniciens: true
          }
        }
      }
    });

    if (!specialite) {
      sendError(res, 'Spécialité non trouvée', 404);
      return;
    }

    sendSuccess(res, specialite, 'Spécialité récupérée avec succès');
  } catch (error) {
    logger.error('Error fetching specialite:', error);
    sendError(res, 'Erreur lors de la récupération de la spécialité');
  }
};

export const createSpecialite = async (req: Request, res: Response): Promise<void> => {
  try {
  const { libelle, description } = req.body;

    // Vérifier que la spécialité n'existe pas déjà
    const existingSpecialite = await prisma.specialite.findUnique({
      where: { libelle }
    });

    if (existingSpecialite) {
      sendError(res, 'Une spécialité avec ce libellé existe déjà', 400);
      return;
    }

    const specialite = await prisma.specialite.create({
      data: {
        libelle,
        description
      },
      include: {
        _count: {
          select: {
            techniciens: true
          }
        }
      }
    });

    sendSuccess(res, specialite, 'Spécialité créée avec succès', 201);
  } catch (error) {
    logger.error('Error creating specialite:', error);
    sendError(res, 'Erreur lors de la création de la spécialité');
  }
};

export const updateSpecialite = async (req: Request, res: Response): Promise<void> => {
  try {
  const { id } = req.params;
  const specialiteId = parseInt(id ?? '');
  const updateData = req.body;

    // Vérifier que la spécialité existe
    const existingSpecialite = await prisma.specialite.findUnique({
      where: { id: specialiteId }
    });

    if (!existingSpecialite) {
      sendError(res, 'Spécialité non trouvée', 404);
      return;
    }

    // Si libellé est modifié, vérifier qu'il n'existe pas déjà
    if (updateData.libelle && updateData.libelle !== existingSpecialite.libelle) {
      const libelleExists = await prisma.specialite.findUnique({
        where: { libelle: updateData.libelle }
      });

      if (libelleExists) {
        sendError(res, 'Une spécialité avec ce libellé existe déjà', 400);
        return;
      }
    }

    const specialite = await prisma.specialite.update({
      where: { id: specialiteId },
      data: updateData,
      include: {
        _count: {
          select: {
            techniciens: true
          }
        }
      }
    });

    sendSuccess(res, specialite, 'Spécialité mise à jour avec succès');
  } catch (error) {
    logger.error('Error updating specialite:', error);
    sendError(res, 'Erreur lors de la mise à jour de la spécialité');
  }
};

export const deleteSpecialite = async (req: Request, res: Response): Promise<void> => {
  try {
  const { id } = req.params;
  const specialiteId = parseInt(id ?? '');

    // Vérifier que la spécialité existe
    const specialite = await prisma.specialite.findUnique({
      where: { id: specialiteId },
      include: {
        techniciens: true
      }
    });

    if (!specialite) {
      sendError(res, 'Spécialité non trouvée', 404);
      return;
    }

    // Vérifier qu'il n'y a pas de techniciens liés
    if (specialite.techniciens.length > 0) {
      sendError(
        res,
        'Impossible de supprimer une spécialité avec des techniciens associés',
        400
      );
      return;
    }

    await prisma.specialite.delete({
      where: { id: specialiteId }
    });

    sendSuccess(res, null, 'Spécialité supprimée avec succès');
  } catch (error) {
    logger.error('Error deleting specialite:', error);
    sendError(res, 'Erreur lors de la suppression de la spécialité');
  }
};