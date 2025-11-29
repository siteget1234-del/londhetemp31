'use client';

import { useState, useMemo, useEffect } from 'react';
import { ShoppingCart, Search, Phone, Plus, X, ChevronLeft, ChevronRight, Minus, Menu, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, getCurrentUser } from '@/lib/supabase';

// Predefined Categories - Always show these 4
const PREDEFINED_CATEGORIES = [
  { name: 'बीज', icon: '🌱', slug: 'seeds' },
  { name: 'पोषण', icon: '🌿', slug: 'nutrition' },
  { name: 'संरक्षण', icon: '🛡️', slug: 'protection' },
  { name: 'हार्डवेअर', icon: '🔧', slug: 'hardware' }
];

export default function Home() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Live data from Supabase
  const [shopData, setShopData] = useState(null);
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Handle history API for all navigation states
  useEffect(() => {
    if (selectedProduct || showSearch || selectedCategory) {
      // Push a new state when any modal/view opens
      window.history.pushState({ 
        modalOpen: !!selectedProduct,
        searchOpen: showSearch,
        categoryOpen: !!selectedCategory
      }, '');
      
      const handlePopState = (event) => {
        // Close modal/view when back button is pressed
        if (selectedProduct) {
          setSelectedProduct(null);
        } else if (selectedCategory) {
          setSelectedCategory(null);
        } else if (showSearch) {
          setShowSearch(false);
          setSearchQuery('');
        }
      };
      
      window.addEventListener('popstate', handlePopState);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [selectedProduct, showSearch, selectedCategory]);

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

  // Fetch shop data from Supabase
  useEffect(() => {
    fetchShopData();
  }, []);

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
        setShopData(data);
        setProducts(data.products || []);
        setBanners(data.banners || []);
      }
    } catch (error) {
      console.log('No shop data yet:', error.message);
      // Set placeholder data
      setShopData({
        shop_name: 'Shop Name',
        shop_number: '0000000000',
        shop_address: 'Shop Address'
      });
      setProducts([]);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-slide banners
  useEffect(() => {
    if (banners.length > 0) {
      const timer = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % banners.length);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [banners]);

  // Enhanced search functionality with keyword mapping
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    
    return products.filter(product => {
      const matchesName = product.name?.toLowerCase().includes(query);
      const matchesDescription = product.description?.toLowerCase().includes(query);
      const matchesCategory = product.category?.toLowerCase().includes(query);
      
      // Search in hidden keywords
      const matchesKeywords = product.searchKeywords?.some(keyword => 
        keyword.toLowerCase().includes(query) || query.includes(keyword.toLowerCase())
      );
      
      return matchesName || matchesDescription || matchesCategory || matchesKeywords;
    });
  }, [searchQuery, products]);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const generateWhatsAppMessage = () => {
    let message = 'मला खरेदी करायची आहे:\n\n';
    cart.forEach((item, index) => {
      message += `${index + 1}) ${item.name} - ₹${item.price} × ${item.quantity} = ₹${item.price * item.quantity}\n`;
    });
    message += `\nएकूण: ₹${totalAmount}`;
    return encodeURIComponent(message);
  };

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) {
      alert('कृपया प्रथम कार्टमध्ये उत्पादने जोडा!');
      return;
    }
    const whatsappUrl = `https://wa.me/${shopData?.shop_number}?text=${generateWhatsAppMessage()}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowUserMenu(false);
  };

  // Featured products - only those marked as featured
  const featuredProducts = products.filter(p => p.featured === true);
  
  const categoryProducts = selectedCategory 
    ? products.filter(p => p.category === selectedCategory)
    : null;

  const displayProducts = showSearch && searchQuery 
    ? searchResults 
    : categoryProducts 
    ? categoryProducts 
    : featuredProducts;

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Always show predefined categories with product counts
  const categoriesWithCounts = useMemo(() => {
    return PREDEFINED_CATEGORIES.map(cat => ({
      ...cat,
      count: products.filter(p => p.category === cat.name).length
    }));
  }, [products]);

  // Product Detail Modal
  if (selectedProduct) {
    const handleCloseModal = () => {
      // Remove the history state if it exists
      if (window.history.state?.modalOpen) {
        window.history.back();
      } else {
        setSelectedProduct(null);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-emerald-700 text-white sticky top-0 z-50 shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={handleCloseModal}
                className="flex items-center space-x-2 hover:bg-emerald-600 px-3 py-2 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>परत</span>
              </button>
              <button 
                onClick={() => setShowCart(true)}
                className="relative p-2 hover:bg-emerald-600 rounded-full transition"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Product Detail */}
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <img 
              src={selectedProduct.image || 'https://via.placeholder.com/400x300?text=Product+Image'} 
              alt={selectedProduct.name}
              className="w-full h-64 object-cover"
            />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-800">{selectedProduct.name}</h1>
                <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold">
                  {selectedProduct.category}
                </span>
              </div>
              
              <div className="text-3xl font-bold text-emerald-600 mb-6">₹{selectedProduct.price}</div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">वर्णन:</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedProduct.description}</p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    addToCart(selectedProduct);
                    setShowCart(true);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>कार्टमध्ये जोडा</span>
                </button>
                <a
                  href={`tel:${shopData?.shop_number}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition flex items-center justify-center"
                >
                  <Phone className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      <header className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white sticky top-0 z-50 shadow-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2" onClick={() => { setSelectedCategory(null); setShowSearch(false); setSearchQuery(''); }} style={{ cursor: 'pointer' }}>
              <div className="text-3xl">🏪</div>
              <div>
                <h1 className="text-lg md:text-xl font-bold leading-tight">{shopData?.shop_name || 'Shop Name'}</h1>
                <p className="text-xs text-emerald-100">{shopData?.shop_address || 'Shop Address'}</p>
              </div>
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
                onClick={() => setShowCart(true)}
                className="relative p-2 hover:bg-emerald-600 rounded-full transition-all duration-200 active:scale-95"
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

          {/* Search Bar */}
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="उत्पादने शोधा..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearch(true);
                  setSelectedCategory(null);
                }}
                onFocus={() => setShowSearch(true)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-300 shadow-md transition-all duration-200"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Banner Carousel */}
      {!showSearch && !selectedCategory && banners.length > 0 && (
        <section className="relative overflow-hidden bg-emerald-700">
          <div className="relative h-56 md:h-72">
            {banners.map((banner, index) => {
              const BannerContent = () => (
                <div className="relative h-full flex items-center justify-center overflow-hidden bg-gray-200">
                  {banner.image ? (
                    <img src={banner.image} alt={`Banner ${banner.order || index + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-400 text-center">
                      <p className="text-lg">No banner image</p>
                    </div>
                  )}
                </div>
              );

              return (
                <div
                  key={banner.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    index === currentBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  {banner.link ? (
                    <a href={banner.link} target="_blank" rel="noopener noreferrer" className="block h-full">
                      <BannerContent />
                    </a>
                  ) : (
                    <BannerContent />
                  )}
                </div>
              );
            })}
          </div>
          
          {banners.length > 1 && (
            <>
              {/* Banner Navigation */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBanner(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentBanner ? 'bg-white w-8' : 'bg-white/50 w-2'
                    }`}
                  />
                ))}
              </div>
              
              {/* Arrow buttons */}
              <button
                onClick={() => setCurrentBanner((currentBanner - 1 + banners.length) % banners.length)}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/30 p-2 rounded-full transition z-20"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => setCurrentBanner((currentBanner + 1) % banners.length)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/30 p-2 rounded-full transition z-20"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </>
          )}
        </section>
      )}

      {/* Categories - Always show all 4 */}
      {!showSearch && !selectedCategory && (
        <section className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-4 gap-2">
            {categoriesWithCounts.map(category => (
              <button
                key={category.slug}
                onClick={() => setSelectedCategory(category.name)}
                className="bg-white p-3 rounded-xl shadow-md hover:shadow-xl transition transform hover:scale-105 active:scale-95 flex flex-col items-center space-y-1 relative"
              >
                <div className="text-3xl">{category.icon}</div>
                <h3 className="text-xs font-semibold text-gray-800 text-center leading-tight">{category.name}</h3>
                <span className={`text-[10px] font-bold ${category.count > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {category.count > 0 ? `${category.count} उत्पादने` : '0 उत्पादने'}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Products Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="mb-6">
          {showSearch && searchQuery ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (window.history.state?.searchOpen) {
                    window.history.back();
                  } else {
                    setShowSearch(false);
                    setSearchQuery('');
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-95"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <h2 className="text-2xl font-bold text-gray-800">
                शोध परिणाम ({searchResults.length})
              </h2>
            </div>
          ) : selectedCategory ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (window.history.state?.categoryOpen) {
                    window.history.back();
                  } else {
                    setSelectedCategory(null);
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-95"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <h2 className="text-2xl font-bold text-gray-800">{selectedCategory}</h2>
            </div>
          ) : (
            <h2 className="text-2xl font-bold text-gray-800">खास उत्पादने</h2>
          )}
        </div>

        {displayProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">अद्याप उत्पादने उपलब्ध नाहीत</p>
            {user && (
              <button
                onClick={() => router.push('/admin')}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold"
              >
                अ‍ॅडमिन पॅनेलमधून उत्पादने जोडा
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {displayProducts.map(product => (
              <div 
                key={product.id} 
                onClick={() => setSelectedProduct(product)}
                className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="relative">
                  <img 
                    src={product.image || 'https://via.placeholder.com/400x300?text=Product+Image'} 
                    alt={product.name}
                    className="w-full h-36 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-emerald-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                    ₹{product.price}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-bold text-gray-800 mb-1 line-clamp-1">{product.name}</h3>
                  <p className="text-gray-600 text-xs mb-3 line-clamp-2 leading-relaxed">{product.description}</p>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold py-2.5 px-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-1 text-xs shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>जोडा</span>
                    </button>
                    <a
                      href={`tel:${shopData?.shop_number}`}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-2.5 px-3 rounded-lg transition-all duration-200 flex items-center justify-center shadow-md"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      {!showSearch && !selectedCategory && (
        <footer className="bg-emerald-700 text-white py-8 mt-12">
          <div className="container mx-auto px-4">
            <h3 className="text-xl font-bold mb-4">आमच्याशी संपर्क साधा</h3>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <span className="text-red-400">📍</span>
                <p>{shopData?.shop_address || 'Shop Address'}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-red-400">📞</span>
                <a href={`tel:${shopData?.shop_number}`} className="hover:text-emerald-200">फोन: {shopData?.shop_number || '0000000000'}</a>
              </div>
            </div>
            <div className="border-t border-emerald-600 mt-6 pt-6">
              <div className="flex items-center justify-between">
                <p className="text-emerald-200">© 2025 {shopData?.shop_name || 'Shop Name'}. सर्व हक्क राखीव.</p>
                {!user && (
                  <button
                    onClick={() => router.push('/login')}
                    className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition flex items-center space-x-1.5 text-sm font-semibold"
                  >
                    <span className="text-base">⚙️</span>
                    <span>अ‍ॅडमिन</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Enhanced Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowCart(false)}></div>
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white p-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">माझी कार्ट</h2>
                <p className="text-sm text-emerald-100">{cartItemCount} वस्तू</p>
              </div>
              <button onClick={() => setShowCart(false)} className="hover:bg-emerald-600 p-2 rounded-full transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-12 h-12 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg font-semibold">तुमची कार्ट रिकामी आहे</p>
                  <p className="text-gray-400 text-sm mt-2">खरेदी सुरू करण्यासाठी उत्पादने जोडा</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
                      <div className="flex space-x-3">
                        <img 
                          src={item.image || 'https://via.placeholder.com/80x80?text=Product'} 
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-gray-800 text-sm leading-tight">{item.name}</h3>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700 ml-2 p-1 hover:bg-red-50 rounded transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-emerald-600 font-bold text-lg mb-2">₹{item.price}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 bg-gray-100 rounded-lg p-1">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="bg-white hover:bg-gray-200 w-7 h-7 rounded-md flex items-center justify-center font-bold text-gray-700 transition"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-bold text-gray-800 w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white w-7 h-7 rounded-md flex items-center justify-center font-bold transition"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <span className="font-bold text-gray-800 text-lg">₹{item.price * item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-gray-200 bg-white p-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>एकूण वस्तू:</span>
                    <span className="font-semibold">{cartItemCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-2xl font-bold">
                    <span className="text-gray-800">एकूण:</span>
                    <span className="text-emerald-600">₹{totalAmount}</span>
                  </div>
                </div>
                <button
                  onClick={handleWhatsAppCheckout}
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-4 rounded-xl transition flex items-center justify-center space-x-2 shadow-lg"
                >
                  <span className="text-lg">व्हाट्सअ‍ॅपद्वारे ऑर्डर करा</span>
                  <span className="text-xl">💬</span>
                </button>
                <p className="text-center text-xs text-gray-500">आम्ही लवकरच तुमच्याशी संपर्क साधू</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}