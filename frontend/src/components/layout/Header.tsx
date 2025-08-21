import { useState, useEffect } from 'react';
import type { Notification as AppNotification } from '@/types';
import { Search, Bell, Moon, Sun, X, Settings, LogOut, HelpCircle, Mail, Phone, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDarkMode } from '@/hooks/useDarkMode';

const logo = '/images/logo.jpeg';

export default function Header() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  // Simuler le chargement des notifications
  useEffect(() => {
    if (showNotifications) {
      setLoadingNotif(true);
      setNotifError(null);
      import('@/services/notificationService').then(mod => {
        Promise.all([
          mod.notificationService.getNotifications({ limit: 10, unreadOnly: false }),
          mod.notificationService.getUnreadCount()
        ]).then(([notifRes, countRes]) => {
          setNotifications((notifRes.data as AppNotification[]) || []);
          setUnreadCount(countRes.data?.unreadCount ?? 0);
        }).catch(err => {
          setNotifError(err?.message || 'Erreur lors du chargement des notifications');
        }).finally(() => setLoadingNotif(false));
      });
    }
  }, [showNotifications]);

  const markAsRead = (id: number) => {
    import('@/services/notificationService').then(mod => {
      mod.notificationService.markAsRead(id).then(() => {
  setNotifications((notifs: AppNotification[]) => notifs.map(n => n.id === id ? { ...n, readAt: new Date() } : n));
        setUnreadCount(prev => prev > 0 ? prev - 1 : 0);
      });
    });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 shadow-sm">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <img 
            src={logo} 
            alt="Logo ProgiTek" 
            className="w-8 h-8 object-contain rounded-lg"
          />
          <span className="text-xl font-semibold text-gray-900 dark:text-white hidden md:inline-block">
            ProgiTeck
          </span>
        </div>

        {/* Barre de recherche */}
        <div className="flex-1 max-w-xl mx-4 md:mx-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un client, ticket..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 relative rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  <button onClick={() => setShowNotifications(false)}>
                    <X className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {loadingNotif ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">Chargement...</div>
                  ) : notifError ? (
                    <div className="p-4 text-center text-red-500 dark:text-red-400">{notifError}</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">Aucune notification</div>
                  ) : (
                    notifications.map(notification => (
                      <div 
                        key={notification.id}
                        className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${!notification.readAt ? 'bg-blue-50 dark:bg-gray-700' : ''}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.message}</p>
                          {!notification.readAt && (
                            <span className="h-2 w-2 rounded-full bg-blue-500 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.createdAt ? new Date(notification.createdAt).toLocaleString('fr-FR') : ''}</p>
                        {notification.data && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Détail : {notification.data}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <a href="/notifications/{notification.id}" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Voir</a>
                          <button className="text-xs text-gray-500 dark:text-gray-400 hover:underline" onClick={() => markAsRead(notification.id)}>Marquer comme lu</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                  <a href="/notifications" className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-center">Voir toutes les notifications</a>
                  <button className="w-full py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded text-center" onClick={() => setShowNotifications(false)}>Fermer</button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button 
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center space-x-2 group"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                {user?.photo ? (
                  <img src={user.photo} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-white font-medium text-sm">
                    {user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}
                  </span>
                )}
              </div>
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Mon compte</h3>
                  <button onClick={() => setShowProfile(false)}>
                    <X className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                      {user?.photo ? (
                        <img src={user.photo} alt="Profile" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white font-medium text-sm">{user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{user?.prenom} {user?.nom}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role?.libelle}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"><Mail className="h-4 w-4 text-gray-400" /><span>{user?.email}</span></div>
                    {user?.phone && (<div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"><Phone className="h-4 w-4 text-gray-400" /><span>{user.phone}</span></div>)}
                    {user?.address && (<div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"><MapPin className="h-4 w-4 text-gray-400" /><span>{user.address}</span></div>)}
                    {user?.country && (<div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"><span>Pays : {user.country}</span></div>)}
                    {user?.state && (<div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"><span>État : {user.state}</span></div>)}
                    {user?.designation && (<div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"><span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">{user.designation}</span></div>)}
                    <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"><span>Solde : {user?.balance ?? 0} €</span></div>
                    <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"><span>Statut email : {user?.emailStatus ?? '-'}</span></div>
                    <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"><span>KYC : {user?.kycStatus ?? '-'}</span></div>
                    <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"><span>Dernière connexion : {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : '-'}</span></div>
                    <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"><span>Statut : {user?.status ?? '-'}</span></div>
                    <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"><span>Thème : {user?.theme ?? '-'}</span></div>
                  </div>
                </div>
                <div className="p-2 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                  <a href="/profile/settings" className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Settings className="h-4 w-4 mr-2" />Paramètres</a>
                  <a href="/help" className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><HelpCircle className="h-4 w-4 mr-2" />Aide</a>
                  <button onClick={logout} className="w-full flex items-center justify-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 rounded"><LogOut className="h-4 w-4 mr-2" />Déconnexion</button>
                  <button className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/20 rounded" onClick={() => setShowProfile(false)}><X className="h-4 w-4 mr-2" />Fermer</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}