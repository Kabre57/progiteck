import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { interventionService } from '../services/interventionService';
import { StatCard } from '../components/StatCard';
import { InterventionModal } from '../components/modals/InterventionModal';
import { ExportButton } from '../components/ExportButton';
import { FilterPanel } from '../components/FilterPanel';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Settings, 
  Play, 
  CheckCircle, 
  Clock,
  RefreshCw,
  Download,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

export const InterventionsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState(null);

  const { data, loading, error, refetch } = useApi(
    () => interventionService.getInterventions(page, 10),
    [page]
  );

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) {
      try {
        await interventionService.deleteIntervention(id);
        toast.success('Intervention supprimée avec succès');
        refetch();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleEdit = (intervention: any) => {
    setSelectedIntervention(intervention);
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedIntervention(null);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  const filterOptions = [
    {
      key: 'status',
      label: 'Statut',
      type: 'select' as const,
      options: [
        { value: 'en_cours', label: 'En cours' },
        { value: 'terminee', label: 'Terminée' }
      ]
    },
    {
      key: 'technicien',
      label: 'Technicien',
      type: 'select' as const,
      options: []
    },
    {
      key: 'dateDebut',
      label: 'Date de début',
      type: 'date' as const
    }
  ];

  // Calculer les statistiques à partir des données réelles
  const totalInterventions = data?.pagination?.total || 0;
  const interventionsEnCours = data?.data?.filter(i => !i.dateHeureFin).length || 0;
  const interventionsTerminees = data?.data?.filter(i => i.dateHeureFin).length || 0;

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'En cours':
        return 'bg-blue-100 text-blue-800';
      case 'Terminée':
        return 'bg-green-100 text-green-800';
      case 'En attente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const gettechnicienInitials = (nom: string, prenom: string) => {
    return `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase();
  };

  const gettechnicienColor = (specialite: string) => {
    const colors = {
      'Hardware': 'bg-green-100 text-green-800',
      'développeur web': 'bg-red-100 text-red-800',
      'Réseau': 'bg-blue-100 text-blue-800',
      'DevOps': 'bg-purple-100 text-purple-800',
      'Software': 'bg-yellow-100 text-yellow-800'
    };
    return colors[specialite as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

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

  // Déterminer le statut de chaque intervention
  const interventionsWithStatus = data?.data.map(intervention => ({
    ...intervention,
    statut: intervention.dateHeureFin ? 'Terminée' : 'En cours'
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des interventions</h1>
          <p className="text-gray-600">Suivez et gérez toutes vos interventions techniques en temps réel</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle intervention
        </button>
      </div>

      {/* Statistiques en temps réel */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Statistiques en temps réel</h2>
          <div className="flex items-center text-sm text-gray-500">
            <RefreshCw className="h-4 w-4 mr-1" />
            Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total interventions"
            value={totalInterventions}
            icon={Settings}
            color="blue"
          />
          <StatCard
            title="En cours"
            value={interventionsEnCours}
            icon={Play}
            color="blue"
          />
          <StatCard
            title="Terminées"
            value={interventionsTerminees}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Durée moyenne"
            value="3h 30min"
            icon={Clock}
            color="purple"
          />
        </div>
      </div>

      {/* Barre de recherche et actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex space-x-2 flex-wrap gap-2">
          <button 
            onClick={() => setShowFilterPanel(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </button>
          <button 
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </button>
          <ExportButton 
            data={interventionsWithStatus} 
            filename="interventions" 
            title="Exporter"
          />
        </div>
      </div>

      {/* Table des interventions */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="table-responsive">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Techniciens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Début
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!interventionsWithStatus.length ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    Aucune intervention trouvée
                  </td>
                </tr>
              ) : (
                interventionsWithStatus.map((intervention) => (
                  <tr key={intervention.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap" data-label="">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" data-label="ID">
                      #{intervention.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Mission">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{intervention.missionId} - {intervention.mission?.natureIntervention || 'Mission'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {intervention.mission?.client?.nom || `Client #${intervention.mission?.clientId || ''}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Techniciens">
                      {intervention.techniciens && intervention.techniciens.length > 0 ? (
                        <div className="flex -space-x-2 overflow-hidden">
                          {intervention.techniciens.slice(0, 3).map((tech, index) => (
                            <div 
                              key={tech.id} 
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white ${gettechnicienColor(tech.specialite?.libelle || '')}`}
                              title={`${tech.nom} ${tech.prenom} (${tech.role || 'Assistant'})`}
                            >
                              {gettechnicienInitials(tech.nom, tech.prenom)}
                            </div>
                          ))}
                          {intervention.techniciens.length > 3 && (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-gray-200 text-gray-800 border-2 border-white">
                              +{intervention.techniciens.length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Non assigné</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-label="Début">
                      {intervention.dateHeureDebut 
                        ? new Date(intervention.dateHeureDebut).toLocaleDateString('fr-FR') + ' ' + 
                          new Date(intervention.dateHeureDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-label="Fin">
                      {intervention.dateHeureFin 
                        ? new Date(intervention.dateHeureFin).toLocaleDateString('fr-FR') + ' ' + 
                          new Date(intervention.dateHeureFin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Durée">
                      {intervention.duree ? (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-gray-400" />
                          <span className="text-sm text-gray-900">{formatDuration(intervention.duree)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-gray-400" />
                          <span className="text-sm text-gray-500">-</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Statut">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(intervention.statut)}`}>
                        {intervention.statut === 'En cours' && <Play className="h-3 w-3 mr-1" />}
                        {intervention.statut === 'Terminée' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {intervention.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" data-label="Actions">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEdit(intervention)}
                          className="text-blue-600 hover:text-blue-900" 
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(intervention.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="text-sm text-gray-700">
            Affichage de {((data.pagination.page - 1) * data.pagination.limit) + 1} à{' '}
            {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} sur{' '}
            {data.pagination.total} résultats
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= data.pagination.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Modales */}
      <InterventionModal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      <InterventionModal
        isOpen={showEditModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        intervention={selectedIntervention}
      />

      <FilterPanel
        isOpen={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        onApply={() => {}}
        options={filterOptions}
        title="Filtrer les interventions"
      />
    </div>
  );
};