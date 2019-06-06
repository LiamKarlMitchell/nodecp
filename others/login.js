const axios = require('axios');

module.exports = {
  route: '/login',
  method: 'post',
  run: async function(req, res, next) {
    let referrer = req.get('referrer') || `${req.WebConfig.StaticFilesDir}`;

    if (req.WebConfig.Recaptcha.enabled) {
      if (!req.body['g-recaptcha-response']) {
        req.flash('error', 'Please complete the captcha.');
        return res.redirect(referrer);
      };
      
      let response = await axios({
        method: 'get',
        url: `https://www.google.com/recaptcha/api/siteverify?secret=${req.WebConfig.Recaptcha['secret-key']}&remoteip=${req.connection.remoteAddress}&response=${req.body['g-recaptcha-response']}`
      });
      
      if (!response.data.success) {
        req.flash('error', 'Recaptcha Failed. Please try again.');
        return res.redirect(referrer);
      };
    }

    if (req.session.loggedin) {
      req.flash('error', 'You are already logged in.');
      return res.redirect(referrer);
    };
    
    let account = req.Mysql.getNoCache('login', 'userid', req.body.userid);
    
    if (account.length < 1) {
      req.flash('error', `No account with the username <u>${req.body.userid}</u> was found.`);
      return res.redirect(referrer);
    };
    
    if (req.WebConfig.HashPassword)
      req.body.user_pass = require('crypto').createHash('md5').update(req.body.user_pass).digest('hex');
    
    if (account[0].user_pass !== req.body.user_pass) {
      req.flash('error', 'Incorrect login details were provided.');
      return res.redirect(referrer);
    };
    
    if (req.WebConfig.PinCodeEnabled) {
      if (account[0].pincode && account[0].pincode !== req.body.pincode) {
        req.flash('error', 'Invalid pincode given.');
        return res.redirect(referrer);
      }
    };
    
    req.session.loggedin = true;
    req.session.account = account[0];
    
    req.flash('success', `Sucessfully logged in as <u>${req.session.account.userid}</u>`);
    return res.redirect(referrer);
  }
};