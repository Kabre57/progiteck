import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { specialiteService } from '../services/specialiteService';
import { StatCard } from '../components/StatCard';
import { SpecialiteModal } from '../components/modals/SpecialiteModal';
import { ExportButton } from '../components/ExportButton';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Wrench,
  Users,
  Award,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export const SpecialitesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSpecialite, setSelectedSpecialite] = useState(null);

  const { data, loading, error, refetch } = useApi(
    () => specialiteService.getSpecialites(page, 10),
    [page]
  );

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette spécialité ?')) {
      try {
        await specialiteService.deleteSpecialite(id);
        toast.success('Spécialité supprimée avec succès');
        refetch();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleEdit = (specialite: any) => {
    setSelectedSpecialite(specialite);
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedSpecialite(null);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  // Calculer les statistiques à partir des données réelles
  const totalSpecialites = data?.pagination?.total || 0;
  const totalTechniciens = data?.data?.reduce((sum, specialite) => sum + (specialite.totalTechniciens || 0), 0) || 0;

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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des spécialités</h1>
          <p className="text-gray-600">Gérez les spécialités techniques de vos techniciens</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle spécialité
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total spécialités"
          value={totalSpecialites}
          icon={Award}
          color="green"
        />
        <StatCard
          title="Techniciens assignés"
          value={totalTechniciens}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Compétences couvertes"
          value={totalSpecialites * 3}
          icon={Wrench}
          color="purple"
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
        <div className="flex space-x-2">
          <button 
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </button>
          <ExportButton 
            data={data?.data || []} 
            filename="specialites" 
            title="Exporter"
          />
        </div>
      </div>

      {/* Table des spécialités */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Libellé
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Techniciens
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date de création
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {!data?.data || data.data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Aucune spécialité trouvée
                </td>
              </tr>
            ) : (
              data.data.map((specialite) => (
                <tr key={specialite.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <Award className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {specialite.libelle}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">
                      {specialite.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {specialite.totalTechniciens || 0} technicien{(specialite.totalTechniciens || 0) > 1 ? 's' : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(specialite.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEdit(specialite)}
                        className="text-blue-600 hover:text-blue-900" 
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(specialite.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer"
                        disabled={(specialite.totalTechniciens ?? 0) > 0}
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

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
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
      <SpecialiteModal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      <SpecialiteModal
        isOpen={showEditModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        specialite={selectedSpecialite}
      />
    </div>
  );
};
