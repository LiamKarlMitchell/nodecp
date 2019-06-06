module.exports = {
  route: '/account/logout',
  method: 'get',
  run: function(req, res, next) {
    if (!req.session.loggedin && !req.session.account) {
      req.flash('error', 'Please login first!');
      return res.redirect(`${req.WebConfig.StaticFilesDir}/account/login`);
    };

    let referrer = req.get('referrer') || '/';
    
    req.session.loggedin = false;
    req.session.account = null;
    
    return res.redirect(referrer);
  }
};