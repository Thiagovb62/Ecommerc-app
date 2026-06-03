const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');

router.post('/user/:userId', checkoutController.realizarCheckout);

module.exports = router;
