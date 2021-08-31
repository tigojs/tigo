const path = require('path');
const fs = require('fs');

const exportSQLFile = (workDir, sqls) => {
  const migrationFolder = path.resolve(workDir, './migration');
  if (!fs.existsSync(migrationFolder)) {
    fs.mkdirSync(migrationFolder, { recursive: true });
  }
  const targetPath = path.resolve(migrationFolder, './cfs_v0.4.0.sql');
  fs.writeFileSync(targetPath, sqls.join('\r\n'));
};

const migrate = async function () {
  const answer = await this.inquirer.prompt([
    {
      type: 'list',
      name: 'dbType',
      message: 'Please select your database type: ',
      choices: [
        {
          name: 'SQLite',
          value: 'sqlite',
        },
        {
          name: 'MySQL',
          value: 'mysql',
        },
        {
          name: 'Others',
          value: 'others',
        },
      ],
    },
  ]);

  // build sqls
  const oldTable = `_tigo_stored_config_bfv040_${Date.now()}`;
  const sqls = [
    'ALTER TABLE tigo_stored_config ADD COLUMN scope_id VARCHAR(255);',
    answer.dbType === 'sqlite'
      ? 'UPDATE tigo_stored_config SET scope_id = (SELECT scope_id from tigo_auth_user WHERE uid = tigo_stored_config.uid);'
      : 'UPDATE tigo_stored_config s INNER JOIN tigo_auth_user u ON u.id = s.uid SET s.scope_id = u.scope_id;',
    ...(answer.dbType === 'sqlite'
      ? [
          `ALTER TABLE tigo_stored_config RENAME TO ${oldTable};`,
          `CREATE TABLE tigo_stored_config (id VARCHAR(255) PRIMARY KEY NOT NULL, scope_id VARCHAR(255), name VARCHAR(255), type VARCHAR(255), created_at DATETIME, updated_at DATETIME);`,
          `INSERT INTO tigo_stored_config (id, scope_id, type, name, created_at, updated_at) SELECT id, scope_id, name, created_at, updated_at FROM ${oldTable};`,
        ]
      : ['ALTER TABLE tigo_stored_config MODIFY COLUMN id VARCHAR(255) NOT NULL;']),
    answer.dbType !== 'sqlite' ? 'ALTER TABLE tigo_stored_config DROP COLUMN uid;' : null,
  ].filter((item) => !!item);

  // execute sqls
  if (answer.dbType === 'sqlite') {
    sqls.push(
      `UPDATE tigo_stored_config SET id = lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr( hex( randomblob(2)), 2) || '-' || substr('AB89', 1 + (abs(random()) % 4) , 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)));`
    );
    const sqliteConfig = this.getPluginConfig('@tigojs/sqlite');
    if (!sqliteConfig) {
      this.logger.error('Cannot find the configuration for @tigojs/sqlite.');
      this.logger.warn('Exporting a SQL file to "migration/cfs_v0.4.0.sql", please try to migrate manually.');
      exportSQLFile(this.workDir, sqls);
      this.logger.info('File exported.');
      return;
    }
    // open sqlite db
    const dbPath = sqliteConfig.dbPath || path.resolve(this.workDir, './run/sqlite.db');
    const db = await this.sqlitePromises.open(dbPath);
    try {
      await db.exec(sqls.join(''));
    } catch (err) {
      this.logger.warn("Failed to execute SQL, we've export the SQL to a file that you can execute manually.");
      exportSQLFile(this.workDir, sqls);
      throw err;
    }
  } else if (answer.dbType === 'mysql') {
    sqls.push('UPDATE tigo_stored_config SET id = uuid()');
    const mysqlConfig = this.getPluginConfig('@tigojs/mysql');
    if (!mysqlConfig) {
      this.logger.error('Cannot find the configuration for @tigojs/mysql.');
      this.logger.warn('Exporting a SQL file to "migration/cfs_v0.4.0.sql", please try to migrate manually.');
      exportSQLFile(this.workDir, sqls);
      this.logger.info('File exported.');
      return;
    }
    // open mysql db
    const { database, user, password, host, port } = mysqlConfig;
    const connection = await this.mysql.createConnection({
      host,
      user,
      password,
      port,
      database,
    });
    for (const sql of sqls) {
      try {
        await connection.execute(sql, sqls);
      } catch (err) {
        this.logger.warn("Failed to execute SQL, we've export the SQL to a file that you can execute manually.");
        exportSQLFile(this.workDir, sqls);
        throw err;
      }
    }
    await connection.close();
  } else {
    this.logger.warn('Exporting a SQL file to "migration/cfs_v0.4.0.sql", please try to migrate manually.');
    this.logger.warn(
      'Due to the unsupported SQL database type, you can get more information in migration documentation in the package project for create new IDs for your data.'
    );
    exportSQLFile(this.workDir, sqls);
  }
};

module.exports = migrate;
