/**
 * Catalogue - Module pour gérer l'affichage et le filtrage des produits
 */
document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM
    const productsContainer = document.getElementById('products-container');
    const searchInput = document.getElementById('search');
    const characterFilter = document.getElementById('character-filter');
    const rarityFilter = document.getElementById('rarity-filter');
    const colorFilter = document.getElementById('color-filter');
    const sortSelect = document.getElementById('sort');
    
    // État de l'application
    let products = [];
    let filteredProducts = [];
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    
    /**
     * Initialise la page catalogue
     */
    async function initCatalog() {
        try {
            products = await API.getProducts();
            filteredProducts = [...products];
            
            // Mise à jour du compteur de panier
            updateCartCount();
            
            // Initialiser les filtres
            initFilters();
            
            // Afficher les produits
            renderProducts();
            
            // Ajouter les écouteurs d'événements
            addEventListeners();
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du catalogue:', error);
            productsContainer.innerHTML = `
                <div class="error">
                    Une erreur est survenue lors du chargement des produits.
                    Veuillez réessayer ultérieurement.
                </div>
            `;
        }
    }
    
    /**
     * Initialise les options des filtres
     */
    function initFilters() {
        // Récupérer toutes les valeurs uniques pour chaque filtre
        const characters = [...new Set(products.map(p => p.characteristics.character))].sort();
        const rarities = [...new Set(products.map(p => p.characteristics.rarity))].sort();
        const colors = [...new Set(products.flatMap(p => p.characteristics.colors))].sort();
        
        // Remplir les dropdowns de filtres
        characters.forEach(character => {
            const option = document.createElement('option');
            option.value = character;
            option.textContent = character;
            characterFilter.appendChild(option);
        });
        
        rarities.forEach(rarity => {
            const option = document.createElement('option');
            option.value = rarity;
            option.textContent = rarity;
            rarityFilter.appendChild(option);
        });
        
        colors.forEach(color => {
            const option = document.createElement('option');
            option.value = color;
            option.textContent = color;
            colorFilter.appendChild(option);
        });
    }
    
    /**
     * Ajoute les écouteurs d'événements
     */
    function addEventListeners() {
        // Écouter les changements dans la recherche et les filtres
        searchInput.addEventListener('input', applyFilters);
        characterFilter.addEventListener('change', applyFilters);
        rarityFilter.addEventListener('change', applyFilters);
        colorFilter.addEventListener('change', applyFilters);
        sortSelect.addEventListener('change', applyFilters);
    }
    
    /**
     * Applique tous les filtres et tris
     */
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedCharacter = characterFilter.value;
        const selectedRarity = rarityFilter.value;
        const selectedColor = colorFilter.value;
        const sortOption = sortSelect.value;
        
        // Filtrer les produits
        filteredProducts = products.filter(product => {
            // Filtre par texte de recherche
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                                  product.description.toLowerCase().includes(searchTerm);
            
            // Filtre par personnage
            const matchesCharacter = !selectedCharacter || product.characteristics.character === selectedCharacter;
            
            // Filtre par rareté
            const matchesRarity = !selectedRarity || product.characteristics.rarity === selectedRarity;
            
            // Filtre par couleur
            const matchesColor = !selectedColor || product.characteristics.colors.includes(selectedColor);
            
            return matchesSearch && matchesCharacter && matchesRarity && matchesColor;
        });
        
        // Trier les produits
        sortProducts(sortOption);
        
        // Afficher les produits filtrés
        renderProducts();
    }
    
    /**
     * Trie les produits selon l'option choisie
     * @param {string} sortOption - Option de tri
     */
    function sortProducts(sortOption) {
        switch (sortOption) {
            case 'price-asc':
                filteredProducts.sort((a, b) => getDiscountedPrice(a) - getDiscountedPrice(b));
                break;
            case 'price-desc':
                filteredProducts.sort((a, b) => getDiscountedPrice(b) - getDiscountedPrice(a));
                break;
            default:
                // Par défaut, on ne change pas l'ordre
                break;
        }
    }
    
    /**
     * Calcule le prix après réduction
     * @param {Object} product - Produit
     * @returns {number} - Prix après réduction
     */
    function getDiscountedPrice(product) {
        return product.price * (1 - product.reduction / 100);
    }
    
    /**
     * Affiche les produits dans le conteneur
     */
    function renderProducts() {
        if (filteredProducts.length === 0) {
            productsContainer.innerHTML = `
                <div class="no-results">
                    <p>Aucun produit ne correspond à votre recherche.</p>
                    <button class="btn" onclick="location.reload()">Réinitialiser les filtres</button>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        filteredProducts.forEach(product => {
            const discountedPrice = getDiscountedPrice(product);
            const isInWishlist = wishlist.includes(product.id);
            
            html += `
                <div class="product-card">
                    <div class="product-image">
                        <img src="${product.images[0]}" alt="${product.name}" class="main-image">
                        <img src="${product.images[1]}" alt="${product.name}" class="hover-image">
                        ${product.reduction > 0 ? `<div class="product-badge">-${product.reduction}%</div>` : ''}
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <div class="product-price">
                            <span class="current-price">${discountedPrice.toFixed(2)} ${product.currency}</span>
                            ${product.reduction > 0 ? `<span class="original-price">${product.price.toFixed(2)} ${product.currency}</span>` : ''}
                        </div>
                        <div class="product-actions">
                            <button class="btn wishlist-btn ${isInWishlist ? 'active' : ''}" data-id="${product.id}">
                                <i class="fas fa-heart"></i>
                            </button>
                            <a href="/product/${product.id}" class="btn">Voir</a>
                        </div>
                    </div>
                </div>
            `;
        });
        
        productsContainer.innerHTML = html;
        
        // Ajouter les écouteurs pour les boutons de liste de souhaits
        document.querySelectorAll('.wishlist-btn').forEach(button => {
            button.addEventListener('click', toggleWishlist);
        });
    }
    
    /**
     * Ajoute ou supprime un produit de la liste de souhaits
     * @param {Event} event - Événement de clic
     */
    function toggleWishlist(event) {
        event.preventDefault();
        const button = event.currentTarget;
        const productId = button.dataset.id;
        
        // Vérifier si le produit est déjà dans la liste de souhaits
        const index = wishlist.indexOf(productId);
        
        if (index === -1) {
            // Ajouter à la liste de souhaits
            wishlist.push(productId);
            button.classList.add('active');
        } else {
            // Supprimer de la liste de souhaits
            wishlist.splice(index, 1);
            button.classList.remove('active');
        }
        
        // Sauvegarder dans le localStorage
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
    
    /**
     * Met à jour le compteur du panier
     */
    function updateCartCount() {
        const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
        const cartCount = document.getElementById('cart-count');
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        
        cartCount.textContent = totalItems;
    }
    
    // Initialiser le catalogue au chargement de la page
    initCatalog();
});