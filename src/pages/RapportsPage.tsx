import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { rapportService } from '../services/rapportService';
import { StatCard } from '../components/StatCard';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  FileText, 
  CheckCircle, 
  XCircle,
  Eye,
  RefreshCw,
  Clock,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FilterPanel } from '../components/FilterPanel';
import { ExportButton } from '../components/ExportButton';

export const RapportsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const navigate = useNavigate();

  const { data, loading, error, refetch } = useApi(
    () => rapportService.getRapports(page, 10, undefined, undefined, statutFilter),
    [page, statutFilter]
  );

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      try {
        await rapportService.deleteRapport(id);
        toast.success('Rapport supprimé avec succès');
        refetch();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleValidate = async (id: number, statut: 'validé' | 'rejeté') => {
    const commentaire = prompt(
      statut === 'validé' 
        ? 'Commentaire de validation (optionnel)' 
        : 'Motif du rejet (optionnel)'
    );
    
    try {
      await rapportService.validateRapport(id, { statut, commentaire: commentaire || undefined });
      toast.success(statut === 'validé' ? 'Rapport validé' : 'Rapport rejeté');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la validation');
    }
  };

  const handleViewDetails = (id: number) => {
    navigate(`/rapports/${id}`);
  };

  const handleCreateRapport = () => {
    navigate('/rapports/new');
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'soumis':
        return 'bg-yellow-100 text-yellow-800';
      case 'validé':
        return 'bg-green-100 text-green-800';
      case 'rejeté':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'soumis':
        return 'Soumis';
      case 'validé':
        return 'Validé';
      case 'rejeté':
        return 'Rejeté';
      default:
        return statut;
    }
  };

  const filterOptions = [
    {
      key: 'statut',
      label: 'Statut',
      type: 'select' as const,
      options: [
        { value: 'soumis', label: 'Soumis' },
        { value: 'validé', label: 'Validé' },
        { value: 'rejeté', label: 'Rejeté' }
      ]
    },
    {
      key: 'technicien',
      label: 'Technicien',
      type: 'select' as const,
      options: []
    },
    {
      key: 'mission',
      label: 'Mission',
      type: 'select' as const,
      options: []
    }
  ];

  // Calculer les statistiques à partir des données réelles
  const totalRapports = data?.pagination?.total || 0;
  const rapportsSoumis = data?.data?.filter(r => r.statut === 'soumis').length || 0;
  const rapportsValides = data?.data?.filter(r => r.statut === 'validé').length || 0;
  const rapportsRejetes = data?.data?.filter(r => r.statut === 'rejeté').length || 0;

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
          <h1 className="text-2xl font-bold text-gray-900">Rapports de mission</h1>
          <p className="text-gray-600">Gérez les rapports d'intervention des techniciens</p>
        </div>
        <button
          onClick={handleCreateRapport}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau rapport
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total rapports"
          value={totalRapports}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="En attente"
          value={rapportsSoumis}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Validés"
          value={rapportsValides}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Rejetés"
          value={rapportsRejetes}
          icon={AlertTriangle}
          color="red"
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
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les statuts</option>
            <option value="soumis">Soumis</option>
            <option value="validé">Validés</option>
            <option value="rejeté">Rejetés</option>
          </select>
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
            filename="rapports" 
            title="Exporter"
          />
        </div>
      </div>

      {/* Table des rapports */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="table-scrollable">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Titre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Technicien
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Images
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
                    Aucun rapport trouvé
                  </td>
                </tr>
              ) : (
                data.data.map((rapport) => (
                  <tr key={rapport.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Titre">
                      <div className="text-sm font-medium text-gray-900">{rapport.titre}</div>
                      <div className="text-xs text-gray-500">ID: #{rapport.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Mission">
                      <div className="text-sm text-gray-900">
                        {rapport.mission?.natureIntervention || `Mission #${rapport.missionId}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {rapport.mission?.client?.nom}
                        {rapport.mission?.client?.entreprise && ` (${rapport.mission.client.entreprise})`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Technicien">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-700">
                            {rapport.technicien?.nom?.charAt(0)}{rapport.technicien?.prenom?.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {rapport.technicien?.nom} {rapport.technicien?.prenom}
                          </div>
                          <div className="text-xs text-gray-500">
                            {rapport.technicien?.specialite?.libelle || 'Non spécifié'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Date">
                      {new Date(rapport.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Statut">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatutColor(rapport.statut)}`}>
                        {getStatutLabel(rapport.statut)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-label="Images">
                      {rapport.images?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" data-label="Actions">
                      <div className="flex items-center space-x-2 flex-wrap gap-2">
                        <button
                          onClick={() => handleViewDetails(rapport.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {rapport.statut === 'soumis' && (
                          <>
                            <button
                              onClick={() => handleValidate(rapport.id, 'validé')}
                              className="text-green-600 hover:text-green-900"
                              title="Valider"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleValidate(rapport.id, 'rejeté')}
                              className="text-red-600 hover:text-red-900"
                              title="Rejeter"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        
                        {rapport.statut === 'soumis' && (
                          <button
                            onClick={() => handleDelete(rapport.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
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

      {/* Filtres */}
      <FilterPanel
        isOpen={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        onApply={() => {}}
        options={filterOptions}
        title="Filtrer les rapports"
      />
    </div>
  );
};