const axios = require('axios');

module.exports = {
  route: '/account/reset',
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

    if (!req.WebConfig.AllowResetPassword) {
      req.flash('error', 'The admins has disabled password reset for accounts.');
      return res.redirect(referrer);
    }

    if (req.session.loggedin) {
      req.flash('error', 'You cannot do this while logged in.');
      return res.redirect(referrer);
    };

    if (req.query.code) {
      let lostAccount = req.Mysql.getNoCache('cp_resetpass', 'code', req.query.code)[0];

      if (!lostAccount) {
        req.flash('error', 'Invalid reset password code.');
        return res.redirect(referrer);
      };

      if (lostAccount.reset_done > 0) {
        req.flash('error', 'The code is expired.');
        return res.redirect(referrer);
      };

      let accountData = req.Mysql.getNoCache('login', 'account_id', lostAccount.account_id)[0];

      if (accountData.user_pass !== lostAccount.old_password) {
        req.flash('error', 'The old password does not match the password on the account.');
        return res.redirect(referrer);
      };

      req.Mysql.editMultiple('cp_resetpass', 'account_id', lostAccount.account_id, [
        {
          column: 'new_password',
          value: req.WebConfig.HashPassword ? require('crypto').createHash('md5').update(req.body.new_pass).digest('hex') : new_pass
        },
        {
          column: 'reset_date', 
          value: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
        },
        {
          column: 'reset_ip',
          value: req.ip
        },
        {
          column: 'reset_done',
          value: 1
        }
      ]);

      req.Mysql.editMultiple('login', 'account_id', lostAccount.account_id, [
        {
          column: 'user_pass',
          value: req.WebConfig.HashPassword ? require('crypto').createHash('md5').update(req.body.new_pass).digest('hex') : new_pass
        }
      ]);

      req.flash('success', 'Successfully reset your password. You may login <a href="/account/login">here.</a>');
      return res.redirect(referrer);
    };

    if (!req.Mysql.has('login', 'userid', req.body.userid)) {
      req.flash('error', `The username <u>${req.body.userid}</u> does not exist.`);
      return res.redirect(referrer);
    };

    let lostAccount = req.Mysql.getNoCache('login', 'userid', req.body.userid)[0];
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';

    for (var i = 0; i < 32; i++) {
      code += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    let resetAccount = req.Mysql.getNoCache('cp_resetpass', 'account_id', lostAccount.account_id)
    .filter(acc => acc.reset_done === '0' || acc.reset_done < 1); 

    if (resetAccount.length > 0) {
      req.flash('error', 'An email was already sent to your email!');
      return res.redirect(referrer);
    };

    req.app.mailer.send('email', {
      to: lostAccount.email,
      subject: 'Password Reset',
      site: `${req.protocol}://${req.get('host')}/account/reset/?code=${code}`
    }, function(err) {
      if (err) {
        req.flash('error', `Something went wrong!\nError Found: ${err.message}`);
        return res.redirect(referrer);
      };

      req.Mysql.setMultiple('cp_resetpass', [
        {
          column: 'code',
          value: code
        },
        {
          column: 'account_id',
          value: lostAccount.account_id
        },
        {
          column: 'old_password',
          value: lostAccount.user_pass
        },
        {
          column: 'request_date',
          value: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
        },
        {
          column: 'request_ip',
          value: req.ip
        }
      ]);
  
      req.flash('success', 'We have sent a reset password link to your email.');
      return res.redirect(referrer);
    });
  }
};