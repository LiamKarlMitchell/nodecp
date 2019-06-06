const express = require('express');
const app = express();
const session = require('express-session');
const fs = require('fs');
const dynamicStatic = require('express-dynamic-static')();
const bodyParser = require('body-parser');
const flash = require('express-flash');
const mailer = require('express-mailer');
const expressip = require('express-ipv4');

// set our dynamic static 
app.use(dynamicStatic);

// allow x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended : true }));
app.use(bodyParser.json());

// configs
const WebConfig = JSON.parse(fs.readFileSync(`${__dirname}/config/web.json`));
const ServerConfig = JSON.parse(fs.readFileSync(`${__dirname}/config/server.json`));

// Mysql Server
const Mysql = require('./src/Mysql');
const MysqlServer = new Mysql(ServerConfig.mysql);

app.use(session({
  secret: WebConfig.Secret,
  resave: true,
  saveUninitialized: false
}));

// use the flash engine
app.use(flash());

// load our custom properties
const Properties = require('./src/Properties');

// load our modules handler
const HandleModules = require('./src/HandleModules');
const HandleJsModules = require('./src/HandleJsModules');
const HandleConditions = require('./src/HandleConditions');

// Our function for modifying the menu items to make it work with base uri
const NavbarModify = require('./src/NavbarModify');

// handle itemDb
let ItemDb;

if (WebConfig.FetchItemDbOnStart) {
  ItemDb = MysqlServer.all(ServerConfig.Renewal ? 'item_db_re' : 'item_db');
};

// set our view engine
app.set('view engine', 'pug');

// ---------------------------------
//         OUR MIDDLEWARES
// ---------------------------------

mailer.extend(app, WebConfig.Email);

app.use(function(req, res, next) {
  Properties(ItemDb, MysqlServer, req, res, next);
});

app.use(function(req, res, next) {
  NavbarModify(req, res, next);
});

app.use(function(req, res, next) {
  app.mailer.update(req.WebConfig.Email, function() {});
  
  next();
});

app.use(expressip());

app.use(function(req, res, next) {
  dynamicStatic.setPath(`${__dirname}/themes/${req.session && req.session.theme || req.WebConfig.themes[0]}`);

  next();
});

app.use(function(req, res, next) {
  app.set('views', `${__dirname}/themes/${req.session.theme || req.WebConfig.themes[0]}`);
  
  next();
});

app.use(function(req, res, next) {
  HandleConditions(req, res, next);
  HandleJsModules(req, res, next);
  HandleModules(req, res, next);

  next();
});

const Tables = JSON.parse(fs.readFileSync(`${__dirname}/data/tables.json`));

let _ = require('lodash');
let difference = _.difference(Tables.customTables.map(table => table.name), Tables.installedTables);

if (difference.length > 0) {
  console.log('Looks like some of your database tables are not installed. Will install the missing ones');

  for (var table of difference) {
    let TableData = Tables.customTables.filter(_table => _table.name === table)[0];

    MysqlServer.db.query(TableData.query);
    Tables.installedTables.push(TableData.name);
    console.log(`Installed ${TableData.name}`);
  }

  fs.writeFileSync(`${__dirname}/data/tables.json`, JSON.stringify(Tables, null, 2));

  console.log('Installed all tables.\n');
};

app.listen(WebConfig.port, function() {
  console.log(`Node CP has started! You could access it with your
webserver's ip and use the port :${WebConfig.port}`)
});