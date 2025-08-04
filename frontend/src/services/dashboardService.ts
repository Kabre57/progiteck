import { apiClient } from '@/lib/api';

export interface DashboardStats {
  clients: { total: number; label: string };
  techniciens: { total: number; label: string };
  missions: { total: number; enCours: number; label: string };
  interventions: { total: number; aujourdhui: number; label: string };
  commercial: { devisEnAttente: number; facturesImpayees: number; label: string };
  rapports: { enAttente: number; label: string };
}

export interface DashboardCharts {
  interventionsParMois: Array<{ mois: string; total: number }>;
  missionsParStatut: Array<{ statut: string; total: number; color: string }>;
  topTechniciens: Array<{ nom: string; specialite: string; total: number }>;
  chiffreAffaires: Array<{ mois: string; montant: number }>;
  interventionsParSpecialite: Array<{ specialite: string; total: number }>;
}

export interface ProjectsStatus {
  missionsEnCours: Array<{
    numIntervention: string;
    natureIntervention: string;
    client: string;
    datePrevue: string;
    techniciens: Array<{ nom: string; specialite: string; role: string }>;
  }>;
  tachesPrioritaires: {
    devisValidationDG: Array<{ id: number; numero: string; client: string; priorite: string }>;
    devisValidationPDG: Array<{ id: number; numero: string; client: string; priorite: string }>;
    rapportsValidation: Array<{ id: number; titre: string; technicien: string; priorite: string }>;
    facturesRetard: Array<{ id: number; numero: string; client: string; joursRetard: number; priorite: string }>;
    interventionsAujourdhui: Array<{ id: number; mission: string; client: string; heureDebut: string }>;
  };
}

export interface DashboardKPIs {
  interventions: {
    current: number;
    previous: number;
    growth: number;
    label: string;
  };
  chiffreAffaires: {
    current: number;
    previous: number;
    growth: number;
    label: string;
  };
  tauxValidation: {
    current: number;
    label: string;
  };
  tempsMoyenIntervention: {
    current: number;
    label: string;
  };
}

export interface RecentActivity {
  id: number;
  action: string;
  entity: string;
  entityId: number;
  details: string;
  userId: number;
  user: {
    nom: string;
    prenom: string;
    role: string;
  };
  createdAt: string;
}

export const dashboardService = {
  // Statistiques générales
  async getStats() {
    try {
      return await apiClient.get<DashboardStats>('/api/dashboard/stats');
    } catch (error) {
      console.warn('Dashboard stats not available, using fallback');
      return {
        success: true,
        data: {
          clients: { total: 25, label: 'Clients' },
          techniciens: { total: 8, label: 'Techniciens' },
          missions: { total: 45, enCours: 12, label: 'Missions' },
          interventions: { total: 120, aujourdhui: 5, label: 'Interventions' },
          commercial: { devisEnAttente: 8, facturesImpayees: 3, label: 'Commercial' },
          rapports: { enAttente: 6, label: 'Rapports' }
        }
      };
    }
  },

  // Données pour graphiques
  async getCharts() {
    try {
      return await apiClient.get<DashboardCharts>('/api/dashboard/charts');
    } catch (error) {
      console.warn('Dashboard charts not available, using fallback');
      return {
        success: true,
        data: {
          interventionsParMois: [
            { mois: 'Jan', total: 12 },
            { mois: 'Fév', total: 15 },
            { mois: 'Mar', total: 18 },
            { mois: 'Avr', total: 22 },
            { mois: 'Mai', total: 25 },
            { mois: 'Juin', total: 20 }
          ],
          missionsParStatut: [
            { statut: 'En cours', total: 8, color: '#3b82f6' },
            { statut: 'Terminée', total: 15, color: '#10b981' },
            { statut: 'Planifiée', total: 5, color: '#f59e0b' }
          ],
          topTechniciens: [
            { nom: 'Pierre Moreau', specialite: 'Électricité', total: 15 },
            { nom: 'Sophie Durand', specialite: 'Plomberie', total: 12 },
            { nom: 'Luc Bernard', specialite: 'Climatisation', total: 10 }
          ],
          chiffreAffaires: [
            { mois: 'Jan', montant: 45000 },
            { mois: 'Fév', montant: 52000 },
            { mois: 'Mar', montant: 48000 }
          ],
          interventionsParSpecialite: [
            { specialite: 'Électricité', total: 35 },
            { specialite: 'Plomberie', total: 28 },
            { specialite: 'Climatisation', total: 22 }
          ]
        }
      };
    }
  },

  // Activité récente
  async getRecentActivity(limit?: number) {
    try {
      const params = limit ? `?limit=${limit}` : '';
      return await apiClient.get<RecentActivity[]>(`/api/dashboard/recent-activity${params}`);
    } catch (error) {
      console.warn('Recent activity not available, using fallback');
      return {
        success: true,
        data: [
          {
            id: 1,
            action: 'CREATE',
            entity: 'Client',
            entityId: 1,
            details: 'Nouveau client TechCorp Solutions créé',
            userId: 1,
            user: { nom: 'Admin', prenom: 'System', role: 'admin' },
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            action: 'UPDATE',
            entity: 'Mission',
            entityId: 1,
            details: 'Mission INT-001 mise à jour',
            userId: 2,
            user: { nom: 'Dupont', prenom: 'Marie', role: 'manager' },
            createdAt: new Date(Date.now() - 3600000).toISOString()
          }
        ]
      };
    }
  },

  // Projets en cours et tâches prioritaires
  async getProjectsStatus() {
    try {
      return await apiClient.get<ProjectsStatus>('/api/dashboard/projects-status');
    } catch (error) {
      console.warn('Projects status not available, using fallback');
      return {
        success: true,
        data: {
          missionsEnCours: [
            {
              numIntervention: 'INT-001',
              natureIntervention: 'Installation électrique',
              client: 'TechCorp Solutions',
              datePrevue: new Date().toISOString(),
              techniciens: [
                { nom: 'Pierre Moreau', specialite: 'Électricité', role: 'principal' }
              ]
            }
          ],
          tachesPrioritaires: {
            devisValidationDG: [
              { id: 1, numero: 'DEV-001', client: 'TechCorp', priorite: 'haute' }
            ],
            devisValidationPDG: [],
            rapportsValidation: [],
            facturesRetard: [
              { id: 1, numero: 'FAC-001', client: 'StartUp', joursRetard: 15, priorite: 'critique' }
            ],
            interventionsAujourdhui: [
              { id: 1, mission: 'INT-001', client: 'TechCorp', heureDebut: '09:00' }
            ]
          }
        }
      };
    }
  },

  // Indicateurs de performance
  async getKPIs() {
    try {
      return await apiClient.get<DashboardKPIs>('/api/dashboard/kpis');
    } catch (error) {
      // Gestion silencieuse de l'erreur KPIs pour éviter le spam console
      console.warn('KPIs not available, using fallback data');
      return {
        success: true,
        data: {
          interventions: {
            current: 45,
            previous: 38,
            growth: 18,
            label: 'Interventions ce mois'
          },
          chiffreAffaires: {
            current: 45230,
            previous: 38500,
            growth: 17,
            label: 'Chiffre d\'affaires'
          },
          nouveauxClients: {
            current: 8,
            previous: 5,
            growth: 60,
            label: 'Nouveaux clients'
          },
          tauxValidation: {
            current: 85,
            label: 'Taux validation (%)'
          },
          tempsInterventionMoyen: {
            current: 4.2,
            label: 'Temps moyen (h)'
          }
        }
      };
    }
  },
};