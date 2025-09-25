module.exports = {
  apps: [
    {
      name: 'chatvendas-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '/opt/chatvendas',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      error_file: '/opt/chatvendas/logs/frontend-error.log',
      out_file: '/opt/chatvendas/logs/frontend-out.log',
      log_file: '/opt/chatvendas/logs/frontend-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,
      merge_logs: true
    },
    {
      name: 'baileys-service',
      script: 'index.js',
      cwd: '/opt/chatvendas/server/baileys-service',
      env: {
        NODE_ENV: 'production',
        BAILEYS_PORT: 3001,
        PORT: 3001,
        SESSION_ID: 'baileys_prod_session',
        HOST: '0.0.0.0',
        // Add CORS configuration
        FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      min_uptime: '10s',
      max_restarts: 5,
      restart_delay: 5000,
      kill_timeout: 5000,
      error_file: '/opt/chatvendas/logs/baileys-error.log',
      out_file: '/opt/chatvendas/logs/baileys-out.log',
      log_file: '/opt/chatvendas/logs/baileys-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,
      merge_logs: true,
      env_file: '/opt/chatvendas/.env'
    },
    {
      name: 'webjs-service',
      script: 'index.js',
      cwd: '/opt/chatvendas/server/webjs-service',
      env: {
        NODE_ENV: 'production',
        WEBJS_PORT: 3002,
        PORT: 3002,
        SESSION_ID: 'webjs_prod_session',
        HOST: '0.0.0.0',
        // Add CORS configuration
        FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      min_uptime: '10s',
      max_restarts: 5,
      restart_delay: 5000,
      kill_timeout: 5000,
      error_file: '/opt/chatvendas/logs/webjs-error.log',
      out_file: '/opt/chatvendas/logs/webjs-out.log',
      log_file: '/opt/chatvendas/logs/webjs-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,
      merge_logs: true,
      env_file: '/opt/chatvendas/.env'
    }
  ],
  
  // Configurações globais do PM2
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'your-git-repo-url',
      path: '/opt/chatvendas',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': ''
    }
  }
};