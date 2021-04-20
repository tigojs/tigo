module.exports = {
  apps: [
    {
      name: 'tigo-server',
      script: './server.js',
      env: {
        NODE_ENV: 'dev',
        DB_ENV: 'prod',
      },
      env_production: {
        NODE_ENV: 'prod',
        DB_ENV: 'prod',
      },
    },
  ],
};
