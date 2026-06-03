# Guia de Integração da API para o Front-End

Este guia descreve os endpoints, payloads, parâmetros e comportamentos esperados da API REST de E-commerce para orientar a integração do front-end.

A API está configurada para rodar localmente no endereço: **`http://localhost:8083`**.

A documentação interativa oficial do Swagger pode ser acessada em: **`http://localhost:8083/api-docs`**.

---

## 1. Tratamento de Erros e Respostas

A API retorna formatos padronizados para respostas de erro. Toda resposta de falha conterá um código HTTP apropriado (400, 404, 500) e um corpo JSON no seguinte formato:

```json
{
  "error": "Mensagem detalhada do erro"
}
```

---

## 2. Endpoints e Integrações

### 2.1. Usuários (`/api/users`)

Responsável pelo cadastro de clientes.

#### Criar Usuário (Cadastro)
*   **Método**: `POST`
*   **Rota**: `/api/users`
*   **Corpo da Requisição**:
    ```json
    {
      "name": "Nome do Usuário",
      "email": "email@exemplo.com",
      "password": "senha"
    }
    ```
*   **Status de Sucesso**: `201 Created`
*   **Comportamento Importante**: Ao criar o usuário, a API automaticamente cria e vincula um `Carrinho` com total zerado a este usuário. O front-end não precisa fazer uma chamada separada para criar o carrinho.

#### Listar Usuários
*   **Método**: `GET`
*   **Rota**: `/api/users`
*   **Status de Sucesso**: `200 OK`
*   **Resposta**: Uma lista de objetos de usuário.

#### Obter Detalhes de um Usuário
*   **Método**: `GET`
*   **Rota**: `/api/users/:id`
*   **Status de Sucesso**: `200 OK`

#### Atualizar Usuário
*   **Método**: `PUT`
*   **Rota**: `/api/users/:id`
*   **Corpo da Requisição**: Mesmos campos do `POST`.
*   **Status de Sucesso**: `200 OK` (retorna o usuário atualizado).

#### Deletar Usuário
*   **Método**: `DELETE`
*   **Rota**: `/api/users/:id`
*   **Status de Sucesso**: `204 No Content` (sem corpo).
*   **Comportamento Importante**: A exclusão do usuário exclui automaticamente o carrinho e quaisquer itens de pedidos pendentes atrelados a ele.

---

### 2.2. Produtos (`/api/produtos`)

Cadastro e consulta do catálogo de itens da loja.

#### Listar Produtos (Catálogo)
*   **Método**: `GET`
*   **Rota**: `/api/produtos`
*   **Status de Sucesso**: `200 OK`
*   **Resposta**:
    ```json
    [
      {
        "id": 1,
        "nome": "Smartphone",
        "preco": 1200.5,
        "descricao": "Celular de última geração",
        "urlImage": "https://link-publico.com/imagem.png"
      }
    ]
    ```

#### Criar Produto
*   **Método**: `POST`
*   **Rota**: `/api/produtos`
*   **Corpo da Requisição**:
    ```json
    {
      "nome": "Smartphone",
      "preco": 1200.5,
      "descricao": "Celular de última geração",
      "urlImage": "https://link-publico.com/imagem.png"
    }
    ```
*   **Status de Sucesso**: `201 Created`

#### Atualizar Produto
*   **Método**: `PUT`
*   **Rota**: `/api/produtos/:id`
*   **Corpo da Requisição**: Enviar os campos a serem alterados.
*   **Status de Sucesso**: `200 OK`

#### Deletar Produto
*   **Método**: `DELETE`
*   **Rota**: `/api/produtos/:id`
*   **Status de Sucesso**: `204 No Content`
*   **Comportamento Importante**: Caso este produto esteja no carrinho de algum usuário no momento da exclusão, a API limpa os itens desses carrinhos e recalcula o total automaticamente para que não ocorram inconsistências.

---

### 2.3. Carrinho (`/api/carrinhos`)

Gerenciamento da seleção de compras do usuário.

#### Obter Carrinho do Usuário
*   **Método**: `GET`
*   **Rota**: `/api/carrinhos/user/:userId`
*   **Status de Sucesso**: `200 OK`
*   **Comportamento Importante**: Se o carrinho por algum motivo ainda não existir para o `userId` informado (embora seja gerado no cadastro), a API criará um carrinho vazio na hora e o retornará.
*   **Resposta**:
    ```json
    {
      "id": 1,
      "userId": 2,
      "total": 2401.0,
      "pedidos": [
        {
          "id": 10,
          "produtoId": 1,
          "carrinhoId": 1,
          "preco": 1200.5,
          "quantidade": 2,
          "dataPedido": "2026-06-03",
          "produto": {
            "id": 1,
            "nome": "Smartphone",
            "preco": 1200.5,
            "descricao": "Celular de última geração",
            "urlImage": "https://link-publico.com/imagem.png"
          }
        }
      ]
    }
    ```

#### Adicionar Produto ao Carrinho
*   **Método**: `POST`
*   **Rota**: `/api/carrinhos/user/:userId/adicionar`
*   **Query Parameters** (Obrigatórios na URL):
    *   `produtoId`: ID do produto a ser adicionado.
    *   `quantidade`: Quantidade a adicionar (deve ser maior que zero).
*   **Exemplo de URL**: `/api/carrinhos/user/2/adicionar?produtoId=1&quantidade=2`
*   **Status de Sucesso**: `200 OK` (retorna o carrinho completo atualizado).
*   **Comportamentos**:
    *   Se o produto já existir no carrinho, a API incrementará a quantidade atual.
    *   Grava a data no formato `YYYY-MM-DD`.
    *   Salva o preço unitário atual no próprio pedido (`preco`), permitindo manter o histórico de quanto o item custava ao entrar no carrinho.

#### Remover ou Reduzir Quantidade do Carrinho
*   **Método**: `POST`
*   **Rota**: `/api/carrinhos/user/:userId/remover`
*   **Query Parameters** (Obrigatórios na URL):
    *   `produtoId`: ID do produto.
    *   `quantidade`: Quantidade a remover.
*   **Exemplo de URL**: `/api/carrinhos/user/2/remover?produtoId=1&quantidade=1`
*   **Status de Sucesso**: `200 OK` (retorna o carrinho completo atualizado).
*   **Comportamentos**:
    *   Se a quantidade a remover for menor que a quantidade que o usuário já tinha no carrinho, a quantidade será diminuída.
    *   Se a quantidade a remover for igual ou superior à quantidade atual do produto no carrinho, o item de pedido será completamente removido do carrinho.
    *   O total do carrinho é recalculado de imediato.

---

### 2.4. Checkout (`/api/checkout`)

Finalização da compra.

#### Realizar Checkout (Fechar Pedido)
*   **Método**: `POST`
*   **Rota**: `/api/checkout/user/:userId`
*   **Status de Sucesso**: `200 OK`
*   **Resposta**:
    ```json
    "Compra realizada com sucesso!"
    ```
*   **Comportamentos e Restrições**:
    *   Se o carrinho do usuário estiver vazio (sem itens de pedido), a API responderá com status `400 Bad Request` e a mensagem de erro `"Nao e possivel realizar checkout com o carrinho vazio"`.
    *   Após o sucesso, a API remove todos os itens de pedido atrelados ao carrinho e redefine o total do carrinho para `0.0`.
