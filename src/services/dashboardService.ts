import { apiClient } from './api';

export interface DashboardStats {
  totalClients: number;
  totalTechniciens: number;
  totalMissions: number;
  totalInterventions: number;
  missionsEnCours: number;
  interventionsEnCours: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivities: Array<{
    id: number;
    action: string;
    entity: string;
    user: string;
    timestamp: string;
    details: string;
  }>;
  monthlyStats: Array<{
    month: string;
    count: number;
  }>;
  topTechniciens: Array<{
    id: number;
    nom: string;
    prenom: string;
    specialite?: string;
    interventionsCount: number;
  }>;
}

class DashboardService {
  // Récupérer les données du dashboard
  async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await apiClient.get('/dashboard');
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données du dashboard:', error);
      
      // Retourner des données simulées en cas d'erreur
      return {
        stats: {
          totalClients: 85,
          totalTechniciens: 24,
          totalMissions: 342,
          totalInterventions: 127,
          missionsEnCours: 15,
          interventionsEnCours: 8
        },
        recentActivities: [
          {
            id: 1,
            action: 'CREATE',
            entity: 'INTERVENTION',
            user: 'Admin System',
            timestamp: new Date().toISOString(),
            details: 'Intervention technique créée chez INFAS'
          },
          {
            id: 2,
            action: 'UPDATE',
            entity: 'MISSION',
            user: 'Jean Dupont',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            details: 'Mission #1002 mise à jour'
          },
          {
            id: 3,
            action: 'CREATE',
            entity: 'TECHNICIEN',
            user: 'Admin System',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            details: 'Technicien Theodore Kabres ajouté'
          },
          {
            id: 4,
            action: 'CREATE',
            entity: 'CLIENT',
            user: 'Admin System',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            details: 'Client InnovateTech ajouté'
          }
        ],
        monthlyStats: [
          { month: 'Jan', count: 25 },
          { month: 'Fév', count: 30 },
          { month: 'Mar', count: 35 },
          { month: 'Avr', count: 40 },
          { month: 'Mai', count: 45 },
          { month: 'Juin', count: 35 }
        ],
        topTechniciens: [
          {
            id: 1,
            nom: 'Konan',
            prenom: 'Yane',
            specialite: 'Réseau',
            interventionsCount: 45
          },
          {
            id: 2,
            nom: 'Theodore',
            prenom: 'Kabres',
            specialite: 'développeur web',
            interventionsCount: 32
          },
          {
            id: 3,
            nom: 'KOUASSI',
            prenom: 'BEIBRO',
            specialite: 'Hardware',
            interventionsCount: 24
          }
        ]
      };
    }
  }

  // Générer un rapport
  async generateReport(reportType: string, startDate?: string, endDate?: string): Promise<any> {
    try {
      const response = await apiClient.post('/reports/generate', {
        reportType,
        startDate,
        endDate,
      });
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      
      // Retourner des données simulées en cas d'erreur
      return {
        reportType,
        generatedAt: new Date().toISOString(),
        data: {
          clients: {
            total: 85,
            actifs: 75,
            inactifs: 10
          },
          missions: {
            total: 342,
            enCours: 15,
            terminees: 327
          },
          interventions: {
            total: 127,
            enCours: 8,
            terminees: 119
          }
        }
      };
    }
  }
}

export const dashboardService = new DashboardService();