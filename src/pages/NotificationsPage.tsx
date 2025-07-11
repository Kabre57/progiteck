import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { notificationService } from '../services/notificationService';
import { StatCard } from '../components/StatCard';
import { NotificationModal } from '../components/modals/NotificationModal';
import { 
  Bell, 
  BellRing, 
  Check, 
  Trash2,
  Settings,
  Mail,
  MessageSquare,
  AlertCircle,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export const NotificationsPage: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useAuth();
  
  const { data: notifications, loading, error, refetch } = useApi(
    () => notificationService.getNotifications(),
    []
  );

  const markAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      toast.success('Notification marquée comme lue');
      refetch();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      toast.success('Toutes les notifications marquées comme lues');
      refetch();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await notificationService.deleteNotification(id);
      toast.success('Notification supprimée');
      refetch();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Bell className="h-5 w-5 text-blue-500" />;
      case 'success':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
  };

  const handleModalSuccess = () => {
    refetch();
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

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : filter === 'unread' 
      ? notifications?.filter(n => !n.readAt)
      : notifications?.filter(n => n.readAt);

  const unreadCount = notifications?.filter(n => !n.readAt).length || 0;
  const todayCount = notifications?.filter(n => {
    const today = new Date().toDateString();
    return new Date(n.createdAt).toDateString() === today;
  }).length || 0;
  const alertCount = notifications?.filter(n => n.type === 'warning' || n.type === 'error').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Gérez vos notifications et alertes</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Check className="h-4 w-4 mr-2" />
            Tout marquer lu
          </button>
          {user?.role.libelle === 'admin' && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle notification
            </button>
          )}
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total notifications"
          value={notifications?.length || 0}
          icon={Bell}
          color="blue"
        />
        <StatCard
          title="Non lues"
          value={unreadCount}
          icon={BellRing}
          color="red"
        />
        <StatCard
          title="Aujourd'hui"
          value={todayCount}
          icon={MessageSquare}
          color="green"
        />
        <StatCard
          title="Alertes"
          value={alertCount}
          icon={AlertCircle}
          color="yellow"
        />
      </div>

      {/* Filtres */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'all' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'unread' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Non lues ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'read' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Lues
          </button>
        </div>
      </div>

      {/* Liste des notifications */}
      <div className="bg-white shadow rounded-lg">
        <div className="divide-y divide-gray-200">
          {!filteredNotifications || filteredNotifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Aucune notification trouvée
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 ${
                  !notification.readAt ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${
                        !notification.readAt ? 'font-medium text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString('fr-FR')}
                      </p>
                      {notification.data && (
                        <div className="mt-1 text-xs text-gray-500 bg-gray-50 p-1 rounded">
                          {typeof notification.data === 'string' 
                            ? notification.data 
                            : JSON.stringify(notification.data)
                          }
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!notification.readAt && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Marquer comme lue"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modales */}
      <NotificationModal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};