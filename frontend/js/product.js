/**
 * Produit - Module pour gérer l'affichage et les interactions de la page produit
 */
document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM
    const productContainer = document.getElementById('product-container');
    const similarProductsContainer = document.getElementById('similar-products-container');
    const productNameBreadcrumb = document.getElementById('product-name-breadcrumb');
    const cartCount = document.getElementById('cart-count');
    
    // Variables d'état
    let currentProduct = null;
    let similarProducts = [];
    let currentImageIndex = 0;
    let selectedColor = null;
    let quantity = 1;
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    
    /**
     * Initialise la page produit
     */
    async function initProductPage() {
        try {
            // Récupérer l'ID du produit depuis l'URL
            const productId = window.location.pathname.split('/').pop();
            
            // Récupérer les détails du produit
            currentProduct = await API.getProductById(productId);
            
            if (!currentProduct) {
                productContainer.innerHTML = `
                    <div class="error">
                        <p>Produit non trouvé.</p>
                        <a href="/" class="btn">Retour à l'accueil</a>
                    </div>
                `;
                return;
            }
            
            // Mettre à jour le breadcrumb
            productNameBreadcrumb.textContent = currentProduct.name;
            
            // Initialiser la couleur sélectionnée
            selectedColor = currentProduct.characteristics.colors[0];
            
            // Afficher le produit
            renderProduct();
            
            // Charger et afficher les produits similaires
            loadSimilarProducts();
            
            // Mettre à jour le compteur du panier
            updateCartCount();
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de la page produit:', error);
            productContainer.innerHTML = `
                <div class="error">
                    <p>Une erreur est survenue lors du chargement du produit.</p>
                    <a href="/" class="btn">Retour à l'accueil</a>
                </div>
            `;
        }
    }
    
    /**
     * Affiche les détails du produit
     */
    function renderProduct() {
        const discountedPrice = currentProduct.price * (1 - currentProduct.reduction / 100);
        const isInWishlist = wishlist.includes(currentProduct.id);
        
        // Déterminer l'état du stock
        let stockStatus = '';
        let stockClass = '';
        
        if (currentProduct.stock > 10) {
            stockStatus = 'En stock';
            stockClass = 'in-stock';
        } else if (currentProduct.stock > 0) {
            stockStatus = `Plus que ${currentProduct.stock} en stock`;
            stockClass = 'low-stock';
        } else {
            stockStatus = 'Rupture de stock';
            stockClass = 'out-of-stock';
        }
        
        // Créer les miniatures du carrousel
        let thumbnailsHtml = '';
        currentProduct.images.forEach((image, index) => {
            thumbnailsHtml += `
                <div class="thumbnail ${index === currentImageIndex ? 'active' : ''}" data-index="${index}">
                    <img src="${image}" alt="${currentProduct.name}">
                </div>
            `;
        });
        
        // Créer les options de couleur
        let colorOptionsHtml = '';
        currentProduct.characteristics.colors.forEach(color => {
            colorOptionsHtml += `
                <div class="color-option ${color === selectedColor ? 'active' : ''}" 
                     data-color="${color}" 
                     style="background-color: ${getColorCode(color)}">
                </div>
            `;
        });
        
        // Créer la liste des caractéristiques
        let characteristicsHtml = '';
        for (const [key, value] of Object.entries(currentProduct.characteristics)) {
            // Exclure les couleurs qui sont affichées séparément
            if (key !== 'colors') {
                let displayValue = Array.isArray(value) ? value.join(', ') : value;
                characteristicsHtml += `
                    <div class="characteristic">
                        <span class="characteristic-name">${capitalizeFirstLetter(key)}:</span>
                        <span class="characteristic-value">${displayValue}</span>
                    </div>
                `;
            }
        }
        
        // Tronquer la description
        const shortDescription = currentProduct.description.length > 150 
            ? currentProduct.description.substring(0, 150) + '...' 
            : currentProduct.description;
        
        const html = `
            <div class="product-gallery">
                <div class="main-image-container">
                    <img src="${currentProduct.images[currentImageIndex]}" alt="${currentProduct.name}" id="main-product-image">
                </div>
                
                <div class="image-thumbnails" id="image-thumbnails">
                    ${thumbnailsHtml}
                </div>
                
                <div class="gallery-controls">
                    <div class="gallery-control prev" id="gallery-prev">
                        <i class="fas fa-chevron-left"></i>
                    </div>
                    <div class="gallery-control next" id="gallery-next">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            </div>
            
            <div class="product-info">
                <h1 class="product-title">${currentProduct.name}</h1>
                
                <div class="product-price-detail">
                    <span class="price-current">${discountedPrice.toFixed(2)} ${currentProduct.currency}</span>
                    ${currentProduct.reduction > 0 ? 
                        `<span class="price-original">${currentProduct.price.toFixed(2)} ${currentProduct.currency}</span>` : ''}
                </div>
                
                <div class="product-description" id="product-description">
                    <p>${shortDescription}</p>
                    ${currentProduct.description.length > 150 ? 
                        `<span class="show-more" id="show-more">Afficher plus</span>` : ''}
                </div>
                
                <div class="product-meta">
                    <p class="product-stock ${stockClass}">${stockStatus}</p>
                    <p class="product-reference">Réf: ${currentProduct.id}</p>
                </div>
                
                <div class="product-characteristics">
                    <h3 class="characteristics-title">Caractéristiques:</h3>
                    ${characteristicsHtml}
                </div>
                
                <div class="color-selection">
                    <h3 class="characteristics-title">Couleur:</h3>
                    <div class="color-options" id="color-options">
                        ${colorOptionsHtml}
                    </div>
                </div>
                
                <div class="product-actions-detail">
                    <div class="quantity-control">
                        <button class="quantity-btn" id="decrease-quantity">-</button>
                        <input type="number" value="1" min="1" max="${currentProduct.stock}" class="quantity-input" id="quantity-input">
                        <button class="quantity-btn" id="increase-quantity">+</button>
                    </div>
                    
                    <button class="btn add-to-cart-btn" id="add-to-cart-btn" ${currentProduct.stock === 0 ? 'disabled' : ''}>
                        Ajouter au panier
                    </button>
                    
                    <button class="add-to-wishlist-btn ${isInWishlist ? 'active' : ''}" id="add-to-wishlist-btn">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
        
        productContainer.innerHTML = html;
        
        // Ajouter les écouteurs d'événements
        addProductEventListeners();
    }
    
    /**
     * Ajoute les écouteurs d'événements pour les interactions produit
     */
    function addProductEventListeners() {
        // Carrousel d'images
        document.querySelectorAll('.thumbnail').forEach(thumbnail => {
            thumbnail.addEventListener('click', changeThumbnail);
        });
        
        document.getElementById('gallery-prev').addEventListener('click', prevImage);
        document.getElementById('gallery-next').addEventListener('click', nextImage);
        
        // Description
        const showMoreBtn = document.getElementById('show-more');
        if (showMoreBtn) {
            showMoreBtn.addEventListener('click', toggleDescription);
        }
        
        // Sélection de couleur
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', changeColor);
        });
        
        // Contrôle de quantité
        document.getElementById('decrease-quantity').addEventListener('click', decreaseQuantity);
        document.getElementById('increase-quantity').addEventListener('click', increaseQuantity);
        document.getElementById('quantity-input').addEventListener('change', updateQuantity);
        
        // Ajout au panier
        document.getElementById('add-to-cart-btn').addEventListener('click', addToCart);
        
        // Ajout à la liste de souhaits
        document.getElementById('add-to-wishlist-btn').addEventListener('click', toggleWishlist);
    }
    
    /**
     * Change l'image principale au clic sur une miniature
     * @param {Event} event - Événement de clic
     */
    function changeThumbnail(event) {
        const thumbnail = event.currentTarget;
        const index = parseInt(thumbnail.dataset.index);
        
        currentImageIndex = index;
        updateMainImage();
        
        // Mettre à jour la classe active
        document.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.classList.remove('active');
        });
        thumbnail.classList.add('active');
    }
    
    /**
     * Affiche l'image précédente
     */
    function prevImage() {
        currentImageIndex = (currentImageIndex - 1 + currentProduct.images.length) % currentProduct.images.length;
        updateMainImage();
        updateThumbnailsActive();
    }
    
    /**
     * Affiche l'image suivante
     */
    function nextImage() {
        currentImageIndex = (currentImageIndex + 1) % currentProduct.images.length;
        updateMainImage();
        updateThumbnailsActive();
    }
    
    /**
     * Met à jour l'image principale
     */
    function updateMainImage() {
        const mainImage = document.getElementById('main-product-image');
        mainImage.src = currentProduct.images[currentImageIndex];
    }
    
    /**
     * Met à jour la miniature active
     */
    function updateThumbnailsActive() {
        document.querySelectorAll('.thumbnail').forEach(thumb => {
            const index = parseInt(thumb.dataset.index);
            if (index === currentImageIndex) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
    }
    
    /**
     * Affiche ou masque la description complète
     */
    function toggleDescription() {
        const descriptionContainer = document.getElementById('product-description');
        const showMoreBtn = document.getElementById('show-more');
        
        if (showMoreBtn.textContent === 'Afficher plus') {
            descriptionContainer.innerHTML = `
                <p>${currentProduct.description}</p>
                <span class="show-more" id="show-more">Afficher moins</span>
            `;
            document.getElementById('show-more').addEventListener('click', toggleDescription);
        } else {
            const shortDescription = currentProduct.description.substring(0, 150) + '...';
            descriptionContainer.innerHTML = `
                <p>${shortDescription}</p>
                <span class="show-more" id="show-more">Afficher plus</span>
            `;
            document.getElementById('show-more').addEventListener('click', toggleDescription);
        }
    }
    
    /**
     * Change la couleur sélectionnée
     * @param {Event} event - Événement de clic
     */
    function changeColor(event) {
        const colorOption = event.currentTarget;
        selectedColor = colorOption.dataset.color;
        
        // Mettre à jour la classe active
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('active');
        });
        colorOption.classList.add('active');
    }
    
    /**
     * Diminue la quantité
     */
    function decreaseQuantity() {
        if (quantity > 1) {
            quantity--;
            document.getElementById('quantity-input').value = quantity;
        }
    }
    
    /**
     * Augmente la quantité
     */
    function increaseQuantity() {
        if (quantity < currentProduct.stock) {
            quantity++;
            document.getElementById('quantity-input').value = quantity;
        }
    }
    
    /**
     * Met à jour la quantité à partir de l'input
     */
    function updateQuantity() {
        const input = document.getElementById('quantity-input');
        let newQuantity = parseInt(input.value);
        
        if (isNaN(newQuantity) || newQuantity < 1) {
            newQuantity = 1;
        } else if (newQuantity > currentProduct.stock) {
            newQuantity = currentProduct.stock;
        }
        
        quantity = newQuantity;
        input.value = quantity;
    }
    
    /**
     * Ajoute le produit au panier
     */
    function addToCart() {
        if (currentProduct.stock === 0 || quantity > currentProduct.stock) {
            alert('Stock insuffisant');
            return;
        }
        
        // Récupérer le panier actuel
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Vérifier si le produit existe déjà dans le panier
        const existingItemIndex = cart.findIndex(item => 
            item.id === currentProduct.id && item.color === selectedColor
        );
        
        if (existingItemIndex !== -1) {
            // Mettre à jour la quantité
            cart[existingItemIndex].quantity += quantity;
        } else {
            // Ajouter un nouvel élément
            cart.push({
                id: currentProduct.id,
                name: currentProduct.name,
                price: currentProduct.price,
                reduction: currentProduct.reduction,
                currency: currentProduct.currency,
                image: currentProduct.images[0],
                color: selectedColor,
                quantity: quantity
            });
        }
        
        // Sauvegarder le panier
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Mettre à jour le compteur du panier
        updateCartCount();
        
        // Feedback utilisateur
        alert('Produit ajouté au panier !');
    }
    
    /**
     * Ajoute ou supprime le produit de la liste de souhaits
     */
    function toggleWishlist() {
        const wishlistBtn = document.getElementById('add-to-wishlist-btn');
        
        // Vérifier si le produit est déjà dans la liste
        const index = wishlist.indexOf(currentProduct.id);
        
        if (index === -1) {
            // Ajouter à la liste
            wishlist.push(currentProduct.id);
            wishlistBtn.classList.add('active');
        } else {
            // Supprimer de la liste
            wishlist.splice(index, 1);
            wishlistBtn.classList.remove('active');
        }
        
        // Sauvegarder dans le localStorage
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
    
    /**
     * Charge et affiche les produits similaires
     */
    async function loadSimilarProducts() {
        try {
            // Récupérer tous les produits
            const allProducts = await API.getProducts();
            
            // Filtrer pour trouver des produits similaires
            // (même personnage ou même rareté, mais pas le produit actuel)
            similarProducts = allProducts.filter(product => 
                product.id !== currentProduct.id && (
                    product.characteristics.character === currentProduct.characteristics.character ||
                    product.characteristics.rarity === currentProduct.characteristics.rarity
                )
            ).slice(0, 4); // Limiter à 4 produits similaires
            
            renderSimilarProducts();
        } catch (error) {
            console.error('Erreur lors du chargement des produits similaires:', error);
        }
    }
    
    /**
     * Affiche les produits similaires
     */
    function renderSimilarProducts() {
        if (similarProducts.length === 0) {
            similarProductsContainer.parentElement.style.display = 'none';
            return;
        }
        
        let html = '';
        
        similarProducts.forEach(product => {
            const discountedPrice = product.price * (1 - product.reduction / 100);
            
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
                            <a href="/product/${product.id}" class="btn">Voir</a>
                        </div>
                    </div>
                </div>
            `;
        });
        
        similarProductsContainer.innerHTML = html;
    }
    
    /**
     * Met à jour le compteur du panier
     */
    function updateCartCount() {
        const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        
        cartCount.textContent = totalItems;
    }
    
    /**
     * Renvoie un code couleur CSS pour une couleur nommée
     * @param {string} color - Nom de la couleur
     * @returns {string} - Code couleur CSS
     */
    function getColorCode(color) {
        const colorMap = {
            'Rouge': '#e74c3c',
            'Bleu': '#3498db',
            'Vert': '#2ecc71',
            'Jaune': '#f1c40f',
            'Violet': '#9b59b6',
            'Rose': '#e84393',
            'Orange': '#e67e22',
            'Marron': '#795548',
            'Noir': '#2c3e50',
            'Blanc': '#ecf0f1',
            'Gris': '#95a5a6'
        };
        
        return colorMap[color] || '#ccc';
    }
    
    /**
     * Met la première lettre en majuscule
     * @param {string} string - Chaîne de caractères
     * @returns {string} - Chaîne avec la première lettre en majuscule
     */
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Initialiser la page au chargement
    initProductPage();
});