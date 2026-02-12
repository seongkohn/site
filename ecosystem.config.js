module.exports = {
  apps: [
    {
      name: 'seongkohn',
      script: '.next/standalone/server.js',
      cwd: '/var/www/seongkohn-site',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
    },
  ],
};
