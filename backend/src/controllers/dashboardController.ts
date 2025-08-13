import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { AuthenticatedRequest } from '@/middleware/auth';
import { sendSuccess, sendError } from '@/utils/response';
import { logger } from '@/config/logger';

export const getStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [
      totalClients,
      activeClients,
      totalTechniciens,
      totalMissions,
      missionsEnCours,
      totalInterventions,
      interventionsAujourdhui,
      devisEnAttente,
      facturesImpayees,
      rapportsEnAttente
    ] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { statut: 'active' } }),
      prisma.technicien.count(),
      prisma.mission.count(),
      prisma.mission.count({
        where: {
          interventions: {
            some: {
              dateHeureFin: null
            }
          }
        }
      }),
      prisma.intervention.count(),
      prisma.intervention.count({
        where: {
          dateHeureDebut: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      }),
      prisma.devis.count({
        where: {
          statut: {
            in: ['envoye', 'valide_dg']
          }
        }
      }),
      prisma.facture.count({
        where: {
          statut: {
            in: ['emise', 'envoyee']
          },
          dateEcheance: {
            lt: today
          }
        }
      }),
      prisma.rapportMission.count({
        where: {
          statut: 'soumis'
        }
      })
    ]);

    const stats = {
      clients: {
        total: totalClients,
        actifs: activeClients,
        label: 'Clients'
      },
      techniciens: {
        total: totalTechniciens,
        label: 'Techniciens'
      },
      missions: {
        total: totalMissions,
        enCours: missionsEnCours,
        label: 'Missions'
      },
      interventions: {
        total: totalInterventions,
        aujourdhui: interventionsAujourdhui,
        label: 'Interventions'
      },
      commercial: {
        devisEnAttente,
        facturesImpayees,
        label: 'Commercial'
      },
      rapports: {
        enAttente: rapportsEnAttente,
        label: 'Rapports'
      }
    };

    sendSuccess(res, stats, 'Statistiques récupérées avec succès');
  } catch (error) {
    logger.error('Error fetching stats:', error);
    sendError(res, 'Erreur lors de la récupération des statistiques');
  }
};

export const getCharts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Interventions par mois
    const interventionsParMois = await prisma.$queryRaw<Array<{
      mois: Date;
      total: bigint;
    }>>`
      SELECT
        DATE_TRUNC('month', "dateHeureDebut") as mois,
        COUNT(*) as total
      FROM interventions
      WHERE "dateHeureDebut" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "dateHeureDebut")
      ORDER BY mois ASC
    `;

    // Missions par statut (GROUP BY)
    const missionsParStatut = await prisma.$queryRaw<Array<{
      statut: string;
      total: bigint;
    }>>`
      SELECT statut, COUNT(*) as total
      FROM (
        SELECT
          m."numIntervention",
          CASE
            WHEN EXISTS (
              SELECT 1 FROM interventions i
              WHERE i."missionId" = m."numIntervention"
              AND i."dateHeureFin" IS NULL
            ) THEN 'En cours'
            WHEN EXISTS (
              SELECT 1 FROM interventions i
              WHERE i."missionId" = m."numIntervention"
              AND i."dateHeureFin" IS NOT NULL
            ) THEN 'Terminée'
            ELSE 'Planifiée'
          END as statut
        FROM missions m
      ) sub
      GROUP BY statut
      ORDER BY statut ASC
    `;

    // Top techniciens
    const topTechniciens = await prisma.$queryRaw<Array<{
      nom: string;
      prenom: string;
      specialite: string;
      total_interventions: bigint;
    }>>`
      SELECT
        t.nom,
        t.prenom,
        s.libelle as specialite,
        COUNT(ti.id) as total_interventions
      FROM techniciens t
      LEFT JOIN specialites s ON t."specialiteId" = s.id
      LEFT JOIN technicien_interventions ti ON t.id = ti."technicienId"
      GROUP BY t.id, t.nom, t.prenom, s.libelle
      ORDER BY total_interventions DESC
      LIMIT 10
    `;

    // Chiffre d'affaires par mois
    const chiffreAffaires = await prisma.$queryRaw<Array<{
      mois: Date;
      montant: number;
    }>>`
      SELECT
        DATE_TRUNC('month', "datePaiement") as mois,
        SUM("montantTTC") as montant
      FROM factures
      WHERE "datePaiement" >= ${sixMonthsAgo}
      AND statut = 'payee'
      GROUP BY DATE_TRUNC('month', "datePaiement")
      ORDER BY mois ASC
    `;

    // Interventions par spécialité
    const interventionsParSpecialite = await prisma.$queryRaw<Array<{
      specialite: string;
      total: bigint;
    }>>`
      SELECT
        s.libelle as specialite,
        COUNT(ti.id) as total
      FROM specialites s
      LEFT JOIN techniciens t ON s.id = t."specialiteId"
      LEFT JOIN technicien_interventions ti ON t.id = ti."technicienId"
      GROUP BY s.id, s.libelle
      ORDER BY total DESC
    `;

    const charts = {
      interventionsParMois: interventionsParMois.map(item => ({
        mois: item.mois.toISOString().substring(0, 7),
        total: Number(item.total)
      })),
      missionsParStatut: missionsParStatut.map(item => ({
        statut: item.statut,
        total: Number(item.total),
        color: item.statut === 'En cours' ? '#3b82f6' : 
               item.statut === 'Terminée' ? '#10b981' : '#f59e0b'
      })),
      topTechniciens: topTechniciens.map(item => ({
        nom: `${item.prenom} ${item.nom}`,
        specialite: item.specialite,
        total: Number(item.total_interventions)
      })),
      chiffreAffaires: chiffreAffaires.map(item => ({
        mois: item.mois.toISOString().substring(0, 7),
        montant: item.montant
      })),
      interventionsParSpecialite: interventionsParSpecialite.map(item => ({
        specialite: item.specialite,
        total: Number(item.total)
      }))
    };

    sendSuccess(res, charts, 'Données graphiques récupérées avec succès');
  } catch (error) {
    logger.error('Error fetching charts:', error);
    sendError(res, 'Erreur lors de la récupération des données graphiques');
  }
};

export const getRecentActivity = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { limit } = req.query;
    const limitNumber = limit ? parseInt(limit as string) : 10;

    const recentActivity = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            role: {
              select: {
                libelle: true
              }
            }
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limitNumber
    });

    sendSuccess(res, recentActivity, 'Activité récente récupérée avec succès');
  } catch (error) {
    logger.error('Error fetching recent activity:', error);
    sendError(res, 'Erreur lors de la récupération de l\'activité récente');
  }
};

export const getProjectsStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Missions en cours
    const missionsEnCours = await prisma.mission.findMany({
      where: {
        interventions: {
          some: {
            dateHeureFin: null
          }
        }
      },
      include: {
        client: true,
        interventions: {
          where: {
            dateHeureFin: null
          },
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
        _count: {
          select: {
            interventions: true,
            rapports: true
          }
        }
      },
      orderBy: {
        dateSortieFicheIntervention: 'asc'
      },
      take: 10
    });

    // Devis en attente de validation DG
    const devisValidationDG = await prisma.devis.findMany({
      where: {
        statut: 'envoye'
      },
      include: {
        client: true
      },
      orderBy: {
        dateCreation: 'asc'
      },
      take: 5
    });

    // Devis en attente de validation PDG
    const devisValidationPDG = await prisma.devis.findMany({
      where: {
        statut: 'valide_dg'
      },
      include: {
        client: true
      },
      orderBy: {
        dateValidationDG: 'asc'
      },
      take: 5
    });

    // Rapports en attente de validation
    const rapportsValidation = await prisma.rapportMission.findMany({
      where: {
        statut: 'soumis'
      },
      include: {
        technicien: true
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 5
    });

    // Factures en retard
    const facturesRetard = await prisma.facture.findMany({
      where: {
        statut: {
          in: ['emise', 'envoyee']
        },
        dateEcheance: {
          lt: today
        }
      },
      include: {
        client: true
      },
      orderBy: {
        dateEcheance: 'asc'
      },
      take: 5
    });

    // Interventions d'aujourd'hui
    const interventionsAujourdhui = await prisma.intervention.findMany({
      where: {
        dateHeureDebut: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      include: {
        mission: {
          include: {
            client: true
          }
        }
      },
      orderBy: {
        dateHeureDebut: 'asc'
      }
    });

    const projectsStatus = {
      missionsEnCours: missionsEnCours.map(mission => ({
        numIntervention: mission.numIntervention,
        natureIntervention: mission.natureIntervention,
        client: mission.client.nom,
        datePrevue: mission.dateSortieFicheIntervention.toISOString(),
        techniciens: mission.interventions.flatMap((intervention: { techniciens: any[]; }) =>
          intervention.techniciens.map((ti: { technicien: { prenom: any; nom: any; specialite: { libelle: any; }; }; role: any; }) => ({
            nom: `${ti.technicien.prenom} ${ti.technicien.nom}`,
            specialite: ti.technicien.specialite?.libelle || 'Non définie',
            role: ti.role || 'Non défini'
          }))
        )
      })),
      tachesPrioritaires: {
        devisValidationDG: devisValidationDG.map(devis => ({
          id: devis.id,
          numero: devis.numero,
          client: devis.client.nom,
          priorite: 'haute'
        })),
        devisValidationPDG: devisValidationPDG.map(devis => ({
          id: devis.id,
          numero: devis.numero,
          client: devis.client.nom,
          priorite: 'haute'
        })),
        rapportsValidation: rapportsValidation.map(rapport => ({
          id: rapport.id,
          titre: rapport.titre,
          technicien: `${rapport.technicien.prenom} ${rapport.technicien.nom}`,
          priorite: 'moyenne'
        })),
        facturesRetard: facturesRetard.map(facture => {
          const joursRetard = Math.floor((today.getTime() - facture.dateEcheance.getTime()) / (1000 * 60 * 60 * 24));
          return {
            id: facture.id,
            numero: facture.numero,
            client: facture.client.nom,
            joursRetard,
            priorite: joursRetard > 30 ? 'critique' : 'haute'
          };
        }),
        interventionsAujourdhui: interventionsAujourdhui.map(intervention => ({
          id: intervention.id,
          mission: intervention.mission.natureIntervention,
          client: intervention.mission.client.nom,
          heureDebut: intervention.dateHeureDebut?.toTimeString().substring(0, 5)
        }))
      }
    };

    sendSuccess(res, projectsStatus, 'Statut des projets récupéré avec succès');
  } catch (error) {
    logger.error('Error fetching projects status:', error);
    sendError(res, 'Erreur lors de la récupération du statut des projets');
  }
};

export const getKPIs = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      interventionsCurrentMonth,
      interventionsPreviousMonth,
      chiffreAffairesCurrentMonth,
      chiffreAffairesPreviousMonth,
      nouveauxClientsCurrentMonth,
      nouveauxClientsPreviousMonth,
      tauxValidation,
      tempsInterventionMoyen
    ] = await Promise.all([
      prisma.intervention.count({
        where: {
          createdAt: {
            gte: currentMonth,
            lt: nextMonth
          }
        }
      }),
      prisma.intervention.count({
        where: {
          createdAt: {
            gte: previousMonth,
            lt: currentMonth
          }
        }
      }),
      prisma.facture.aggregate({
        where: {
          statut: 'payee',
          datePaiement: {
            gte: currentMonth
          }
        },
        _sum: {
          montantTTC: true
        }
      }),
      prisma.facture.aggregate({
        where: {
          statut: 'payee',
          datePaiement: {
            gte: previousMonth,
            lt: currentMonth
          }
        },
        _sum: {
          montantTTC: true
        }
      }),
      prisma.client.count({
        where: {
          createdAt: {
            gte: currentMonth,
            lt: nextMonth
          }
        }
      }),
      prisma.client.count({
        where: {
          createdAt: {
            gte: previousMonth,
            lt: currentMonth
          }
        }
      }),
      prisma.$queryRaw<Array<{ taux: number }>>`
        SELECT
          COUNT(CASE WHEN statut IN ('valide_dg', 'valide_pdg', 'accepte_client', 'facture') THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as taux
        FROM devis
        WHERE statut != 'brouillon'
      `,
      prisma.$queryRaw<Array<{ moyenne: number }>>`
        SELECT AVG(duree) as moyenne
        FROM interventions
        WHERE duree IS NOT NULL
        AND "dateHeureDebut" >= ${previousMonth}
      `
    ]);

    const interventionsCurrent = interventionsCurrentMonth;
    const interventionsPrevious = interventionsPreviousMonth;
    const interventionsGrowth = interventionsPrevious > 0 
      ? Math.round(((interventionsCurrent - interventionsPrevious) / interventionsPrevious) * 100)
      : 0;

    const chiffreAffairesCurrent = chiffreAffairesCurrentMonth._sum.montantTTC || 0;
    const chiffreAffairesPrevious = chiffreAffairesPreviousMonth._sum.montantTTC || 0;
    const chiffreAffairesGrowth = chiffreAffairesPrevious > 0
      ? Math.round(((chiffreAffairesCurrent - chiffreAffairesPrevious) / chiffreAffairesPrevious) * 100)
      : 0;

    const nouveauxClientsCurrent = nouveauxClientsCurrentMonth;
    const nouveauxClientsPrevious = nouveauxClientsPreviousMonth;
    const nouveauxClientsGrowth = nouveauxClientsPrevious > 0
      ? Math.round(((nouveauxClientsCurrent - nouveauxClientsPrevious) / nouveauxClientsPrevious) * 100)
      : 0;

    const kpis = {
      interventions: {
        current: interventionsCurrent,
        previous: interventionsPrevious,
        growth: interventionsGrowth,
        label: 'Interventions ce mois'
      },
      chiffreAffaires: {
        current: chiffreAffairesCurrent,
        previous: chiffreAffairesPrevious,
        growth: chiffreAffairesGrowth,
        label: 'Chiffre d\'affaires'
      },
      nouveauxClients: {
        current: nouveauxClientsCurrent,
        previous: nouveauxClientsPrevious,
        growth: nouveauxClientsGrowth,
        label: 'Nouveaux clients'
      },
      tauxValidation: {
        current: Math.round(tauxValidation[0]?.taux || 0),
        label: 'Taux validation (%)'
      },
      tempsInterventionMoyen: {
        current: Math.round((tempsInterventionMoyen[0]?.moyenne || 0) / 60 * 10) / 10,
        label: 'Temps moyen (h)'
      }
    };

    sendSuccess(res, kpis, 'KPIs récupérés avec succès');
  } catch (error) {
    logger.error('Error fetching KPIs:', error);
    sendError(res, 'Erreur lors de la récupération des KPIs');
  }
};