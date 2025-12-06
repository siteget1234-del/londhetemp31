/**
 * Special Offer Pricing Calculation Utility
 * Handles batch-based pricing logic for special offers
 */

/**
 * Calculate pricing with special offer logic
 * @param {Object} product - Product object with price and specialOffer
 * @param {number} quantity - Number of items
 * @param {string} offerType - 'regular' or 'bulk'
 * @returns {Object} - Pricing breakdown
 */
export function calculateOfferPricing(product, quantity, offerType = 'regular') {
  const regularPrice = parseFloat(product.price) || 0;
  const batchSize = product.specialOffer?.quantity || 0;
  const offerPricePerUnit = parseFloat(product.specialOffer?.offerPricePerUnit) || 0;

  // If no special offer exists or offerType is regular
  if (!product.specialOffer || !batchSize || !offerPricePerUnit || offerType === 'regular') {
    return {
      subtotal: regularPrice * quantity,
      discount: 0,
      total: regularPrice * quantity,
      itemsAtOfferPrice: 0,
      itemsAtRegularPrice: quantity,
      effectivePricePerUnit: regularPrice,
      breakdown: []
    };
  }

  // Calculate batch-based pricing
  const fullBatches = Math.floor(quantity / batchSize);
  const remainingItems = quantity % batchSize;
  
  const itemsAtOfferPrice = fullBatches * batchSize;
  const itemsAtRegularPrice = remainingItems;
  
  const offerTotal = itemsAtOfferPrice * offerPricePerUnit;
  const regularTotal = itemsAtRegularPrice * regularPrice;
  const total = offerTotal + regularTotal;
  
  const subtotal = quantity * regularPrice;
  const discount = subtotal - total;

  return {
    subtotal,
    discount,
    total,
    itemsAtOfferPrice,
    itemsAtRegularPrice,
    effectivePricePerUnit: total / quantity,
    breakdown: [
      ...(itemsAtOfferPrice > 0 ? [{
        type: 'offer',
        quantity: itemsAtOfferPrice,
        pricePerUnit: offerPricePerUnit,
        total: offerTotal
      }] : []),
      ...(itemsAtRegularPrice > 0 ? [{
        type: 'regular',
        quantity: itemsAtRegularPrice,
        pricePerUnit: regularPrice,
        total: regularTotal
      }] : [])
    ]
  };
}

/**
 * Calculate total cart pricing with offers
 * @param {Array} cartItems - Array of cart items with product, quantity, and offerType
 * @returns {Object} - Total pricing breakdown
 */
export function calculateCartTotal(cartItems) {
  let totalSubtotal = 0;
  let totalDiscount = 0;
  let totalAmount = 0;

  const itemBreakdowns = cartItems.map(item => {
    const pricing = calculateOfferPricing(item, item.quantity, item.offerType);
    totalSubtotal += pricing.subtotal;
    totalDiscount += pricing.discount;
    totalAmount += pricing.total;
    
    return {
      ...item,
      pricing
    };
  });

  return {
    subtotal: totalSubtotal,
    discount: totalDiscount,
    total: totalAmount,
    items: itemBreakdowns
  };
}

/**
 * Format discount text for display
 * @param {number} discount - Discount amount
 * @returns {string} - Formatted discount text
 */
export function formatDiscount(discount) {
  return discount > 0 ? `₹${Math.round(discount)} सूट` : '';
}

/**
 * Calculate total weight of cart items
 * @param {Array} cartItems - Array of cart items with product and quantity
 * @returns {number} - Total weight in grams
 */
export function calculateCartWeight(cartItems) {
  return cartItems.reduce((totalWeight, item) => {
    const productWeight = parseFloat(item.weight) || 0; // weight in grams
    return totalWeight + (productWeight * item.quantity);
  }, 0);
}

/**
 * Calculate delivery charges based on weight slabs
 * @param {number} weightInGrams - Total cart weight in grams
 * @param {Array} deliverySlabs - Array of delivery slabs {weight: '1kg', price: 50}
 * @returns {number} - Delivery charge amount
 */
export function calculateDeliveryCharge(weightInGrams, deliverySlabs) {
  if (!deliverySlabs || deliverySlabs.length === 0) {
    return 0; // No delivery slabs configured
  }
  
  // Convert weight from grams to kg
  const weightInKg = weightInGrams / 1000;
  
  // Sort slabs by weight ascending to find the appropriate slab
  const sortedSlabs = [...deliverySlabs].sort((a, b) => {
    const weightA = parseFloat(a.weight.replace('kg', ''));
    const weightB = parseFloat(b.weight.replace('kg', ''));
    return weightA - weightB;
  });
  
  // Find the first slab that can accommodate the weight
  let deliveryCharge = 0;
  for (const slab of sortedSlabs) {
    const slabWeight = parseFloat(slab.weight.replace('kg', ''));
    if (weightInKg <= slabWeight) {
      deliveryCharge = parseFloat(slab.price);
      break;
    }
  }
  
  // If weight exceeds all slabs, use the highest slab price
  if (deliveryCharge === 0 && sortedSlabs.length > 0) {
    deliveryCharge = parseFloat(sortedSlabs[sortedSlabs.length - 1].price);
  }
  
  return deliveryCharge;
}
