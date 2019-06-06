const fs = require('fs');

module.exports = function(req, res, next) {
  let othersDir = `${process.cwd()}/others`;
  
  if (fs.existsSync(othersDir) && fs.statSync(othersDir).isDirectory()) {
    let Files = fs.readdirSync(othersDir)
    .filter(file => fs.statSync(`${othersDir}/${file}`).isFile());

    for (var File of Files) {
      let FileData = require(`${othersDir}/${File}`);

      req.JSFiles.set(`${FileData.method}-${FileData.route}`, { dir: `${othersDir}/${File}` });
    };
  }

  /*let _url;

  if (req.originalUrl.split('?')[0] === '/') {
    _url = '/';
  } else {
    _url = req.originalUrl.split('?')[0];
  };

  if (_url.endsWith('/') && _url !== '/') {
    _url = _url.slice(0, _url.length - 1);
  };

  let moduleName = _url.substring(req.WebConfig.BaseUri.length);*/

  let url;
      
  if (Object.keys(req.query).length < 1) {
    url = req.originalUrl === '/' ? '/home' : req.originalUrl;
  } else {
    url = req.originalUrl.split('?')[0] === '/' ? '/home' : req.originalUrl.split('?')[0];
  };

  if (url.endsWith('/') && url !== '/') {
    url = url.slice(0, url.length - 1);
  }

  if (req.JSFiles.has(`${req.method.toLowerCase()}-${url === '/home' ? '/' : url}`)) {

    req.app[req.method.toLowerCase()](url, function(req, res, next) {
      let FileData = req.JSFiles.get(`${req.method.toLowerCase()}-${url}`);

      require(FileData.dir).run(req, res, next);
    });
  };
};