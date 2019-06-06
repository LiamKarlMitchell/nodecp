const fs = require('fs');

module.exports = function(req, res, next) {
  let conditionsDir = `${process.cwd()}/others/conditions`;

  if (fs.existsSync(conditionsDir) && fs.statSync(conditionsDir).isDirectory()) {
    let Files = fs.readdirSync(conditionsDir)
    .filter(file => fs.statSync(`${conditionsDir}/${file}`).isFile());

    for (var File of Files) {
      let FileData = require(`${conditionsDir}/${File}`);

      req.Conditions.set(`${FileData.method}-${FileData.route}`, { dir: `${conditionsDir}/${File}` });
    }; 
  }
};