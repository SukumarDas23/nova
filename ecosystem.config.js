# ─── NOVA — PM2 Ecosystem ───────────────────────────────────────────────────
# Start all processes: pm2 start ecosystem.config.js
# Stop all:           pm2 stop all
# Restart:            pm2 restart all
# View logs:          pm2 logs
# Save & auto-start:  pm2 save && pm2 startup

module.exports = {
  apps: [
    {
      name: 'nova-server',
      script: './server/dist/index.js',
      cwd: '/home/ubuntu/nova',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      max_memory_restart: '400M',
      restart_delay: 3000,
      max_restarts: 10,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/home/ubuntu/.pm2/logs/nova-server-error.log',
      out_file:   '/home/ubuntu/.pm2/logs/nova-server-out.log',
    },
    {
      name: 'nova-web',
      script: './apps/web/.next/standalone/server.js',
      cwd: '/home/ubuntu/nova',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
      max_memory_restart: '300M',
      restart_delay: 3000,
      max_restarts: 10,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/home/ubuntu/.pm2/logs/nova-web-error.log',
      out_file:   '/home/ubuntu/.pm2/logs/nova-web-out.log',
    },
  ],
};
