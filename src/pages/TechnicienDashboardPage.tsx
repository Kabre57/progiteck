import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { technicienService } from '../services/technicienService';
import { StatCard } from '../components/StatCard';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  Calendar, 
  Settings, 
  User,
  Award,
  Building,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export const TechnicienDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const { data: dashboardData, loading, error, refetch } = useApi(
    () => technicienService.getTechnicienDashboard(parseInt(id || '0')),
    [id]
  );

  // Rafraîchir les données toutes les 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
      setLastUpdate(new Date());
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [refetch]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const getProgressColor = (progress: number) => {
    if (progress < 25) return 'bg-red-500';
    if (progress < 50) return 'bg-orange-500';
    if (progress < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Erreur: {error || 'Données non disponibles'}</p>
        <button 
          onClick={() => navigate('/techniciens')}
          className="mt-2 text-blue-600 hover:text-blue-800"
        >
          Retour à la liste des techniciens
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/techniciens')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard Technicien
            </h1>
            <p className="text-gray-600">
              {dashboardData.technicien.nom} {dashboardData.technicien.prenom} - {dashboardData.technicien.specialite || 'Non spécifié'}
            </p>
          </div>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-1" />
          Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total interventions"
          value={dashboardData.stats.totalInterventions}
          icon={Settings}
          color="blue"
        />
        <StatCard
          title="En cours"
          value={dashboardData.stats.interventionsEnCours}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Terminées"
          value={dashboardData.stats.interventionsTerminees}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Durée moyenne"
          value={formatDuration(dashboardData.stats.dureeMoyenne)}
          icon={Calendar}
          color="purple"
        />
      </div>

      {/* Missions en cours et prochaines interventions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missions en cours */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Missions en cours</h3>
            <button 
              onClick={() => navigate('/interventions')}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              Voir tout <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          
          <div className="space-y-4">
            {dashboardData.missionsEnCours.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Aucune mission en cours</p>
            ) : (
              dashboardData.missionsEnCours.map(mission => (
                <div key={mission.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{mission.title}</h4>
                      <p className="text-xs text-gray-500">
                        Client: {mission.client}
                        {mission.clientEntreprise && ` (${mission.clientEntreprise})`}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {mission.role === 'principal' ? 'Principal' : 
                       mission.role === 'expert' ? 'Expert' : 'Assistant'}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${getProgressColor(mission.progress)}`}
                      style={{ width: `${mission.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {mission.progress}% complété
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Prochaines interventions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Prochaines interventions</h3>
            <button 
              onClick={() => navigate('/interventions')}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              Voir tout <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          
          <div className="space-y-3">
            {dashboardData.prochainesInterventions.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Aucune intervention planifiée</p>
            ) : (
              dashboardData.prochainesInterventions.map(intervention => (
                <div key={intervention.id} className="flex items-start p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-shrink-0 w-2 h-full rounded-full bg-blue-500 mr-3"></div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium text-gray-900">
                        {intervention.mission.natureIntervention}
                      </h4>
                      <span className="text-xs font-medium text-blue-600">
                        #{intervention.id}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      Client: {intervention.mission.client?.nom || 'Non spécifié'}
                      {intervention.mission.client?.entreprise && ` (${intervention.mission.client.entreprise})`}
                    </p>
                    
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {intervention.dateHeureDebut 
                        ? new Date(intervention.dateHeureDebut).toLocaleString('fr-FR', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })
                        : 'Date non définie'
                      }
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Interventions récentes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Interventions récentes</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.interventionsRecentes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Aucune intervention récente
                  </td>
                </tr>
              ) : (
                dashboardData.interventionsRecentes.map(intervention => (
                  <tr key={intervention.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{intervention.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {intervention.mission.natureIntervention}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {intervention.mission.client?.nom || 'Non spécifié'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {intervention.dateHeureDebut 
                        ? new Date(intervention.dateHeureDebut).toLocaleDateString('fr-FR')
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {intervention.duree 
                        ? formatDuration(intervention.duree)
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {intervention.role === 'principal' ? 'Principal' : 
                         intervention.role === 'expert' ? 'Expert' : 'Assistant'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        intervention.status === 'terminée' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {intervention.status === 'terminée' ? 'Terminée' : 'En cours'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};