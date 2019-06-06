const Mysql = require('sync-mysql');
const WEB_CONFIG = require('../config/web.json');

module.exports = class NodeCPSql {
  constructor(options = {}) {
    this.db = new Mysql({
      host: options.host,
      user: options.user,
      password: options.password,
      port: options.port || 3306,
      database: options.database
    });

    this.host = options.host;
    this.user = options.user;
    this.password = options.password;
    this.port = options.port;
    this.database = options.database;

    this.cache = require('memory-cache');
    this._checkDatabase();
  }

  _checkDatabase() {
    try {
      this.db.query(`use ??`, [this.database]);
    } catch(err) {
      throw new Error(err.Error || err)
    }
  }

  /**
   * Checks if the database has the key in it
   * @param {String} table The mysql table on where to check
   * @param {String} column The column of where the key is located
   * @param {String} key The key to check
   * @returns {Boolean}
   */

  has(table, column, key) {
    if (typeof table !== 'string' || typeof column !== 'string')
      throw new Error('Invalid types given!');

    let query = this.db.query(`SELECT * FROM ${this.database}.${table} WHERE ${column} = ?`, [key]);

    if (query.length === 0)
      return false;
    else return true;
  }

  hasTable(table) {
    if (typeof table !== 'string')
      throw new Error('Invalid types given!');

    try {
      this.db.query(`SELECT * FROM ${this.database}.${table}`);
      return true;
    } catch(e) {
      return false;
    }
  }

  /**
   * Pushes a key to the database
   * @param {String} table The table, where the column is located
   * @param {String} key The column name
   * @param {Any} value The value of the column
   */

  set(table, key, value) {
    if (typeof table !== 'string' || typeof key !== 'string')
      throw new Error('Invalid types given!');

    if (typeof value === 'string') {
      this.db.query(`INSERT into ${this.database}.${table} (${key}) VALUES (?)`, [`${value}`]);
    } else if (typeof value === 'number') {
      this.ds.query(`INSERT into ${this.database}.${table} (${key}) VALUES (?)`, [value]);
    } else {
      value = JSON.stringify(value);

      this.ds.query(`INSERT into ${this.database}.${table} (${key}) VALUES (?)`, [value]);
    }

    return;
  }

  setMultiple(table, values) {
    let columns = '';
    let _values = '';
    let realValues = [];

    for (var i = 0; i < values.length; i++) {
      realValues.push(values[i].value);

      if (values.length === 1) {
        columns += `(${values[i].column})`;
        _values += '(?)'
      } else {
        if (i === 0) {
          columns += `(${values[i].column}, `;
          _values += `(?, `;
        } else if (i === values.length - 1) {
          columns += `${values[i].column})`;
          _values += `?)`;
        } else {
          columns += `${values[i].column}, `;
          _values += `?, `;
        }
      };
    };

    this.db.query(`INSERT into ${this.database}.${table} ${columns} VALUES ${_values}`, realValues);

    return undefined;
  }

  editMultiple(table, column, column_value, values) {
    let result = '';
    let realValues = [];

    for (var i = 0; i < values.length; i++) {
      realValues.push(values[i].value)

      if (values.length === 1) {
        result += `${values[i].column} = (?)`;
      } else {
        if (i < values.length - 1) {
          result += `${values[i].column} = (?), `;
        } else {
          result += `${values[i].column} = (?)`;
        }
      }
    };

    this.db.query(`UPDATE ${this.database}.${table} SET ${result} WHERE ${column} = ${column_value}`, realValues);

    return undefined;
  }

  delete(table, column, key) {
    if (typeof table !== 'string' || typeof column !== 'string' || typeof key !== 'string')
      throw new Error('Invalid types given!');

    let result = this.db.query(`DELETE FROM ${this.database}.${table} WHERE ${column} = ?`, [key]);

    if (result.affectedRows >= 1)
      return true;
    else return false;
  }

  get(table, column, key, cacheName) {
    if (typeof table !== 'string' || typeof column !== 'string')
      throw new Error('Invalid types given!');

    if (!cacheName)
      cacheName = table;

    let cache = this.cache.get(cacheName);

    if (!cache) {
      let data = this.db.query(`SELECT * FROM ${this.database}.${table} WHERE ${column} = ?`, [key]);
      this.cache.put(table, data, WEB_CONFIG.cache.mysql);

      return data;
    }

    return this.cache.get(cacheName);
  }

  getNoCache(table, column, key) {
    if (typeof table !== 'string' || typeof column !== 'string')
      throw new Error('Invalid types given!');

    let data = this.db.query(`SELECT * FROM ${this.database}.${table} WHERE ${column} = ?`, [key]);

    return data;
  }

  /**
   * Returns all the columns of a table
   * @param {String} table The table name
   * @returns {Array<Object<DatabaseData>>}
   */

  all(table) {    
    if (typeof table !== 'string')
      throw new Error('invalid types given!');

    let cache = this.cache.get(table);

    if (!cache) {
      let data = this.db.query(`SELECT * FROM ${this.database}.${table}`);
      this.cache.put(table, data, WEB_CONFIG.cache.mysql);

      return data;
    }

    return this.cache.get(table);
  }
};
