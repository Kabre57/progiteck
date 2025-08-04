import { useState, useEffect } from 'react';
import { Plus, Edit, Eye, FileText, CheckCircle, XCircle, Clock, DollarSign, Printer } from 'lucide-react';
import DevisForm from '@/components/forms/DevisForm';
import Modal from '@/components/ui/Modal';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { devisService } from '@/services/devisService';
import { clientService } from '@/services/clientService';
import { missionService } from '@/services/missionService';
import { useAuth } from '@/hooks/useAuth';
import { Devis } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import PrintService from '@/services/printService';

import { CreateDevisData } from '@/types';

export default function DevisPage() {
  const { hasRole } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState<Devis | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [clients, setClients] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    brouillon: 0,
    enValidation: 0,
    valides: 0,
  });

  useEffect(() => {
    loadStats();
    loadClients();
    loadMissions();
  }, [refreshTrigger]);

  const loadStats = async () => {
    try {
      const response = await devisService.getDevis({ page: 1, limit: 100 });
      const allDevis = response.data || [];
      
      setStats({
        total: allDevis.length,
        brouillon: allDevis.filter(d => d.statut === 'brouillon').length,
        enValidation: allDevis.filter(d => ['envoye', 'valide_dg'].includes(d.statut)).length,
        valides: allDevis.filter(d => ['valide_pdg', 'accepte_client'].includes(d.statut)).length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadClients = async () => {
    try {
      const response = await clientService.getClients({ page: 1, limit: 100 });
      setClients(response.data || []);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const loadMissions = async () => {
    try {
      const response = await missionService.getMissions({ page: 1, limit: 100 });
      setMissions(response.data || []);
    } catch (error) {
      console.error('Failed to load missions:', error);
    }
  };

  const fetchDevis = async (params: { page: number; limit: number; search?: string }) => {
    const response = await devisService.getDevis(params);
    return {
      data: response.data || [],
      pagination: response.pagination!,
    };
  };

  const handleCreate = async (data: CreateDevisData) => {
    try {
      await devisService.createDevis(data);
      setShowCreateModal(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleEdit = (devis: Devis) => {
    setSelectedDevis(devis);
    setShowEditModal(true);
  };

  const handleUpdate = async (data: Partial<CreateDevisData>) => {
    if (selectedDevis) {
      try {
        // Note: L'API ne semble pas avoir d'endpoint PUT pour les devis
        // On peut implémenter quand l'endpoint sera disponible
        toast.error('Modification de devis non disponible pour le moment');
        setShowEditModal(false);
        setSelectedDevis(null);
      } catch (error) {
        toast.error('Erreur lors de la modification');
      }
    }
  };

  const getStatusBadge = (statut: string) => {
    const statusMap = {
      brouillon: { variant: 'secondary' as const, label: 'Brouillon' },
      envoye: { variant: 'info' as const, label: 'Envoyé' },
      valide_dg: { variant: 'warning' as const, label: 'Validé DG' },
      refuse_dg: { variant: 'error' as const, label: 'Refusé DG' },
      valide_pdg: { variant: 'success' as const, label: 'Validé PDG' },
      refuse_pdg: { variant: 'error' as const, label: 'Refusé PDG' },
      accepte_client: { variant: 'success' as const, label: 'Accepté Client' },
      refuse_client: { variant: 'error' as const, label: 'Refusé Client' },
      facture: { variant: 'success' as const, label: 'Facturé' },
    };
    
    const status = statusMap[statut as keyof typeof statusMap] || { variant: 'default' as const, label: statut };
    return <Badge variant={status.variant}>{status.label}</Badge>;
  };

  const handleValidate = async (devis: Devis, action: 'approve' | 'reject', level: 'dg' | 'pdg') => {
    const comment = prompt(`Commentaire ${level.toUpperCase()} (optionnel):`);
    const statut = action === 'approve' 
      ? (level === 'dg' ? 'valide_dg' : 'valide_pdg')
      : (level === 'dg' ? 'refuse_dg' : 'refuse_pdg');

    try {
      await devisService.validateDevis(devis.id, statut, comment || undefined);
      toast.success(`Devis ${action === 'approve' ? 'validé' : 'refusé'} avec succès`);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast.error('Erreur lors de la validation');
    }
  };

  const handleConvertToInvoice = async (devis: Devis) => {
    const typeDevis = confirm('Type de devis :\n\nOK = Devis client (nécessite acceptation)\nAnnuler = Devis interne (conversion directe)');
    
    if (typeDevis) {
      // Devis client - vérifier acceptation
      if (devis.statut !== 'accepte_client') {
        toast.error('Le devis client doit être accepté avant conversion');
        return;
      }
    } else {
      // Devis interne - vérifier validation PDG
      if (devis.statut !== 'valide_pdg') {
        toast.error('Le devis interne doit être validé par le PDG avant conversion');
        return;
      }
    }
    
    if (confirm(`Convertir ce ${typeDevis ? 'devis client' : 'devis interne'} en facture ?`)) {
      try {
        await devisService.convertToInvoice(devis.id);
        toast.success(`${typeDevis ? 'Devis client' : 'Devis interne'} converti en facture avec succès`);
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        toast.error('Erreur lors de la conversion');
      }
    }
  };

  const columns = [
    {
      key: 'numero' as keyof Devis,
      title: 'N° Devis',
      render: (value: string, record: Devis) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{record.titre}</p>
        </div>
      ),
    },
    {
      key: 'client' as keyof Devis,
      title: 'Client',
      render: (client: Devis['client']) => (
        <div>
          <p className="font-medium text-gray-900">{client.nom}</p>
          <p className="text-sm text-gray-500">{client.entreprise || 'Particulier'}</p>
        </div>
      ),
    },
    {
      key: 'montantTTC' as keyof Devis,
      title: 'Montant TTC',
      render: (montant: number) => (
        <div className="text-right">
          <p className="font-medium text-gray-900">{montant.toLocaleString('fr-FR')} FCFA</p>
        </div>
      ),
    },
    {
      key: 'dateValidite' as keyof Devis,
      title: 'Validité',
      render: (date: string) => (
        <span className="text-sm text-gray-900">
          {format(new Date(date), 'dd/MM/yyyy', { locale: fr })}
        </span>
      ),
    },
    {
      key: 'statut' as keyof Devis,
      title: 'Statut',
      render: (statut: string) => getStatusBadge(statut),
    },
    {
      key: 'actions' as keyof Devis,
      title: 'Actions',
      render: (value: any, record: Devis) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedDevis(record);
              setShowViewModal(true);
            }}
            className="text-blue-600 hover:text-blue-900 p-1"
            title="Voir détails"
          >
            <Eye className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => handleEdit(record)}
            className="text-green-600 hover:text-green-900 p-1"
            title="Modifier"
          >
            <Edit className="h-4 w-4" />
          </button>
          
          {/* Validation DG */}
          {hasRole(['admin']) && record.statut === 'envoye' && (
            <>
              <button
                onClick={() => handleValidate(record, 'approve', 'dg')}
                className="text-green-600 hover:text-green-900 p-1"
                title="Valider DG"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleValidate(record, 'reject', 'dg')}
                className="text-red-600 hover:text-red-900 p-1"
                title="Refuser DG"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
          
          {/* Validation PDG */}
          {hasRole(['admin']) && record.statut === 'valide_dg' && (
            <>
              <button
                onClick={() => handleValidate(record, 'approve', 'pdg')}
                className="text-green-600 hover:text-green-900 p-1"
                title="Valider PDG"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleValidate(record, 'reject', 'pdg')}
                className="text-red-600 hover:text-red-900 p-1"
                title="Refuser PDG"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
          
          {/* Conversion en facture */}
          {hasRole(['admin', 'manager']) && (record.statut === 'accepte_client' || record.statut === 'valide_pdg') && (
            <button
              onClick={() => handleConvertToInvoice(record)}
              className="text-purple-600 hover:text-purple-900 p-1"
              title="Convertir en facture"
            >
              <FileText className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={() => PrintService.printDevis(record)}
            className="text-gray-600 hover:text-gray-900 p-1"
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
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Devis</h1>
            <p className="text-gray-600">Créez et gérez vos devis avec workflow de validation</p>
          </div>
          {hasRole(['admin', 'manager', 'commercial']) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau Devis</span>
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total devis"
            value={stats.total}
            icon={FileText}
            color="blue"
            trend={{ value: "8%", isPositive: true }}
          />
          <StatCard
            title="Brouillons"
            value={stats.brouillon}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title="En validation"
            value={stats.enValidation}
            icon={Clock}
            color="purple"
          />
          <StatCard
            title="Validés"
            value={stats.valides}
            icon={CheckCircle}
            color="green"
            trend={{ value: "15%", isPositive: true }}
          />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          fetchData={fetchDevis}
          pageSize={10}
          searchable={true}
          key={refreshTrigger}
        />

        {/* Modal Création */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Nouveau Devis"
          size="xl"
        >
          <DevisForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>

        {/* Modal Modification */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedDevis(null);
          }}
          title="Modifier Devis"
          size="xl"
        >
          {selectedDevis && (
            <DevisForm
              devis={selectedDevis}
              onSubmit={handleUpdate}
              onCancel={() => {
                setShowEditModal(false);
                setSelectedDevis(null);
              }}
            />
          )}
        </Modal>

        {/* Modal Détails */}
        <Modal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedDevis(null);
          }}
          title="Détails du Devis"
          size="xl"
        >
          {selectedDevis && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">N° Devis</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedDevis.numero}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Statut</label>
                  <div className="mt-1">{getStatusBadge(selectedDevis.statut)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedDevis.client.nom}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de validité</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(selectedDevis.dateValidite), 'dd/MM/yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Titre</label>
                <p className="mt-1 text-sm text-gray-900">{selectedDevis.titre}</p>
              </div>
              
              {selectedDevis.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedDevis.description}</p>
                </div>
              )}

              {/* Lignes du devis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lignes du devis</label>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Désignation</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qté</th>
                        <td className="px-6 py-4 text-sm text-gray-900">{ligne.prixUnitaire.toLocaleString('fr-FR')} FCFA</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{ligne.montantHT.toLocaleString('fr-FR')} FCFA</td>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedDevis.lignes.map((ligne) => (
                        <tr key={ligne.id}>
                          <td className="px-6 py-4 text-sm text-gray-900">{ligne.designation}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{ligne.quantite}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{ligne.prixUnitaire.toFixed(2)} €</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{ligne.montantHT.toFixed(2)} €</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totaux */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Montant HT:</span>
                  <span className="text-sm font-medium">{selectedDevis.montantHT.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">TVA ({selectedDevis.tauxTVA}%):</span>
                  <span className="text-sm font-medium">
                    {(selectedDevis.montantTTC - selectedDevis.montantHT).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-base font-medium text-gray-900">Montant TTC:</span>
                  <span className="text-base font-bold text-gray-900">{selectedDevis.montantTTC.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>

              {/* Commentaires */}
              {selectedDevis.commentaireDG && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Commentaire DG</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedDevis.commentaireDG}</p>
                </div>
              )}
              
              {selectedDevis.commentairePDG && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Commentaire PDG</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedDevis.commentairePDG}</p>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}