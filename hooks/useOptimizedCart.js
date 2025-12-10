'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { debouncedSaveCart } from '@/lib/cacheUtils';
import { calculateCartTotal, calculateCartWeight, calculateDeliveryCharge } from '@/lib/offerCalculations';

export function useOptimizedCart(shopData) {
  const [cart, setCart] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        setCart(cartData);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes (debounced)
  useEffect(() => {
    if (cart.length >= 0) {
      debouncedSaveCart(cart);
    }
  }, [cart]);

  const addToCart = useCallback((product, quantity = 1, offerType = 'regular') => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity, offerType }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity, offerType }];
      }
    });
    return true;
  }, []);

  const addAllToCart = useCallback((productsToAdd) => {
    try {
      setCart(prevCart => {
        let updatedCart = [...prevCart];
        let addedCount = 0;
        
        productsToAdd.forEach(product => {
          const existingItemIndex = updatedCart.findIndex(item => item.id === product.id);
          
          if (existingItemIndex !== -1) {
            updatedCart[existingItemIndex].quantity += 1;
          } else {
            updatedCart.push({ ...product, quantity: 1, offerType: 'regular' });
          }
          addedCount++;
        });
        
        return updatedCart;
      });
      return productsToAdd.length;
    } catch (error) {
      console.error('Error adding all to cart:', error);
      return 0;
    }
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, newQuantity, products = []) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
    } else {
      setCart(prevCart => prevCart.map(item => {
        if (item.id === productId) {
          // Auto-adjust offer type based on quantity
          const product = products.find(p => p.id === productId);
          const bulkRequiredQty = product?.specialOffer?.quantity || 0;
          
          let adjustedOfferType = item.offerType;
          
          // Auto-select bulk if quantity >= bulkRequiredQty
          if (bulkRequiredQty > 0 && newQuantity >= bulkRequiredQty) {
            adjustedOfferType = 'bulk';
          } 
          // Auto-select regular if quantity < bulkRequiredQty
          else if (bulkRequiredQty > 0 && newQuantity < bulkRequiredQty) {
            adjustedOfferType = 'regular';
          }
          
          return { ...item, quantity: newQuantity, offerType: adjustedOfferType };
        }
        return item;
      }));
    }
  }, [removeFromCart]);

  const updateCartOfferType = useCallback((productId, offerType, products = []) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === productId) {
        const product = products.find(p => p.id === productId);
        const bulkRequiredQty = product?.specialOffer?.quantity || 1;
        
        // Set quantity based on offer type
        const newQuantity = offerType === 'bulk' ? bulkRequiredQty : 1;
        
        return { ...item, quantity: newQuantity, offerType };
      }
      return item;
    }));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Calculate cart totals (memoized)
  const cartTotals = useMemo(() => calculateCartTotal(cart), [cart]);
  
  const cartWeight = useMemo(() => calculateCartWeight(cart), [cart]);
  
  const deliveryCharge = useMemo(
    () => calculateDeliveryCharge(cartWeight, shopData?.delivery?.slabs || []),
    [cartWeight, shopData?.delivery?.slabs]
  );
  
  const totalAmount = cartTotals.total + deliveryCharge;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart,
    addToCart,
    addAllToCart,
    removeFromCart,
    updateQuantity,
    updateCartOfferType,
    clearCart,
    cartTotals,
    cartWeight,
    deliveryCharge,
    totalAmount,
    cartItemCount,
  };
}
