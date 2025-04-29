const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes API
app.get('/api/products', (req, res) => {
  try {
    const products = JSON.parse(fs.readFileSync(path.join(__dirname, '/backend/data/products.json'), 'utf8'));
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des produits' });
  }
});

app.get('/api/products/:id', (req, res) => {
  try {
    const products = JSON.parse(fs.readFileSync(path.join(__dirname, '/backend/data/products.json'), 'utf8'));
    const product = products.find(p => p.id === req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du produit' });
  }
});

app.put('/api/products/:id/stock', (req, res) => {
  try {
    const { quantity } = req.body;
    const products = JSON.parse(fs.readFileSync(path.join(__dirname, '/backend/data/products.json'), 'utf8'));
    const productIndex = products.findIndex(p => p.id === req.params.id);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    products[productIndex].stock -= quantity;
    
    if (products[productIndex].stock < 0) {
      return res.status(400).json({ error: 'Stock insuffisant' });
    }
    
    fs.writeFileSync(path.join(__dirname, '/backend/data/products.json'), JSON.stringify(products, null, 2));
    
    res.json({ success: true, newStock: products[productIndex].stock });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du stock' });
  }
});

// Route pour récupérer des adresses via l'API (simulation)
app.get('/api/address/:query', (req, res) => {
  const query = req.params.query;
  
  // Simulation d'une API d'adresses
  setTimeout(() => {
    const addresses = [
      { id: 1, address: `${query}, 1 rue des Brawlers, 75001 Paris` },
      { id: 2, address: `${query}, 2 avenue Supercell, 69002 Lyon` },
      { id: 3, address: `${query}, 3 boulevard des Stars, 33000 Bordeaux` }
    ];
    
    res.json(addresses);
  }, 300); // Simuler un délai de réponse
});

// Routes de pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/product/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/product.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/cart.html'));
});

app.get('/wishlist', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/wishlist.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});