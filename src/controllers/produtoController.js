const produtoService = require('../services/produtoService');

async function getAllProdutos(req, res, next) {
  try {
    const produtos = await produtoService.getAllProdutos();
    res.json(produtos);
  } catch (err) {
    next(err);
  }
}

async function getProdutoById(req, res, next) {
  try {
    const produto = await produtoService.getProdutoById(req.params.id);
    res.json(produto);
  } catch (err) {
    next(err);
  }
}

async function createProduto(req, res, next) {
  try {
    const produto = await produtoService.createProduto(req.body);
    res.status(201).json(produto);
  } catch (err) {
    next(err);
  }
}

async function updateProduto(req, res, next) {
  try {
    const produto = await produtoService.updateProduto(req.params.id, req.body);
    res.json(produto);
  } catch (err) {
    next(err);
  }
}

async function deleteProduto(req, res, next) {
  try {
    await produtoService.deleteProduto(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllProdutos,
  getProdutoById,
  createProduto,
  updateProduto,
  deleteProduto
};
