import { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  RefreshCw, 
  Database, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Trash2
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import SettingsCard from '@/components/ui/SettingsCard';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function AdvancedSettingsPage() {
  const { hasRole } = useAuth();
  const { exportSettings, importSettings, resetSettings, loading } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [systemHealth, setSystemHealth] = useState({
    database: 'healthy',
    api: 'healthy',
    cache: 'healthy',
    storage: 'healthy',
  });

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  const handleExportSettings = async () => {
    try {
      await exportSettings();
      toast.success('Paramètres exportés avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importSettings(file);
      toast.success('Paramètres importés avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'import');
    }
  };

  const handleResetSettings = async () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
      try {
        await resetSettings();
        toast.success('Paramètres réinitialisés');
      } catch (error) {
        toast.error('Erreur lors de la réinitialisation');
      }
    }
  };

  const checkSystemHealth = async () => {
    // Simulation de vérification de santé système
    setSystemHealth({
      database: Math.random() > 0.1 ? 'healthy' : 'warning',
      api: Math.random() > 0.05 ? 'healthy' : 'error',
      cache: Math.random() > 0.2 ? 'healthy' : 'warning',
      storage: Math.random() > 0.15 ? 'healthy' : 'warning',
    });
    toast.success('Vérification système terminée');
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-400';
    }
  };

  // Vérifier les permissions admin
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
              Seuls les administrateurs peuvent accéder aux paramètres avancés.
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres Avancés</h1>
            <p className="text-gray-600 dark:text-gray-400">Configuration système et maintenance (Administrateurs uniquement)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sauvegarde et Restauration */}
          <SettingsCard
            title="Sauvegarde et Restauration"
            description="Gérez vos paramètres et configurations"
            icon={Database}
          >
            <div className="space-y-4">
              <button
                onClick={handleExportSettings}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>Exporter les paramètres</span>
              </button>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportSettings}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  <span>Importer les paramètres</span>
                </button>
              </div>

              <button
                onClick={handleResetSettings}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>Réinitialiser</span>
              </button>
            </div>
          </SettingsCard>

          {/* Santé du Système */}
          <SettingsCard
            title="Santé du Système"
            description="Surveillez l'état des composants système"
            icon={Shield}
            action={
              <button
                onClick={checkSystemHealth}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Vérifier</span>
              </button>
            }
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Base de données</span>
                <div className="flex items-center space-x-2">
                  {getHealthIcon(systemHealth.database)}
                  <span className={`text-sm font-medium ${getHealthColor(systemHealth.database)}`}>
                    {systemHealth.database === 'healthy' ? 'Sain' : 
                     systemHealth.database === 'warning' ? 'Attention' : 'Erreur'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">API</span>
                <div className="flex items-center space-x-2">
                  {getHealthIcon(systemHealth.api)}
                  <span className={`text-sm font-medium ${getHealthColor(systemHealth.api)}`}>
                    {systemHealth.api === 'healthy' ? 'Sain' : 
                     systemHealth.api === 'warning' ? 'Attention' : 'Erreur'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cache</span>
                <div className="flex items-center space-x-2">
                  {getHealthIcon(systemHealth.cache)}
                  <span className={`text-sm font-medium ${getHealthColor(systemHealth.cache)}`}>
                    {systemHealth.cache === 'healthy' ? 'Sain' : 
                     systemHealth.cache === 'warning' ? 'Attention' : 'Erreur'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Stockage</span>
                <div className="flex items-center space-x-2">
                  {getHealthIcon(systemHealth.storage)}
                  <span className={`text-sm font-medium ${getHealthColor(systemHealth.storage)}`}>
                    {systemHealth.storage === 'healthy' ? 'Sain' : 
                     systemHealth.storage === 'warning' ? 'Attention' : 'Erreur'}
                  </span>
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* Mode Maintenance */}
          <SettingsCard
            title="Mode Maintenance"
            description="Activez le mode maintenance pour les mises à jour"
            icon={Settings}
          >
            <div className="space-y-4">
              <ToggleSwitch
                checked={maintenanceMode}
                onChange={setMaintenanceMode}
                label="Mode maintenance"
                description="Désactive l'accès utilisateur temporairement"
              />

              {maintenanceMode && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      Le mode maintenance est activé. Les utilisateurs ne peuvent pas accéder au système.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </SettingsCard>

          {/* Paramètres de Développement */}
          <SettingsCard
            title="Développement"
            description="Paramètres pour le débogage et l'analyse"
            icon={Settings}
          >
            <div className="space-y-4">
              <ToggleSwitch
                checked={debugMode}
                onChange={setDebugMode}
                label="Mode debug"
                description="Affiche les informations de débogage"
              />

              <ToggleSwitch
                checked={analyticsEnabled}
                onChange={setAnalyticsEnabled}
                label="Analytics"
                description="Collecte des données d'utilisation anonymes"
              />
            </div>
          </SettingsCard>
        </div>

        {/* Informations Système */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Informations Système</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Version</h4>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">1.0.0</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Environnement</h4>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">Production</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Dernière mise à jour</h4>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">18 Juillet 2025</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}