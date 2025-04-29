/**
 * API - Module pour gérer les appels API
 */
const API = {
    // Base URL pour les appels API
    baseURL: '/api',
    
    /**
     * Récupère tous les produits
     * @returns {Promise<Array>} Liste des produits
     */
    getProducts: async function() {
        try {
            const response = await fetch(`${this.baseURL}/products`);
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des produits');
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur API getProducts:', error);
            return [];
        }
    },
    
    /**
     * Récupère un produit par son ID
     * @param {string} id - ID du produit
     * @returns {Promise<Object|null>} - Détails du produit ou null si non trouvé
     */
    getProductById: async function(id) {
        try {
            const response = await fetch(`${this.baseURL}/products/${id}`);
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération du produit');
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur API getProductById:', error);
            return null;
        }
    },
    
    /**
     * Met à jour le stock d'un produit après achat
     * @param {string} id - ID du produit
     * @param {number} quantity - Quantité achetée
     * @returns {Promise<{success: boolean, newStock: number}>} Résultat de l'opération
     */
    updateProductStock: async function(id, quantity) {
        try {
            const response = await fetch(`${this.baseURL}/products/${id}/stock`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ quantity })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la mise à jour du stock');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erreur API updateProductStock:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Recherche des adresses basées sur une requête
     * @param {string} query - Texte de recherche
     * @returns {Promise<Array>} - Liste des adresses correspondantes
     */
    searchAddresses: async function(query) {
        try {
            if (!query || query.length < 3) {
                return [];
            }
            
            const response = await fetch(`${this.baseURL}/address/${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('Erreur lors de la recherche d\'adresses');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erreur API searchAddresses:', error);
            return [];
        }
    }
};