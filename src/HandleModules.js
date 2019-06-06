const fs = require('fs');
const HandleConditions = require('./HandleConditions');

module.exports = function(req, res, next) {
  // lets add forward slash
  
  if (req.originalUrl.endsWith('/') && req.originalUrl !== '/') {
    req.originalUrl = req.originalUrl.slice(0, req.originalUrl.length - 1);
  };
  
  /*
    let's define the originalUrl in a variable and check if it's "/".
    if it is, change it to "/home" so it uses the home.pug file 
    */
  
  let url;
      
  if (Object.keys(req.query).length < 1) {
    url = req.originalUrl === '/' ? '/home' : req.originalUrl;
  } else {
    url = req.originalUrl.split('?')[0] === '/' ? '/home' : req.originalUrl.split('?')[0];
  };

  if (url.endsWith('/') && url !== '/') {
    url = url.slice(0, url.length - 1);
  }

  // make it use the theme first, and if it doesn't exists, redefine it with the main modules folder
  let modulesDir = `${process.cwd()}/themes/${req.session.theme || req.WebConfig.themes[0]}/modules`;
  
  // check if the module exists in the themes and is a file
  if (fs.existsSync(`${modulesDir}${url}.pug`) &&
  fs.statSync(`${modulesDir}${url}.pug`).isFile()) {
    
    let module = `${modulesDir}${url}.pug`;
    req.RouteContent.set(`${req.method.toLowerCase()}-${url}`, {
      content: fs.readFileSync(module)
    });
    
    // check if the module exists in the main dir and is a file
  } else if (fs.existsSync(`${process.cwd()}/modules${url}.pug`) &&
  fs.statSync(`${process.cwd()}/modules${url}.pug`)) {
    
    let module = `${process.cwd()}/modules${url}.pug`;
    req.RouteContent.set(`${req.method.toLowerCase()}-${url}`, {
      content: fs.readFileSync(module)
    });
  };
  
  if (req.RouteContent.has(`${req.method.toLowerCase()}-${url}`)) {
    req.app[req.method.toLowerCase()](url === '/home' ? '/' : url, function(req, res, next) {
      if (req.Conditions.has(`${req.method.toLowerCase()}-${url}`)) {
        let Condition = req.Conditions.get(`${req.method.toLowerCase()}-${url}`);

        return require(Condition.dir).run(req, res, next);
      };
    
      res.render('index', { req, content: req.RouteContent.get(`${req.method.toLowerCase()}-${url}`).content });
    });
  };
};