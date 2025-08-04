import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Settings } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { notificationService } from '@/services/notificationService';
import { Notification } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    info: 0,
    warning: 0,
  });

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  const loadStats = async () => {
    try {
      const [notificationsResponse, unreadResponse] = await Promise.all([
        notificationService.getNotifications({ page: 1, limit: 100 }),
        notificationService.getUnreadCount()
      ]);
      
      const allNotifications = notificationsResponse.data || [];
      
      setStats({
        total: allNotifications.length,
        unread: unreadResponse.data?.unreadCount || 0,
        info: allNotifications.filter(n => n.type === 'info').length,
        warning: allNotifications.filter(n => n.type === 'warning').length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const fetchNotifications = async (params: { page: number; limit: number; search?: string }) => {
    const response = await notificationService.getNotifications(params);
    return {
      data: response.data || [],
      pagination: response.pagination!,
    };
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (!notification.readAt) {
      try {
        await notificationService.markAsRead(notification.id);
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        toast.error('Erreur lors du marquage comme lu');
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      toast.success('Toutes les notifications marquées comme lues');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast.error('Erreur lors du marquage');
    }
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      info: { variant: 'info' as const, label: 'Info' },
      success: { variant: 'success' as const, label: 'Succès' },
      warning: { variant: 'warning' as const, label: 'Attention' },
      error: { variant: 'error' as const, label: 'Erreur' },
    };
    
    const typeConfig = typeMap[type as keyof typeof typeMap] || { variant: 'default' as const, label: type };
    return <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>;
  };

  const columns = [
    {
      key: 'type' as keyof Notification,
      title: 'Type',
      render: (type: string) => getTypeBadge(type),
    },
    {
      key: 'message' as keyof Notification,
      title: 'Message',
      render: (message: string, record: Notification) => (
        <div>
          <p className={`text-sm ${!record.readAt ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
            {message}
          </p>
          {!record.readAt && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mt-1">
              Non lu
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt' as keyof Notification,
      title: 'Date',
      render: (date: string) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr })}
        </span>
      ),
    },
    {
      key: 'readAt' as keyof Notification,
      title: 'Statut',
      render: (readAt: string | undefined) => (
        <div className="flex items-center space-x-2">
          {readAt ? (
            <>
              <CheckCheck className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Lu</span>
            </>
          ) : (
            <>
              <Bell className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-600">Non lu</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'actions' as keyof Notification,
      title: 'Actions',
      render: (value: any, record: Notification) => (
        <div className="flex items-center space-x-2">
          {!record.readAt && (
            <button
              onClick={() => handleMarkAsRead(record)}
              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
              title="Marquer comme lu"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-gray-600 dark:text-gray-400">Gérez vos notifications système</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleMarkAllAsRead}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Tout marquer comme lu</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total notifications"
            value={stats.total}
            icon={Bell}
            color="blue"
          />
          <StatCard
            title="Non lues"
            value={stats.unread}
            icon={Bell}
            color="red"
          />
          <StatCard
            title="Informations"
            value={stats.info}
            icon={Bell}
            color="blue"
          />
          <StatCard
            title="Alertes"
            value={stats.warning}
            icon={Bell}
            color="yellow"
          />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          fetchData={fetchNotifications}
          pageSize={10}
          searchable={true}
          key={refreshTrigger}
        />
      </div>
    </Layout>
  );
}