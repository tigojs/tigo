module.exports = {
  apps: [
    {
      name: 'tigo-server',
      script: './server.js',
      env: {
        NODE_ENV: 'dev',
      },
      env_production: {
        NODE_ENV: 'prod',
      },
    },
  ],
};
