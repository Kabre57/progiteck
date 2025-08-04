import { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Database,
  Mail,
  Key,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  X
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useDarkMode } from '@/hooks/useDarkMode';
import { userService } from '@/services/userService';
import { notificationService } from '@/services/notificationService';
import toast from 'react-hot-toast';

interface UserSettings {
  nom: string;
  prenom: string;
  email: string;
  phone: string;
  displayName: string;
  address: string;
  state: string;
  country: string;
  designation: string;
  theme: 'light' | 'dark';
}

interface NotificationSettings {
  checkUnusualActivity: boolean;
  checkNewSignIn: boolean;
  notifyLatestNews: boolean;
  notifyFeatureUpdate: boolean;
  notifyAccountTips: boolean;
}

interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface SystemSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  pageSize: number;
  autoSave: boolean;
  compactMode: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // États des paramètres
  const [userSettings, setUserSettings] = useState<UserSettings>({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    phone: user?.phone || '',
    displayName: user?.displayName || '',
    address: user?.address || '',
    state: user?.state || '',
    country: user?.country || 'Côte d\'Ivoire',
    designation: user?.designation || '',
    theme: user?.theme || 'light',
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    checkUnusualActivity: true,
    checkNewSignIn: true,
    notifyLatestNews: true,
    notifyFeatureUpdate: true,
    notifyAccountTips: false,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    language: 'fr',
    timezone: 'Africa/Abidjan',
    dateFormat: 'dd/MM/yyyy',
    currency: 'XOF',
    pageSize: 10,
    autoSave: true,
    compactMode: false,
  });

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const response = await notificationService.getPreferences();
      setNotificationSettings(response.data);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await userService.updateProfile(userSettings);
      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      await notificationService.updatePreferences(notificationSettings);
      toast.success('Préférences de notification mises à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour des notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (securitySettings.newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword(
        securitySettings.currentPassword,
        securitySettings.newPassword
      );
      toast.success('Mot de passe modifié avec succès');
      setSecuritySettings({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error('Erreur lors de la modification du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSystemSettings = () => {
    // Sauvegarder dans localStorage pour les paramètres système
    localStorage.setItem('systemSettings', JSON.stringify(systemSettings));
    toast.success('Paramètres système sauvegardés');
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'appearance', label: 'Apparence', icon: Palette },
    { id: 'system', label: 'Système', icon: Settings },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
            <p className="text-gray-600 dark:text-gray-400">Gérez vos préférences et paramètres du compte</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation des onglets */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-700 dark:border-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <tab.icon className="mr-3 h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Contenu des onglets */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              
              {/* Onglet Profil */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <User className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Informations du Profil</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nom
                      </label>
                      <input
                        type="text"
                        value={userSettings.nom}
                        onChange={(e) => setUserSettings({ ...userSettings, nom: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Prénom
                      </label>
                      <input
                        type="text"
                        value={userSettings.prenom}
                        onChange={(e) => setUserSettings({ ...userSettings, prenom: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={userSettings.email}
                        onChange={(e) => setUserSettings({ ...userSettings, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={userSettings.phone}
                        onChange={(e) => setUserSettings({ ...userSettings, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nom d'affichage
                      </label>
                      <input
                        type="text"
                        value={userSettings.displayName}
                        onChange={(e) => setUserSettings({ ...userSettings, displayName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fonction
                      </label>
                      <input
                        type="text"
                        value={userSettings.designation}
                        onChange={(e) => setUserSettings({ ...userSettings, designation: e.target.value })}
                        placeholder="Ex: Directeur Technique"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Pays
                      </label>
                      <select
                        value={userSettings.country}
                        onChange={(e) => setUserSettings({ ...userSettings, country: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                        <option value="Ghana">Ghana</option>
                        <option value="Burkina Faso">Burkina Faso</option>
                        <option value="Mali">Mali</option>
                        <option value="Sénégal">Sénégal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Région/État
                      </label>
                      <input
                        type="text"
                        value={userSettings.state}
                        onChange={(e) => setUserSettings({ ...userSettings, state: e.target.value })}
                        placeholder="Ex: Abidjan"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Adresse
                    </label>
                    <textarea
                      value={userSettings.address}
                      onChange={(e) => setUserSettings({ ...userSettings, address: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      <span>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Onglet Notifications */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Préférences de Notification</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Activité inhabituelle</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Recevoir des alertes pour les connexions suspectes</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.checkUnusualActivity}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            checkUnusualActivity: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Nouvelles connexions</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Notification lors de nouvelles connexions</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.checkNewSignIn}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            checkNewSignIn: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Actualités</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Recevoir les dernières nouvelles du système</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.notifyLatestNews}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            notifyLatestNews: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Mises à jour</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Notification des nouvelles fonctionnalités</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.notifyFeatureUpdate}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            notifyFeatureUpdate: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Conseils</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Recevoir des conseils d'utilisation</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.notifyAccountTips}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            notifyAccountTips: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveNotifications}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      <span>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Onglet Sécurité */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sécurité du Compte</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mot de passe actuel
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={securitySettings.currentPassword}
                          onChange={(e) => setSecuritySettings({
                            ...securitySettings,
                            currentPassword: e.target.value
                          })}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        value={securitySettings.newPassword}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          newPassword: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confirmer le nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        value={securitySettings.confirmPassword}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          confirmPassword: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">Exigences du mot de passe</h4>
                      <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                        <li className="flex items-center space-x-2">
                          {securitySettings.newPassword.length >= 8 ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                          <span>Au moins 8 caractères</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          {/[A-Z]/.test(securitySettings.newPassword) ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                          <span>Au moins une majuscule</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          {/[a-z]/.test(securitySettings.newPassword) ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                          <span>Au moins une minuscule</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          {/\d/.test(securitySettings.newPassword) ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                          <span>Au moins un chiffre</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleChangePassword}
                      disabled={loading || !securitySettings.currentPassword || !securitySettings.newPassword || securitySettings.newPassword !== securitySettings.confirmPassword}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Key className="h-4 w-4" />
                      <span>{loading ? 'Modification...' : 'Changer le mot de passe'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Onglet Apparence */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <Palette className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Apparence</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Mode sombre</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Basculer entre le thème clair et sombre</p>
                      </div>
                      <button
                        onClick={toggleDarkMode}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          isDarkMode ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isDarkMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Mode compact</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Interface plus dense avec moins d'espacement</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={systemSettings.compactMode}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            compactMode: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Taille de police
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="small">Petite</option>
                        <option value="medium">Moyenne</option>
                        <option value="large">Grande</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveSystemSettings}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Save className="h-4 w-4" />
                      <span>Sauvegarder</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Onglet Système */}
              {activeTab === 'system' && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Paramètres Système</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Langue
                      </label>
                      <select
                        value={systemSettings.language}
                        onChange={(e) => setSystemSettings({
                          ...systemSettings,
                          language: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fuseau horaire
                      </label>
                      <select
                        value={systemSettings.timezone}
                        onChange={(e) => setSystemSettings({
                          ...systemSettings,
                          timezone: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="Africa/Abidjan">Abidjan (GMT)</option>
                        <option value="Africa/Accra">Accra (GMT)</option>
                        <option value="Europe/Paris">Paris (CET)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Format de date
                      </label>
                      <select
                        value={systemSettings.dateFormat}
                        onChange={(e) => setSystemSettings({
                          ...systemSettings,
                          dateFormat: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                        <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                        <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Devise
                      </label>
                      <select
                        value={systemSettings.currency}
                        onChange={(e) => setSystemSettings({
                          ...systemSettings,
                          currency: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="XOF">Franc CFA (XOF)</option>
                        <option value="EUR">Euro (EUR)</option>
                        <option value="USD">Dollar US (USD)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Éléments par page
                      </label>
                      <select
                        value={systemSettings.pageSize}
                        onChange={(e) => setSystemSettings({
                          ...systemSettings,
                          pageSize: Number(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Sauvegarde automatique</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Sauvegarder automatiquement les modifications</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={systemSettings.autoSave}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            autoSave: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveSystemSettings}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Save className="h-4 w-4" />
                      <span>Sauvegarder</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}