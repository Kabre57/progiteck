import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, DollarSign, Users } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { typePaiementService } from '@/services/typePaiementService';
import { TypePaiement } from '@/types';
import toast from 'react-hot-toast';

export default function TypesPaiementPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTypePaiement, setSelectedTypePaiement] = useState<TypePaiement | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [formData, setFormData] = useState({
    libelle: '',
    description: '',
    delaiPaiement: 30,
    tauxRemise: 0,
    actif: true,
  });
  const [stats, setStats] = useState({
    total: 0,
    actifs: 0,
    clients: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Délai plus long pour éviter le rate limiting (3 secondes)
      await new Promise(resolve => setTimeout(resolve, 3000));
      const response = await typePaiementService.getTypesPaiement();
      const typesPaiement = response.data || [];
      
      setStats({
        total: typesPaiement.length,
        actifs: typesPaiement.filter(t => t.actif).length,
        clients: typesPaiement.reduce((sum, t) => sum + (t._count?.clients || 0), 0),
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Fallback stats
      setStats({
        total: 0,
        actifs: 0,
        clients: 0,
      });
    }
  };

  const fetchTypesPaiement = async () => {
    const response = await typePaiementService.getTypesPaiement();
    return {
      data: response.data || [],
      pagination: {
        total: response.data?.length || 0,
        page: 1,
        limit: 100,
        totalPages: 1,
      },
    };
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await typePaiementService.createTypePaiement(formData);
      toast.success('Type de paiement créé avec succès');
      setShowCreateModal(false);
      setFormData({ libelle: '', description: '', delaiPaiement: 30, tauxRemise: 0, actif: true });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleEdit = (typePaiement: TypePaiement) => {
    setSelectedTypePaiement(typePaiement);
    setFormData({
      libelle: typePaiement.libelle,
      description: typePaiement.description || '',
      delaiPaiement: typePaiement.delaiPaiement || 30,
      tauxRemise: typePaiement.tauxRemise || 0,
      actif: typePaiement.actif,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypePaiement) return;

    try {
      await typePaiementService.updateTypePaiement(selectedTypePaiement.id, formData);
      toast.success('Type de paiement modifié avec succès');
      setShowEditModal(false);
      setSelectedTypePaiement(null);
      setFormData({ libelle: '', description: '', delaiPaiement: 30, tauxRemise: 0, actif: true });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast.error('Erreur lors de la modification');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce type de paiement ?')) {
      try {
        await typePaiementService.deleteTypePaiement(id);
        toast.success('Type de paiement supprimé avec succès');
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const columns = [
    {
      key: 'libelle' as keyof TypePaiement,
      title: 'Type de Paiement',
      render: (value: string, record: TypePaiement) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{record.description || 'Aucune description'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'delaiPaiement' as keyof TypePaiement,
      title: 'Délai',
      render: (delai: number) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {delai} jours
        </span>
      ),
    },
    {
      key: 'tauxRemise' as keyof TypePaiement,
      title: 'Remise',
      render: (taux: number) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {taux}%
        </span>
      ),
    },
    {
      key: '_count' as keyof TypePaiement,
      title: 'Clients',
      render: (count: TypePaiement['_count']) => (
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {count?.clients || 0} client(s)
          </span>
        </div>
      ),
    },
    {
      key: 'actif' as keyof TypePaiement,
      title: 'Statut',
      render: (actif: boolean) => (
        <Badge variant={actif ? 'success' : 'secondary'}>
          {actif ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'actions' as keyof TypePaiement,
      title: 'Actions',
      render: (value: any, record: TypePaiement) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEdit(record)}
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
            title="Modifier"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(record.id)}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Types de Paiement</h1>
            <p className="text-gray-600 dark:text-gray-400">Gérez les types de paiement clients</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau Type</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total types"
            value={stats.total}
            icon={DollarSign}
            color="blue"
          />
          <StatCard
            title="Types actifs"
            value={stats.actifs}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Clients utilisant"
            value={stats.clients}
            icon={Users}
            color="purple"
          />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          fetchData={fetchTypesPaiement}
          pageSize={10}
          searchable={false}
          key={refreshTrigger}
        />

        {/* Modal Création */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setFormData({ libelle: '', description: '', delaiPaiement: 30, tauxRemise: 0, actif: true });
          }}
          title="Nouveau Type de Paiement"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Libellé *
              </label>
              <input
                type="text"
                value={formData.libelle}
                onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Délai (jours)
                </label>
                <input
                  type="number"
                  value={formData.delaiPaiement}
                  onChange={(e) => setFormData({ ...formData, delaiPaiement: Number(e.target.value) })}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Remise (%)
                </label>
                <input
                  type="number"
                  value={formData.tauxRemise}
                  onChange={(e) => setFormData({ ...formData, tauxRemise: Number(e.target.value) })}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="actif"
                checked={formData.actif}
                onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="actif" className="ml-2 block text-sm text-gray-900 dark:text-white">
                Type actif
              </label>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ libelle: '', description: '', delaiPaiement: 30, tauxRemise: 0, actif: true });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Créer
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal Modification */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTypePaiement(null);
            setFormData({ libelle: '', description: '', delaiPaiement: 30, tauxRemise: 0, actif: true });
          }}
          title="Modifier Type de Paiement"
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Libellé *
              </label>
              <input
                type="text"
                value={formData.libelle}
                onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Délai (jours)
                </label>
                <input
                  type="number"
                  value={formData.delaiPaiement}
                  onChange={(e) => setFormData({ ...formData, delaiPaiement: Number(e.target.value) })}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Remise (%)
                </label>
                <input
                  type="number"
                  value={formData.tauxRemise}
                  onChange={(e) => setFormData({ ...formData, tauxRemise: Number(e.target.value) })}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="actif-edit"
                checked={formData.actif}
                onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="actif-edit" className="ml-2 block text-sm text-gray-900 dark:text-white">
                Type actif
              </label>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedTypePaiement(null);
                  setFormData({ libelle: '', description: '', delaiPaiement: 30, tauxRemise: 0, actif: true });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Modifier
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}