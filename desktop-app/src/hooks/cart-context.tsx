import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './use-auth';
import { apiService } from '@/lib/api';
import type { 
  Cart, 
  CartProduct, 
  CartContextType, 
  Product,
  CartResponse 
} from '@/types';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartProducts, setCartProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load product details for cart items
  const loadCartProducts = useCallback(async (cartItems: Cart['items']) => {
    if (!cartItems || cartItems.length === 0) {
      setCartProducts([]);
      return;
    }

    try {
      const productPromises = cartItems.map(async (item) => {
        const response = await apiService.getProductById(item.productId);
        return {
          ...response.product,
          quantity: item.quantity
        } as CartProduct;
      });

      const products = await Promise.all(productPromises);
      setCartProducts(products);
    } catch (err) {
      console.error('Failed to load cart products:', err);
      setError('Failed to load cart products');
    }
  }, []);

  // Refresh cart data from API
  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      setCartProducts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response: CartResponse = await apiService.getCartItems(user.uid);
      const cartData = response.cart || { userId: user.uid, items: [] };
      
      setCart(cartData);
      await loadCartProducts(cartData.items);
    } catch (err) {
      console.error('Failed to refresh cart:', err);
      setError('Failed to load cart');
      setCart({ userId: user.uid, items: [] });
      setCartProducts([]);
    } finally {
      setLoading(false);
    }
  }, [user, loadCartProducts]);

  // Add item to cart
  const addToCart = useCallback(async (productId: string, quantity = 1) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      await apiService.addToCart(user.uid, productId, quantity);
      await refreshCart(); // Reload cart data
    } catch (err) {
      console.error('Failed to add to cart:', err);
      setError('Failed to add item to cart');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, refreshCart]);

  // Remove item from cart
  const removeFromCart = useCallback(async (productId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      await apiService.removeFromCart(user.uid, productId);
      await refreshCart(); // Reload cart data
    } catch (err) {
      console.error('Failed to remove from cart:', err);
      setError('Failed to remove item from cart');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, refreshCart]);

  // Update item quantity in cart
  const updateQuantity = useCallback(async (productId: string, newQuantity: number) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (newQuantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Remove existing item and add with new quantity
      await apiService.removeFromCart(user.uid, productId);
      await apiService.addToCart(user.uid, productId, newQuantity);
      await refreshCart(); // Reload cart data
    } catch (err) {
      console.error('Failed to update quantity:', err);
      setError('Failed to update item quantity');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, removeFromCart, refreshCart]);

  // Clear all items from cart
  const clearCart = useCallback(async () => {
    if (!user || !cartProducts.length) return;

    setLoading(true);
    setError(null);

    try {
      // Remove all items
      const removePromises = cartProducts.map(product => 
        apiService.removeFromCart(user.uid, product._id)
      );
      await Promise.all(removePromises);
      await refreshCart(); // Reload cart data
    } catch (err) {
      console.error('Failed to clear cart:', err);
      setError('Failed to clear cart');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, cartProducts, refreshCart]);

  // Get total number of items in cart
  const getTotalItems = useCallback(() => {
    return cartProducts.reduce((total, product) => total + product.quantity, 0);
  }, [cartProducts]);

  // Get total amount of cart
  const getTotalAmount = useCallback(() => {
    return cartProducts.reduce((total, product) => {
      return total + (product.price * product.quantity);
    }, 0);
  }, [cartProducts]);

  // Load cart when user changes
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const contextValue: CartContextType = {
    cart,
    cartProducts,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart,
    getTotalItems,
    getTotalAmount,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
