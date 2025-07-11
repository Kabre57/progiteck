import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { technicienService } from '../services/technicienService';
import { StatCard } from '../components/StatCard';
import { TechnicienModal } from '../components/modals/TechnicienModal';
import { ExportButton } from '../components/ExportButton';
import { FilterPanel } from '../components/FilterPanel';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Users, 
  UserCheck, 
  Award, 
  Wrench,
  Phone,
  BarChart2,
  Link
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const TechniciensPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedTechnicien, setSelectedTechnicien] = useState(null);
  const navigate = useNavigate();

  const { data, loading, error, refetch } = useApi(
    () => technicienService.getTechniciens(page, 10),
    [page]
  );

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce technicien ?')) {
      try {
        await technicienService.deleteTechnicien(id);
        toast.success('Technicien supprimé avec succès');
        refetch();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleEdit = (technicien: any) => {
    setSelectedTechnicien(technicien);
    setShowEditModal(true);
  };

  const handleViewDashboard = (id: number) => {
    navigate(`/technicien-dashboard/${id}`);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedTechnicien(null);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  const filterOptions = [
    {
      key: 'specialite',
      label: 'Spécialité',
      type: 'select' as const,
      options: [
        { value: 'Réseau', label: 'Réseau' },
        { value: 'développeur web', label: 'Développeur web' },
        { value: 'Hardware', label: 'Hardware' },
        { value: 'DevOps', label: 'DevOps' },
        { value: 'Software', label: 'Software' }
      ]
    }
  ];

  // Données simulées pour les statistiques
  const stats = {
    total: data?.pagination?.total || 0,
    disponibles: data?.pagination?.total || 0,
    specialites: 5,
    interventions: 79
  };

  // Données simulées pour la répartition par spécialité
  const specialiteStats = [
    { nom: 'Réseau', count: 1, color: 'bg-blue-100 text-blue-800' },
    { nom: 'développeur web', count: 1, color: 'bg-red-100 text-red-800' },
    { nom: 'Hardware', count: 1, color: 'bg-green-100 text-green-800' },
    { nom: 'DevOps', count: 1, color: 'bg-purple-100 text-purple-800' },
    { nom: 'Software', count: 0, color: 'bg-yellow-100 text-yellow-800' }
  ];

  const getSpecialiteColor = (specialite: string) => {
    const colors = {
      'Réseau': 'bg-blue-100 text-blue-800',
      'développeur web': 'bg-red-100 text-red-800',
      'Hardware': 'bg-green-100 text-green-800',
      'DevOps': 'bg-purple-100 text-purple-800',
      'Software': 'bg-yellow-100 text-yellow-800'
    };
    return colors[specialite as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const gettechnicienInitials = (nom: string, prenom: string) => {
    return `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase();
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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des techniciens</h1>
          <p className="text-gray-600">Gérez votre équipe de techniciens et leurs spécialités</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau technicien
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total techniciens"
          value={stats.total}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Disponibles"
          value={stats.disponibles}
          icon={UserCheck}
          color="green"
        />
        <StatCard
          title="Spécialités"
          value={stats.specialites}
          icon={Award}
          color="purple"
        />
        <StatCard
          title="Interventions"
          value={stats.interventions}
          icon={Wrench}
          color="indigo"
        />
      </div>

      {/* Répartition par spécialité */}
      <div className="bg-white rounded-lg shadow p-6 overflow-x-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Répartition par spécialité</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {specialiteStats.map((specialite) => (
            <div key={specialite.nom} className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-lg ${specialite.color} mb-2`}>
                <span className="text-2xl font-bold">{specialite.count}</span>
              </div>
              <div className="text-sm font-medium text-gray-900">{specialite.nom}</div>
              <div className="text-xs text-gray-500">technicien{specialite.count > 1 ? 's' : ''}</div>
            </div>
          ))}
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
          <ExportButton 
            data={data?.data || []} 
            filename="techniciens" 
            title="Exporter"
          />
        </div>
      </div>

      {/* Table des techniciens */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="table-scrollable">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Technicien
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spécialité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interventions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compte lié
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
                    Aucun technicien trouvé
                  </td>
                </tr>
              ) : (
                data.data.map((technicien) => (
                  <tr key={technicien.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Technicien">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium mr-4 ${getSpecialiteColor(technicien.specialite?.libelle || '')}`}>
                          {gettechnicienInitials(technicien.nom, technicien.prenom)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {technicien.nom} {technicien.prenom}
                          </div>
                          <div className="text-sm text-gray-500">
                            Technicien spécialisé
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Spécialité">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSpecialiteColor(technicien.specialite?.libelle || '')}`}>
                        <Wrench className="h-3 w-3 mr-1" />
                        {technicien.specialite?.libelle || 'Non spécifié'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Contact">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-900">{technicien.contact || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-label="Interventions">
                      {technicien.totalInterventions || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Compte lié">
                      {technicien.utilisateurId ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Link className="h-3 w-3 mr-1" />
                          Compte lié
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Non lié</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" data-label="Actions">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDashboard(technicien.id)}
                          className="text-purple-600 hover:text-purple-900" 
                          title="Dashboard"
                        >
                          <BarChart2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEdit(technicien)}
                          className="text-blue-600 hover:text-blue-900" 
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(technicien.id)}
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
      <TechnicienModal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      <TechnicienModal
        isOpen={showEditModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        technicien={selectedTechnicien}
      />

      <FilterPanel
        isOpen={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        onApply={() => {}}
        options={filterOptions}
        title="Filtrer les techniciens"
      />
    </div>
  );
};