import prisma from '../utils/prisma';
import { Prisma, Mission, Intervention } from '@prisma/client';

export class MissionService {

  /**
   * Créer une nouvelle mission
   */
  static async createMission(data: Prisma.MissionCreateInput): Promise<Mission> {
    try {
      const mission = await prisma.mission.create({
        data,
        include: {
          client: {
            include: {
              typePaiement: true,
            },
          },
          interventions: {
            include: {
              techniciens: {
                include: {
                  technicien: {
                    include: {
                      specialite: true,
                      utilisateur: true,
                    },
                  },
                },
              },
            },
          },
          devis: true,
          rapports: true,
        },
      });
      return mission;
    } catch (error) {
      console.error('Erreur lors de la création de la mission:', error);
      throw error;
    }
  }

  /**
   * Récupérer une mission par numéro d'intervention
   */
  static async getMissionByNumIntervention(numIntervention: string): Promise<Mission | null> {
    try {
      const mission = await prisma.mission.findUnique({
        where: { numIntervention },
        include: {
          client: {
            include: {
              typePaiement: true,
            },
          },
          interventions: {
            include: {
              techniciens: {
                include: {
                  technicien: {
                    include: {
                      specialite: true,
                      utilisateur: true,
                    },
                  },
                },
              },
              rapports: true,
              sortiesMateriels: {
                include: {
                  materiel: true,
                  technicien: {
                    include: {
                      utilisateur: true,
                    },
                  },
                },
              },
            },
            orderBy: { dateHeureDebut: 'desc' },
          },
          devis: {
            include: {
              lignes: true,
              validateur: true,
              validateurPDG: true,
            },
            orderBy: { dateCreation: 'desc' },
          },
          rapports: {
            include: {
              technicien: {
                include: {
                  utilisateur: true,
                  specialite: true,
                },
              },
              images: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      return mission;
    } catch (error) {
      console.error('Erreur lors de la récupération de la mission:', error);
      throw error;
    }
  }

  /**
   * Récupérer toutes les missions avec filtres et pagination
   */
  static async getAllMissions(
    page: number = 1,
    limit: number = 10,
    filters?: {
      clientId?: number;
      statut?: string;
      priorite?: string;
      dateDebut?: Date;
      dateFin?: Date;
      search?: string;
    }
  ) {
    try {
      const skip = (page - 1) * limit;
      
      const where: Prisma.MissionWhereInput = {};
      
      if (filters?.clientId) {
        where.clientId = filters.clientId;
      }
      
      if (filters?.statut) {
        where.statut = filters.statut;
      }
      
      if (filters?.priorite) {
        where.priorite = filters.priorite;
      }
      
      if (filters?.dateDebut && filters?.dateFin) {
        where.dateSortieFicheIntervention = {
          gte: filters.dateDebut,
          lte: filters.dateFin,
        };
      }
      
      if (filters?.search) {
        where.OR = [
          { numIntervention: { contains: filters.search, mode: 'insensitive' } },
          { natureIntervention: { contains: filters.search, mode: 'insensitive' } },
          { objectifDuContrat: { contains: filters.search, mode: 'insensitive' } },
          { client: { nom: { contains: filters.search, mode: 'insensitive' } } },
        ];
      }

      const [missions, total] = await prisma.$transaction([
        prisma.mission.findMany({
          where,
          include: {
            client: true,
            interventions: {
              include: {
                techniciens: {
                  include: {
                    technicien: {
                      include: {
                        utilisateur: true,
                        specialite: true,
                      },
                    },
                  },
                },
              },
            },
            devis: {
              select: {
                id: true,
                numero: true,
                statut: true,
                montantTTC: true,
              },
            },
            _count: {
              select: {
                interventions: true,
                rapports: true,
                devis: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.mission.count({ where }),
      ]);

      return {
        data: missions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des missions:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour le statut d'une mission
   */
  static async updateMissionStatus(
    numIntervention: string,
    statut: string
  ): Promise<Mission> {
    try {
      const mission = await prisma.mission.update({
        where: { numIntervention },
        data: {
          statut,
          updatedAt: new Date(),
        },
        include: {
          client: true,
          interventions: true,
        },
      });
      return mission;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de la mission:', error);
      throw error;
    }
  }

  /**
   * Créer une intervention pour une mission
   */
  static async createIntervention(
    missionId: string,
    data: Omit<Prisma.InterventionCreateInput, 'mission'>,
    technicienIds: number[]
  ): Promise<Intervention> {
    try {
      const intervention = await prisma.$transaction(async (tx) => {
        // Créer l'intervention
        const newIntervention = await tx.intervention.create({
          data: {
            ...data,
            mission: {
              connect: { numIntervention: missionId },
            },
          },
        });

        // Associer les techniciens à l'intervention
        if (technicienIds.length > 0) {
          await tx.technicienIntervention.createMany({
            data: technicienIds.map((technicienId, index) => ({
              technicienId,
              interventionId: newIntervention.id,
              role: index === 0 ? 'responsable' : 'assistant',
            })),
          });
        }

        // Mettre à jour le statut de la mission si nécessaire
        await tx.mission.update({
          where: { numIntervention: missionId },
          data: {
            statut: 'en_cours',
            updatedAt: new Date(),
          },
        });

        return newIntervention;
      });

      // Récupérer l'intervention complète avec les relations
      const fullIntervention = await prisma.intervention.findUnique({
        where: { id: intervention.id },
        include: {
          mission: {
            include: {
              client: true,
            },
          },
          techniciens: {
            include: {
              technicien: {
                include: {
                  utilisateur: true,
                  specialite: true,
                },
              },
            },
          },
        },
      });

      return fullIntervention!;
    } catch (error) {
      console.error('Erreur lors de la création de l\'intervention:', error);
      throw error;
    }
  }

  /**
   * Terminer une intervention
   */
  static async finishIntervention(
    interventionId: number,
    dateHeureFin: Date,
    rapportData?: {
      titre: string;
      contenu: string;
      technicienId: number;
    }
  ): Promise<Intervention> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Récupérer l'intervention pour calculer la durée
        const intervention = await tx.intervention.findUnique({
          where: { id: interventionId },
          include: { mission: true },
        });

        if (!intervention) {
          throw new Error('Intervention non trouvée');
        }

        // Calculer la durée en minutes
        const duree = Math.round(
          (dateHeureFin.getTime() - intervention.dateHeureDebut.getTime()) / (1000 * 60)
        );

        // Mettre à jour l'intervention
        const updatedIntervention = await tx.intervention.update({
          where: { id: interventionId },
          data: {
            dateHeureFin,
            duree,
            updatedAt: new Date(),
          },
        });

        // Créer un rapport si fourni
        if (rapportData) {
          await tx.rapportMission.create({
            data: {
              ...rapportData,
              interventionId,
              missionId: intervention.missionId,
              statut: 'soumis',
            },
          });
        }

        // Vérifier si toutes les interventions de la mission sont terminées
        const interventionsEnCours = await tx.intervention.count({
          where: {
            missionId: intervention.missionId,
            dateHeureFin: null,
          },
        });

        // Si plus d'interventions en cours, marquer la mission comme terminée
        if (interventionsEnCours === 0) {
          await tx.mission.update({
            where: { numIntervention: intervention.missionId },
            data: {
              statut: 'terminee',
              updatedAt: new Date(),
            },
          });
        }

        return updatedIntervention;
      });

      // Récupérer l'intervention complète
      const fullIntervention = await prisma.intervention.findUnique({
        where: { id: result.id },
        include: {
          mission: {
            include: {
              client: true,
            },
          },
          techniciens: {
            include: {
              technicien: {
                include: {
                  utilisateur: true,
                  specialite: true,
                },
              },
            },
          },
          rapports: true,
        },
      });

      return fullIntervention!;
    } catch (error) {
      console.error('Erreur lors de la finalisation de l\'intervention:', error);
      throw error;
    }
  }

  /**
   * Récupérer les missions par client
   */
  static async getMissionsByClient(clientId: number): Promise<Mission[]> {
    try {
      const missions = await prisma.mission.findMany({
        where: { clientId },
        include: {
          client: true,
          interventions: {
            include: {
              techniciens: {
                include: {
                  technicien: {
                    include: {
                      utilisateur: true,
                      specialite: true,
                    },
                  },
                },
              },
            },
          },
          devis: {
            select: {
              id: true,
              numero: true,
              statut: true,
              montantTTC: true,
            },
          },
          _count: {
            select: {
              interventions: true,
              rapports: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return missions;
    } catch (error) {
      console.error('Erreur lors de la récupération des missions par client:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques des missions
   */
  static async getMissionStats() {
    try {
      const stats = await prisma.$transaction([
        // Total des missions
        prisma.mission.count(),
        
        // Missions par statut
        prisma.mission.groupBy({
          by: ['statut'],
          _count: true,
        }),
        
        // Missions par priorité
        prisma.mission.groupBy({
          by: ['priorite'],
          _count: true,
        }),
        
        // Missions créées ce mois
        prisma.mission.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
        
        // Interventions en cours
        prisma.intervention.count({
          where: {
            dateHeureFin: null,
          },
        }),
      ]);

      return {
        totalMissions: stats[0],
        missionsByStatus: stats[1],
        missionsByPriority: stats[2],
        missionsThisMonth: stats[3],
        interventionsEnCours: stats[4],
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques des missions:', error);
      throw error;
    }
  }
}

