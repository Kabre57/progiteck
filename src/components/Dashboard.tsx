import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { dashboardService } from '../services/dashboardService';
import { 
  Users, 
  Building, 
  Wrench, 
  Briefcase,
  BarChart2,
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Settings,
  RefreshCw,
  FileText,
  ArrowRight
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useNavigate } from 'react-router-dom';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const Dashboard: React.FC = () => {
  const { data, loading, error, refetch } = useApi(() => dashboardService.getDashboardData(), []);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const navigate = useNavigate();

  // Projets en cours et tâches prioritaires (simulés)
  const currentProjects = [
    {
      id: 1,
      title: "Installation réseau INFAS",
      client: "INFAS",
      progress: 75,
      dueDate: "2024-07-15",
      priority: "high"
    },
    {
      id: 2,
      title: "Maintenance serveurs DataSys",
      client: "DataSys Industries",
      progress: 30,
      dueDate: "2024-07-20",
      priority: "medium"
    },
    {
      id: 3,
      title: "Audit sécurité InnovateTech",
      client: "InnovateTech",
      progress: 10,
      dueDate: "2024-07-25",
      priority: "low"
    }
  ];

  const priorityTasks = [
    {
      id: 1,
      title: "Intervention urgente serveur principal",
      client: "INFAS",
      dueDate: "2024-07-05",
      assignedTo: "Konan Yane",
      priority: "critical"
    },
    {
      id: 2,
      title: "Mise à jour firewall",
      client: "DataSys Industries",
      dueDate: "2024-07-08",
      assignedTo: "Theodore Kabres",
      priority: "high"
    },
    {
      id: 3,
      title: "Remplacement disque dur défectueux",
      client: "InnovateTech",
      dueDate: "2024-07-10",
      assignedTo: "KOUASSI BEIBRO",
      priority: "medium"
    }
  ];

  // Rafraîchir les données toutes les 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
      setLastUpdate(new Date());
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [refetch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Erreur: {error}</p>
      </div>
    );
  }

  const stats = data?.stats || {
    totalClients: 85,
    totalTechniciens: 24,
    totalMissions: 342,
    totalInterventions: 127,
    missionsEnCours: 15,
    interventionsEnCours: 8
  };

  // Préparer les données pour le graphique d'évolution des interventions
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
  const interventionValues = [40, 45, 55, 65, 60, 55];

  // Données pour le graphique d'évolution des interventions
  const interventionsData = {
    labels: months,
    datasets: [
      {
        label: 'Interventions',
        data: interventionValues,
        fill: false,
        borderColor: 'rgb(59, 130, 246)',
        tension: 0.1,
      },
    ],
  };

  // Préparer les données pour le graphique de répartition des missions
  const missionMonths = data?.monthlyStats?.map(item => item.month) || months;
  const missionCounts = data?.monthlyStats?.map(item => item.count) || [25, 30, 35, 40, 45, 35];

  // Données pour le graphique de répartition des missions
  const missionsData = {
    labels: missionMonths,
    datasets: [
      {
        label: 'Missions',
        data: missionCounts,
        backgroundColor: 'rgb(139, 92, 246)',
      },
    ],
  };

  // Options pour les graphiques
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Fonction pour obtenir la classe de couleur selon la priorité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Fonction pour calculer la classe de couleur de la barre de progression
  const getProgressColor = (progress: number) => {
    if (progress < 25) return 'bg-red-500';
    if (progress < 50) return 'bg-orange-500';
    if (progress < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600">Vue d'ensemble de l'activité de votre système de gestion</p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg relative">
          <div className="absolute top-0 right-0 mt-4 mr-4">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Utilisateurs
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                127
              </dd>
              <dd className="mt-2 text-sm text-green-600">
                +8.2% vs mois dernier
              </dd>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg relative">
          <div className="absolute top-0 right-0 mt-4 mr-4">
            <Building className="h-6 w-6 text-green-600" />
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Clients
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {stats.totalClients}
              </dd>
              <dd className="mt-2 text-sm text-green-600">
                +5.3% vs mois dernier
              </dd>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg relative">
          <div className="absolute top-0 right-0 mt-4 mr-4">
            <Wrench className="h-6 w-6 text-purple-600" />
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Techniciens
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {stats.totalTechniciens}
              </dd>
              <dd className="mt-2 text-sm text-green-600">
                +3.7% vs mois dernier
              </dd>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg relative">
          <div className="absolute top-0 right-0 mt-4 mr-4">
            <Briefcase className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Missions
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {stats.totalMissions}
              </dd>
              <dd className="mt-2 text-sm text-green-600">
                +6.2% vs mois dernier
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Projets en cours et tâches prioritaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projets en cours */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Projets en cours</h3>
            <button 
              onClick={() => navigate('/missions')}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              Voir tout <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          
          <div className="space-y-4">
            {currentProjects.map(project => (
              <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{project.title}</h4>
                    <p className="text-xs text-gray-500">Client: {project.client}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                    {project.priority === 'high' && 'Haute'}
                    {project.priority === 'medium' && 'Moyenne'}
                    {project.priority === 'low' && 'Basse'}
                  </span>
                </div>
                
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <Calendar className="h-3 w-3 mr-1" />
                  Échéance: {new Date(project.dueDate).toLocaleDateString('fr-FR')}
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${getProgressColor(project.progress)}`}
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <div className="text-right text-xs text-gray-500 mt-1">
                  {project.progress}% complété
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tâches prioritaires */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Tâches prioritaires</h3>
            <button 
              onClick={() => navigate('/interventions')}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              Voir tout <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          
          <div className="space-y-3">
            {priorityTasks.map(task => (
              <div key={task.id} className="flex items-start p-3 border rounded-lg hover:bg-gray-50">
                <div className={`flex-shrink-0 w-2 h-full rounded-full ${
                  task.priority === 'critical' ? 'bg-red-500' :
                  task.priority === 'high' ? 'bg-orange-500' :
                  task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                } mr-3`}></div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'critical' && 'Critique'}
                      {task.priority === 'high' && 'Haute'}
                      {task.priority === 'medium' && 'Moyenne'}
                      {task.priority === 'low' && 'Basse'}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-500">Client: {task.client}</p>
                  
                  <div className="flex justify-between items-center mt-2 text-xs">
                    <div className="flex items-center text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Users className="h-3 w-3 mr-1" />
                      {task.assignedTo}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique d'évolution des interventions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Évolution des interventions</h3>
            <div className="flex items-center text-sm text-gray-500">
              <RefreshCw className="h-4 w-4 mr-1" />
              Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
          <div className="h-64">
            <Line data={interventionsData} options={chartOptions} />
          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Activité récente</h3>
            <button 
              onClick={() => refetch()}
              className="text-blue-600 hover:text-blue-800"
              title="Actualiser"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            {data?.recentActivities?.slice(0, 4).map((activity, index) => (
              <div key={activity.id || index} className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    {activity.entity === 'INTERVENTION' && <Wrench className="h-4 w-4 text-green-600" />}
                    {activity.entity === 'MISSION' && <Briefcase className="h-4 w-4 text-blue-600" />}
                    {activity.entity === 'USER' && <Users className="h-4 w-4 text-purple-600" />}
                    {activity.entity === 'CLIENT' && <Building className="h-4 w-4 text-yellow-600" />}
                    {activity.entity === 'TECHNICIEN' && <Wrench className="h-4 w-4 text-red-600" />}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action === 'CREATE' && 'Création'}
                    {activity.action === 'UPDATE' && 'Modification'}
                    {activity.action === 'DELETE' && 'Suppression'}
                    {' '}
                    {activity.entity === 'INTERVENTION' && "d'intervention"}
                    {activity.entity === 'MISSION' && 'de mission'}
                    {activity.entity === 'USER' && "d'utilisateur"}
                    {activity.entity === 'CLIENT' && 'de client'}
                    {activity.entity === 'TECHNICIEN' && 'de technicien'}
                  </p>
                  <p className="text-sm text-gray-500">{activity.details}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(activity.timestamp).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Répartition des missions par mois */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Répartition des missions par mois</h3>
          <button 
            onClick={() => refetch()}
            className="text-blue-600 hover:text-blue-800"
            title="Actualiser"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
        <div className="h-64">
          <Bar data={missionsData} options={chartOptions} />
        </div>
      </div>

      {/* Statistiques supplémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Taux de réussite</h3>
              <p className="text-3xl font-bold text-gray-900">98.5%</p>
              <p className="text-sm text-gray-500">Interventions réussies</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Temps moyen</h3>
              <p className="text-3xl font-bold text-gray-900">2h 45m</p>
              <p className="text-sm text-gray-500">Durée d'intervention</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Interventions urgentes</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.interventionsEnCours}</p>
              <p className="text-sm text-gray-500">En attente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};