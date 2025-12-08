'use client';

import { useEffect } from 'react';
import { ChevronLeft, ShoppingCart, Package } from 'lucide-react';
import { applyCloudinaryOptimization } from '@/lib/imageOptimization';

// Crop data with images
const CROPS_DATA = [
  { name: 'बटाटा', image: '/images/crops/बटाटा.webp' },
  { name: 'कोबी', image: '/images/crops/कोबी.webp' },
  { name: 'डिंक गवार', image: '/images/crops/डिंकगवार.webp' },
  { name: 'ऊस', image: '/images/crops/ऊस.webp' },
  { name: 'कापूस', image: '/images/crops/कापूस.webp' },
  { name: 'टोमॅटो', image: '/images/crops/टोमॅटो.webp' },
  { name: 'कांदा', image: '/images/crops/कांदा.webp' },
  { name: 'गहू', image: '/images/crops/गहू.webp' },
  { name: 'भात', image: '/images/crops/भात.webp' },
  { name: 'गवार', image: '/images/crops/गवार.webp' }
];

export default function CropView({ cropName, back, shopData, blogs, cart, addToCart, addAllToCart, openCart }) {
  // Find crop data
  const cropData = CROPS_DATA.find(c => c.name === cropName);
  
  // Filter blogs for this specific crop
  const cropBlogs = blogs.filter(blog => blog.selectedCrop === cropName);

  // Scroll to top when crop page opens
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [cropName]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#177B3B] to-[#01582E] text-white py-4 px-4 rounded-b-[32px] shadow-2xl">
        <div className="flex items-center justify-between">
          <button 
            onClick={back}
            className="flex items-center space-x-2 hover:bg-white/10 px-3 py-2 rounded-xl transition bg-white/5 backdrop-blur-sm"
            data-testid="back-from-crop-btn"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>मुख्यपृष्ठ</span>
          </button>
          <h1 className="text-xl font-bold" data-testid="crop-view-title">
            {cropName}
          </h1>
        </div>
      </header>

      {/* Blogs Section */}
      <section className="container mx-auto px-4 py-12">
        {cropBlogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌾</div>
            <p className="text-gray-500 text-lg mb-2">या पिकासाठी अद्याप पोस्ट उपलब्ध नाहीत</p>
            <p className="text-gray-400 text-sm">लवकरच आम्ही या पिकासाठी माहिती जोडू</p>
          </div>
        ) : (
          <div className="space-y-8">
            {cropBlogs.map(blog => {
              // Define layout aspect ratios
              const layoutAspects = {
                standard: 16/9,
                portrait: 4/5,
                square: 1,
                wide: 21/9
              };
              const aspect = layoutAspects[blog.layout || 'standard'];
              
              // Get attached products
              const attachedProducts = blog.attachedProducts && blog.attachedProducts.length > 0
                ? shopData.products.filter(p => blog.attachedProducts.includes(p.id))
                : [];
              
              return (
                <div key={blog.id} className="space-y-6">
                  {/* Blog Card */}
                  <div 
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col"
                    data-testid={`crop-blog-${blog.id}`}
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
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 shadow-lg">
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
                                // Go back to main page and open the cart
                                openCart();
                              }
                            }}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-6 py-3 rounded-lg shadow-lg transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
                            data-testid={`buy-all-btn-${blog.id}`}
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
                              data-testid={`attached-product-${product.id}`}
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
                                  <div className="offer-pill-shimmer bg-gradient-to-r from-green-50 to-emerald-50 border border-emerald-300 rounded-lg px-1.5 py-0.5 flex items-center space-x-1">
                                    <span className="text-xs">💰</span>
                                    <p className="text-[10px] font-bold text-emerald-800" data-testid="product-offer-price">
                                      ऑफर: ₹{product.specialOffer.offerPricePerUnit}/ प्रति नग
                                    </p>
                                  </div>
                                ) : discountPercent ? (
                                  <div className="offer-pill-shimmer bg-gradient-to-r from-green-50 to-emerald-50 border border-emerald-300 rounded-lg px-1.5 py-0.5 flex items-center space-x-1">
                                    <span className="text-xs">💰</span>
                                    <p className="text-[10px] font-bold text-emerald-800" data-testid="product-discount">
                                      खास {discountPercent}% सूट
                                    </p>
                                  </div>
                                ) : null}
                                
                                {/* Buy Now Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(product, 1, 'regular');
                                    // Go back to main page and open the cart
                                    openCart();
                                  }}
                                  className="w-full bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 hover:from-emerald-800 hover:via-emerald-700 hover:to-teal-700 text-white font-bold py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-sm"
                                  data-testid="buy-now-btn"
                                >
                                  खरेदी करा
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
      <footer className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white py-8 mt-12 shadow-2xl">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">{shopData?.shop_name || 'Shop Name'}</h3>
            <p className="text-emerald-100 text-sm mb-4">{shopData?.shop_address || 'Shop Address'}</p>
            <a 
              href={`tel:${shopData?.shop_number}`}
              className="text-white hover:text-emerald-100 transition"
            >
              📞 {shopData?.shop_number || '0000000000'}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
