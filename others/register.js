const axios = require('axios');

module.exports = {
  route: '/create',
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
    
    if (req.Mysql.has('login', 'userid', req.body.userid)) {
      req.flash('error', `Account <u>${req.body.userid}</u> already exists!`);
      return res.redirect(referrer);
    };
    
    if (!req.WebConfig.AllowMultipleEmails && req.Mysql.has('login', 'email', req.body.email)) {
      req.flash('error', 'A user already owns that email.');
      return res.redirect(referrer);
    };
    
    if (req.WebConfig.HashPassword)
      req.body.user_pass = require('crypto').createHash('md5').update(req.body.user_pass).digest('hex');
    
    let registerData;
    
    if (req.WebConfig.PinCodeEnabled) {
      registerData = [
        {
          column: "userid",
          value: req.body.userid
        },
        {
          column: "email",
          value: req.body.email
        },
        {
          column: "user_pass",
          value: req.body.user_pass
        },
        {
          column: "sex",
          value: req.body.sex
        },
        {
          column: "birthdate",
          value: `${req.body.birthdate_year}-${req.body.birthdate_month}-${req.body.birthdate_day}`
        },
        {
          column: "pincode",
          value: req.body.pincode
        }
      ]
    } else {
      registerData = [
        {
          column: "userid",
          value: req.body.userid
        },
        {
          column: "email",
          value: req.body.email
        },
        {
          column: "user_pass",
          value: req.body.user_pass
        },
        {
          column: "sex",
          value: req.body.sex
        },
        {
          column: "birthdate",
          value: `${req.body.birthdate_year}-${req.body.birthdate_month}-${req.body.birthdate_day}`
        }
      ]
    };
        
    req.Mysql.setMultiple('login', registerData);
    
    req.flash('success', `Successfully registered as <i>${req.body.userid}</i> You may login <a href="/account/login">here.</a>`);
    return res.redirect(referrer);
  }
};