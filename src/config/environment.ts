// Configuration des environnements
const environments = {
  development: {
    API_BASE_URL: 'http://localhost:3000',
  },
  production: {
    API_BASE_URL: 'https://votre-backend-production.com',
  },
  preview: {
    API_BASE_URL: 'https://votre-backend-staging.com',
  }
};

// Détection automatique de l'environnement
const getEnvironment = () => {
  if (import.meta.env.DEV) return 'development';
  if (import.meta.env.PROD && window.location.hostname.includes('vercel.app')) return 'preview';
  return 'production';
};

// Configuration avec fallback
export const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 
                environments[getEnvironment()].API_BASE_URL,
};

// Validation de la configuration
if (!config.API_BASE_URL) {
  console.error('❌ Configuration API manquante');
  throw new Error('Configuration API non disponible');
}

console.log(`🔗 Environnement: ${getEnvironment()}`);
console.log(`🔗 API Base URL: ${config.API_BASE_URL}`);