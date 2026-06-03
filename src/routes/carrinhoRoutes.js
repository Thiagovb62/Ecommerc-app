const express = require('express');
const router = express.Router();
const carrinhoController = require('../controllers/carrinhoController');

router.get('/user/:userId', carrinhoController.getCarrinhoByUserId);
router.post('/user/:userId/adicionar', carrinhoController.adicionarProduto);
router.post('/user/:userId/remover', carrinhoController.removerProduto);

module.exports = router;
