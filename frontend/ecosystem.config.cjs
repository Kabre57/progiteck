// ecosystem.config.cjs
module.exports = {
  apps: [{
    name: "Progiteck-frontend",
    script: "node_modules/vite/bin/vite.js",
    args: "dev", // "preview" pour la production
    interpreter: "node",
    cwd: "/var/www/Progiteck/frontend",
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: "development",
      PORT: 5173,
      HOST: "0.0.0.0"
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 8080 // Correspond à preview.port dans vite.config.ts
    }
  }]
}