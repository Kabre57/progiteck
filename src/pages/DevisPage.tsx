import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { devisService } from '../services/devisService';
import { StatCard } from '../components/StatCard';
import { DevisModal } from '../components/modals/DevisModal';
import { ExportButton } from '../components/ExportButton';
import { FilterPanel } from '../components/FilterPanel';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Send, 
  Check, 
  X,
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  Receipt,
  Printer,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { generateDevisPDF } from '../utils/pdfGenerator';

export const DevisPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState(null);

  const { data, loading, error, refetch } = useApi(
    () => devisService.getDevis(page, 10, statutFilter),
    [page, statutFilter]
  );

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
      try {
        await devisService.deleteDevis(id);
        toast.success('Devis supprimé avec succès');
        refetch();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleSend = async (id: number) => {
    try {
      await devisService.sendDevis(id);
      toast.success('Devis envoyé pour validation DG');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi');
    }
  };

  const handleValidate = async (id: number, statut: 'valide_dg' | 'refuse_dg') => {
    const commentaire = prompt(
      statut === 'valide_dg' 
        ? 'Commentaire de validation (optionnel)' 
        : 'Motif du refus (optionnel)'
    );
    
    try {
      await devisService.validateDevis(id, statut, commentaire || undefined);
      toast.success(statut === 'valide_dg' ? 'Devis validé' : 'Devis refusé');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la validation');
    }
  };

  const handleClientResponse = async (id: number, statut: 'accepte_client' | 'refuse_client') => {
    const commentaire = prompt(
      statut === 'accepte_client' 
        ? 'Commentaire d\'acceptation (optionnel)' 
        : 'Motif du refus (optionnel)'
    );
    
    try {
      await devisService.responseDevis(id, statut, commentaire || undefined);
      toast.success(statut === 'accepte_client' ? 'Devis accepté par le client' : 'Devis refusé par le client');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la réponse');
    }
  };

  const handleCreateFacture = async (id: number) => {
    try {
      const dateEcheance = prompt('Date d\'échéance (YYYY-MM-DD):', 
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      
      if (!dateEcheance) return;
      
      await devisService.createFactureFromDevis(id, dateEcheance);
      toast.success('Facture créée avec succès');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création de la facture');
    }
  };

  const handlePrintDevis = async (devis: any) => {
    try {
      await generateDevisPDF(devis);
      toast.success('Devis prêt pour impression');
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const handleEdit = (devis: any) => {
    setSelectedDevis(devis);
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedDevis(null);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'brouillon':
        return 'bg-gray-100 text-gray-800';
      case 'envoye':
        return 'bg-blue-100 text-blue-800';
      case 'valide_dg':
        return 'bg-green-100 text-green-800';
      case 'refuse_dg':
        return 'bg-red-100 text-red-800';
      case 'accepte_client':
        return 'bg-emerald-100 text-emerald-800';
      case 'refuse_client':
        return 'bg-orange-100 text-orange-800';
      case 'facture':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'brouillon':
        return 'Brouillon';
      case 'envoye':
        return 'Envoyé DG';
      case 'valide_dg':
        return 'Validé DG';
      case 'refuse_dg':
        return 'Refusé DG';
      case 'accepte_client':
        return 'Accepté Client';
      case 'refuse_client':
        return 'Refusé Client';
      case 'facture':
        return 'Facturé';
      default:
        return statut;
    }
  };

  const canEdit = (statut: string) => {
    return ['brouillon', 'refuse_dg', 'refuse_client'].includes(statut);
  };

  const canSend = (statut: string) => {
    return statut === 'brouillon';
  };

  const canValidate = (statut: string) => {
    return statut === 'envoye';
  };

  const canClientRespond = (statut: string) => {
    return statut === 'valide_dg';
  };

  const canCreateFacture = (statut: string) => {
    return statut === 'accepte_client';
  };

  const canDelete = (statut: string) => {
    return ['brouillon', 'refuse_dg', 'refuse_client'].includes(statut);
  };

  const filterOptions = [
    {
      key: 'statut',
      label: 'Statut',
      type: 'select' as const,
      options: [
        { value: 'brouillon', label: 'Brouillon' },
        { value: 'envoye', label: 'Envoyé DG' },
        { value: 'valide_dg', label: 'Validé DG' },
        { value: 'refuse_dg', label: 'Refusé DG' },
        { value: 'accepte_client', label: 'Accepté Client' },
        { value: 'refuse_client', label: 'Refusé Client' },
        { value: 'facture', label: 'Facturé' }
      ]
    }
  ];

  // Calculer les statistiques à partir des données réelles
  const totalDevis = data?.pagination?.total || 0;
  const brouillons = data?.data?.filter(d => d.statut === 'brouillon').length || 0;
  const enAttente = data?.data?.filter(d => d.statut === 'envoye').length || 0;
  const valides = data?.data?.filter(d => ['valide_dg', 'accepte_client'].includes(d.statut)).length || 0;

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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des devis</h1>
          <p className="text-gray-600">Créez et gérez vos devis avec validation DG</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau devis
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total devis"
          value={totalDevis}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Brouillons"
          value={brouillons}
          icon={Edit}
          color="gray"
        />
        <StatCard
          title="En attente DG"
          value={enAttente}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Validés"
          value={valides}
          icon={CheckCircle}
          color="green"
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
            <option value="brouillon">Brouillon</option>
            <option value="envoye">Envoyé DG</option>
            <option value="valide_dg">Validé DG</option>
            <option value="refuse_dg">Refusé DG</option>
            <option value="accepte_client">Accepté Client</option>
            <option value="refuse_client">Refusé Client</option>
            <option value="facture">Facturé</option>
          </select>
          <button 
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </button>
          <ExportButton 
            data={data?.data || []} 
            filename="devis" 
            title="Exporter"
          />
        </div>
      </div>

      {/* Table des devis */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="table-scrollable">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Numéro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Titre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant TTC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date création
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
                    Aucun devis trouvé
                  </td>
                </tr>
              ) : (
                data.data.map((devis) => (
                  <tr key={devis.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" data-label="Numéro">
                      {devis.numero}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Titre">
                      <div className="text-sm font-medium text-gray-900">{devis.titre}</div>
                      {devis.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {devis.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Client">
                      <div className="text-sm text-gray-900">{devis.client?.nom}</div>
                      <div className="text-sm text-gray-500">{devis.client?.entreprise}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-label="Montant TTC">
                      {devis.montantTTC.toLocaleString('fr-FR', { 
                        style: 'currency', 
                        currency: 'XOF' 
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Statut">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatutColor(devis.statut)}`}>
                        {getStatutLabel(devis.statut)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Date création">
                      {new Date(devis.dateCreation).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" data-label="Actions">
                      <div className="flex items-center space-x-2 flex-wrap gap-2">
                        {/* Toujours disponible: Imprimer */}
                        <button
                          onClick={() => handlePrintDevis(devis)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Imprimer"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        
                        {/* Toujours disponible: Voir */}
                        <button
                          onClick={() => window.open(`/devis/${devis.id}`, '_blank')}
                          className="text-gray-600 hover:text-gray-900"
                          title="Voir"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {/* Conditionnels: Éditer, Envoyer, Valider/Refuser, Accepter/Refuser, Facturer, Supprimer */}
                        {canEdit(devis.statut) && (
                          <button
                            onClick={() => handleEdit(devis)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        
                        {canSend(devis.statut) && (
                          <button
                            onClick={() => handleSend(devis.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Envoyer pour validation DG"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        )}
                        
                        {canValidate(devis.statut) && (
                          <>
                            <button
                              onClick={() => handleValidate(devis.id, 'valide_dg')}
                              className="text-green-600 hover:text-green-900"
                              title="Valider"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleValidate(devis.id, 'refuse_dg')}
                              className="text-red-600 hover:text-red-900"
                              title="Refuser"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        
                        {canClientRespond(devis.statut) && (
                          <>
                            <button
                              onClick={() => handleClientResponse(devis.id, 'accepte_client')}
                              className="text-green-600 hover:text-green-900"
                              title="Accepter (client)"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleClientResponse(devis.id, 'refuse_client')}
                              className="text-red-600 hover:text-red-900"
                              title="Refuser (client)"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        
                        {canCreateFacture(devis.statut) && !devis.factureId && (
                          <button
                            onClick={() => handleCreateFacture(devis.id)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Créer facture"
                          >
                            <Receipt className="h-4 w-4" />
                          </button>
                        )}
                        
                        {canDelete(devis.statut) && (
                          <button
                            onClick={() => handleDelete(devis.id)}
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

      {/* Modales */}
      <DevisModal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      <DevisModal
        isOpen={showEditModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        devis={selectedDevis}
      />
    </div>
  );
};