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

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message });
});

module.exports = app;
