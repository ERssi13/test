/**
 * Liste de souhaits - Module pour gérer la liste de souhaits
 */
document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM
    const wishlistContainer = document.getElementById('wishlist-container');
    const wishlistEmpty = document.getElementById('wishlist-empty');
    const wishlistItems = document.getElementById('wishlist-items');
    const wishlistSort = document.getElementById('wishlist-sort');
    const cartCount = document.getElementById('cart-count');
    
    // Variables d'état
    let wishlistIds = JSON.parse(localStorage.getItem('wishlist')) || [];
    let wishlistProducts = [];
    let wishlistPriorities = JSON.parse(localStorage.getItem('wishlistPriorities')) || {};
    
    /**
     * Initialise la page liste de souhaits
     */
    async function initWishlistPage() {
        try {
            // Si la liste de souhaits est vide
            if (wishlistIds.length === 0) {
                wishlistEmpty.style.display = 'block';
                wishlistItems.style.display = 'none';
                return;
            }
            
            // Récupérer les détails des produits
            const allProducts = await API.getProducts();
            
            // Filtrer pour obtenir seulement les produits de la liste de souhaits
            wishlistProducts = allProducts.filter(product => wishlistIds.includes(product.id));
            
            // Initialiser les priorités si nécessaire
            wishlistIds.forEach(id => {
                if (wishlistPriorities[id] === undefined) {
                    wishlistPriorities[id] = 3; // Priorité par défaut: 3 sur 5
                }
            });
            
            // Sauvegarder les priorités
            savePriorities();
            
            // Afficher la liste
            renderWishlist();
            
            // Mettre à jour le compteur du panier
            updateCartCount();
            
            // Ajouter les écouteurs d'événements
            addWishlistEventListeners();
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de la liste de souhaits:', error);
            wishlistContainer.innerHTML = `
                <div class="error">
                    <p>Une erreur est survenue lors du chargement de la liste de souhaits.</p>
                    <a href="/" class="btn">Retour à l'accueil</a>
                </div>
            `;
        }
    }
    
    /**
     * Ajoute les écouteurs d'événements
     */
    function addWishlistEventListeners() {
        // Tri de la liste
        wishlistSort.addEventListener('change', sortWishlist);
    }
    
    /**
     * Affiche la liste de souhaits
     */
    function renderWishlist() {
        if (wishlistProducts.length === 0) {
            wishlistEmpty.style.display = 'block';
            wishlistItems.style.display = 'none';
            return;
        }
        
        wishlistEmpty.style.display = 'none';
        wishlistItems.style.display = 'grid';
        
        let html = '';
        
        wishlistProducts.forEach(product => {
            const discountedPrice = product.price * (1 - product.reduction / 100);
            const priority = wishlistPriorities[product.id] || 3;
            
            // Créer les étoiles de priorité
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                starsHtml += `
                    <span class="priority-star ${i <= priority ? '' : 'inactive'}" 
                          data-product-id="${product.id}" data-priority="${i}">
                        <i class="fas fa-star"></i>
                    </span>
                `;
            }
            
            html += `
                <div class="wishlist-item">
                    <div class="wishlist-item-image">
                        <img src="${product.images[0]}" alt="${product.name}">
                        ${product.reduction > 0 ? `<div class="product-badge">-${product.reduction}%</div>` : ''}
                    </div>
                    <div class="wishlist-item-info">
                        <h3 class="wishlist-item-name">${product.name}</h3>
                        <div class="wishlist-item-price">
                            <span class="wishlist-item-current-price">${discountedPrice.toFixed(2)} ${product.currency}</span>
                            ${product.reduction > 0 ? 
                                `<span class="wishlist-item-original-price">${product.price.toFixed(2)} ${product.currency}</span>` : ''}
                        </div>
                        <div class="wishlist-item-priority">
                            <p>Priorité:</p>
                            <div class="priority-stars">
                                ${starsHtml}
                            </div>
                        </div>
                        <div class="wishlist-item-actions">
                            <a href="/product/${product.id}" class="btn">Voir le produit</a>
                            <button class="btn wishlist-remove-btn" data-product-id="${product.id}">Supprimer</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        wishlistItems.innerHTML = html;
        
        // Ajouter les écouteurs d'événements pour les actions
        document.querySelectorAll('.priority-star').forEach(star => {
            star.addEventListener('click', updatePriority);
        });
        
        document.querySelectorAll('.wishlist-remove-btn').forEach(btn => {
            btn.addEventListener('click', removeFromWishlist);
        });
    }
    
    /**
     * Trie la liste de souhaits selon l'option choisie
     */
    function sortWishlist() {
        const sortOption = wishlistSort.value;
        
        switch (sortOption) {
            case 'priority-desc':
                wishlistProducts.sort((a, b) => 
                    (wishlistPriorities[b.id] || 0) - (wishlistPriorities[a.id] || 0)
                );
                break;
            case 'priority-asc':
                wishlistProducts.sort((a, b) => 
                    (wishlistPriorities[a.id] || 0) - (wishlistPriorities[b.id] || 0)
                );
                break;
            case 'price-asc':
                wishlistProducts.sort((a, b) => 
                    a.price * (1 - a.reduction / 100) - b.price * (1 - b.reduction / 100)
                );
                break;
            case 'price-desc':
                wishlistProducts.sort((a, b) => 
                    b.price * (1 - b.reduction / 100) - a.price * (1 - a.reduction / 100)
                );
                break;
            default:
                break;
        }
        
        renderWishlist();
    }
    
    /**
     * Met à jour la priorité d'un produit
     * @param {Event} event - Événement de clic
     */
    function updatePriority(event) {
        const productId = event.currentTarget.dataset.productId;
        const priority = parseInt(event.currentTarget.dataset.priority);
        
        wishlistPriorities[productId] = priority;
        savePriorities();
        renderWishlist();
    }
    
    /**
     * Supprime un produit de la liste de souhaits
     * @param {Event} event - Événement de clic
     */
    function removeFromWishlist(event) {
        const productId = event.currentTarget.dataset.productId;
        
        // Supprimer de la liste
        const index = wishlistIds.indexOf(productId);
        if (index !== -1) {
            wishlistIds.splice(index, 1);
        }
        
        // Supprimer des priorités
        delete wishlistPriorities[productId];
        
        // Supprimer du tableau de produits
        wishlistProducts = wishlistProducts.filter(product => product.id !== productId);
        
        // Sauvegarder les changements
        saveWishlist();
        savePriorities();
        
        // Mettre à jour l'affichage
        renderWishlist();
    }
    
    /**
     * Sauvegarde la liste de souhaits dans le localStorage
     */
    function saveWishlist() {
        localStorage.setItem('wishlist', JSON.stringify(wishlistIds));
    }
    
    /**
     * Sauvegarde les priorités dans le localStorage
     */
    function savePriorities() {
        localStorage.setItem('wishlistPriorities', JSON.stringify(wishlistPriorities));
    }
    
    /**
     * Met à jour le compteur du panier
     */
    function updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        cartCount.textContent = totalItems;
    }
    
    // Initialiser la page liste de souhaits au chargement
    initWishlistPage();
});