'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ShoppingCart, Package, Share2, X } from 'lucide-react';
import { applyCloudinaryOptimization } from '@/lib/imageOptimization';

export default function BlogDetailView({ blog, cropName, back, shopData, addToCart, addAllToCart, openCart }) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Scroll to top when blog opens
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [blog.id]);

  // Close share menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showShareMenu && !event.target.closest('[data-testid="blog-share-icon"]') && !event.target.closest('.absolute')) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu]);

  // Get attached products
  const attachedProducts = blog.attachedProducts && blog.attachedProducts.length > 0
    ? shopData.products.filter(p => blog.attachedProducts.includes(p.id))
    : [];

  // Define layout aspect ratios
  const layoutAspects = {
    standard: 16/9,
    portrait: 4/5,
    square: 1,
    wide: 21/9
  };
  const aspect = layoutAspects[blog.layout || 'standard'];

  // Generate shareable blog URL
  const blogUrl = typeof window !== 'undefined' ? `${window.location.origin}?crop=${encodeURIComponent(cropName)}&blog=${blog.id}` : '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#177B3B] to-[#01582E] text-white py-4 px-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <button 
            onClick={back}
            className="flex items-center space-x-2 hover:bg-white/10 px-3 py-2 rounded-xl transition bg-white/5 backdrop-blur-sm"
            data-testid="back-from-blog-btn"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>परत</span>
          </button>
          <h1 className="text-xl font-bold" data-testid="blog-view-title">
            {cropName}
          </h1>
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-2 hover:bg-white/10 rounded-xl transition bg-white/5 backdrop-blur-sm"
              data-testid="blog-share-icon"
            >
              <Share2 className="w-5 h-5" />
            </button>
            {showShareMenu && (
              <div className="absolute right-0 top-12 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-48 z-50">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(blogUrl).then(() => {
                      setCopySuccess(true);
                      setTimeout(() => {
                        setCopySuccess(false);
                        setShowShareMenu(false);
                      }, 1500);
                    });
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 transition"
                  data-testid="blog-copy-link-btn"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">{copySuccess ? '✓ Copied!' : 'Copy Link'}</span>
                </button>
                <button
                  onClick={() => {
                    const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(blogUrl)}`;
                    window.open(whatsappShareUrl, '_blank');
                    setShowShareMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 transition"
                  data-testid="blog-share-whatsapp-btn"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Share to WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Blog Content Section */}
      <section className="container mx-auto px-4 py-6">
        {/* Blog Card */}
        <div 
          className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col"
          data-testid={`blog-detail-${blog.id}`}
        >
          <div className="relative w-full bg-gray-100" style={{ paddingBottom: `${(1 / aspect) * 100}%` }}>
            <img 
              src={applyCloudinaryOptimization(blog.image) || 'https://via.placeholder.com/400x300?text=Blog+Image'} 
              alt={`${cropName} Blog`}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <div className="p-6 flex-1">
            <div 
              className="text-gray-700 leading-relaxed blog-content"
              dangerouslySetInnerHTML={{ __html: blog.text }}
            />
          </div>
        </div>

        {/* Attached Products Section */}
        {attachedProducts.length > 0 && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 shadow-lg mt-6">
            {/* Header with Buy All Button */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                <Package className="w-6 h-6 text-emerald-600" />
                <span>संबंधित उत्पादने</span>
              </h3>
              {attachedProducts.length > 1 && (
                <button
                  onClick={() => {
                    const count = addAllToCart(attachedProducts);
                    if (count > 0) {
                      // Go back and open the cart
                      openCart();
                    }
                  }}
                  className="bg-gradient-to-r from-[#177B3B] to-[#01582E] hover:from-[#1a8e45] hover:to-[#016a37] text-white font-bold px-6 py-3 rounded-lg shadow-lg transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
                  data-testid={`buy-all-products-btn-${blog.id}`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>सर्व खरेदी करा</span>
                </button>
              )}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 gap-2">
              {attachedProducts.map(product => {
                const discountPercent = product.mrp && product.price < product.mrp 
                  ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                  : null;
                
                const hasSpecialOffer = product.specialOffer?.offerName && 
                                       product.specialOffer?.quantity && 
                                       product.specialOffer?.offerPricePerUnit;
                
                return (
                  <div 
                    key={product.id}
                    className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden transform hover:scale-[1.03] active:scale-[0.98] border border-gray-100"
                    data-testid={`blog-product-${product.id}`}
                  >
                    {/* Product Image */}
                    <div className="relative">
                      <img 
                        src={product.image || 'https://via.placeholder.com/400x300?text=Product+Image'} 
                        alt={product.name}
                        className="w-full h-28 object-cover"
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
                        <div className="offer-pill-shimmer bg-gradient-to-r from-[#177B3B]/10 to-[#01582E]/10 border border-[#177B3B]/40 rounded-lg px-1.5 py-0.5 flex items-center space-x-1">
                          <span className="text-xs">💰</span>
                          <p className="text-[10px] font-bold text-[#177B3B]" data-testid="product-discount">
                            खास {discountPercent}% सूट
                          </p>
                        </div>
                      ) : null}
                      
                      {/* Buy Now Button with Cart Button */}
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product, 1, 'regular');
                            // Go back and open the cart
                            openCart();
                          }}
                          className="flex-1 bg-gradient-to-r from-[#177B3B] to-[#01582E] hover:from-[#1a8e45] hover:to-[#016a37] text-white font-bold py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-sm"
                          data-testid="buy-now-btn"
                        >
                          खरेदी करा
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product, 1, 'regular');
                          }}
                          className="bg-gradient-to-r from-[#177B3B] to-[#01582E] hover:from-[#1a8e45] hover:to-[#016a37] text-white font-bold p-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center justify-center"
                          data-testid="add-to-cart-btn"
                          title="कार्टमध्ये जोडा"
                        >
                          <ShoppingCart className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Custom Styles for Blog Content */}
      <style jsx>{`
        .blog-content {
          font-size: 15px;
          line-height: 1.6;
        }
        
        .blog-content h1 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 12px;
          color: #1f2937;
        }
        
        .blog-content h2 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 10px;
          color: #1f2937;
        }
        
        .blog-content h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #374151;
        }
        
        .blog-content p {
          margin-bottom: 12px;
        }
        
        .blog-content ul,
        .blog-content ol {
          margin-left: 20px;
          margin-bottom: 12px;
        }
        
        .blog-content li {
          margin-bottom: 6px;
        }
        
        .blog-content strong {
          font-weight: 600;
        }
        
        .blog-content em {
          font-style: italic;
        }
        
        .blog-content u {
          text-decoration: underline;
        }
        
        .blog-content a {
          color: #059669;
          text-decoration: underline;
        }
        
        .blog-content a:hover {
          color: #047857;
        }
      `}</style>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#177B3B] to-[#01582E] text-white py-8 mt-12 rounded-t-[32px]">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">{shopData?.shop_name || 'Shop Name'}</h3>
            <p className="text-white/80 text-sm mb-4">{shopData?.shop_address || 'Shop Address'}</p>
            <a 
              href={`tel:${shopData?.shop_number}`}
              className="text-white hover:text-white/80 transition"
            >
              📞 {shopData?.shop_number || '0000000000'}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
