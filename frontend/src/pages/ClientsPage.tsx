import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building2, Mail, Phone, MapPin, Eye } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import ClientForm from '@/components/forms/ClientForm';
import { clientService } from '@/services/clientService';
import { Client } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    actifs: 0,
    premium: 0,
    enAttente: 0,
  });

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  const loadStats = async () => {
    try {
      const response = await clientService.getClients({ page: 1, limit: 100 });
      const allClients = response.data || [];
      
      setStats({
        total: allClients.length,
        actifs: allClients.filter(c => c.statut === 'active').length,
        premium: allClients.filter(c => c.typeDeCart === 'Premium' || c.typeDeCart === 'VIP').length,
        enAttente: allClients.filter(c => c.statut === 'pending').length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const fetchClients = async (params: { page: number; limit: number; search?: string }) => {
    const response = await clientService.getClients(params);
    return {
      data: response.data || [],
      pagination: response.pagination!,
    };
  };

  const handleCreate = async (data: CreateClientData) => {
    try {
      await clientService.createClient(data);
      toast.success('Client créé avec succès');
      setShowCreateModal(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      // Erreur déjà gérée dans le formulaire
    }
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setShowEditModal(true);
  };

  const handleUpdate = async (data: Partial<CreateClientData>) => {
    if (selectedClient) {
      try {
        await clientService.updateClient(selectedClient.id, data);
        toast.success('Client modifié avec succès');
        setShowEditModal(false);
        setSelectedClient(null);
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        // Erreur déjà gérée dans le formulaire
      }
    }
  };

  const handleView = (client: Client) => {
    setSelectedClient(client);
    setShowViewModal(true);
  };
  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        await clientService.deleteClient(id);
        toast.success('Client supprimé avec succès');
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const getStatusBadge = (statut: string) => {
    const statusMap = {
      active: { variant: 'success' as const, label: 'Actif' },
      inactive: { variant: 'secondary' as const, label: 'Inactif' },
      pending: { variant: 'warning' as const, label: 'En attente' },
    };
    
    const status = statusMap[statut as keyof typeof statusMap] || { variant: 'default' as const, label: statut };
    return <Badge variant={status.variant}>{status.label}</Badge>;
  };

  const getCardTypeBadge = (type?: string) => {
    const typeMap = {
      Standard: { variant: 'info' as const },
      Premium: { variant: 'secondary' as const },
      VIP: { variant: 'warning' as const },
    };

    if (!type) return <span className="text-gray-500">-</span>;

    const typeConfig = typeMap[type as keyof typeof typeMap] || { variant: 'default' as const };
    return <Badge variant={typeConfig.variant}>{type}</Badge>;
  };

  const columns = [
    {
      key: 'nom' as keyof Client,
      title: 'Client',
      render: (value: string, record: Client) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {record.nom.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{record.nom}</p>
            <p className="text-sm text-gray-500">{record.entreprise || 'Particulier'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email' as keyof Client,
      title: 'Contact',
      render: (value: string, record: Client) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-900">{record.email}</span>
          </div>
          {record.telephone && (
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">{record.telephone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'typeDeCart' as keyof Client,
      title: 'Type de carte',
      render: (value: string) => getCardTypeBadge(value),
    },
    {
      key: 'typePaiement' as keyof Client,
      title: 'Paiement',
      render: (typePaiement: Client['typePaiement']) => (
        <span className="text-sm text-gray-900">
          {typePaiement?.libelle || 'Non défini'}
        </span>
      ),
    },
    {
      key: 'statut' as keyof Client,
      title: 'Statut',
      render: (statut: string) => getStatusBadge(statut),
    },
    {
      key: 'dateDInscription' as keyof Client,
      title: 'Inscription',
      render: (date: string) => (
        <span className="text-sm text-gray-500">
          {format(new Date(date), 'dd/MM/yyyy', { locale: fr })}
        </span>
      ),
    },
    {
      key: 'actions' as keyof Client,
      title: 'Actions',
      render: (value: any, record: Client) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleView(record)}
            className="text-blue-600 hover:text-blue-900 p-1"
            title="Voir détails"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEdit(record)}
            className="text-blue-600 hover:text-blue-900 p-1"
            title="Modifier"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(record.id)}
            className="text-red-600 hover:text-red-900 p-1"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
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
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Clients</h1>
            <p className="text-gray-600">Gérez votre base clients et leurs informations</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau Client</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total clients"
            value={stats.total}
            icon={Building2}
            color="blue"
            trend={{ value: "12%", isPositive: true }}
          />
          <StatCard
            title="Clients actifs"
            value={stats.actifs}
            icon={Building2}
            color="green"
            trend={{ value: "8%", isPositive: true }}
          />
          <StatCard
            title="Clients Premium"
            value={stats.premium}
            icon={Building2}
            color="purple"
            trend={{ value: "15%", isPositive: true }}
          />
          <StatCard
            title="En attente"
            value={stats.enAttente}
            icon={Building2}
            color="yellow"
            trend={{ value: "3%", isPositive: false }}
          />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          fetchData={fetchClients}
          pageSize={10}
          searchable={true}
          key={refreshTrigger}
        />

        {/* Modales */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Nouveau Client"
          size="lg"
        >
          <ClientForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>

        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedClient(null);
          }}
          title="Modifier Client"
          size="lg"
        >
          {selectedClient && (
            <ClientForm
              client={selectedClient}
              onSubmit={handleUpdate}
              onCancel={() => {
                setShowEditModal(false);
                setSelectedClient(null);
              }}
            />
          )}
        </Modal>

        <Modal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedClient(null);
          }}
          title="Détails Client"
          size="lg"
        >
          {selectedClient && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedClient.nom}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedClient.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedClient.telephone || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Entreprise</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedClient.entreprise || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type de carte</label>
                  <div className="mt-1">{getCardTypeBadge(selectedClient.typeDeCart)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Statut</label>
                  <div className="mt-1">{getStatusBadge(selectedClient.statut)}</div>
                </div>
              </div>
              {selectedClient.localisation && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Localisation</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedClient.localisation}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{selectedClient._count?.missions || 0}</p>
                  <p className="text-sm text-gray-500">Missions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedClient._count?.devis || 0}</p>
                  <p className="text-sm text-gray-500">Devis</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{selectedClient._count?.factures || 0}</p>
                  <p className="text-sm text-gray-500">Factures</p>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}