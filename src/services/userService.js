const prisma = require('../prismaClient');

async function getAllUsers() {
  return await prisma.user.findMany();
}

async function getUserById(id) {
  const userId = Number(id);
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!user) {
    const error = new Error(`Recurso com id ${userId} nao encontrado`);
    error.status = 404;
    throw error;
  }
  return user;
}

async function createUser(data) {
  const { name, email, password } = data;
  const novoUser = await prisma.user.create({
    data: { name, email, password }
  });
  await prisma.carrinho.create({
    data: { userId: novoUser.id, total: 0.0 }
  });
  return novoUser;
}

async function updateUser(id, data) {
  const userId = Number(id);
  await getUserById(userId);
  const { name, email, password } = data;
  return prisma.user.update({
      where: {id: userId},
      data: {name, email, password}
  });
}

async function deleteUser(id) {
  const userId = Number(id);
  await getUserById(userId);
  const carrinho = await prisma.carrinho.findUnique({
    where: { userId: userId }
  });
  if (carrinho) {
    await prisma.pedido.deleteMany({
      where: { carrinhoId: carrinho.id }
    });
    await prisma.carrinho.delete({
      where: { id: carrinho.id }
    });
  }
  await prisma.user.delete({
    where: { id: userId }
  });
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
