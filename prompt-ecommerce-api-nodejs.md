# Prompt: Criar API de E-commerce em Node.js com SQLite e Prisma ORM

## Contexto

Crie uma API REST de e-commerce completa em **Node.js** usando **JavaScript**, **SQLite** como banco de dados e **Prisma ORM**. A API deve replicar fielmente a estrutura e comportamento de uma API Spring Boot existente.

---

## Stack e dependências

- **Runtime:** Node.js
- **Framework:** Express.js
- **ORM:** Prisma com provider `sqlite`
- **Banco de dados:** SQLite (arquivo local `dev.db`)
- **Porta:** 8083

### `package.json` — dependências necessárias:
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "@prisma/client": "^5.0.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0"
  }
}
```

---

## Schema Prisma (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id       Int      @id @default(autoincrement())
  name     String?
  email    String?
  password String?
  carrinho Carrinho?
}

model Produto {
  id        Int      @id @default(autoincrement())
  nome      String?
  preco     Float
  descricao String?
  pedidos   Pedido[]
}

model Carrinho {
  id      Int      @id @default(autoincrement())
  userId  Int      @unique
  total   Float?   @default(0)
  user    User     @relation(fields: [userId], references: [id])
  pedidos Pedido[]
}

model Pedido {
  id          Int       @id @default(autoincrement())
  produtoId   Int?
  carrinhoId  Int?
  quantidade  Int
  dataPedido  String?
  produto     Produto?  @relation(fields: [produtoId], references: [id])
  carrinho    Carrinho? @relation(fields: [carrinhoId], references: [id])
}
```

---

## Estrutura de pastas do projeto

```
ecommerce-api/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── controllers/
│   │   ├── userController.js
│   │   ├── produtoController.js
│   │   ├── carrinhoController.js
│   │   └── checkoutController.js
│   ├── services/
│   │   ├── userService.js
│   │   ├── produtoService.js
│   │   ├── carrinhoService.js
│   │   └── checkoutService.js
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── produtoRoutes.js
│   │   ├── carrinhoRoutes.js
│   │   └── checkoutRoutes.js
│   ├── prismaClient.js
│   └── app.js
├── server.js
└── package.json
```

---

## Arquivo `src/prismaClient.js`

```js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
module.exports = prisma;
```

---

## Endpoints e comportamento esperado

### `/api/users`

| Método | Rota            | Descrição                                                                                     |
|--------|-----------------|-----------------------------------------------------------------------------------------------|
| GET    | `/api/users`    | Retorna lista de todos os usuários. Status 200.                                               |
| GET    | `/api/users/:id`| Retorna usuário pelo ID. Se não encontrado, lança erro.                                       |
| POST   | `/api/users`    | Cria novo usuário com `name`, `email`, `password`. **Ao criar, também cria automaticamente um `Carrinho` associado com `total: 0.0`**. Status 201. |
| PUT    | `/api/users/:id`| Atualiza `name`, `email`, `password` do usuário existente. Retorna usuário atualizado.       |
| DELETE | `/api/users/:id`| Deleta usuário pelo ID. Status 204 sem body.                                                  |

**Comportamento especial no POST /api/users:**
Ao criar um usuário, o serviço deve também criar um carrinho vinculado a ele:
```js
// Após criar o user, criar o carrinho associado
await prisma.carrinho.create({
  data: { userId: novoUser.id, total: 0.0 }
});
```

---

### `/api/produtos`

| Método | Rota               | Descrição                                                                 |
|--------|--------------------|---------------------------------------------------------------------------|
| GET    | `/api/produtos`    | Retorna lista de todos os produtos. Status 200.                           |
| GET    | `/api/produtos/:id`| Retorna produto pelo ID. Lança erro se não encontrado.                    |
| POST   | `/api/produtos`    | Cria produto com `nome`, `preco`, `descricao`. Status 201.                |
| PUT    | `/api/produtos/:id`| Atualiza `nome`, `preco`, `descricao`. Retorna produto atualizado.       |
| DELETE | `/api/produtos/:id`| Deleta produto pelo ID. Status 204 sem body.                              |

---

### `/api/carrinhos`

| Método | Rota                                          | Descrição                                                                                                                  |
|--------|-----------------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| GET    | `/api/carrinhos/user/:userId`                 | Retorna o carrinho do usuário (com os pedidos e produtos incluídos via `include`). Se não existir, cria um novo automaticamente. |
| POST   | `/api/carrinhos/user/:userId/adicionar`       | Adiciona produto ao carrinho. Recebe `produtoId` e `quantidade` como **query params**. Veja lógica detalhada abaixo.       |
| POST   | `/api/carrinhos/user/:userId/remover`         | Remove (ou reduz) produto do carrinho. Recebe `produtoId` e `quantidade` como **query params**. Veja lógica detalhada abaixo. |

**Lógica do serviço de carrinho — `adicionar`:**
1. Buscar o carrinho do usuário pelo `userId`.
2. Validar que `quantidade > 0`, senão lançar erro `"A quantidade deve ser maior que zero"`.
3. Buscar o produto pelo `produtoId`.
4. Verificar se já existe um `Pedido` no carrinho com aquele `produtoId`:
   - Se **já existe**: incrementar a `quantidade` existente.
   - Se **não existe**: criar novo `Pedido` com `produtoId`, `carrinhoId`, `quantidade`, `dataPedido` = data atual (formato ISO `YYYY-MM-DD`).
5. Recalcular o `total` do carrinho somando `pedido.quantidade * produto.preco` para todos os pedidos.
6. Salvar e retornar o carrinho atualizado.

**Lógica do serviço de carrinho — `remover`:**
1. Buscar o carrinho do usuário.
2. Buscar o pedido existente no carrinho para o `produtoId`.
3. Se a `quantidade` do pedido for maior que a quantidade a remover: decrementar.
4. Se a `quantidade` for igual ou menor: deletar o pedido.
5. Recalcular o `total` do carrinho.
6. Retornar o carrinho atualizado.

**Ao buscar o carrinho, sempre incluir os pedidos com os produtos:**
```js
await prisma.carrinho.findFirst({
  where: { userId: Number(userId) },
  include: {
    pedidos: {
      include: { produto: true }
    }
  }
});
```

---

### `/api/checkout`

| Método | Rota                        | Descrição                                                                                                              |
|--------|-----------------------------|------------------------------------------------------------------------------------------------------------------------|
| POST   | `/api/checkout/user/:userId`| Realiza o checkout do usuário. Veja lógica abaixo. Retorna string de sucesso. Status 200.                             |

**Lógica do checkout:**
1. Buscar carrinho do usuário pelo `userId`.
2. Se o carrinho estiver vazio (`pedidos.length === 0`), lançar erro: `"Nao e possivel realizar checkout com o carrinho vazio"`.
3. Limpar o carrinho: deletar todos os `Pedido` do `carrinhoId` e zerar o `total` do carrinho para `0.0`.
4. Retornar a string: `"Compra realizada com sucesso!"`.

---

## Tratamento de erros global

No `app.js`, adicionar um middleware de erro global:
```js
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message });
});
```

Para erros de "não encontrado", lançar com status 404:
```js
const error = new Error(`Recurso com id ${id} nao encontrado`);
error.status = 404;
throw error;
```

Para erros de validação (ex: quantidade <= 0, carrinho vazio), usar status 400:
```js
const error = new Error("A quantidade deve ser maior que zero");
error.status = 400;
throw error;
```

---

## `src/app.js`

```js
const express = require('express');
const app = express();

app.use(express.json());

const userRoutes = require('./routes/userRoutes');
const produtoRoutes = require('./routes/produtoRoutes');
const carrinhoRoutes = require('./routes/carrinhoRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');

app.use('/api/users', userRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/carrinhos', carrinhoRoutes);
app.use('/api/checkout', checkoutRoutes);

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message });
});

module.exports = app;
```

---

## `server.js`

```js
const app = require('./src/app');
const PORT = 8083;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
```

---

## Comandos para iniciar o projeto

```bash
# Instalar dependências
npm install

# Inicializar Prisma e criar banco SQLite
npx prisma migrate dev --name init

# Iniciar servidor
node server.js
```

---

## Observações importantes

- Todos os IDs devem ser convertidos para `Number()` ao receber de `req.params` antes de usar no Prisma.
- `quantidade` vinda de query params também deve ser convertida: `Number(req.query.quantidade)`.
- A data do pedido deve ser salva no formato `YYYY-MM-DD` (use `new Date().toISOString().split('T')[0]`).
- O recalculo do `total` do carrinho deve sempre considerar todos os pedidos atuais após qualquer operação de adicionar/remover.
- Ao deletar um usuário, o Prisma pode exigir que o carrinho seja deletado antes (por causa da FK). Gerencie isso no `userService` excluindo o carrinho antes do user, se existir.
