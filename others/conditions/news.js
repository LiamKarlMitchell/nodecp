const RSSParser = require('rss-parser');
let parser = new RSSParser();

module.exports = {
  route: '/news',
  method: 'get',
  run: async function(req, res, next) {
    if (req.WebConfig.Rss.enabled) {
      req.rss = await parser.parseURL(req.WebConfig.Rss.link)
    }

    return req.renderPug(req);
  }
};