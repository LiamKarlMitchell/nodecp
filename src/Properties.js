const fs = require('fs');
const ServerConfig = JSON.parse(fs.readFileSync(`${process.cwd()}/config/server.json`));

// make a new cache for RouteContent
const RouteContent = new Map();

// make a new cache for JS files inside /others
const JSFiles = new Map();

// make a new cache for conditions
const Conditions = new Map();

module.exports = async function(ItemDb, MysqlServer, req, res, next) {
  // our config
  req.WebConfig = JSON.parse(fs.readFileSync(`${process.cwd()}/config/web.json`));
  
  // define it insidde the middleware
  req.RouteContent = RouteContent;
  req.JSFiles = JSFiles;
  req.Conditions = Conditions;

  // Mysql server
  req.Mysql = MysqlServer;

  // Constants
  req.Constants = JSON.parse(fs.readFileSync(`${process.cwd()}/data/constants.json`));

  // moment
  req.moment = require('moment');

  if (!req.WebConfig.FetchItemDbOnStart) {
    req.ItemDb = req.Mysql.all(ServerConfig.Renewal ? 'item_db_re' : 'item_db');
  } else {
    req.ItemDb = ItemDb;
  };

  req.ServerConfig = JSON.parse(fs.readFileSync(`${process.cwd()}/config/server.json`));;
  
  // our content parser 
  req.parseContent = function(req, content) {
    return require('pug').render(content, { req, content: content.toString() });
  };

  // render pug config
  req.renderPug = function(req, content) {
    let url;

    if (Object.keys(req.query).length < 1) {
      url = req.originalUrl === '/' ? '/home' : req.originalUrl;
    } else {
      url = req.originalUrl.split('?')[0] === '/' ? '/home' : req.originalUrl.split('?')[0];
    }

    if (!content) {
      return res.render('index', { req, content: req.RouteContent.get(`${req.method.toLowerCase()}-${url}`).content.toString() });
    } else {
      return res.render('index', { req, content: content.toString() });
    }
  };

  // status fetcher
  req.fetchStatus = async function() {
    const isPortReachable = require('is-port-reachable');
    this.cache = require('memory-cache');

    if (this.cache.get('status'))
      return this.cache.get('status');

    let result = {
      char: false,
      map: false,
      login: false,
      online: 0
    };

    for (var ports in req.ServerConfig.ports) {
      let status = await isPortReachable(req.ServerConfig.ports[ports], { host: req.ServerConfig.host });
      result[ports] = status;
    };

    this.cache.put('status', result, 60000);

    return result;
  };

  // our status variable
  req.status = await req.fetchStatus();

  // fetch the buffer of modules
  req.ModuleToBuffer = function(module) {
    if (fs.existsSync(`${__dirname}/themes/${req.session.theme || req.WebConfig.themes[0]}/modules${module}.pug`)) {
      return fs.readFileSync(`${__dirname}/themes/${req.session.theme || req.WebConfig.themes[0]}/modules${module}.pug`);
    } else if (fs.existsSync(`${__dirname}/modules${module}.pug`)) {
      return fs.readFileSync(`${__dirname}/modules${module}.pug`);
    } else {
      return undefined;
    };
  };
  
  // flash
  req.success = req.flash('success');
  req.error = req.flash('error');
  
  next();
};