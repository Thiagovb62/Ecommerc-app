const prisma = require('../prismaClient');

async function getAllProdutos() {
  return await prisma.produto.findMany();
}

async function getProdutoById(id) {
  const produtoId = Number(id);
  const produto = await prisma.produto.findUnique({
    where: { id: produtoId }
  });
  if (!produto) {
    const error = new Error(`Recurso com id ${produtoId} nao encontrado`);
    error.status = 404;
    throw error;
  }
  return produto;
}

async function createProduto(data) {
  const { nome, preco, descricao, urlImage } = data;
  return prisma.produto.create({
      data: {nome, preco: Number(preco), descricao, urlImage}
  });
}

async function updateProduto(id, data) {
  const produtoId = Number(id);
  await getProdutoById(produtoId);
  const { nome, preco, descricao, urlImage } = data;
  return prisma.produto.update({
      where: {id: produtoId},
      data: {
          nome,
          preco: preco !== undefined ? Number(preco) : undefined,
          descricao,
          urlImage
      }
  });
}

async function deleteProduto(id) {
  const produtoId = Number(id);
  await getProdutoById(produtoId);
  const pedidos = await prisma.pedido.findMany({
    where: { produtoId: produtoId }
  });
  const carrinhoIds = [...new Set(pedidos.map(p => p.carrinhoId).filter(Boolean))];
  await prisma.pedido.deleteMany({
    where: { produtoId: produtoId }
  });
  for (const cId of carrinhoIds) {
    const remainingPedidos = await prisma.pedido.findMany({
      where: { carrinhoId: cId },
      include: { produto: true }
    });
    let total = 0;
    for (const p of remainingPedidos) {
      total += p.quantidade * (p.preco || (p.produto ? p.produto.preco : 0));
    }
    await prisma.carrinho.update({
      where: { id: cId },
      data: { total: total }
    });
  }
  await prisma.produto.delete({
    where: { id: produtoId }
  });
}

module.exports = {
  getAllProdutos,
  getProdutoById,
  createProduto,
  updateProduto,
  deleteProduto
};
