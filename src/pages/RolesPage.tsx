import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { roleService } from '../services/roleService';
import { StatCard } from '../components/StatCard';
import { RoleModal } from '../components/modals/RoleModal';
import { ExportButton } from '../components/ExportButton';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Shield, 
  Users, 
  Settings, 
  Crown,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export const RolesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const { data, loading, error, refetch } = useApi(
    () => roleService.getRoles(page, 10),
    [page]
  );

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      try {
        await roleService.deleteRole(id);
        toast.success('Rôle supprimé avec succès');
        refetch();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleEdit = (role: any) => {
    setSelectedRole(role);
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedRole(null);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  // Calculer les statistiques à partir des données réelles
  const totalRoles = data?.pagination?.total || 0;
  const totalUsers = data?.data?.reduce((sum, role) => sum + (role.totalUtilisateurs || 0), 0) || 0;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-purple-100 text-purple-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return Crown;
      case 'manager':
        return Settings;
      case 'user':
        return Users;
      default:
        return Shield;
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des rôles</h1>
          <p className="text-gray-600">Gérez les rôles et permissions du système</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau rôle
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total rôles"
          value={totalRoles}
          icon={Shield}
          color="purple"
        />
        <StatCard
          title="Rôles actifs"
          value={totalRoles}
          icon={Settings}
          color="green"
        />
        <StatCard
          title="Utilisateurs"
          value={totalUsers}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Permissions"
          value={totalRoles * 4}
          icon={Crown}
          color="yellow"
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
            filename="roles" 
            title="Exporter"
          />
        </div>
      </div>

      {/* Grille des rôles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!data?.data || data.data.length === 0 ? (
          <div className="col-span-3 bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            Aucun rôle trouvé
          </div>
        ) : (
          data.data.map((role) => {
            const IconComponent = getRoleIcon(role.libelle);
            return (
              <div key={role.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getRoleColor(role.libelle)}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEdit(role)}
                      className="text-blue-600 hover:text-blue-900" 
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Supprimer"
                      disabled={role.libelle === 'admin'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 capitalize">
                  {role.libelle}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4">
                  {role.description || 'Aucune description'}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {role.totalUtilisateurs || 0} utilisateur{(role.totalUtilisateurs || 0) > 1 ? 's' : ''}
                  </span>
                  <span className="text-gray-500">
                    Créé le {new Date(role.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            );
          })
        )}
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
      <RoleModal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      <RoleModal
        isOpen={showEditModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        role={selectedRole}
      />
    </div>
  );
};