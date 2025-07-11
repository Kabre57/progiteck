import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Header } from './Header';
import toast from 'react-hot-toast';
import { 
  Users, 
  UserCheck, 
  Briefcase, 
  Settings, 
  FileText, 
  Receipt, 
  BarChart3, 
  Eye, 
  Bell, 
  Shield,
  Award,
  LogOut,
  MessageSquare,
  ClipboardList
} from 'lucide-react';
import { messageService } from '../services/messageService';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Récupérer le nombre de messages non lus
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await messageService.getUnreadCount();
        setUnreadMessages(count);
      } catch (error) {
        console.error('Erreur lors de la récupération des messages non lus:', error);
      }
    };

    fetchUnreadCount();
    
    // Rafraîchir toutes les minutes
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Utilisateurs', href: '/users', icon: Users, adminOnly: true },
    { name: 'Rôles', href: '/roles', icon: Shield, adminOnly: true },
    { name: 'Spécialités', href: '/specialites', icon: Award, adminOnly: true },
    { name: 'Clients', href: '/clients', icon: UserCheck },
    { name: 'Techniciens', href: '/techniciens', icon: Settings },
    { name: 'Missions', href: '/missions', icon: Briefcase },
    { name: 'Interventions', href: '/interventions', icon: Settings },
    { name: 'Devis', href: '/devis', icon: FileText },
    { name: 'Factures', href: '/factures', icon: Receipt },
    { name: 'Rapports', href: '/rapports', icon: ClipboardList },
    { name: 'Messages', href: '/messages', icon: MessageSquare, badge: unreadMessages > 0 ? unreadMessages : undefined },
    { name: 'Statistiques', href: '/reports', icon: BarChart3 },
    { name: 'Audit', href: '/audit', icon: Eye, adminOnly: true },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Paramètres', href: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Déconnexion réussie');
      navigate('/login');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const filteredNavigation = navigation.filter(item => 
    !item.adminOnly || user?.role.libelle === 'admin'
  );

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar mobile */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Fermer le menu</span>
              <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                  PS
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">Progiteck</span>
              </div>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-4 h-6 w-6" />
                    {item.name}
                    {item.badge && (
                      <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="flex items-center text-red-600 hover:text-red-900"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                  PS
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">Progiteck</span>
              </div>
              
              {/* Profil utilisateur dans la sidebar */}
              <div className="mt-6 px-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">
                      {user?.nom?.charAt(0).toUpperCase()}{user?.prenom?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">
                      {user?.nom} {user?.prenom}
                    </p>
                    <p className="text-xs text-gray-500">{user?.role.libelle}</p>
                  </div>
                </div>
              </div>

              <nav className="mt-8 flex-1 px-2 bg-white space-y-1">
                {filteredNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                      {item.badge && (
                        <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <button
                onClick={handleLogout}
                className="flex items-center text-red-600 hover:text-red-900 w-full"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header */}
        <Header onSidebarToggle={() => setSidebarOpen(true)} />

        {/* Contenu de la page */}
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};