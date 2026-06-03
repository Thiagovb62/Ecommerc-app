const carrinhoService = require('../services/carrinhoService');

async function getCarrinhoByUserId(req, res, next) {
  try {
    const carrinho = await carrinhoService.getOrCreateCarrinho(req.params.userId);
    res.json(carrinho);
  } catch (err) {
    next(err);
  }
}

async function adicionarProduto(req, res, next) {
  try {
    const carrinho = await carrinhoService.adicionarProduto(
      req.params.userId,
      req.query.produtoId,
      req.query.quantidade
    );
    res.json(carrinho);
  } catch (err) {
    next(err);
  }
}

async function removerProduto(req, res, next) {
  try {
    const carrinho = await carrinhoService.removerProduto(
      req.params.userId,
      req.query.produtoId,
      req.query.quantidade
    );
    res.json(carrinho);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCarrinhoByUserId,
  adicionarProduto,
  removerProduto
};
