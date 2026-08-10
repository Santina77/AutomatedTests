const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

/** @type {{ id: string, name: string, price: number, category: string, in_stock: boolean, created_at: string }[]} */
const products = [];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function validateProduct(body) {
  const errors = [];
  if (!body || typeof body.name !== 'string' || body.name.trim() === '') {
    errors.push('name is required');
  }
  if (!body || typeof body.price !== 'number' || !(body.price > 0)) {
    errors.push('price must be a positive number');
  }
  if (!body || typeof body.category !== 'string' || body.category.trim() === '') {
    errors.push('category is required');
  }
  if (!body || typeof body.in_stock !== 'boolean') {
    errors.push('in_stock must be a boolean');
  }
  return errors;
}

app.get('/api/products', (req, res) => {
  res.status(200).json({ products });
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.status(200).json({ product });
});

app.post('/api/products', (req, res) => {
  const errors = validateProduct(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  const product = {
    id: crypto.randomUUID(),
    name: req.body.name.trim(),
    price: req.body.price,
    category: req.body.category.trim(),
    in_stock: req.body.in_stock,
    created_at: new Date().toISOString(),
  };
  products.push(product);
  res.status(201).json({ product });
});

app.delete('/api/products/:id', (req, res) => {
  const index = products.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  products.splice(index, 1);
  res.status(204).send();
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Product manager app listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
