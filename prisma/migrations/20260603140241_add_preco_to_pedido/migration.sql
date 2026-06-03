/*
  Warnings:

  - Added the required column `preco` to the `Pedido` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pedido" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "produtoId" INTEGER,
    "carrinhoId" INTEGER,
    "preco" REAL NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "dataPedido" TEXT,
    CONSTRAINT "Pedido_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Pedido_carrinhoId_fkey" FOREIGN KEY ("carrinhoId") REFERENCES "Carrinho" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Pedido" ("carrinhoId", "dataPedido", "id", "produtoId", "quantidade") SELECT "carrinhoId", "dataPedido", "id", "produtoId", "quantidade" FROM "Pedido";
DROP TABLE "Pedido";
ALTER TABLE "new_Pedido" RENAME TO "Pedido";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
