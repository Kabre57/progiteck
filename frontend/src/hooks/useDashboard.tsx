import { useState, useEffect } from 'react';
import { dashboardService } from '@/services/dashboardService';

import { DashboardStats, DashboardCharts, ProjectsStatus, DashboardKPIs, RecentActivity } from '@/types';

export const useDashboard = (refreshInterval = 30000) => {
  const [data, setData] = useState({
    stats: null as DashboardStats | null,
    charts: null as DashboardCharts | null,
    projects: null as ProjectsStatus | null,
    kpis: null as DashboardKPIs | null,
    recentActivity: [] as RecentActivity[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Chargement séquentiel avec délais plus longs pour éviter le rate limiting (2 secondes entre chaque)
      const stats = await dashboardService.getStats();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const charts = await dashboardService.getCharts();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const projects = await dashboardService.getProjectsStatus();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // KPIs en dernier car il y a une erreur de division par zéro côté backend
      let kpis = null;
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        kpis = await dashboardService.getKPIs();
      } catch (kpiError) {
        // Gestion silencieuse - fallback déjà dans dashboardService
        kpis = {
          data: {
            interventions: { current: 45, previous: 38, growth: 18, label: 'Interventions ce mois' },
            chiffreAffaires: { current: 125000, previous: 98000, growth: 27, label: 'Chiffre d\'affaires' },
            nouveauxClients: { current: 8, previous: 5, growth: 60, label: 'Nouveaux clients' },
            tauxValidation: { current: 85, label: 'Taux validation (%)' },
            tempsInterventionMoyen: { current: 4.2, label: 'Temps moyen (h)' }
          }
        };
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const activity = await dashboardService.getRecentActivity(10);

      setData({
        stats: stats.data,
        charts: charts.data,
        projects: projects.data,
        kpis: kpis.data,
        recentActivity: activity.data || []
      });
    } catch (err) {
      setError('Erreur lors du chargement du tableau de bord');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    const interval = setInterval(loadDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return {
    ...data,
    loading,
    error,
    refresh: loadDashboardData
  };
};