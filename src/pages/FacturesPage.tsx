import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { factureService } from '../services/factureService';
import { StatCard } from '../components/StatCard';
import { ExportButton } from '../components/ExportButton';
import { FilterPanel } from '../components/FilterPanel';
import { 
  Search, 
  Filter, 
  Edit, 
  Send, 
  Check,
  Receipt, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  CreditCard,
  Euro,
  Printer,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { generateFacturePDF } from '../utils/pdfGenerator';

export const FacturesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const { data, loading, error, refetch } = useApi(
    () => factureService.getFactures(page, 10, statutFilter),
    [page, statutFilter]
  );

  const handleSend = async (id: number) => {
    try {
      await factureService.sendFacture(id);
      toast.success('Facture envoyée au client');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi');
    }
  };

  const handlePay = async (id: number) => {
    const modePaiement = prompt('Mode de paiement:');
    const referenceTransaction = prompt('Référence de transaction (optionnel):');
    
    if (!modePaiement) return;
    
    try {
      await factureService.payFacture(id, {
        modePaiement,
        referenceTransaction: referenceTransaction || undefined,
      });
      toast.success('Facture marquée comme payée');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du marquage de paiement');
    }
  };

  const handlePrintFacture = async (facture: any) => {
    try {
      await generateFacturePDF(facture);
      toast.success('Facture prête pour impression');
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'emise':
        return 'bg-blue-100 text-blue-800';
      case 'envoyee':
        return 'bg-yellow-100 text-yellow-800';
      case 'payee':
        return 'bg-green-100 text-green-800';
      case 'annulee':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'emise':
        return 'Émise';
      case 'envoyee':
        return 'Envoyée';
      case 'payee':
        return 'Payée';
      case 'annulee':
        return 'Annulée';
      default:
        return statut;
    }
  };

  const canSend = (statut: string) => {
    return statut === 'emise';
  };

  const canPay = (statut: string) => {
    return ['emise', 'envoyee'].includes(statut);
  };

  const filterOptions = [
    {
      key: 'statut',
      label: 'Statut',
      type: 'select' as const,
      options: [
        { value: 'emise', label: 'Émise' },
        { value: 'envoyee', label: 'Envoyée' },
        { value: 'payee', label: 'Payée' },
        { value: 'annulee', label: 'Annulée' }
      ]
    },
    {
      key: 'dateEmission',
      label: 'Date d\'émission',
      type: 'date' as const
    },
    {
      key: 'dateEcheance',
      label: 'Date d\'échéance',
      type: 'date' as const
    }
  ];

  // Calculer les statistiques à partir des données réelles
  const totalFactures = data?.pagination?.total || 0;
  const emises = data?.data?.filter(f => f.statut === 'emise').length || 0;
  const envoyees = data?.data?.filter(f => f.statut === 'envoyee').length || 0;
  const payees = data?.data?.filter(f => f.statut === 'payee').length || 0;

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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des factures</h1>
          <p className="text-gray-600">Suivez et gérez vos factures clients</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total factures"
          value={totalFactures}
          icon={Receipt}
          color="blue"
        />
        <StatCard
          title="Émises"
          value={emises}
          icon={Edit}
          color="blue"
        />
        <StatCard
          title="Envoyées"
          value={envoyees}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Payées"
          value={payees}
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
            <option value="emise">Émise</option>
            <option value="envoyee">Envoyée</option>
            <option value="payee">Payée</option>
            <option value="annulee">Annulée</option>
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
            filename="factures" 
            title="Exporter"
          />
        </div>
      </div>

      {/* Table des factures */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="table-scrollable">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Numéro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Devis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant TTC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date émission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Échéance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!data?.data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Aucune facture trouvée
                  </td>
                </tr>
              ) : (
                data.data.map((facture) => (
                  <tr key={facture.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" data-label="Numéro">
                      {facture.numero}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Client">
                      <div className="text-sm text-gray-900">{facture.client?.nom}</div>
                      <div className="text-sm text-gray-500">{facture.client?.entreprise}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Devis">
                      <div className="text-sm text-gray-900">{facture.devis?.numero}</div>
                      <div className="text-sm text-gray-500">{facture.devis?.titre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-label="Montant TTC">
                      {facture.montantTTC.toLocaleString('fr-FR', { 
                        style: 'currency', 
                        currency: 'XOF' 
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" data-label="Statut">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatutColor(facture.statut)}`}>
                        {getStatutLabel(facture.statut)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Date émission">
                      {new Date(facture.dateEmission).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Échéance">
                      {new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" data-label="Actions">
                      <div className="flex items-center space-x-2 flex-wrap gap-2">
                        {/* Toujours disponible: Imprimer */}
                        <button
                          onClick={() => handlePrintFacture(facture)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Imprimer"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        
                        {/* Toujours disponible: Voir */}
                        <button
                          onClick={() => window.open(`/factures/${facture.id}`, '_blank')}
                          className="text-gray-600 hover:text-gray-900"
                          title="Voir"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {/* Conditionnels: Envoyer, Payer */}
                        {canSend(facture.statut) && (
                          <button
                            onClick={() => handleSend(facture.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Envoyer au client"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        )}
                        
                        {canPay(facture.statut) && (
                          <button
                            onClick={() => handlePay(facture.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Marquer comme payée"
                          >
                            <CreditCard className="h-4 w-4" />
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
        title="Filtrer les factures"
      />
    </div>
  );
};