import { Response } from 'express';
import { prisma } from '@/config/database';
import { AuthenticatedRequest } from '@/middleware/auth';
import { sendSuccess, sendSuccessWithPagination, sendError } from '@/utils/response';
import { getPagination, createPaginationMeta } from '@/utils/pagination';
import { generateMissionNumber } from '@/utils/generators';
import { CreateMissionRequest, Mission } from '@/types';
import { logger } from '@/config/logger';

export const getMissions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { page, limit, clientId, search } = req.query;
    const pagination = getPagination({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    const where: Record<string, unknown> = {};

    if (clientId) {
      where.clientId = parseInt(clientId as string);
    }

    if (search) {
      where.OR = [
        { numIntervention: { contains: search as string, mode: 'insensitive' } },
        { natureIntervention: { contains: search as string, mode: 'insensitive' } },
        { objectifDuContrat: { contains: search as string, mode: 'insensitive' } },
        { client: { nom: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    const [missions, total] = await Promise.all([
      prisma.mission.findMany({
        where,
        include: {
          client: {
            include: {
              typePaiement: true
            }
          },
          _count: {
            select: {
              interventions: true,
              rapports: true
            }
          }
        },
        orderBy: {
          dateSortieFicheIntervention: 'desc'
        },
        skip: pagination.skip,
        take: pagination.take
      }),
      prisma.mission.count({ where })
    ]);

    const paginationMeta = createPaginationMeta(total, pagination.page, pagination.limit);

    sendSuccessWithPagination(
      res,
      missions,
      paginationMeta,
      'Missions récupérées avec succès'
    );
  } catch (error) {
    logger.error('Error fetching missions:', error);
    sendError(res, 'Erreur lors de la récupération des missions');
  }
};

export const getMissionById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { numIntervention } = req.params;

    const mission = await prisma.mission.findUnique({
      where: { numIntervention },
      include: {
        client: {
          include: {
            typePaiement: true
          }
        },
        interventions: {
          include: {
            techniciens: {
              include: {
                technicien: {
                  include: {
                    specialite: true
                  }
                }
              }
            }
          }
        },
        rapports: {
          include: {
            technicien: {
              include: {
                specialite: true
              }
            },
            images: true
          }
        },
        _count: {
          select: {
            interventions: true,
            rapports: true
          }
        }
      }
    });

    if (!mission) {
      sendError(res, 'Mission non trouvée', 404);
      return;
    }

    sendSuccess(res, mission, 'Mission récupérée avec succès');
  } catch (error) {
    logger.error('Error fetching mission:', error);
    sendError(res, 'Erreur lors de la récupération de la mission');
  }
};
// Dans missionController.ts
export const createMission = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      natureIntervention,
      objectifDuContrat,
      description,
      priorite,
      statut,
      dateSortieFicheIntervention,
      clientId
    }: CreateMissionRequest = req.body;

    logger.info('Creating mission with data:', req.body);

    // Vérifier que le client existe
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      sendError(res, 'Client non trouvé', 404);
      return;
    }

    // Générer un numéro d'intervention unique
    let numIntervention: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!isUnique && attempts < maxAttempts) {
      attempts++;
      numIntervention = await generateMissionNumber();
      
      // Vérifier si le numéro existe déjà
      const existingMission = await prisma.mission.findUnique({
        where: { numIntervention }
      });

      if (!existingMission) {
        isUnique = true;
      }
    }

    if (!isUnique) {
      sendError(res, 'Impossible de générer un numéro d\'intervention unique', 500);
      return;
    }

    // Déterminer le statut initial de la mission
    const now = new Date();
    const missionStatut = new Date(dateSortieFicheIntervention) <= now ? 'en_cours' : 'planifiee';

    // Créer la mission
    const mission = await prisma.mission.create({
      data: {
        numIntervention,
        natureIntervention,
        objectifDuContrat,
        description,
        priorite: priorite || 'normale',
        statut: missionStatut,
        dateSortieFicheIntervention: new Date(dateSortieFicheIntervention),
        clientId
      },
      include: {
        client: {
          include: {
            typePaiement: true
          }
        },
        _count: {
          select: {
            interventions: true,
            rapports: true
          }
        }
      }
    });

    logger.info('Mission created successfully:', mission.numIntervention);

    sendSuccess(res, mission, 'Mission créée avec succès', 201);
  } catch (error) {
    logger.error('Error creating mission:', error);
    sendError(res, 'Erreur lors de la création de la mission');
  }
};

export const updateMission = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { numIntervention } = req.params;
    const updateData: Partial<CreateMissionRequest> = req.body;

    // Vérifier que la mission existe
    const existingMission = await prisma.mission.findUnique({
      where: { numIntervention }
    });

    if (!existingMission) {
      sendError(res, 'Mission non trouvée', 404);
      return;
    }

    // Si clientId est fourni, vérifier qu'il existe
    if (updateData.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: updateData.clientId }
      });

      if (!client) {
        sendError(res, 'Client non trouvé', 404);
        return;
      }
    }

    const mission = await prisma.mission.update({
      where: { numIntervention },
      data: {
        ...updateData,
        dateSortieFicheIntervention: updateData.dateSortieFicheIntervention 
          ? new Date(updateData.dateSortieFicheIntervention)
          : undefined
      },
      include: {
        client: {
          include: {
            typePaiement: true
          }
        },
        _count: {
          select: {
            interventions: true,
            rapports: true
          }
        }
      }
    });

    sendSuccess(res, mission, 'Mission mise à jour avec succès');
  } catch (error) {
    logger.error('Error updating mission:', error);
    sendError(res, 'Erreur lors de la mise à jour de la mission');
  }
};

export const deleteMission = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { numIntervention } = req.params;

    // Vérifier que la mission existe
    const mission = await prisma.mission.findUnique({
      where: { numIntervention },
      include: {
        interventions: true,
        rapports: true
      }
    });

    if (!mission) {
      sendError(res, 'Mission non trouvée', 404);
      return;
    }

    // Vérifier qu'il n'y a pas d'interventions ou de rapports liés
    if (mission.interventions.length > 0 || mission.rapports.length > 0) {
      sendError(
        res,
        'Impossible de supprimer une mission avec des interventions ou rapports associés',
        400
      );
      return;
    }

    await prisma.mission.delete({
      where: { numIntervention }
    });

    sendSuccess(res, null, 'Mission supprimée avec succès');
  } catch (error) {
    logger.error('Error deleting mission:', error);
    sendError(res, 'Erreur lors de la suppression de la mission');
  }
};