module.exports = {
  route: '/download',
  method: 'get',
  run: function(req, res, next) {
    if (req.query.file) {
      let file = `${process.cwd()}/downloads/${req.query.file}`;

      res.download(file, function(err) {
        if (err)
          return res.send(`File: ${req.query.file} not found.`);
      });
    } else {
      return next();
    };
  }
};