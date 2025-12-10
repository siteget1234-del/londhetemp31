'use client';

import { memo } from 'react';
import Image from 'next/image';
import { calculateOfferPricing, formatDiscount } from '@/lib/offerCalculations';

const ProductCard = memo(function ProductCard({ product, onClick }) {
  const discountPercent = product.mrp && product.price < product.mrp 
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : null;
  
  const hasSpecialOffer = product.specialOffer?.offerName && 
                         product.specialOffer?.quantity && 
                         product.specialOffer?.offerPricePerUnit;
  
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden transform hover:scale-[1.03] active:scale-[0.98] border border-gray-100"
      data-testid={`product-card-${product.id}`}
    >
      {/* Product Image */}
      <div className="relative w-full h-28">
        <Image 
          src={product.image || 'https://via.placeholder.com/400x300?text=Product+Image'} 
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover"
          loading="lazy"
          quality={75}
        />
      </div>
      
      {/* Product Info */}
      <div className="p-2 space-y-1.5">
        {/* Product Name */}
        <h3 className="text-sm font-normal text-gray-800 line-clamp-2 leading-tight min-h-[2.5rem]" data-testid="product-name">
          {product.name}
        </h3>
        
        {/* Price Section */}
        <div className="flex items-center space-x-1.5">
          <span className="text-base font-bold text-gray-900" data-testid="product-price">
            ₹{product.price}
          </span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-xs text-gray-500 line-through" data-testid="product-mrp">
              ₹{product.mrp}
            </span>
          )}
        </div>
        
        {/* Offer Badge */}
        {product.offer && (
          <div className="bg-red-50 border border-red-200 rounded-md px-1.5 py-0.5">
            <span className="text-[10px] font-bold text-red-600" data-testid="product-offer">
              {product.offer}
            </span>
          </div>
        )}
        
        {/* Special Offer Text or Discount */}
        {hasSpecialOffer ? (
          <div className="offer-pill-shimmer bg-gradient-to-r from-[#177B3B]/10 to-[#01582E]/10 border border-[#177B3B]/40 rounded-lg px-1.5 py-0.5 flex items-center space-x-1">
            <span className="text-xs">💰</span>
            <p className="text-[10px] font-bold text-[#177B3B]" data-testid="product-offer-price">
              ऑफर: ₹{product.specialOffer.offerPricePerUnit}/ प्रति नग
            </p>
          </div>
        ) : discountPercent ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-1.5 py-0.5 flex items-center justify-center space-x-1">
            <span className="text-xs">🔥</span>
            <p className="text-[10px] font-bold text-green-700" data-testid="product-discount">
              {discountPercent}% सवलत
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
});

export default ProductCard;
