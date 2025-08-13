import { useState, useEffect } from 'react';
import { Plus, Send, MessageSquare, User, Clock } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { messageService } from '@/services/messageService';
import SendMessageForm from '@/components/forms/SendMessageForm';
import { useAuth } from '@/hooks/useAuth';
import { Message } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function MessagesPage() {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    sent: 0,
    received: 0,
  });

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  const loadStats = async () => {
    try {
      const [messagesResponse, unreadResponse] = await Promise.all([
        messageService.getMessages({ page: 1, limit: 100 }),
        messageService.getUnreadCount()
      ]);
      
      const allMessages = messagesResponse.data || [];
      
      setStats({
        total: allMessages.length,
        unread: unreadResponse.data?.unreadCount || 0,
        sent: allMessages.filter(m => m.senderId === user?.id).length,
        received: allMessages.filter(m => m.receiverId === user?.id).length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const fetchMessages = async (params: { page: number; limit: number; search?: string }) => {
    const response = await messageService.getMessages(params);
    return {
      data: response.data || [],
      pagination: response.pagination!,
    };
  };

  const handleMarkAsRead = async (message: Message) => {
    if (!message.readAt && message.receiverId === user?.id) {
      try {
        await messageService.markAsRead(message.id);
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        toast.error('Erreur lors du marquage comme lu');
      }
    }
  };

  const columns = [
    {
      key: 'sender' as keyof Message,
      title: 'Expéditeur',
      render: (value: unknown, record: Message) => {
        const sender = value as Message['sender'] | undefined;
        return (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {sender?.prenom?.charAt(0) ?? ''}{sender?.nom?.charAt(0) ?? ''}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {sender?.prenom ?? ''} {sender?.nom ?? ''}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {record.senderId === user?.id ? 'Vous' : sender?.email ?? ''}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'receiver' as keyof Message,
      title: 'Destinataire',
      render: (value: unknown, record: Message) => {
        const receiver = value as Message['receiver'] | undefined;
        return (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {receiver?.prenom?.charAt(0) ?? ''}{receiver?.nom?.charAt(0) ?? ''}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {receiver?.prenom ?? ''} {receiver?.nom ?? ''}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {record.receiverId === user?.id ? 'Vous' : receiver?.email ?? ''}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'contenu' as keyof Message,
      title: 'Message',
      render: (value: unknown, record: Message) => {
        const contenu = value as string;
        return (
          <div>
            <p className={`text-sm ${!record.readAt && record.receiverId === user?.id ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
              {contenu.length > 100 ? `${contenu.substring(0, 100)}...` : contenu}
            </p>
            {!record.readAt && record.receiverId === user?.id && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mt-1">
                Non lu
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'createdAt' as keyof Message,
      title: 'Date',
      render: (value: unknown) => {
        const date = value as string;
        return (
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white">
              {format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr })}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions' as keyof Message,
      title: 'Actions',
      render: (_: unknown, record: Message) => (
        <div className="flex items-center space-x-2">
          {!record.readAt && record.receiverId === user?.id && (
            <button
              onClick={() => handleMarkAsRead(record)}
              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
              title="Marquer comme lu"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // ...existing code...
  // Fonction appelée après envoi de message pour rafraîchir la liste et fermer la modale
  const handleMessageSent = () => {
    setShowCreateModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messagerie</h1>
            <p className="text-gray-600 dark:text-gray-400">Gérez vos messages internes</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau Message</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total messages"
            value={stats.total}
            icon={MessageSquare}
            color="blue"
          />
          <StatCard
            title="Non lus"
            value={stats.unread}
            icon={MessageSquare}
            color="red"
          />
          <StatCard
            title="Envoyés"
            value={stats.sent}
            icon={Send}
            color="green"
          />
          <StatCard
            title="Reçus"
            value={stats.received}
            icon={User}
            color="purple"
          />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          fetchData={fetchMessages}
          pageSize={10}
          searchable={true}
          key={refreshTrigger}
        />

        {/* Modal Nouveau Message */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Nouveau Message"
          size="lg"
        >
          <div className="p-4">
            {/* Intégration du formulaire d'envoi de message */}
            {/* À adapter si tu veux choisir le destinataire dynamiquement */}
            {user && (
              <SendMessageForm receiverId={user.id === 1 ? 2 : 1} onSent={handleMessageSent} />
            )}
          </div>
        </Modal>
      </div>
    </Layout>
  );
}