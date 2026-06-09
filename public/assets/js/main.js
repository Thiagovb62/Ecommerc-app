const API_URL = '';
let userId = localStorage.getItem('userId');
let abaAtual = 'produtos';

if (!userId) {
    window.location.href = '/login.html';
}

const produtosSection = document.getElementById('produtos-section');
const carrinhoSection = document.getElementById('carrinho-section');
const produtosContainer = document.getElementById('produtos-container');
const carrinhoContainer = document.getElementById('carrinho-container');
const carrinhoCount = document.getElementById('carrinho-count');
const carrinhoLink = document.getElementById('carrinho-link');
const produtosLink = document.getElementById('produtos-link');
const voltarProdutos = document.getElementById('voltar-produtos');
const finalizarCompra = document.getElementById('finalizar-compra');

document.getElementById('ano-atual').textContent = new Date().getFullYear();

async function carregarProdutos() {
    try {
        const response = await fetch(`${API_URL}/api/produtos`);
        if (!response.ok) throw new Error('Erro ao carregar produtos');
        const produtos = await response.json();
        exibirProdutos(produtos);
    } catch (error) {
        console.error('Erro:', error);
        produtosContainer.innerHTML = '<div class="loading"><i class="fas fa-exclamation-triangle"></i> Erro ao carregar produtos. Verifique se o servidor está rodando.</div>';
    }
}

function exibirProdutos(produtos) {
    if (!produtos.length) {
        produtosContainer.innerHTML = '<div class="loading"><i class="fas fa-box-open"></i> Nenhum produto encontrado.</div>';
        return;
    }
    
    produtosContainer.innerHTML = produtos.map(produto => `
        <div class="produto-card">
            <div class="produto-imagem">
                ${produto.urlImage ? `<img src="${produto.urlImage}" alt="${produto.nome}">` : '<i class="fas fa-box"></i>'}
            </div>
            <div class="produto-info">
                <h3>${produto.nome}</h3>
                <p class="descricao">${produto.descricao || 'Sem descrição'}</p>
                <p class="preco">${produto.preco.toFixed(2)}</p>
                <button class="btn-comprar" onclick="adicionarAoCarrinho(${produto.id}, event)">
                    <i class="fas fa-cart-plus"></i> Adicionar ao Carrinho
                </button>
            </div>
        </div>
    `).join('');
}

async function carregarCarrinho() {
    try {
        const response = await fetch(`${API_URL}/api/carrinhos/user/${userId}`);
        if (!response.ok) throw new Error('Erro ao carregar carrinho');
        const carrinho = await response.json();
        exibirCarrinho(carrinho);
        atualizarContadorCarrinho(carrinho);
    } catch (error) {
        console.error('Erro:', error);
        carrinhoContainer.innerHTML = '<div class="loading"><i class="fas fa-exclamation-triangle"></i> Erro ao carregar carrinho</div>';
    }
}

function exibirCarrinho(carrinho) {
    if (!carrinho.pedidos || carrinho.pedidos.length === 0) {
        carrinhoContainer.innerHTML = '<div class="carrinho-vazio"><i class="fas fa-shopping-basket"></i> Seu carrinho está vazio</div>';
        return;
    }
    
    let html = '';
    carrinho.pedidos.forEach(pedido => {
        html += `
            <div class="carrinho-item">
                <div class="carrinho-item-info">
                    <h4>${pedido.produto.nome}</h4>
                    <p>R$ ${pedido.preco.toFixed(2)}</p>
                </div>
                <div class="carrinho-item-quantidade">
                    <button onclick="removerDoCarrinho(${pedido.produtoId}, 1, event)"><i class="fas fa-minus"></i></button>
                    <span>${pedido.quantidade}</span>
                    <button onclick="adicionarAoCarrinho(${pedido.produtoId}, event)"><i class="fas fa-plus"></i></button>
                </div>
                <div class="carrinho-item-total">
                    R$ ${(pedido.preco * pedido.quantidade).toFixed(2)}
                </div>
            </div>
        `;
    });
    
    html += `<div class="carrinho-total">Total: R$ ${carrinho.total.toFixed(2)}</div>`;
    carrinhoContainer.innerHTML = html;
}

function atualizarContadorCarrinho(carrinho) {
    const totalItens = carrinho.pedidos?.reduce((sum, item) => sum + item.quantidade, 0) || 0;
    carrinhoCount.textContent = totalItens;
}

window.adicionarAoCarrinho = async function(produtoId, event) {
    try {
        const response = await fetch(
            `${API_URL}/api/carrinhos/user/${userId}/adicionar?produtoId=${produtoId}&quantidade=1`,
            { method: 'POST' }
        );
        
        if (!response.ok) throw new Error('Erro ao adicionar produto');
        
        const carrinho = await response.json();
        atualizarContadorCarrinho(carrinho);
        
        if (abaAtual === 'carrinho') {
            await carregarCarrinho();
        }
        
        const btn = event.target.closest('.btn-comprar');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Adicionado!';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 1000);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao adicionar produto ao carrinho');
    }
}

window.removerDoCarrinho = async function(produtoId, quantidade, event) {
    try {
        const response = await fetch(
            `${API_URL}/api/carrinhos/user/${userId}/remover?produtoId=${produtoId}&quantidade=${quantidade}`,
            { method: 'POST' }
        );
        
        if (!response.ok) throw new Error('Erro ao remover produto');
        
        const carrinho = await response.json();
        atualizarContadorCarrinho(carrinho);
        await carregarCarrinho();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao remover produto do carrinho');
    }
}

async function finalizarCheckout() {
    try {
        const response = await fetch(`${API_URL}/api/checkout/user/${userId}`, { method: 'POST' });
        
        if (response.status === 400) {
            alert('Carrinho vazio! Adicione produtos antes de finalizar.');
            return;
        }
        
        if (!response.ok) throw new Error('Erro no checkout');
        
        alert('Compra realizada com sucesso!');
        await carregarCarrinho();
        mostrarProdutos();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao finalizar compra');
    }
}

function mostrarProdutos() {
    abaAtual = 'produtos';
    produtosSection.style.display = 'block';
    carrinhoSection.style.display = 'none';
    produtosLink.classList.add('active');
    carrinhoLink.classList.remove('active');
    carregarProdutos();
}

function mostrarCarrinho() {
    abaAtual = 'carrinho';
    produtosSection.style.display = 'none';
    carrinhoSection.style.display = 'block';
    carrinhoLink.classList.add('active');
    produtosLink.classList.remove('active');
    carregarCarrinho();
}

carrinhoLink.addEventListener('click', (e) => {
    e.preventDefault();
    mostrarCarrinho();
});

produtosLink.addEventListener('click', (e) => {
    e.preventDefault();
    mostrarProdutos();
});

voltarProdutos.addEventListener('click', () => {
    mostrarProdutos();
});

finalizarCompra.addEventListener('click', () => {
    finalizarCheckout();
});

document.getElementById('sair-link').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    window.location.href = '/login.html';
});

carregarProdutos();