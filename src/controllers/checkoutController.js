const checkoutService = require('../services/checkoutService');

async function realizarCheckout(req, res, next) {
  try {
    const result = await checkoutService.realizarCheckout(req.params.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  realizarCheckout
};
