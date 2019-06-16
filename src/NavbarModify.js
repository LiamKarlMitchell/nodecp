module.exports = function(req, res, next) {
  let MenuItems = req.WebConfig.MenuItems

  // modify our Menu Items to use the correct navigation
  for (var Nav of MenuItems) {
    for (var Item of Nav.items) {
      if (!Item.externalLink) {
        Item.href = `${req.WebConfig.StaticFilesDir}${Item.href}`;
      }
    }
  }

  // apply it to the request property
  req.MenuItems = MenuItems;

  next();
};