module.exports = {
  apps: [
    {
      name: 'Progiteck-frontend',
      cwd: '/var/www/Progiteck/frontend',
      script: './node_modules/vite/bin/vite.js',
      args: 'dev',
      interpreter: 'node',
      env: {
        NODE_ENV: 'development',
        VITE_API_BASE_URL: '/api',
        VITE_API_VERSION: 'v1',
        VITE_APP_NAME: 'Progiteck System',
        VITE_APP_VERSION: '1.0.0',
        VITE_ENABLE_WEBSOCKETS: 'true',
        VITE_ENABLE_NOTIFICATIONS: 'true'
      }
    }
  ]
}
