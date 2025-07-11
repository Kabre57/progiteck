import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { clientService } from '../services/clientService';
import { StatCard } from '../components/StatCard';
import { ClientModal } from '../components/modals/ClientModal';
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
  Crown, 
  Clock,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ClientsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [filters, setFilters] = useState({});

  const { data, loading, error, refetch } = useApi(
    () => clientService.getClients(page, 10, search),
    [page, search]
  );

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        await clientService.deleteClient(id);
        toast.success('Client supprimé avec succès');
        refetch();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleEdit = (client: any) => {
    setSelectedClient(client);
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedClient(null);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  const filterOptions = [
    {
      key: 'statut',
      label: 'Statut',
      type: 'select' as const,
      options: [
        { value: 'active', label: 'Actif' },
        { value: 'inactive', label: 'Inactif' }
      ]
    },
    {
      key: 'typeDeCart',
      label: 'Type de carte',
      type: 'select' as const,
      options: [
        { value: 'Standard', label: 'Standard' },
        { value: 'Premium', label: 'Premium' },
        { value: 'VIP', label: 'VIP' }
      ]
    },
    {
      key: 'dateInscription',
      label: 'Date d\'inscription',
      type: 'date' as const
    }
  ];

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

  // Calculer les statistiques à partir des données réelles
  const activeClients = data?.data?.filter(client => client.statut === 'active').length || 0;
  const premiumClients = data?.data?.filter(client => client.typeDeCart === 'Premium' || client.typeDeCart === 'VIP').length || 0;
  const pendingClients = data?.data?.filter(client => client.statut === 'inactive').length || 0;

  const stats = {
    total: data?.pagination?.total || 0,
    actifs: activeClients,
    premium: premiumClients,
    enAttente: pendingClients
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des clients</h1>
          <p className="text-gray-600">Gérez vos clients et leurs informations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau client
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total clients"
          value={stats.total}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Actifs"
          value={stats.actifs}
          icon={UserCheck}
          color="green"
        />
        <StatCard
          title="Premium"
          value={stats.premium}
          icon={Crown}
          color="purple"
        />
        <StatCard
          title="En attente"
          value={stats.enAttente}
          icon={Clock}
          color="yellow"
        />
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
            data={data?.data || []} 
            filename="clients" 
            title="Exporter"
          />
        </div>
      </div>

      {/* Table des clients */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="table-scrollable">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type de carte
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localisation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d'inscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!data?.data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Aucun client trouvé
                  </td>
                </tr>
              ) : (
                data.data.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Client">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-700">
                              {client.nom.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {client.nom}
                          </div>
                          <div className="text-sm text-gray-500">
                            {client.entreprise}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Contact">
                      <div className="text-sm text-gray-900">{client.email}</div>
                      <div className="text-sm text-gray-500">{client.telephone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Type de carte">
                      <span className="text-sm text-gray-900">{client.typeDeCart || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Statut">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.statut === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {client.statut === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-label="Localisation">
                      {client.localisation || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Date d'inscription">
                      {new Date(client.dateDInscription).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" data-label="Actions">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(client)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
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
      <ClientModal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      <ClientModal
        isOpen={showEditModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        client={selectedClient}
      />

      <FilterPanel
        isOpen={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        onApply={setFilters}
        options={filterOptions}
        title="Filtrer les clients"
      />
    </div>
  );
};