module.exports = {
  route: '/account',
  method: 'get',
  run: function(req, res, next) {
    if (!req.session.loggedin) {
      req.flash('error', 'Please login first!');
      return res.redirect(`${req.WebConfig.StaticFilesDir}/account/login`);
    };

    if (req.session.account && req.session.loggedin) {
      let account = req.Mysql.getNoCache('login', 'account_id', req.session.account.account_id)[0];

      if (account.user_pass !== req.session.account.user_pass) {
        req.session.account = null;
        req.session.loggedin = false;
        req.flash('error', 'Your account details were updated. We had to log you out.');
        return res.redirect(`${req.WebConfig.StaticFilesDir}/account/login`);
      }
    };
    
    return req.renderPug(req);
  }
};