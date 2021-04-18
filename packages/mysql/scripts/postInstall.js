const mysql = require('mysql2');

const doPrompt = async function () {
  this.logger.info('Please input your settings for mysql:');
  const answers = await this.inquirer.prompt([
    {
      type: 'input',
      name: 'host',
      message: 'Host',
      default: '127.0.0.1',
    },
    {
      type: 'number',
      name: 'port',
      message: 'Port',
      default: 3306,
      validate: (port) => {
        if (port <= 0 || port > 65535) {
          return 'Port is invalid.';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'user',
      message: 'User',
      default: 'root',
    },
    {
      type: 'input',
      name: 'database',
      message: 'Database',
    },
  ]);
  const doQueryPassword = async () => {
    const pwds = await this.inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: 'Password',
      },
      {
        type: 'password',
        name: 'confirmPassword',
        message: 'Please reinput the password to confirm',
      },
    ]);
    if (pwds.password !== pwds.confirmPassword) {
      this.logger.error('The two passwords are inconsistent. Please try again.');
      return await doQueryPassword();
    }
    return pwds;
  };
  const pwds = await doQueryPassword();
  return {
    ...answers,
    ...pwds,
  };
};

const tryCreateDatabase = async function (conn, database) {
  const createDatabase = () => {
    return new Promise((resolve, reject) => {
      conn.query(`CREATE DATABASE IF NOT EXISTS ${database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`, (err, result) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  };
  try {
    await createDatabase();
    this.logger.info('Database created.');
  } catch (err) {
    this.logger.error('Failed to create the database, please do it manually.', err);
  }
};

const tryConnect = async function ({ host, user, password, database }) {
  const connection = mysql.createConnection({
    host,
    user,
    password,
  });
  const connect = () => {
    return new Promise((resolve, reject) => {
      connection.connect(function (err) {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  };
  try {
    await connect();
  } catch (err) {
    this.logger.error('Failed to connect to the database.', err);
    return;
  }
  // check database
  const checkDatabase = () => {
    return new Promise((resolve, reject) => {
      connection.query(`show databases like ${database};`, (err, result) => {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
    });
  };
  try {
    const res = await checkDatabase();
    if (!res.length) {
      const answers = await this.inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Unable to find the set database, do you want to create it automatically?',
          default: true,
        },
      ]);
      if (answers.confirm) {
        await tryCreateDatabase.call(this, connection, database);
      } else {
        this.logger.warn('Please check your configuration or create the database manually.');
      }
    }
    this.logger.info('Connection check finished.');
  } catch (err) {
    this.logger.error('Failed to check database.', err);
    return;
  }
};

const postInstall = async function () {
  const answers = await doPrompt.call(this);
  const { host, port, user, password, database } = answers;
  this.updatePluginConfig('@tigojs/mysql', (pluginConfig) => {
    Object.assign(pluginConfig, {
      host,
      port,
      user,
      password,
      database,
    });
  });
  // try to connect database
  this.logger.debug('Try to connect database...');
  await tryConnect.call(this);
};

module.exports = postInstall;
