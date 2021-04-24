module.exports = {
  apps: [
    {
      name: 'tigo-server',
      script: './server.js',
      env: {
        NODE_ENV: 'prod',
        DB_ENV: 'prod',
      },
    },
  ],
};
