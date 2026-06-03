const prisma = require('../prismaClient');

async function realizarCheckout(userId) {
  const uId = Number(userId);

  const user = await prisma.user.findUnique({
    where: { id: uId }
  });
  if (!user) {
    const error = new Error(`Recurso com id ${uId} nao encontrado`);
    error.status = 404;
    throw error;
  }

  const carrinho = await prisma.carrinho.findUnique({
    where: { userId: uId },
    include: {
      pedidos: true
    }
  });

  if (!carrinho) {
    const error = new Error(`Recurso com id ${uId} nao encontrado`);
    error.status = 404;
    throw error;
  }

  if (carrinho.pedidos.length === 0) {
    const error = new Error('Nao e possivel realizar checkout com o carrinho vazio');
    error.status = 400;
    throw error;
  }

  await prisma.pedido.deleteMany({
    where: { carrinhoId: carrinho.id }
  });

  await prisma.carrinho.update({
    where: { id: carrinho.id },
    data: { total: 0.0 }
  });

  return 'Compra realizada com sucesso!';
}

module.exports = {
  realizarCheckout
};
