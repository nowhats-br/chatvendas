module.exports = {
  apps: [
    {
      name: 'chatvendas-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '/opt/chatvendas',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/opt/chatvendas/logs/frontend-error.log',
      out_file: '/opt/chatvendas/logs/frontend-out.log',
      log_file: '/opt/chatvendas/logs/frontend-combined.log',
      time: true
    },
    {
      name: 'baileys-service',
      script: 'index.js',
      cwd: '/opt/chatvendas/server/baileys-service',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/opt/chatvendas/logs/baileys-error.log',
      out_file: '/opt/chatvendas/logs/baileys-out.log',
      log_file: '/opt/chatvendas/logs/baileys-combined.log',
      time: true
    },
    {
      name: 'webjs-service',
      script: 'index.js',
      cwd: '/opt/chatvendas/server/webjs-service',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/opt/chatvendas/logs/webjs-error.log',
      out_file: '/opt/chatvendas/logs/webjs-out.log',
      log_file: '/opt/chatvendas/logs/webjs-combined.log',
      time: true
    }
  ]
};