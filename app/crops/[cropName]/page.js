'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ShoppingCart, Search, Menu, LogOut, Settings, Package } from 'lucide-react';
import Link from 'next/link';
import { supabase, getCurrentUser } from '@/lib/supabase';

// Helper function to add Cloudinary optimizations to image URLs
const applyCloudinaryOptimization = (imageUrl) => {
  if (!imageUrl) return imageUrl;
  
  // Check if it's a Cloudinary URL
  if (imageUrl.includes('cloudinary.com') && imageUrl.includes('/upload/')) {
    // Add f_auto,q_auto transformations for bandwidth optimization
    return imageUrl.replace('/upload/', '/upload/f_auto,q_auto/');
  }
  
  return imageUrl;
};

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

export default function CropPage() {
  const params = useParams();
  const router = useRouter();
  const cropName = decodeURIComponent(params.cropName);
  
  const [blogs, setBlogs] = useState([]);
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [cart, setCart] = useState([]);
  
  // Find crop data
  const cropData = CROPS_DATA.find(c => c.name === cropName);

  // Check authentication state
  useEffect(() => {
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  // Fetch shop data and blogs
  useEffect(() => {
    fetchShopData();
  }, []);

  // Load cart count from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        setCart(cartData);
        const count = cartData.reduce((sum, item) => sum + item.quantity, 0);
        setCartItemCount(count);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  }, []);

  // Add to cart function
  const addToCart = (product) => {
    try {
      const existingCart = [...cart];
      const existingItemIndex = existingCart.findIndex(item => item.id === product.id);
      
      if (existingItemIndex !== -1) {
        existingCart[existingItemIndex].quantity += 1;
      } else {
        existingCart.push({ ...product, quantity: 1 });
      }
      
      localStorage.setItem('cart', JSON.stringify(existingCart));
      setCart(existingCart);
      
      const count = existingCart.reduce((sum, item) => sum + item.quantity, 0);
      setCartItemCount(count);
      
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  };

  // Add all products to cart
  const addAllToCart = (products) => {
    try {
      let existingCart = [...cart];
      let addedCount = 0;
      
      products.forEach(product => {
        const existingItemIndex = existingCart.findIndex(item => item.id === product.id);
        
        if (existingItemIndex !== -1) {
          existingCart[existingItemIndex].quantity += 1;
        } else {
          existingCart.push({ ...product, quantity: 1 });
        }
        addedCount++;
      });
      
      localStorage.setItem('cart', JSON.stringify(existingCart));
      setCart(existingCart);
      
      const count = existingCart.reduce((sum, item) => sum + item.quantity, 0);
      setCartItemCount(count);
      
      return addedCount;
    } catch (error) {
      console.error('Error adding all to cart:', error);
      return 0;
    }
  };

  const fetchShopData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shop_data')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      
      if (data) {
        // Parse social_links from JSON string if needed
        let parsedData = { ...data };
        if (data.social_links && typeof data.social_links === 'string') {
          try {
            parsedData.social_links = JSON.parse(data.social_links);
          } catch (e) {
            console.error('Error parsing social_links:', e);
            parsedData.social_links = { instagram: '', facebook: '', youtube: '' };
          }
        }
        
        setShopData(parsedData);
        
        // Filter blogs for this specific crop
        const allBlogs = data.blogs || [];
        const cropBlogs = allBlogs.filter(blog => blog.selectedCrop === cropName);
        setBlogs(cropBlogs);
      }
    } catch (error) {
      console.log('Error fetching shop data:', error.message);
      setShopData({
        shop_name: 'Shop Name',
        shop_number: '0000000000',
        shop_address: 'Shop Address',
        social_links: { instagram: '', facebook: '', youtube: '' }
      });
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowUserMenu(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-semibold">लोड होत आहे...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white sticky top-0 z-50 shadow-2xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => router.push('/')}
                className="flex items-center space-x-2 hover:bg-emerald-600 px-3 py-2 rounded-lg transition"
                data-testid="back-to-home-btn"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>मुख्यपृष्ठ</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {/* Admin Dropdown Menu (only for logged in users) */}
              {user && (
                <div className="relative">
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="p-2 hover:bg-emerald-600 rounded-full transition-all duration-200 active:scale-95"
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50">
                      <button
                        onClick={() => {
                          router.push('/admin');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-emerald-50 flex items-center space-x-2"
                      >
                        <Settings className="w-4 h-4" />
                        <span>अ‍ॅडमिन डॅशबोर्ड</span>
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>साइन आउट</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              {/* Cart Button */}
              <button 
                onClick={() => router.push('/?openCart=true')}
                className="relative p-2 hover:bg-emerald-600 rounded-full transition-all duration-200 active:scale-95"
                data-testid="cart-button"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Crop Hero Section */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center space-y-6">
            {/* Crop Image */}
            {cropData && (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-4 border-emerald-500 shadow-2xl flex items-center justify-center overflow-hidden">
                <img 
                  src={cropData.image} 
                  alt={cropName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/128x128/f59e0b/ffffff?text=' + encodeURIComponent(cropName.charAt(0));
                  }}
                />
              </div>
            )}
            
            {/* Crop Title */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-2" data-testid="crop-page-title">
                {cropName}
              </h1>
              <p className="text-gray-600 text-lg">
                {blogs.length > 0 ? `${blogs.length} पोस्ट उपलब्ध` : 'अद्याप पोस्ट उपलब्ध नाहीत'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Blogs Section */}
      <section className="container mx-auto px-4 py-12">
        {blogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌾</div>
            <p className="text-gray-500 text-lg mb-2">या पिकासाठी अद्याप पोस्ट उपलब्ध नाहीत</p>
            <p className="text-gray-400 text-sm">लवकरच आम्ही या पिकासाठी माहिती जोडू</p>
          </div>
        ) : (
          <div className="space-y-8">
            {blogs.map(blog => {
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

                  {/* Attached Products Section - Only for crops blogs */}
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
                                alert(`${count} उत्पादने कार्टमध्ये जोडली!`);
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

                      {/* Products Grid - Matching Homepage Style */}
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
                                
                                {/* Buy Now Button with Cart Button */}
                                <div className="flex items-center space-x-1.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const success = addToCart(product);
                                      if (success) {
                                        alert('उत्पादन कार्टमध्ये जोडले!');
                                      }
                                    }}
                                    className="flex-1 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 hover:from-emerald-800 hover:via-emerald-700 hover:to-teal-700 text-white font-bold py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-sm"
                                    data-testid="buy-now-btn"
                                  >
                                    खरेदी करा
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addToCart(product);
                                    }}
                                    className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 hover:from-emerald-800 hover:via-emerald-700 hover:to-teal-700 text-white font-bold p-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center justify-center"
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
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Custom Styles for Blog Content */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
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
