const prisma = require('../prismaClient');

async function getOrCreateCarrinho(userId) {
  const uId = Number(userId);
  const user = await prisma.user.findUnique({
    where: { id: uId }
  });
  if (!user) {
    const error = new Error(`Recurso com id ${uId} nao encontrado`);
    error.status = 404;
    throw error;
  }
  let carrinho = await prisma.carrinho.findUnique({
    where: { userId: uId },
    include: {
      pedidos: {
        include: { produto: true }
      }
    }
  });
  if (!carrinho) {
    carrinho = await prisma.carrinho.create({
      data: { userId: uId, total: 0.0 },
      include: {
        pedidos: {
          include: { produto: true }
        }
      }
    });
  }
  return carrinho;
}

async function adicionarProduto(userId, produtoId, quantidade) {
  const uId = Number(userId);
  const pId = Number(produtoId);
  const qty = Number(quantidade);

  if (isNaN(qty) || qty <= 0) {
    const error = new Error('A quantidade deve ser maior que zero');
    error.status = 400;
    throw error;
  }

  const carrinho = await getOrCreateCarrinho(uId);

  const produto = await prisma.produto.findUnique({
    where: { id: pId }
  });
  if (!produto) {
    const error = new Error(`Recurso com id ${pId} nao encontrado`);
    error.status = 404;
    throw error;
  }

  const pedidoExistente = await prisma.pedido.findFirst({
    where: {
      carrinhoId: carrinho.id,
      produtoId: pId
    }
  });

  if (pedidoExistente) {
    await prisma.pedido.update({
      where: { id: pedidoExistente.id },
      data: { quantidade: pedidoExistente.quantidade + qty }
    });
  } else {
    await prisma.pedido.create({
      data: {
        carrinhoId: carrinho.id,
        produtoId: pId,
        preco: produto.preco,
        quantidade: qty,
        dataPedido: new Date().toISOString().split('T')[0]
      }
    });
  }

  const todosPedidos = await prisma.pedido.findMany({
    where: { carrinhoId: carrinho.id },
    include: { produto: true }
  });

  let total = 0;
  for (const p of todosPedidos) {
    total += p.quantidade * (p.preco || (p.produto ? p.produto.preco : 0));
  }

  await prisma.carrinho.update({
    where: { id: carrinho.id },
    data: { total: total }
  });

  return await prisma.carrinho.findUnique({
    where: { id: carrinho.id },
    include: {
      pedidos: {
        include: { produto: true }
      }
    }
  });
}

async function removerProduto(userId, produtoId, quantidade) {
  const uId = Number(userId);
  const pId = Number(produtoId);
  const qty = Number(quantidade);

  const carrinho = await getOrCreateCarrinho(uId);

  const pedidoExistente = await prisma.pedido.findFirst({
    where: {
      carrinhoId: carrinho.id,
      produtoId: pId
    }
  });

  if (!pedidoExistente) {
    const error = new Error(`Recurso com id ${pId} nao encontrado`);
    error.status = 404;
    throw error;
  }

  if (pedidoExistente.quantidade > qty) {
    await prisma.pedido.update({
      where: { id: pedidoExistente.id },
      data: { quantidade: pedidoExistente.quantidade - qty }
    });
  } else {
    await prisma.pedido.delete({
      where: { id: pedidoExistente.id }
    });
  }

  const todosPedidos = await prisma.pedido.findMany({
    where: { carrinhoId: carrinho.id },
    include: { produto: true }
  });

  let total = 0;
  for (const p of todosPedidos) {
    total += p.quantidade * (p.preco || (p.produto ? p.produto.preco : 0));
  }

  await prisma.carrinho.update({
    where: { id: carrinho.id },
    data: { total: total }
  });

  return await prisma.carrinho.findUnique({
    where: { id: carrinho.id },
    include: {
      pedidos: {
        include: { produto: true }
      }
    }
  });
}

module.exports = {
  getOrCreateCarrinho,
  adicionarProduto,
  removerProduto
};
