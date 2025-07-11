import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { missionService } from '../services/missionService';
import { StatCard } from '../components/StatCard';
import { MissionModal } from '../components/modals/MissionModal';
import { ExportButton } from '../components/ExportButton';
import { FilterPanel } from '../components/FilterPanel';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Briefcase, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Calendar,
  Building,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const MissionsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);
  const navigate = useNavigate();

  const { data, loading, error, refetch } = useApi(
    () => missionService.getMissions(page, 10),
    [page]
  );

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette mission ?')) {
      try {
        await missionService.deleteMission(id);
        toast.success('Mission supprimée avec succès');
        refetch();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleEdit = (mission: any) => {
    setSelectedMission(mission);
    setShowEditModal(true);
  };

  const handleViewDetails = (missionId: number) => {
    navigate(`/missions/${missionId}`);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedMission(null);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  const filterOptions = [
    {
      key: 'client',
      label: 'Client',
      type: 'select' as const,
      options: data?.data.map(mission => ({ 
        value: mission.clientId.toString(), 
        label: mission.client?.nom || `Client #${mission.clientId}`
      })) || []
    },
    {
      key: 'date',
      label: 'Date prévue',
      type: 'date' as const
    }
  ];

  // Données simulées pour les statistiques
  const stats = {
    total: data?.pagination?.total || 0,
    planifiees: 0,
    urgentes: 0,
    enRetard: data?.pagination?.total || 0
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'Planifiée':
        return 'bg-green-100 text-green-800';
      case 'Urgente':
        return 'bg-yellow-100 text-yellow-800';
      case 'En retard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'Planifiée':
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'Urgente':
        return <AlertCircle className="h-3 w-3 mr-1" />;
      case 'En retard':
        return <Clock className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des missions</h1>
          <p className="text-gray-600">Planifiez et suivez vos missions d'intervention</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle mission
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total missions"
          value={stats.total}
          icon={Briefcase}
          color="purple"
        />
        <StatCard
          title="Planifiées"
          value={stats.planifiees}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Urgentes"
          value={stats.urgentes}
          icon={AlertCircle}
          color="yellow"
        />
        <StatCard
          title="En retard"
          value={stats.enRetard}
          icon={Clock}
          color="red"
        />
      </div>

      {/* Barre de recherche et filtres */}
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
          <ExportButton 
            data={data?.data || []} 
            filename="missions" 
            title="Exporter"
          />
        </div>
      </div>

      {/* Table des missions */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="table-scrollable">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° Mission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nature
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date prévue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!data?.data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Aucune mission trouvée
                  </td>
                </tr>
              ) : (
                data.data.map((mission) => (
                  <tr key={mission.numIntervention} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" data-label="N° Mission">
                      #{mission.numIntervention}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Nature">
                      <div className="text-sm font-medium text-gray-900">
                        {mission.natureIntervention}
                      </div>
                      <div className="text-sm text-gray-500">
                        {mission.objectifDuContrat?.substring(0, 30)}
                        {mission.objectifDuContrat && mission.objectifDuContrat.length > 30 ? '...' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Client">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <Building className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {mission.client?.nom || `Client #${mission.clientId}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {mission.client?.entreprise || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Date prévue">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {mission.dateSortieFicheIntervention 
                            ? new Date(mission.dateSortieFicheIntervention).toLocaleDateString('fr-FR')
                            : '-'
                          }
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4" data-label="Description">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {mission.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" data-label="Actions">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleViewDetails(mission.numIntervention)}
                          className="text-gray-600 hover:text-gray-900" 
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEdit(mission)}
                          className="text-blue-600 hover:text-blue-900" 
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(mission.numIntervention)}
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
      <MissionModal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      <MissionModal
        isOpen={showEditModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        mission={selectedMission}
      />

      <FilterPanel
        isOpen={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        onApply={() => {}}
        options={filterOptions}
        title="Filtrer les missions"
      />
    </div>
  );
};