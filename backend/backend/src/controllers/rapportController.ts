import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { AuthenticatedRequest } from '@/middleware/auth';
import { sendSuccess, sendSuccessWithPagination, sendError } from '@/utils/response';
import { getPagination, createPaginationMeta } from '@/utils/pagination';
import { CreateRapportRequest, ValidateRapportRequest } from '@/types';
import { logger } from '@/config/logger';

export const getRapports = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { page, limit, statut, technicienId, missionId } = req.query;
    const pagination = getPagination({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    const where: Record<string, unknown> = {};

    if (statut) {
      where.statut = statut as string;
    }

    if (technicienId) {
      where.technicienId = parseInt(technicienId as string);
    }

    if (missionId) {
      where.missionId = parseInt(missionId as string);
    }

    const [rapports, total] = await Promise.all([
      prisma.rapportMission.findMany({
        where,
        include: {
          intervention: {
            include: {
              mission: {
                include: {
                  client: true
                }
              }
            }
          },
          technicien: {
            include: {
              specialite: true
            }
          },
          mission: {
            include: {
              client: true
            }
          },
          createdBy: {
            select: {
              id: true,
              nom: true,
              prenom: true
            }
          },
          images: {
            orderBy: {
              ordre: 'asc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: pagination.skip,
        take: pagination.take
      }),
      prisma.rapportMission.count({ where })
    ]);

    const paginationMeta = createPaginationMeta(total, pagination.page, pagination.limit);

    sendSuccessWithPagination(
      res,
      rapports,
      paginationMeta,
      'Rapports récupérés avec succès'
    );
  } catch (error) {
    logger.error('Error fetching rapports:', error);
    sendError(res, 'Erreur lors de la récupération des rapports');
  }
};

export const getRapportById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const rapportId = parseInt(id);

    const rapport = await prisma.rapportMission.findUnique({
      where: { id: rapportId },
      include: {
        intervention: {
          include: {
            mission: {
              include: {
                client: true
              }
            }
          }
        },
        technicien: {
          include: {
            specialite: true,
            utilisateur: {
              include: {
                role: true
              }
            }
          }
        },
        mission: {
          include: {
            client: true
          }
        },
        createdBy: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        },
        images: {
          orderBy: {
            ordre: 'asc'
          }
        }
      }
    });

    if (!rapport) {
      sendError(res, 'Rapport non trouvé', 404);
      return;
    }

    sendSuccess(res, rapport, 'Rapport récupéré avec succès');
  } catch (error) {
    logger.error('Error fetching rapport:', error);
    sendError(res, 'Erreur lors de la récupération du rapport');
  }
};

export const createRapport = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      titre,
      contenu,
      interventionId,
      technicienId,
      missionId,
      images
    }: CreateRapportRequest = req.body;

    // Vérifier que l'intervention existe
    if (interventionId) {
      const intervention = await prisma.intervention.findUnique({
        where: { id: interventionId }
      });

      if (!intervention) {
        sendError(res, 'Intervention non trouvée', 404);
        return;
      }
    }

    // Vérifier que le technicien existe
    const technicien = await prisma.technicien.findUnique({
      where: { id: technicienId }
    });

    if (!technicien) {
      sendError(res, 'Technicien non trouvé', 404);
      return;
    }

    // Vérifier que la mission existe
    const mission = await prisma.mission.findUnique({
      where: { numIntervention: missionId }
    });

    if (!mission) {
      sendError(res, 'Mission non trouvée', 404);
      return;
    }

    const rapport = await prisma.rapportMission.create({
      data: {
        titre,
        contenu,
        interventionId,
        technicienId,
        missionId,
        createdById: req.user!.id,
        images: images ? {
          create: images.map((image, index) => ({
            url: image.url,
            description: image.description,
            ordre: index + 1
          }))
        } : undefined
      },
      include: {
        intervention: {
          include: {
            mission: {
              include: {
                client: true
              }
            }
          }
        },
        technicien: {
          include: {
            specialite: true
          }
        },
        mission: {
          include: {
            client: true
          }
        },
        createdBy: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        },
        images: {
          orderBy: {
            ordre: 'asc'
          }
        }
      }
    });

    sendSuccess(res, rapport, 'Rapport créé avec succès', 201);
  } catch (error) {
    logger.error('Error creating rapport:', error);
    sendError(res, 'Erreur lors de la création du rapport');
  }
};

export const updateRapport = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const rapportId = parseInt(id);
    const { titre, contenu, images }: CreateRapportRequest = req.body; // Utiliser CreateRapportRequest pour la structure

    // Vérifier que le rapport existe
    const existingRapport = await prisma.rapportMission.findUnique({
      where: { id: rapportId }
    });

    if (!existingRapport) {
      sendError(res, 'Rapport non trouvé', 404);
      return;
    }

    // Mettre à jour le rapport et gérer les images
    const rapport = await prisma.rapportMission.update({
      where: { id: rapportId },
      data: {
        titre,
        contenu,
        images: images ? {
          deleteMany: {},
          create: images.map((image, index) => ({
            url: image.url,
            description: image.description,
            ordre: index + 1
          }))
        } : undefined
      },
      include: {
        intervention: {
          include: {
            mission: {
              include: {
                client: true
              }
            }
          }
        },
        technicien: {
          include: {
            specialite: true
          }
        },
        mission: {
          include: {
            client: true
          }
        },
        createdBy: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        },
        images: {
          orderBy: {
            ordre: 'asc'
          }
        }
      }
    });

    sendSuccess(res, rapport, 'Rapport mis à jour avec succès');
  } catch (error) {
    logger.error('Error updating rapport:', error);
    sendError(res, 'Erreur lors de la mise à jour du rapport');
  }
};

export const validateRapport = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const rapportId = parseInt(id);
    const { statut, commentaire }: ValidateRapportRequest = req.body;

    // Vérifier que le rapport existe
    const existingRapport = await prisma.rapportMission.findUnique({
      where: { id: rapportId }
    });

    if (!existingRapport) {
      sendError(res, 'Rapport non trouvé', 404);
      return;
    }

    const rapport = await prisma.rapportMission.update({
      where: { id: rapportId },
      data: {
        statut,
        dateValidation: new Date(),
        commentaire
      },
      include: {
        intervention: {
          include: {
            mission: {
              include: {
                client: true
              }
            }
          }
        },
        technicien: {
          include: {
            specialite: true
          }
        },
        mission: {
          include: {
            client: true
          }
        },
        createdBy: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        },
        images: {
          orderBy: {
            ordre: 'asc'
          }
        }
      }
    });

    sendSuccess(res, rapport, 'Rapport validé avec succès');
  } catch (error) {
    logger.error('Error validating rapport:', error);
    sendError(res, 'Erreur lors de la validation du rapport');
  }
};

export const deleteRapport = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const rapportId = parseInt(id);

    // Vérifier que le rapport existe
    const rapport = await prisma.rapportMission.findUnique({
      where: { id: rapportId }
    });

    if (!rapport) {
      sendError(res, 'Rapport non trouvé', 404);
      return;
    }

    await prisma.rapportMission.delete({
      where: { id: rapportId }
    });

    sendSuccess(res, null, 'Rapport supprimé avec succès');
  } catch (error) {
    logger.error('Error deleting rapport:', error);
    sendError(res, 'Erreur lors de la suppression du rapport');
  }
};