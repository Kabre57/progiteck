import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { AuthenticatedRequest } from '@/middleware/auth';
import { sendSuccess, sendSuccessWithPagination, sendError } from '@/utils/response';
import { getPagination, createPaginationMeta } from '@/utils/pagination';
import { CreateInterventionRequest, UpdateInterventionRequest, CheckAvailabilityRequest } from '@/types';
import { logger } from '@/config/logger';

export const getInterventions = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { page, limit, missionId, search } = req.query;
    const pagination = getPagination({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    const where: Record<string, unknown> = {};

    if (missionId) {
      where.missionId = parseInt(missionId as string);
    }

    if (search) {
      where.OR = [
        { mission: { natureIntervention: { contains: search as string, mode: 'insensitive' } } },
        { mission: { client: { nom: { contains: search as string, mode: 'insensitive' } } } }
      ];
    }

    const [interventions, total] = await Promise.all([
      prisma.intervention.findMany({
        where,
        include: {
          mission: {
            include: {
              client: true
            }
          },
          techniciens: {
            include: {
              technicien: {
                include: {
                  specialite: true
                }
              }
            }
          },
          sortiesMateriels: {
            include: {
              materiel: true
            }
          }
        },
        orderBy: {
          dateHeureDebut: 'desc'
        },
        skip: pagination.skip,
        take: pagination.take
      }),
      prisma.intervention.count({ where })
    ]);

    const paginationMeta = createPaginationMeta(total, pagination.page, pagination.limit);

    sendSuccessWithPagination(
      res,
      interventions,
      paginationMeta,
      'Interventions récupérées avec succès'
    );
  } catch (error) {
    logger.error('Error fetching interventions:', error);
    sendError(res, 'Erreur lors de la récupération des interventions');
  }
};

export const getInterventionById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const interventionId = parseInt(id);

    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId },
      include: {
        mission: {
          include: {
            client: true
          }
        },
        techniciens: {
          include: {
            technicien: {
              include: {
                specialite: true,
                utilisateur: {
                  include: {
                    role: true
                  }
                }
              }
            }
          }
        },
        rapportsMission: {
          include: {
            technicien: true,
            images: true
          }
        },
        sortiesMateriels: {
          include: {
            materiel: true
          }
        }
      }
    });

    if (!intervention) {
      sendError(res, 'Intervention non trouvée', 404);
      return;
    }

    sendSuccess(res, intervention, 'Intervention récupérée avec succès');
  } catch (error) {
    logger.error('Error fetching intervention:', error);
    sendError(res, 'Erreur lors de la récupération de l\'intervention');
  }
};

export const createIntervention = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      dateHeureDebut,
      dateHeureFin,
      duree,
      missionId,
      techniciens,
      materiels
    }: CreateInterventionRequest = req.body;

    // Vérifier que la mission existe
    const mission = await prisma.mission.findUnique({
      where: { numIntervention: missionId }
    });

    if (!mission) {
      sendError(res, 'Mission non trouvée', 404);
      return;
    }

    // Vérifier que tous les techniciens existent
    if (techniciens) {
      for (const tech of techniciens) {
        const technicien = await prisma.technicien.findUnique({
          where: { id: tech.technicienId }
        });

        if (!technicien) {
          sendError(res, `Technicien avec l'ID ${tech.technicienId} non trouvé`, 404);
          return;
        }
      }
    }

    // Vérifier que tous les matériels existent et sont disponibles
    if (materiels) {
      for (const mat of materiels) {
        const materiel = await prisma.materiel.findUnique({
          where: { id: mat.materielId }
        });

        if (!materiel) {
          sendError(res, `Matériel avec l'ID ${mat.materielId} non trouvé`, 404);
          return;
        }
        if (materiel.quantiteDisponible < mat.quantite) {
          sendError(res, `Quantité insuffisante pour le matériel ${materiel.designation}`, 400);
          return;
        }
      }
    }

    // Créer l'intervention avec les techniciens et les matériels dans une transaction
    const intervention = await prisma.$transaction(async (tx) => {
      // Créer l'intervention
      const newIntervention = await tx.intervention.create({
        data: {
          dateHeureDebut: dateHeureDebut ? new Date(dateHeureDebut) : null,
          dateHeureFin: dateHeureFin ? new Date(dateHeureFin) : null,
          duree,
          missionId,
          techniciens: techniciens ? {
            create: techniciens.map(tech => ({
              technicienId: tech.technicienId,
              role: tech.role,
              commentaire: tech.commentaire
            }))
          } : undefined
        }
      });

      // Créer les sorties de matériels et mettre à jour le stock
      if (materiels) {
        for (const mat of materiels) {
          // Créer la sortie de matériel
          await tx.sortieMateriel.create({
            data: {
              materielId: mat.materielId,
              interventionId: newIntervention.id,
              quantite: mat.quantite,
              commentaire: mat.commentaire,
              technicienId: techniciens && techniciens.length > 0 ? techniciens[0].technicienId : 1
            }
          });

          // Mettre à jour le stock du matériel
          await tx.materiel.update({
            where: { id: mat.materielId },
            data: {
              quantiteDisponible: {
                decrement: mat.quantite
              }
            }
          });
        }
      }

      // Retourner l'intervention avec toutes les relations
      return await tx.intervention.findUnique({
        where: { id: newIntervention.id },
        include: {
          mission: {
            include: {
              client: true
            }
          },
          techniciens: {
            include: {
              technicien: {
                include: {
                  specialite: true
                }
              }
            }
          },
          sortiesMateriels: {
            include: {
              materiel: true
            }
          }
        }
      });
    });
    sendSuccess(res, intervention, 'Intervention créée avec succès', 201);
  } catch (error) {
    logger.error('Error creating intervention:', error);
    sendError(res, 'Erreur lors de la création de l\'intervention');
  }
};

export const updateIntervention = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const interventionId = parseInt(id);
    const updateData: UpdateInterventionRequest = req.body;

    // Vérifier que l'intervention existe
    const existingIntervention = await prisma.intervention.findUnique({
      where: { id: interventionId }
    });

    if (!existingIntervention) {
      sendError(res, 'Intervention non trouvée', 404);
      return;
    }

    // Mettre à jour l'intervention dans une transaction pour gérer le stock
    const intervention = await prisma.$transaction(async (tx) => {
      // Récupérer les anciennes sorties de matériels pour restaurer le stock
      const oldSorties = await tx.sortieMateriel.findMany({
        where: { interventionId: interventionId }
      });

      // Restaurer le stock des anciens matériels
      for (const sortie of oldSorties) {
        await tx.materiel.update({
          where: { id: sortie.materielId },
          data: {
            quantiteDisponible: {
              increment: sortie.quantite
            }
          }
        });
      }

      // Supprimer les anciennes sorties
      await tx.sortieMateriel.deleteMany({
        where: { interventionId: interventionId }
      });

      // Mettre à jour l'intervention
      const updatedIntervention = await tx.intervention.update({
        where: { id: interventionId },
        data: {
          dateHeureDebut: updateData.dateHeureDebut ? new Date(updateData.dateHeureDebut) : undefined,
          dateHeureFin: updateData.dateHeureFin ? new Date(updateData.dateHeureFin) : undefined,
          duree: updateData.duree,
          techniciens: updateData.techniciens ? {
            deleteMany: {},
            create: updateData.techniciens.map(tech => ({
              technicienId: tech.technicienId,
              role: tech.role,
              commentaire: tech.commentaire
            }))
          } : undefined
        }
      });

      // Créer les nouvelles sorties de matériels et mettre à jour le stock
      if (updateData.materiels) {
        for (const mat of updateData.materiels) {
          // Vérifier la disponibilité du matériel
          const materiel = await tx.materiel.findUnique({
            where: { id: mat.materielId }
          });

          if (!materiel) {
            throw new Error(`Matériel avec l'ID ${mat.materielId} non trouvé`);
          }

          if (materiel.quantiteDisponible < mat.quantite) {
            throw new Error(`Quantité insuffisante pour le matériel ${materiel.designation}`);
          }

          // Créer la nouvelle sortie
          await tx.sortieMateriel.create({
            data: {
              materielId: mat.materielId,
              interventionId: interventionId,
              quantite: mat.quantite,
              commentaire: mat.commentaire,
              technicienId: updateData.techniciens && updateData.techniciens.length > 0 ? updateData.techniciens[0].technicienId : 1
            }
          });

          // Mettre à jour le stock
          await tx.materiel.update({
            where: { id: mat.materielId },
            data: {
              quantiteDisponible: {
                decrement: mat.quantite
              }
            }
          });
        }
      }

      // Retourner l'intervention mise à jour avec toutes les relations
      return await tx.intervention.findUnique({
        where: { id: interventionId },
        include: {
          mission: {
            include: {
              client: true
            }
          },
          techniciens: {
            include: {
              technicien: {
                include: {
                  specialite: true
                }
              }
            }
          },
          sortiesMateriels: {
            include: {
              materiel: true
            }
          }
        }
      });
    });

    sendSuccess(res, intervention, 'Intervention mise à jour avec succès');
  } catch (error) {
    logger.error('Error updating intervention:', error);
    sendError(res, 'Erreur lors de la mise à jour de l\'intervention');
  }
};

export const checkAvailability = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      technicienId,
      dateHeureDebut,
      dateHeureFin,
      excludeInterventionId
    }: CheckAvailabilityRequest = req.body;

    // ✅ CORRECTION : Convertir technicienId en entier
    const technicienIdInt = parseInt(technicienId.toString());
    
    // Validation de l'ID du technicien
    if (isNaN(technicienIdInt)) {
      sendError(res, 'ID du technicien invalide', 400);
      return;
    }

    logger.info(`Checking availability for technicien ID: ${technicienIdInt} (type: ${typeof technicienIdInt})`);

    // Vérifier que le technicien existe
    const technicien = await prisma.technicien.findUnique({
      where: { id: technicienIdInt }, // ✅ Utiliser l'entier converti
      include: {
        specialite: true
      }
    });

    if (!technicien) {
      sendError(res, 'Technicien non trouvé', 404);
      return;
    }

    const startDate = new Date(dateHeureDebut);
    const endDate = new Date(dateHeureFin);

    // Validation des dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      sendError(res, 'Dates invalides', 400);
      return;
    }

    if (startDate >= endDate) {
      sendError(res, 'La date de début doit être antérieure à la date de fin', 400);
      return;
    }

    // Vérifier les conflits d'horaires
    const conflictingInterventions = await prisma.intervention.findMany({
      where: {
        AND: [
          {
            techniciens: {
              some: {
                technicienId: technicienIdInt // ✅ Utiliser l'entier converti
              }
            }
          },
          {
            OR: [
              {
                AND: [
                  { dateHeureDebut: { lte: startDate } },
                  { dateHeureFin: { gte: startDate } }
                ]
              },
              {
                AND: [
                  { dateHeureDebut: { lte: endDate } },
                  { dateHeureFin: { gte: endDate } }
                ]
              },
              {
                AND: [
                  { dateHeureDebut: { gte: startDate } },
                  { dateHeureFin: { lte: endDate } }
                ]
              }
            ]
          },
          excludeInterventionId ? { id: { not: excludeInterventionId } } : {}
        ]
      },
      include: {
        mission: {
          include: {
            client: true
          }
        }
      }
    });

    const available = conflictingInterventions.length === 0;

    const response = {
      technicienId: technicienIdInt,
      technicien: `${technicien.prenom} ${technicien.nom}`,
      specialite: technicien.specialite?.libelle || 'Non définie',
      available,
      period: {
        debut: dateHeureDebut,
        fin: dateHeureFin
      },
      conflictingInterventions: conflictingInterventions.map(intervention => ({
        id: intervention.id,
        mission: intervention.mission.natureIntervention,
        client: intervention.mission.client.nom,
        dateDebut: intervention.dateHeureDebut?.toISOString(),
        dateFin: intervention.dateHeureFin?.toISOString()
      }))
    };

    logger.info(`Availability check completed for technicien ${technicienIdInt}: ${available}`);
    sendSuccess(res, response, 'Vérification de disponibilité effectuée');
  } catch (error) {
    logger.error('Error checking availability:', error);
    sendError(res, 'Erreur lors de la vérification de disponibilité');
  }
};

export const deleteIntervention = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const interventionId = parseInt(id);

    // Vérifier que l'intervention existe
    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId },
      include: {
        rapportsMission: true
      }
    });

    if (!intervention) {
      sendError(res, 'Intervention non trouvée', 404);
      return;
    }

    // Vérifier qu'il n'y a pas de rapports liés
    if (intervention.rapportsMission.length > 0) {
      sendError(
        res,
        'Impossible de supprimer une intervention avec des rapports associés',
        400
      );
      return;
    }

    await prisma.intervention.delete({
      where: { id: interventionId }
    });

    sendSuccess(res, null, 'Intervention supprimée avec succès');
  } catch (error) {
    logger.error('Error deleting intervention:', error);
    sendError(res, 'Erreur lors de la suppression de l\'intervention');
  }
};
