const axios = require('axios');

module.exports = {
  route: '/pin',
  method: 'post',
  run: async function(req, res, next) {
    let referrer = req.get('referrer') || `${req.WebConfig.StaticFilesDir}`;
    
    if (!req.session.loggedin) {
      req.flash('error', 'Please login first!');
      return res.redirect(`${req.WebConfig.StaticFilesDir}/account/login`);
    };
    
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
    
    if (req.session.account.pincode) {
      if (!req.body.old_pincode || req.body.old_pincode !== req.session.account.pincode) {
        req.flash('error', 'The old pincode given does not match!');
        return res.redirect(referrer)
      }
    };

    if (req.WebConfig.HashPassword)
      req.body.user_pass = require('crypto').createHash('md5').update(req.body.user_pass).digest('hex');
    
    if (req.body.user_pass !== req.session.account.user_pass) {
      req.flash('error', 'Incorrect login details were provided.');
      return res.redirect(referrer);
    };
        
    req.Mysql.editMultiple('login', 'account_id', req.session.account.account_id, [
      {
        column: 'pincode',
        value: req.body.new_pincode
      }
    ]);
    
    req.session.account = req.Mysql.getNoCache('login', 'account_id', req.session.account.account_id)[0];
          
    req.flash('success', `Sucessfully changed your pincode!`);
    return res.redirect(referrer);
  }
};