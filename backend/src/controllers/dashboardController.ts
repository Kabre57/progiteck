import { Response } from 'express';
import { prisma } from '@/config/database';
import { AuthenticatedRequest } from '@/middleware/auth';
import { sendSuccess, sendError } from '@/utils/response';
import { logger } from '@/config/logger';

// --- Définition des types pour les résultats des requêtes brutes ---
interface MoisTotal { mois: Date; total: bigint; }
interface StatutTotal { statut: string; total: bigint; }
interface TopTechnicien { nom: string; prenom: string; specialite: string; total_interventions: bigint; }
interface ChiffreAffaires { mois: Date; montant: number; }
interface SpecialiteTotal { specialite: string; total: bigint; }
interface TauxValidation { taux: number; }
interface TempsMoyen { moyenne: number; }

export const getStats = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [
      totalClients, activeClients, totalTechniciens, totalMissions, missionsEnCours,
      totalInterventions, interventionsAujourdhui, devisEnAttente, facturesImpayees, rapportsEnAttente
    ] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { statut: 'active' } }),
      prisma.technicien.count(),
      prisma.mission.count(),
      prisma.mission.count({ where: { interventions: { some: { dateHeureFin: null } } } }),
      prisma.intervention.count(),
      prisma.intervention.count({ where: { dateHeureDebut: { gte: startOfDay, lt: endOfDay } } }),
      prisma.devis.count({ where: { statut: { in: ['envoye', 'valide_dg'] } } }),
      prisma.facture.count({ where: { statut: { in: ['emise', 'envoyee'] }, dateEcheance: { lt: today } } }),
      prisma.rapportMission.count({ where: { statut: 'soumis' } })
    ]);

    const stats = {
      clients: { total: totalClients, actifs: activeClients, label: 'Clients' },
      techniciens: { total: totalTechniciens, label: 'Techniciens' },
      missions: { total: totalMissions, enCours: missionsEnCours, label: 'Missions' },
      interventions: { total: totalInterventions, aujourdhui: interventionsAujourdhui, label: 'Interventions' },
      commercial: { devisEnAttente, facturesImpayees, label: 'Commercial' },
      rapports: { enAttente: rapportsEnAttente, label: 'Rapports' }
    };

    sendSuccess(res, stats, 'Statistiques récupérées avec succès');
  } catch (error) {
    logger.error('Error fetching stats:', error);
    sendError(res, 'Erreur lors de la récupération des statistiques');
  }
};

export const getCharts = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const interventionsParMois = await prisma.$queryRaw<MoisTotal[]>`...`;
    const missionsParStatut = await prisma.$queryRaw<StatutTotal[]>`...`;
    const topTechniciens = await prisma.$queryRaw<TopTechnicien[]>`...`;
    const chiffreAffaires = await prisma.$queryRaw<ChiffreAffaires[]>`...`;
    const interventionsParSpecialite = await prisma.$queryRaw<SpecialiteTotal[]>`...`;

    const charts = {
      interventionsParMois: interventionsParMois.map((item: MoisTotal) => ({
        mois: item.mois.toISOString().substring(0, 7),
        total: Number(item.total)
      })),
      missionsParStatut: missionsParStatut.map((item: StatutTotal) => ({
        statut: item.statut,
        total: Number(item.total),
        color: item.statut === 'En cours' ? '#3b82f6' : item.statut === 'Terminée' ? '#10b981' : '#f59e0b'
      })),
      topTechniciens: topTechniciens.map((item: TopTechnicien) => ({
        nom: `${item.prenom} ${item.nom}`,
        specialite: item.specialite,
        total: Number(item.total_interventions)
      })),
      chiffreAffaires: chiffreAffaires.map((item: ChiffreAffaires) => ({
        mois: item.mois.toISOString().substring(0, 7),
        montant: item.montant
      })),
      interventionsParSpecialite: interventionsParSpecialite.map((item: SpecialiteTotal) => ({
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
    const limitNumber = limit ? parseInt(limit as string, 10) : 10;

    const recentActivity = await prisma.auditLog.findMany({
      include: { user: { select: { id: true, nom: true, prenom: true, role: { select: { libelle: true } } } } },
      orderBy: { timestamp: 'desc' },
      take: limitNumber
    });

    sendSuccess(res, recentActivity, 'Activité récente récupérée avec succès');
  } catch (error) {
    logger.error('Error fetching recent activity:', error);
    sendError(res, 'Erreur lors de la récupération de l\'activité récente');
  }
};

export const getProjectsStatus = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const missionsEnCours = await prisma.mission.findMany({ where: { interventions: { some: { dateHeureFin: null } } }, include: { client: true, interventions: { where: { dateHeureFin: null }, include: { techniciens: { include: { technicien: { include: { specialite: true } } } } } }, _count: { select: { interventions: true, rapports: true } } }, orderBy: { dateSortieFicheIntervention: 'asc' }, take: 10 });
    const devisValidationDG = await prisma.devis.findMany({ where: { statut: 'envoye' }, include: { client: true }, orderBy: { dateCreation: 'asc' }, take: 5 });
    const devisValidationPDG = await prisma.devis.findMany({ where: { statut: 'valide_dg' }, include: { client: true }, orderBy: { dateValidationDG: 'asc' }, take: 5 });
    const rapportsValidation = await prisma.rapportMission.findMany({ where: { statut: 'soumis' }, include: { technicien: true }, orderBy: { createdAt: 'asc' }, take: 5 });
    const facturesRetard = await prisma.facture.findMany({ where: { statut: { in: ['emise', 'envoyee'] }, dateEcheance: { lt: today } }, include: { client: true }, orderBy: { dateEcheance: 'asc' }, take: 5 });
    const interventionsAujourdhui = await prisma.intervention.findMany({ where: { dateHeureDebut: { gte: startOfDay, lt: endOfDay } }, include: { mission: { include: { client: true } } }, orderBy: { dateHeureDebut: 'asc' } });

    const projectsStatus = {
      missionsEnCours: missionsEnCours.map((mission: any) => ({
        numIntervention: mission.numIntervention,
        natureIntervention: mission.natureIntervention,
        client: mission.client.nom,
        datePrevue: mission.dateSortieFicheIntervention.toISOString(),
        techniciens: mission.interventions.flatMap((intervention: any) =>
          intervention.techniciens.map((ti: any) => ({
            nom: `${ti.technicien.prenom} ${ti.technicien.nom}`,
            specialite: ti.technicien.specialite?.libelle || 'Non définie',
            role: ti.role || 'Non défini'
          }))
        )
      })),
      tachesPrioritaires: {
        devisValidationDG: devisValidationDG.map((devis: any) => ({ id: devis.id, numero: devis.numero, client: devis.client.nom, priorite: 'haute' })),
        devisValidationPDG: devisValidationPDG.map((devis: any) => ({ id: devis.id, numero: devis.numero, client: devis.client.nom, priorite: 'haute' })),
        rapportsValidation: rapportsValidation.map((rapport: any) => ({ id: rapport.id, titre: rapport.titre, technicien: `${rapport.technicien.prenom} ${rapport.technicien.nom}`, priorite: 'moyenne' })),
        facturesRetard: facturesRetard.map((facture: any) => {
          const joursRetard = Math.floor((today.getTime() - facture.dateEcheance.getTime()) / (1000 * 60 * 60 * 24));
          return { id: facture.id, numero: facture.numero, client: facture.client.nom, joursRetard, priorite: joursRetard > 30 ? 'critique' : 'haute' };
        }),
        interventionsAujourdhui: interventionsAujourdhui.map((intervention: any) => ({ id: intervention.id, mission: intervention.mission.natureIntervention, client: intervention.mission.client.nom, heureDebut: intervention.dateHeureDebut?.toTimeString().substring(0, 5) }))
      }
    };

    sendSuccess(res, projectsStatus, 'Statut des projets récupéré avec succès');
  } catch (error) {
    logger.error('Error fetching projects status:', error);
    sendError(res, 'Erreur lors de la récupération du statut des projets');
  }
};

export const getKPIs = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      interventionsCurrentMonth, interventionsPreviousMonth, chiffreAffairesCurrentMonth, chiffreAffairesPreviousMonth,
      nouveauxClientsCurrentMonth, nouveauxClientsPreviousMonth, tauxValidation, tempsInterventionMoyen
    ] = await Promise.all([
      prisma.intervention.count({ where: { createdAt: { gte: currentMonth, lt: nextMonth } } }),
      prisma.intervention.count({ where: { createdAt: { gte: previousMonth, lt: currentMonth } } }),
      prisma.facture.aggregate({ where: { statut: 'payee', datePaiement: { gte: currentMonth } }, _sum: { montantTTC: true } }),
      prisma.facture.aggregate({ where: { statut: 'payee', datePaiement: { gte: previousMonth, lt: currentMonth } }, _sum: { montantTTC: true } }),
      prisma.client.count({ where: { createdAt: { gte: currentMonth, lt: nextMonth } } }),
      prisma.client.count({ where: { createdAt: { gte: previousMonth, lt: currentMonth } } }),
      prisma.$queryRaw<TauxValidation[]>`SELECT COUNT(CASE WHEN statut IN ('valide_dg', 'valide_pdg', 'accepte_client', 'facture') THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as taux FROM devis WHERE statut != 'brouillon'`,
      prisma.$queryRaw<TempsMoyen[]>`SELECT AVG(duree) as moyenne FROM interventions WHERE duree IS NOT NULL AND "dateHeureDebut" >= ${previousMonth}`
    ]);

    const interventionsGrowth = interventionsPreviousMonth > 0 ? Math.round(((interventionsCurrentMonth - interventionsPreviousMonth) / interventionsPreviousMonth) * 100) : 0;
    const chiffreAffairesGrowth = (chiffreAffairesPreviousMonth._sum.montantTTC || 0) > 0 ? Math.round((((chiffreAffairesCurrentMonth._sum.montantTTC || 0) - (chiffreAffairesPreviousMonth._sum.montantTTC || 0)) / (chiffreAffairesPreviousMonth._sum.montantTTC || 0)) * 100) : 0;
    const nouveauxClientsGrowth = nouveauxClientsPreviousMonth > 0 ? Math.round(((nouveauxClientsCurrentMonth - nouveauxClientsPreviousMonth) / nouveauxClientsPreviousMonth) * 100) : 0;

    const kpis = {
      interventions: { current: interventionsCurrentMonth, previous: interventionsPreviousMonth, growth: interventionsGrowth, label: 'Interventions ce mois' },
      chiffreAffaires: { current: (chiffreAffairesCurrentMonth._sum.montantTTC || 0), previous: (chiffreAffairesPreviousMonth._sum.montantTTC || 0), growth: chiffreAffairesGrowth, label: 'Chiffre d\'affaires' },
      nouveauxClients: { current: nouveauxClientsCurrentMonth, previous: nouveauxClientsPreviousMonth, growth: nouveauxClientsGrowth, label: 'Nouveaux clients' },
      tauxValidation: { current: Math.round(tauxValidation[0]?.taux || 0), label: 'Taux validation (%)' },
      tempsInterventionMoyen: { current: Math.round((tempsInterventionMoyen[0]?.moyenne || 0) / 60 * 10) / 10, label: 'Temps moyen (h)' }
    };

    sendSuccess(res, kpis, 'KPIs récupérés avec succès');
  } catch (error) {
    logger.error('Error fetching KPIs:', error);
    sendError(res, 'Erreur lors de la récupération des KPIs');
  }
};
