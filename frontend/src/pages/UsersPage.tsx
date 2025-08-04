import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, User, Shield, ToggleLeft, ToggleRight, Key, Eye } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import UserForm from '@/components/forms/UserForm';
import { userService } from '@/services/userService';
import { useAuth } from '@/hooks/useAuth';
import { User as UserType, CreateUserData } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const { hasRole } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [roles, setRoles] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
  });

  useEffect(() => {
    loadStats();
    loadRoles();
  }, [refreshTrigger]);

  const loadStats = async () => {
    try {
      const response = await userService.getUsers({ page: 1, limit: 100 });
      const allUsers = response.data || [];
      
      setStats({
        total: allUsers.length,
        active: allUsers.filter(u => u.status === 'active').length,
        inactive: allUsers.filter(u => u.status === 'inactive').length,
        admins: allUsers.filter(u => u.role.libelle === 'admin').length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await userService.getRoles();
      setRoles(response.data || []);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const fetchUsers = async (params: { page: number; limit: number; search?: string }) => {
    const response = await userService.getUsers(params);
    return {
      data: response.data || [],
      pagination: response.pagination!,
    };
  };

  const handleCreate = async (data: CreateUserData) => {
    try {
      await userService.createUser(data);
      toast.success('Utilisateur créé avec succès');
      setShowCreateModal(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      // Erreur déjà gérée dans le formulaire
    }
  };

  const handleEdit = (user: UserType) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUpdate = async (data: Partial<CreateUserData>) => {
    if (selectedUser) {
      try {
        await userService.updateUser(selectedUser.id, data);
        toast.success('Utilisateur modifié avec succès');
        setShowEditModal(false);
        setSelectedUser(null);
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        // Erreur déjà gérée dans le formulaire
      }
    }
  };

  const handleView = (user: UserType) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await userService.deleteUser(id);
        toast.success('Utilisateur supprimé avec succès');
        setRefreshTrigger(prev => prev + 1);
      } catch (error: unknown) {
        const errorMessage = error && typeof error === 'object' && 'response' in error
          ? ((error as { response: { data?: { message?: string } } }).response.data?.message || 'Erreur lors de la suppression')
          : 'Erreur lors de la suppression';
        toast.error(errorMessage);
      }
    }
  };

  const handleToggleStatus = async (user: UserType) => {
    try {
      await userService.toggleUserStatus(user.id);
      toast.success(`Utilisateur ${user.status === 'active' ? 'désactivé' : 'activé'} avec succès`);
      setRefreshTrigger(prev => prev + 1);
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? ((error as { response: { data?: { message?: string } } }).response.data?.message || 'Erreur lors de la modification du statut')
        : 'Erreur lors de la modification du statut';
      toast.error(errorMessage);
    }
  };

  const handleResetPassword = async (user: UserType) => {
    const newPassword = prompt('Nouveau mot de passe (minimum 8 caractères avec majuscule, minuscule et chiffre):');
    if (newPassword && newPassword.length >= 8) {
      try {
        await userService.resetUserPassword(user.id, newPassword);
        toast.success('Mot de passe réinitialisé avec succès');
      } catch (error: unknown) {
        const errorMessage = error && typeof error === 'object' && 'response' in error
          ? ((error as { response: { data?: { message?: string } } }).response.data?.message || 'Erreur lors de la réinitialisation')
          : 'Erreur lors de la réinitialisation';
        toast.error(errorMessage);
      }
    } else if (newPassword) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { variant: 'success' as const, label: 'Actif' },
      inactive: { variant: 'secondary' as const, label: 'Inactif' },
      suspended: { variant: 'error' as const, label: 'Suspendu' },
    };
    
    const statusConfig = statusMap[status as keyof typeof statusMap] || { variant: 'default' as const, label: status };
    return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const roleMap = {
      admin: { variant: 'error' as const, label: 'Administrateur' },
      manager: { variant: 'warning' as const, label: 'Manager' },
      commercial: { variant: 'info' as const, label: 'Commercial' },
      technicien: { variant: 'success' as const, label: 'Technicien' },
      user: { variant: 'secondary' as const, label: 'Utilisateur' },
    };
    
    const roleConfig = roleMap[role as keyof typeof roleMap] || { variant: 'default' as const, label: role };
    return <Badge variant={roleConfig.variant}>{roleConfig.label}</Badge>;
  };

  const columns = [
    {
      key: 'nom' as keyof UserType,
      title: 'Utilisateur',
      render: (value: string, record: UserType) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {record.prenom.charAt(0)}{record.nom.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {record.prenom} {record.nom}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {record.displayName || record.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'email' as keyof UserType,
      title: 'Contact',
      render: (email: string, record: UserType) => (
        <div>
          <p className="text-sm text-gray-900 dark:text-white">{email}</p>
          {record.phone && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{record.phone}</p>
          )}
        </div>
      ),
    },
    {
      key: 'role' as keyof UserType,
      title: 'Rôle',
      render: (role: UserType['role']) => getRoleBadge(role.libelle),
    },
    {
      key: 'status' as keyof UserType,
      title: 'Statut',
      render: (status: string) => getStatusBadge(status),
    },
    {
      key: 'lastLogin' as keyof UserType,
      title: 'Dernière connexion',
      render: (lastLogin: string | null) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {lastLogin 
            ? format(new Date(lastLogin), 'dd/MM/yyyy HH:mm', { locale: fr })
            : 'Jamais'
          }
        </span>
      ),
    },
    {
      key: 'actions' as keyof UserType,
      title: 'Actions',
      render: (_: unknown, record: UserType) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleView(record)}
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
            title="Voir détails"
          >
            <Eye className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => handleEdit(record)}
            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1"
            title="Modifier"
          >
            <Edit className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => handleToggleStatus(record)}
            className={`p-1 ${
              record.status === 'active' 
                ? 'text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300' 
                : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
            }`}
            title={record.status === 'active' ? 'Désactiver' : 'Activer'}
          >
            {record.status === 'active' ? (
              <ToggleRight className="h-4 w-4" />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
          </button>
          
          <button
            onClick={() => handleResetPassword(record)}
            className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 p-1"
            title="Réinitialiser mot de passe"
          >
            <Key className="h-4 w-4" />
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

  // Vérifier les permissions
  if (!hasRole(['admin'])) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Accès Restreint
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Seuls les administrateurs (DG/PDG) peuvent gérer les utilisateurs.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Utilisateurs</h1>
            <p className="text-gray-600 dark:text-gray-400">Gérez les comptes utilisateurs du système (DG/PDG uniquement)</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvel Utilisateur</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total utilisateurs"
            value={stats.total}
            icon={User}
            color="blue"
            trend={{ value: "5%", isPositive: true }}
          />
          <StatCard
            title="Utilisateurs actifs"
            value={stats.active}
            icon={User}
            color="green"
            trend={{ value: "8%", isPositive: true }}
          />
          <StatCard
            title="Utilisateurs inactifs"
            value={stats.inactive}
            icon={User}
            color="yellow"
          />
          <StatCard
            title="Administrateurs"
            value={stats.admins}
            icon={Shield}
            color="red"
          />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          fetchData={fetchUsers}
          pageSize={10}
          searchable={true}
          key={refreshTrigger}
        />

        {/* Modal Création */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Nouvel Utilisateur"
          size="lg"
        >
          <UserForm
            roles={roles}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>

        {/* Modal Modification */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          title="Modifier Utilisateur"
          size="lg"
        >
          {selectedUser && (
            <UserForm
              user={selectedUser}
              roles={roles}
              onSubmit={handleUpdate}
              onCancel={() => {
                setShowEditModal(false);
                setSelectedUser(null);
              }}
            />
          )}
        </Modal>

        {/* Modal Détails */}
        <Modal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedUser(null);
          }}
          title="Détails Utilisateur"
          size="lg"
        >
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom complet</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedUser.prenom} {selectedUser.nom}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedUser.phone || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rôle</label>
                  <div className="mt-1">{getRoleBadge(selectedUser.role.libelle)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
                  <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dernière connexion</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedUser.lastLogin 
                      ? format(new Date(selectedUser.lastLogin), 'dd/MM/yyyy HH:mm', { locale: fr })
                      : 'Jamais'
                    }
                  </p>
                </div>
              </div>
              
              {selectedUser.displayName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom d'affichage</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedUser.displayName}</p>
                </div>
              )}
              
              {selectedUser.designation && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fonction</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedUser.designation}</p>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}