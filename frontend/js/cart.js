/**
 * Panier - Module pour gérer le panier d'achat
 */
document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM
    const cartContainer = document.getElementById('cart-container');
    const cartEmptyElement = document.getElementById('cart-empty');
    const cartContentElement = document.getElementById('cart-content');
    const cartItemsElement = document.getElementById('cart-items');
    const subtotalElement = document.getElementById('subtotal');
    const discountElement = document.getElementById('discount');
    const totalElement = document.getElementById('total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const addressSearchInput = document.getElementById('address-search');
    const addressSuggestionsElement = document.getElementById('address-suggestions');
    const selectedAddressElement = document.getElementById('selected-address');
    const saveAddressCheckbox = document.getElementById('save-address');
    const cartCountElement = document.getElementById('cart-count');
    const orderConfirmationModal = document.getElementById('order-confirmation');
    
    // Variables d'état
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let products = {};
    let selectedAddress = localStorage.getItem('savedAddress') || null;
    
    /**
     * Initialise la page panier
     */
    async function initCartPage() {
        try {
            // Charger les données des produits
            const productsData = await API.getProducts();
            
            // Convertir le tableau en objet pour un accès plus rapide
            productsData.forEach(product => {
                products[product.id] = product;
            });
            
            // Afficher le panier
            renderCart();
            
            // Mettre à jour le compteur du panier
            updateCartCount();
            
            // Ajouter les écouteurs d'événements
            addCartEventListeners();
            
            // Vérifier si une adresse est sauvegardée
            if (selectedAddress) {
                selectedAddressElement.textContent = selectedAddress;
                selectedAddressElement.style.display = 'block';
                saveAddressCheckbox.checked = true;
            }
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du panier:', error);
            cartContainer.innerHTML = `
                <div class="error">
                    <p>Une erreur est survenue lors du chargement du panier.</p>
                    <a href="/" class="btn">Retour à l'accueil</a>
                </div>
            `;
        }
    }
    
    /**
     * Ajoute les écouteurs d'événements
     */
    function addCartEventListeners() {
        // Recherche d'adresse
        addressSearchInput.addEventListener('input', debounce(searchAddress, 300));
        
        // Sauvegarder l'adresse
        saveAddressCheckbox.addEventListener('change', toggleSaveAddress);
        
        // Bouton de paiement
        checkoutBtn.addEventListener('click', processCheckout);
        
        // Fermer la modal de confirmation
        document.querySelector('.close').addEventListener('click', () => {
            orderConfirmationModal.style.display = 'none';
        });
        
        document.getElementById('continue-shopping').addEventListener('click', () => {
            orderConfirmationModal.style.display = 'none';
            window.location.href = '/';
        });
    }
    
    /**
     * Affiche le panier
     */
    function renderCart() {
        if (cart.length === 0) {
            cartEmptyElement.style.display = 'block';
            cartContentElement.style.display = 'none';
            return;
        }
        
        cartEmptyElement.style.display = 'none';
        cartContentElement.style.display = 'grid';
        
        let cartItemsHtml = '';
        let subtotal = 0;
        let totalDiscount = 0;
        
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            const itemDiscount = (item.price * item.reduction / 100) * item.quantity;
            
            subtotal += itemTotal;
            totalDiscount += itemDiscount;
            
            cartItemsHtml += `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="cart-item-details">
                        <h3 class="cart-item-name">${item.name}</h3>
                        <div class="cart-item-price">
                            <span class="cart-item-current-price">
                                ${((item.price * (1 - item.reduction / 100))).toFixed(2)} ${item.currency}
                            </span>
                            ${item.reduction > 0 ? 
                                `<span class="cart-item-original-price">${item.price.toFixed(2)} ${item.currency}</span>` : ''}
                        </div>
                        <p class="cart-item-color">Couleur: ${item.color}</p>
                        <div class="cart-item-actions">
                            <div class="cart-item-quantity">
                                <button class="cart-item-quantity-btn decrease" data-index="${index}">-</button>
                                <input type="number" class="cart-item-quantity-input" value="${item.quantity}" min="1" data-index="${index}">
                                <button class="cart-item-quantity-btn increase" data-index="${index}">+</button>
                            </div>
                            <div class="cart-item-remove" data-index="${index}">
                                <i class="fas fa-trash-alt"></i> Supprimer
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        cartItemsElement.innerHTML = cartItemsHtml;
        
        // Mettre à jour le récapitulatif
        const total = subtotal - totalDiscount;
        subtotalElement.textContent = `${subtotal.toFixed(2)} €`;
        discountElement.textContent = `- ${totalDiscount.toFixed(2)} €`;
        totalElement.textContent = `${total.toFixed(2)} €`;
        
        // Ajouter les écouteurs pour les boutons de quantité et suppression
        document.querySelectorAll('.cart-item-quantity-btn.decrease').forEach(btn => {
            btn.addEventListener('click', decreaseQuantity);
        });
        
        document.querySelectorAll('.cart-item-quantity-btn.increase').forEach(btn => {
            btn.addEventListener('click', increaseQuantity);
        });
        
        document.querySelectorAll('.cart-item-quantity-input').forEach(input => {
            input.addEventListener('change', updateCartItemQuantity);
        });
        
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', removeCartItem);
        });
    }
    
    /**
     * Diminue la quantité d'un article du panier
     * @param {Event} event - Événement de clic
     */
    function decreaseQuantity(event) {
        const index = parseInt(event.currentTarget.dataset.index);
        
        if (cart[index].quantity > 1) {
            cart[index].quantity--;
            saveCart();
            renderCart();
            updateCartCount();
        }
    }
    
    /**
     * Augmente la quantité d'un article du panier
     * @param {Event} event - Événement de clic
     */
    function increaseQuantity(event) {
        const index = parseInt(event.currentTarget.dataset.index);
        const productId = cart[index].id;
        
        // Vérifier le stock disponible
        if (products[productId] && cart[index].quantity < products[productId].stock) {
            cart[index].quantity++;
            saveCart();
            renderCart();
            updateCartCount();
        } else {
            alert('Stock maximum atteint pour ce produit');
        }
    }
    
    /**
     * Met à jour la quantité d'un article du panier
     * @param {Event} event - Événement de changement
     */
    function updateCartItemQuantity(event) {
        const index = parseInt(event.currentTarget.dataset.index);
        let newQuantity = parseInt(event.currentTarget.value);
        const productId = cart[index].id;
        
        if (isNaN(newQuantity) || newQuantity < 1) {
            newQuantity = 1;
        } else if (products[productId] && newQuantity > products[productId].stock) {
            newQuantity = products[productId].stock;
            alert('Stock maximum atteint pour ce produit');
        }
        
        cart[index].quantity = newQuantity;
        saveCart();
        renderCart();
        updateCartCount();
    }
    
    /**
     * Supprime un article du panier
     * @param {Event} event - Événement de clic
     */
    function removeCartItem(event) {
        const index = parseInt(event.currentTarget.dataset.index);
        
        if (confirm('Êtes-vous sûr de vouloir supprimer cet article de votre panier ?')) {
            cart.splice(index, 1);
            saveCart();
            renderCart();
            updateCartCount();
        }
    }
    
    /**
     * Recherche une adresse via l'API
     */
    async function searchAddress() {
        const query = addressSearchInput.value.trim();
        
        if (query.length < 3) {
            addressSuggestionsElement.style.display = 'none';
            return;
        }
        
        try {
            const addresses = await API.searchAddresses(query);
            
            if (addresses.length === 0) {
                addressSuggestionsElement.style.display = 'none';
                return;
            }
            
            let suggestionsHtml = '';
            
            addresses.forEach(address => {
                suggestionsHtml += `
                    <div class="address-suggestion" data-address="${address.address}">
                        ${address.address}
                    </div>
                `;
            });
            
            addressSuggestionsElement.innerHTML = suggestionsHtml;
            addressSuggestionsElement.style.display = 'block';
            
            // Ajouter des écouteurs d'événements aux suggestions
            document.querySelectorAll('.address-suggestion').forEach(suggestion => {
                suggestion.addEventListener('click', selectAddress);
            });
        } catch (error) {
            console.error('Erreur lors de la recherche d\'adresses:', error);
        }
    }
    
    /**
     * Sélectionne une adresse depuis les suggestions
     * @param {Event} event - Événement de clic
     */
    function selectAddress(event) {
        const address = event.currentTarget.dataset.address;
        
        selectedAddress = address;
        selectedAddressElement.textContent = address;
        selectedAddressElement.style.display = 'block';
        addressSearchInput.value = '';
        addressSuggestionsElement.style.display = 'none';
        
        if (saveAddressCheckbox.checked) {
            localStorage.setItem('savedAddress', address);
        }
    }
    
    /**
     * Gère la sauvegarde de l'adresse
     */
    function toggleSaveAddress() {
        if (saveAddressCheckbox.checked && selectedAddress) {
            localStorage.setItem('savedAddress', selectedAddress);
        } else {
            localStorage.removeItem('savedAddress');
        }
    }
    
    /**
     * Traite la commande
     */
    async function processCheckout() {
        if (cart.length === 0) {
            alert('Votre panier est vide');
            return;
        }
        
        if (!selectedAddress) {
            alert('Veuillez sélectionner une adresse de livraison');
            return;
        }
        
        try {
            // Mettre à jour les stocks
            for (const item of cart) {
                await API.updateProductStock(item.id, item.quantity);
            }
            
            // Vider le panier
            cart = [];
            saveCart();
            updateCartCount();
            
            // Afficher la confirmation
            orderConfirmationModal.style.display = 'flex';
        } catch (error) {
            console.error('Erreur lors du paiement:', error);
            alert('Une erreur est survenue lors du traitement de votre commande');
        }
    }
    
    /**
     * Sauvegarde le panier dans le localStorage
     */
    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }
    
    /**
     * Met à jour le compteur du panier
     */
    function updateCartCount() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalItems;
    }
    
    /**
     * Fonction de debounce pour limiter les appels fréquents
     * @param {Function} func - Fonction à appeler
     * @param {number} delay - Délai en millisecondes
     * @returns {Function} - Fonction avec debounce
     */
    function debounce(func, delay) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }
    
    // Initialiser la page panier au chargement
    initCartPage();
});