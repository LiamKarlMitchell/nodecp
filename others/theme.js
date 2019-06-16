module.exports = {
  route: '/theme',
  method: 'post',
  run: function(req, res, next) {
    let referrer = req.get('referrer') || `${req.WebConfig.StaticFilesDir}/`;
    req.session.theme = req.body.theme;

    return res.redirect(referrer)
  }
};