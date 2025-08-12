import { Response } from 'express';
import { prisma } from '@/config/database';
import { AuthenticatedRequest } from '@/middleware/auth';
import { sendSuccess, sendSuccessWithPagination, sendError } from '@/utils/response';
import { getPagination, createPaginationMeta } from '@/utils/pagination';
import { CreateTechnicienRequest } from '@/types';
import { logger } from '@/config/logger';

export const getTechniciens = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { page, limit, specialiteId, search } = req.query;
    const pagination = getPagination({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    const where: Record<string, unknown> = {};

    if (specialiteId) {
      where.specialiteId = parseInt(specialiteId as string);
    }

    if (search) {
      where.OR = [
        { nom: { contains: search as string, mode: 'insensitive' } },
        { prenom: { contains: search as string, mode: 'insensitive' } },
        { contact: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [techniciens, total] = await Promise.all([
      prisma.technicien.findMany({
        where,
        include: {
          specialite: true,
          utilisateur: {
            include: {
              role: true
            }
          },
          _count: {
            select: {
              interventions: true
            }
          }
        },
        orderBy: [
          { nom: 'asc' },
          { prenom: 'asc' }
        ],
        skip: pagination.skip,
        take: pagination.take
      }),
      prisma.technicien.count({ where })
    ]);

    const paginationMeta = createPaginationMeta(total, pagination.page, pagination.limit);

    sendSuccessWithPagination(
      res,
      techniciens,
      paginationMeta,
      'Techniciens récupérés avec succès'
    );
  } catch (error) {
    logger.error('Error fetching techniciens:', error);
    sendError(res, 'Erreur lors de la récupération des techniciens');
  }
};

export const getTechnicienById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const technicienId = parseInt(id as string);

    const technicien = await prisma.technicien.findUnique({
      where: { id: technicienId },
      include: {
        specialite: true,
        utilisateur: {
          include: {
            role: true
          }
        },
        interventions: {
          include: {
            intervention: {
              include: {
                mission: {
                  include: {
                    client: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            interventions: true
          }
        }
      }
    });

    if (!technicien) {
      sendError(res, 'Technicien non trouvé', 404);
      return;
    }

    sendSuccess(res, technicien, 'Technicien récupéré avec succès');
  } catch (error) {
    logger.error('Error fetching technicien:', error);
    sendError(res, 'Erreur lors de la récupération du technicien');
  }
};

export const createTechnicien = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      nom,
      prenom,
      contact,
      specialiteId,
      utilisateurId
    }: CreateTechnicienRequest = req.body;

    // Vérifier que la spécialité existe
    const specialite = await prisma.specialite.findUnique({
      where: { id: specialiteId }
    });

    if (!specialite) {
      sendError(res, 'Spécialité non trouvée', 404);
      return;
    }

    // Si utilisateurId est fourni, vérifier qu'il existe et n'est pas déjà lié
    if (utilisateurId) {
      const utilisateur = await prisma.utilisateur.findUnique({
        where: { id: utilisateurId }
      });

      if (!utilisateur) {
        sendError(res, 'Utilisateur non trouvé', 404);
        return;
      }

      const existingTechnicien = await prisma.technicien.findUnique({
        where: { utilisateurId }
      });

      if (existingTechnicien) {
        sendError(res, 'Cet utilisateur est déjà lié à un technicien', 400);
        return;
      }
    }

    const technicien = await prisma.technicien.create({
      data: {
        nom,
        prenom,
        contact,
        specialiteId,
        utilisateurId: utilisateurId ?? null
      },
      include: {
        specialite: true,
        utilisateur: {
          include: {
            role: true
          }
        },
        _count: {
          select: {
            interventions: true
          }
        }
      }
    });

    sendSuccess(res, technicien, 'Technicien créé avec succès', 201);
  } catch (error) {
    logger.error('Error creating technicien:', error);
    sendError(res, 'Erreur lors de la création du technicien');
  }
};

export const updateTechnicien = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const technicienId = parseInt(id as string);
    const updateData: Partial<CreateTechnicienRequest> = req.body;

    // Vérifier que le technicien existe
    const existingTechnicien = await prisma.technicien.findUnique({
      where: { id: technicienId }
    });

    if (!existingTechnicien) {
      sendError(res, 'Technicien non trouvé', 404);
      return;
    }

    // Si specialiteId est fourni, vérifier qu'elle existe
    if (updateData.specialiteId) {
      const specialite = await prisma.specialite.findUnique({
        where: { id: updateData.specialiteId }
      });

      if (!specialite) {
        sendError(res, 'Spécialité non trouvée', 404);
        return;
      }
    }

    // Si utilisateurId est fourni, vérifier qu'il existe et n'est pas déjà lié
    if (updateData.utilisateurId && updateData.utilisateurId !== existingTechnicien.utilisateurId) {
      const utilisateur = await prisma.utilisateur.findUnique({
        where: { id: updateData.utilisateurId }
      });

      if (!utilisateur) {
        sendError(res, 'Utilisateur non trouvé', 404);
        return;
      }

      const existingLink = await prisma.technicien.findUnique({
        where: { utilisateurId: updateData.utilisateurId as number }
      });

      if (existingLink) {
        sendError(res, 'Cet utilisateur est déjà lié à un technicien', 400);
        return;
      }
    }

    const technicien = await prisma.technicien.update({
      where: { id: technicienId },
      data: updateData,
      include: {
        specialite: true,
        utilisateur: {
          include: {
            role: true
          }
        },
        _count: {
          select: {
            interventions: true
          }
        }
      }
    });

    sendSuccess(res, technicien, 'Technicien mis à jour avec succès');
  } catch (error) {
    logger.error('Error updating technicien:', error);
    sendError(res, 'Erreur lors de la mise à jour du technicien');
  }
};

export const deleteTechnicien = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const technicienId = parseInt(id as string);

    // Vérifier que le technicien existe
    const technicien = await prisma.technicien.findUnique({
      where: { id: technicienId },
      include: {
        interventions: true,
        rapports: true
      }
    });

    if (!technicien) {
      sendError(res, 'Technicien non trouvé', 404);
      return;
    }

    // Vérifier qu'il n'y a pas d'interventions ou de rapports liés
    if (technicien.interventions.length > 0 || technicien.rapports.length > 0) {
      sendError(
        res,
        'Impossible de supprimer un technicien avec des interventions ou rapports associés',
        400
      );
      return;
    }

    await prisma.technicien.delete({
      where: { id: technicienId }
    });

    sendSuccess(res, null, 'Technicien supprimé avec succès');
  } catch (error) {
    logger.error('Error deleting technicien:', error);
    sendError(res, 'Erreur lors de la suppression du technicien');
  }
};