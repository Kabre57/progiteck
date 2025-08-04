import { useState, useEffect } from 'react';
import { 
  Users, 
  Wrench, 
  ClipboardList, 
  Settings,
  TrendingUp,
  Calendar,
  Activity,
  DollarSign,
  AlertTriangle,
  Clock
} from 'lucide-react';
import InterventionChart from '@/components/charts/InterventionChart';
import MissionChart from '@/components/charts/MissionChart';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/ui/StatCard';
import { useDashboard } from '@/hooks/useDashboard';
import PriorityTasks from '@/components/Dashboard/PriorityTasks';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Dashboard() {
  const { stats, charts, projects, kpis, recentActivity, loading, error, refresh } = useDashboard();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Chargement du tableau de bord...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Erreur de chargement
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
            <p className="text-gray-600 dark:text-gray-400">Vue d'ensemble de votre système de gestion technique</p>
          </div>
          <button
            onClick={refresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Actualiser</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Clients"
            value={stats?.clients?.total || 0}
            icon={Users}
            color="blue"
            trend={{ value: "12%", isPositive: true }}
          />
          <StatCard
            title="Techniciens"
            value={stats?.techniciens?.total || 0}
            icon={Wrench}
            color="green"
            trend={{ value: "5%", isPositive: true }}
          />
          <StatCard
            title="Missions"
            value={stats?.missions?.total || 0}
            icon={ClipboardList}
            color="yellow"
            trend={{ value: "8%", isPositive: true }}
          />
          <StatCard
            title="Interventions"
            value={stats?.interventions?.total || 0}
            icon={Settings}
            color="purple"
            trend={{ value: "15%", isPositive: true }}
          />
        </div>

        {/* Alertes et Tâches Prioritaires */}
        {projects && <PriorityTasks tasks={projects.tachesPrioritaires} />}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graphique Interventions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Interventions par mois</h3>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            {charts && (
              <InterventionChart data={charts.interventionsParMois?.map((item: any) => ({
                month: item.mois,
                interventions: item.total
              })) || []} />
            )}
          </div>

          {/* Graphique Missions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Répartition des missions</h3>
              <ClipboardList className="h-5 w-5 text-gray-400" />
            </div>
            {charts && (
              <MissionChart data={charts.missionsParStatut?.map((item: any) => ({
                name: item.statut,
                value: item.total,
                color: item.color || '#3b82f6'
              })) || []} />
            )}
          </div>
        </div>

        {/* Second Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activité récente */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Activité récente</h3>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {activity.details}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.user?.prenom} {activity.user?.nom} - {activity.createdAt ? format(new Date(activity.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr }) : 'Date inconnue'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucune activité récente</p>
              )}
            </div>
          </div>

          {/* Top Techniciens */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Top Techniciens</h3>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {charts && charts.topTechniciens?.length > 0 ? (
                charts.topTechniciens.slice(0, 5).map((tech: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {tech.nom.split(' ').map((n: string) => n.charAt(0)).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{tech.nom}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{tech.specialite}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {tech.total} interventions
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucune donnée disponible</p>
              )}
            </div>
          </div>
        </div>

        {/* KPIs avec croissance */}
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{kpis.chiffreAffaires?.label || 'Chiffre d\'affaires'}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(kpis.chiffreAffaires?.current || 0).toLocaleString('fr-FR')} FCFA
                  </p>
                  <p className={`text-sm mt-1 ${(kpis.chiffreAffaires?.growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(kpis.chiffreAffaires?.growth || 0) >= 0 ? '+' : ''}{kpis.chiffreAffaires?.growth || 0}% vs mois dernier
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{kpis.interventions?.label || 'Interventions'}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis.interventions?.current || 0}</p>
                  <p className={`text-sm mt-1 ${(kpis.interventions?.growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(kpis.interventions?.growth || 0) >= 0 ? '+' : ''}{kpis.interventions?.growth || 0}% vs mois dernier
                  </p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{kpis.tauxValidation?.label || 'Taux validation'}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis.tauxValidation?.current || 0}%</p>
                  <p className="text-sm text-purple-600 mt-1">Taux de validation</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}