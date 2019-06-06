module.exports = {
  route: '/theme',
  method: 'post',
  run: function(req, res, next) {
    req.session.theme = req.body.theme;

    return res.redirect(`${req.WebConfig.StaticFilesDir}/`)
  }
};