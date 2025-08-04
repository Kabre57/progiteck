import { useState, useEffect } from 'react';
import { Eye, FileText, DollarSign, AlertTriangle, CheckCircle, Printer } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { factureService } from '@/services/factureService';
import { Facture } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import PrintService from '@/services/printService';

export default function FacturesPage() {
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    emises: 0,
    payees: 0,
    enRetard: 0,
  });

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  const loadStats = async () => {
    try {
      const [response, overdueResponse] = await Promise.all([
        factureService.getFactures({ page: 1, limit: 100 }),
        factureService.getOverdueFactures()
      ]);
      
      const allFactures = response.data || [];
      const overdueFactures = overdueResponse.data || [];
      
      setStats({
        total: allFactures.length,
        emises: allFactures.filter(f => f.statut === 'emise' || f.statut === 'envoyee').length,
        payees: allFactures.filter(f => f.statut === 'payee').length,
        enRetard: overdueFactures.length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const fetchFactures = async (params: { page: number; limit: number; search?: string }) => {
    const response = await factureService.getFactures(params);
    return {
      data: response.data || [],
      pagination: response.pagination!,
    };
  };

  const getStatusBadge = (statut: string) => {
    const statusMap = {
      emise: { variant: 'info' as const, label: 'Émise' },
      envoyee: { variant: 'warning' as const, label: 'Envoyée' },
      payee: { variant: 'success' as const, label: 'Payée' },
      annulee: { variant: 'error' as const, label: 'Annulée' },
    };
    
    const status = statusMap[statut as keyof typeof statusMap] || { variant: 'default' as const, label: statut };
    return <Badge variant={status.variant}>{status.label}</Badge>;
  };

  const handleMarkAsPaid = async (facture: Facture) => {
    const modePaiement = prompt('Mode de paiement (virement, chèque, espèces, mobile money, etc.):');
    const referenceTransaction = prompt('Référence de transaction:');
    const dateReception = prompt('Date de réception du paiement (YYYY-MM-DD):') || new Date().toISOString().split('T')[0];
    
    if (modePaiement) {
      try {
        await factureService.updateFacture(facture.id, {
          statut: 'payee',
          datePaiement: new Date(dateReception).toISOString(),
          modePaiement,
          referenceTransaction,
        });
        toast.success('Paiement enregistré par le comptable');
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        toast.error('Erreur lors de l\'enregistrement du paiement');
      }
    }
  };

  const columns = [
    {
      key: 'numero' as keyof Facture,
      title: 'N° Facture',
      render: (value: string, record: Facture) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {record.devis ? `Devis ${record.devis.numero}` : 'Facture directe'}
          </p>
        </div>
      ),
    },
    {
      key: 'client' as keyof Facture,
      title: 'Client',
      render: (client: Facture['client']) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{client.nom}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{client.entreprise || 'Particulier'}</p>
        </div>
      ),
    },
    {
      key: 'montantTTC' as keyof Facture,
      title: 'Montant TTC',
      render: (montant: number) => (
        <div className="text-right">
          <p className="font-medium text-gray-900 dark:text-white">{montant.toLocaleString('fr-FR')} FCFA</p>
        </div>
      ),
    },
    {
      key: 'dateEmission' as keyof Facture,
      title: 'Émission',
      render: (date: string) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {format(new Date(date), 'dd/MM/yyyy', { locale: fr })}
        </span>
      ),
    },
    {
      key: 'dateEcheance' as keyof Facture,
      title: 'Échéance',
      render: (date: string, record: Facture) => {
        const isOverdue = new Date(date) < new Date() && record.statut !== 'payee';
        return (
          <div className={`text-sm ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-white'}`}>
            {format(new Date(date), 'dd/MM/yyyy', { locale: fr })}
            {isOverdue && <span className="block text-xs">En retard</span>}
          </div>
        );
      },
    },
    {
      key: 'statut' as keyof Facture,
      title: 'Statut',
      render: (statut: string) => getStatusBadge(statut),
    },
    {
      key: 'actions' as keyof Facture,
      title: 'Actions',
      render: (value: any, record: Facture) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedFacture(record);
              setShowViewModal(true);
            }}
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
            title="Voir détails"
          >
            <Eye className="h-4 w-4" />
          </button>
          
          {record.statut !== 'payee' && record.statut !== 'annulee' && (
            <button
              onClick={() => handleMarkAsPaid(record)}
              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1"
              title="Enregistrer paiement (Comptable)"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={() => PrintService.printFacture(record)}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 p-1"
            title="Imprimer"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Factures</h1>
            <p className="text-gray-600 dark:text-gray-400">Suivez vos factures et encaissements</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total factures"
            value={stats.total}
            icon={FileText}
            color="blue"
            trend={{ value: "8%", isPositive: true }}
          />
          <StatCard
            title="En attente"
            value={stats.emises}
            icon={DollarSign}
            color="yellow"
          />
          <StatCard
            title="Payées"
            value={stats.payees}
            icon={CheckCircle}
            color="green"
            trend={{ value: "15%", isPositive: true }}
          />
          <StatCard
            title="En retard"
            value={stats.enRetard}
            icon={AlertTriangle}
            color="red"
            trend={{ value: "2", isPositive: false }}
          />
        </div>

        {/* Factures en retard */}
        {stats.enRetard > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Factures en Retard</h3>
            </div>
            <p className="text-sm text-red-700 dark:text-red-400">
              Vous avez {stats.enRetard} facture(s) en retard de paiement qui nécessitent un suivi.
            </p>
          </div>
        )}

        {/* Table */}
        <DataTable
          columns={columns}
          fetchData={fetchFactures}
          pageSize={10}
          searchable={true}
          key={refreshTrigger}
        />

        {/* Modal Détails */}
        <Modal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedFacture(null);
          }}
          title="Détails de la Facture"
          size="xl"
        >
          {selectedFacture && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">N° Facture</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedFacture.numero}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
                  <div className="mt-1">{getStatusBadge(selectedFacture.statut)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Client</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedFacture.client.nom}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date d'émission</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {format(new Date(selectedFacture.dateEmission), 'dd/MM/yyyy', { locale: fr })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date d'échéance</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {format(new Date(selectedFacture.dateEcheance), 'dd/MM/yyyy', { locale: fr })}
                  </p>
                </div>
                {selectedFacture.datePaiement && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date de paiement</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {format(new Date(selectedFacture.datePaiement), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                  </div>
                )}
              </div>

              {/* Lignes de la facture */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lignes de la facture</label>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Désignation</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Qté</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Prix unitaire</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Montant HT</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedFacture.lignes.map((ligne) => (
                        <tr key={ligne.id}>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{ligne.designation}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{ligne.quantite}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{ligne.prixUnitaire.toLocaleString('fr-FR')} FCFA</td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{ligne.montantHT.toLocaleString('fr-FR')} FCFA</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totaux */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Montant HT:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedFacture.montantHT.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">TVA ({selectedFacture.tauxTVA}%):</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {(selectedFacture.montantTTC - selectedFacture.montantHT).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-base font-medium text-gray-900 dark:text-white">Montant TTC:</span>
                  <span className="text-base font-bold text-gray-900 dark:text-white">{selectedFacture.montantTTC.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>

              {/* Informations de paiement */}
              {selectedFacture.modePaiement && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mode de paiement</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedFacture.modePaiement}</p>
                  </div>
                  {selectedFacture.referenceTransaction && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Référence transaction</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedFacture.referenceTransaction}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}