'use client';

import { useState, useMemo, useEffect } from 'react';
import { ShoppingCart, Search, Phone, Plus, X, ChevronLeft, ChevronRight, Minus, Menu, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { calculateOfferPricing, calculateCartTotal, formatDiscount } from '@/lib/offerCalculations';

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
  const [selectedOffers, setSelectedOffers] = useState({}); // Track offer type: 'regular' or 'bulk'
  const [productQuantity, setProductQuantity] = useState(1); // Quantity for product detail page
  
  // Delivery Address State
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [addressForm, setAddressForm] = useState({ 
    name: '', 
    addressLine: '', 
    cityVillage: '', 
    state: 'महाराष्ट्र', 
    pincode: '' 
  });
  
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
          setProductQuantity(1);
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

  // Reset quantity when product changes
  useEffect(() => {
    if (selectedProduct) {
      setProductQuantity(1);
      // Default to regular price
      setSelectedOffers(prev => ({
        ...prev,
        [selectedProduct.id]: 'regular'
      }));
    }
  }, [selectedProduct?.id]);

  // Auto-adjust offer type based on quantity changes
  useEffect(() => {
    if (selectedProduct) {
      const bulkRequiredQty = selectedProduct.specialOffer?.quantity || 0;
      
      if (bulkRequiredQty > 0) {
        // Auto-select bulk if quantity equals or exceeds bulkRequiredQty
        if (productQuantity >= bulkRequiredQty) {
          setSelectedOffers(prev => ({
            ...prev,
            [selectedProduct.id]: 'bulk'
          }));
        } 
        // Auto-select regular if quantity is below bulkRequiredQty
        else {
          setSelectedOffers(prev => ({
            ...prev,
            [selectedProduct.id]: 'regular'
          }));
        }
      }
    }
  }, [productQuantity, selectedProduct?.id]);

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

  const addToCart = (product, quantity = 1, offerType = 'regular') => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + quantity, offerType }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity, offerType }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item => {
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
  };
  
  // Update cart item offer type and adjust quantity accordingly
  const updateCartOfferType = (productId, offerType) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const product = products.find(p => p.id === productId);
        const bulkRequiredQty = product?.specialOffer?.quantity || 1;
        
        // Set quantity based on offer type
        const newQuantity = offerType === 'bulk' ? bulkRequiredQty : 1;
        
        return { ...item, quantity: newQuantity, offerType };
      }
      return item;
    }));
  };

  // Calculate cart total using new algorithm
  const cartTotals = useMemo(() => {
    return calculateCartTotal(cart);
  }, [cart]);

  const totalAmount = cartTotals.total;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const generateWhatsAppMessage = () => {
    let message = 'मला खरेदी करायची आहे:\n\n';
    
    cartTotals.items.forEach((item, index) => {
      const pricing = item.pricing;
      if (pricing.itemsAtOfferPrice > 0 && pricing.itemsAtRegularPrice > 0) {
        message += `${index + 1}) ${item.name}:\n`;
        message += `   - ${pricing.itemsAtOfferPrice} @ ₹${item.specialOffer.offerPricePerUnit} (ऑफर) = ₹${pricing.itemsAtOfferPrice * item.specialOffer.offerPricePerUnit}\n`;
        message += `   - ${pricing.itemsAtRegularPrice} @ ₹${item.price} (नियमित) = ₹${pricing.itemsAtRegularPrice * item.price}\n`;
      } else if (pricing.itemsAtOfferPrice > 0) {
        message += `${index + 1}) ${item.name} - ₹${item.specialOffer.offerPricePerUnit} (ऑफर) × ${item.quantity} = ₹${pricing.total}\n`;
      } else {
        message += `${index + 1}) ${item.name} - ₹${item.price} × ${item.quantity} = ₹${pricing.total}\n`;
      }
    });
    
    if (cartTotals.discount > 0) {
      message += `\nमूल्य: ₹${Math.round(cartTotals.subtotal)}\n`;
      message += `डिस्काउंट: -₹${Math.round(cartTotals.discount)}\n`;
    }
    message += `\nएकूण: ₹${Math.round(totalAmount)}`;
    return encodeURIComponent(message);
  };

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) {
      alert('कृपया प्रथम कार्टमध्ये उत्पादने जोडा!');
      return;
    }
    if (!deliveryAddress) {
      alert('कृपया प्रथम डिलिव्हरी पत्ता जोडा!');
      return;
    }
    const whatsappUrl = `https://wa.me/${shopData?.shop_number}?text=${generateWhatsAppMessage()}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSaveAddress = () => {
    if (!addressForm.name.trim() || !addressForm.addressLine.trim() || 
        !addressForm.cityVillage.trim() || !addressForm.pincode.trim()) {
      alert('कृपया सर्व फील्ड भरा!');
      return;
    }
    
    // Validate pincode (6 digits)
    if (!/^\d{6}$/.test(addressForm.pincode.trim())) {
      alert('कृपया योग्य ६ अंकी पिनकोड भरा!');
      return;
    }
    
    setDeliveryAddress({
      name: addressForm.name.trim(),
      addressLine: addressForm.addressLine.trim(),
      cityVillage: addressForm.cityVillage.trim(),
      state: addressForm.state.trim(),
      pincode: addressForm.pincode.trim()
    });
    setShowAddressDialog(false);
  };

  const handleEditAddress = () => {
    setAddressForm({
      name: deliveryAddress?.name || '',
      addressLine: deliveryAddress?.addressLine || '',
      cityVillage: deliveryAddress?.cityVillage || '',
      state: deliveryAddress?.state || 'महाराष्ट्र',
      pincode: deliveryAddress?.pincode || ''
    });
    setShowAddressDialog(true);
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
        setProductQuantity(1);
      }
    };

    const discountPercent = selectedProduct.mrp && selectedProduct.price < selectedProduct.mrp 
      ? Math.round(((selectedProduct.mrp - selectedProduct.price) / selectedProduct.mrp) * 100)
      : null;

    // Helper to extract YouTube video ID
    const getYouTubeEmbedUrl = (url) => {
      if (!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
    };

    const videoEmbedUrl = getYouTubeEmbedUrl(selectedProduct.videoUrl);
    
    const currentOfferType = selectedOffers[selectedProduct.id] || 'regular';
    const hasSpecialOffer = selectedProduct.specialOffer?.offerName && 
                           selectedProduct.specialOffer?.quantity && 
                           selectedProduct.specialOffer?.offerPricePerUnit;
    
    // Calculate pricing for current selection
    const regularPricing = calculateOfferPricing(selectedProduct, productQuantity, 'regular');
    const bulkPricing = hasSpecialOffer ? calculateOfferPricing(selectedProduct, productQuantity, 'bulk') : null;

    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <header className="bg-emerald-700 text-white sticky top-0 z-50 shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={handleCloseModal}
                className="flex items-center space-x-2 hover:bg-emerald-600 px-3 py-2 rounded-lg transition"
                data-testid="back-btn"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>परत</span>
              </button>
              <span className="text-sm font-semibold">{shopData?.shop_name} : {selectedProduct.category}</span>
            </div>
          </div>
        </header>

        {/* Product Detail - Modular Sections */}
        <div className="container mx-auto px-4 py-6 space-y-4">
          
          {/* Product Image + Name */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <img 
              src={selectedProduct.image || 'https://via.placeholder.com/400x300?text=Product+Image'} 
              alt={selectedProduct.name}
              className="w-full h-64 object-cover"
              data-testid="product-detail-image"
            />
            <div className="p-4">
              <h1 className="text-xl font-bold text-gray-800" data-testid="product-detail-name">
                {selectedProduct.name}
              </h1>
              {selectedProduct.specifications?.quantity && (
                <p className="text-sm text-gray-500 mt-1">प्रति युनिटचे मुल्य • सर्व कर लागू</p>
              )}
            </div>
          </div>

          {/* Price & Offers Section */}
          <div className="bg-white rounded-xl shadow-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-bold text-gray-900" data-testid="detail-selling-price">
                  ₹{selectedProduct.price}
                </span>
                {selectedProduct.mrp && selectedProduct.mrp > selectedProduct.price && (
                  <span className="text-lg text-gray-500 line-through" data-testid="detail-mrp">
                    ₹{selectedProduct.mrp}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={`https://wa.me/${shopData?.shop_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-all duration-200"
                  data-testid="whatsapp-icon"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </a>
                <a
                  href={`tel:${shopData?.shop_number}`}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-all duration-200"
                  data-testid="call-icon"
                >
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            {/* Offer Blocks */}
            {discountPercent && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 flex items-center space-x-2">
                <span className="text-2xl">💰</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-700">MH_{discountPercent}% OFF</p>
                  <p className="text-xs text-green-600">उत्पादन सूट • सर्व ग्राहकांसाठी लागू आहे</p>
                </div>
              </div>
            )}
            
            {selectedProduct.offer && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                <span className="text-2xl">🎁</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-700">{selectedProduct.offer}</p>
                  <p className="text-xs text-red-600">विशेष ऑफर किमान ऑर्डर खालील किंवा आर्डरची आर्डर</p>
                </div>
              </div>
            )}

            {/* Special Bulk Offer - Radio Buttons */}
            {hasSpecialOffer && (
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🎁</span>
                    <p className="text-base font-bold text-orange-800">{selectedProduct.specialOffer.offerName}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {/* Option 1: Regular Price */}
                  <button
                    onClick={() => {
                      setSelectedOffers(prev => ({ ...prev, [selectedProduct.id]: 'regular' }));
                      setProductQuantity(1); // Auto-set quantity to 1
                    }}
                    className={`w-full text-left rounded-lg p-3 border-2 transition ${
                      currentOfferType === 'regular' 
                        ? 'bg-white border-orange-400 shadow-sm' 
                        : 'bg-orange-50/50 border-orange-200 opacity-60'
                    } cursor-pointer hover:border-orange-400`}
                    data-testid="offer-radio-regular"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          currentOfferType === 'regular' ? 'border-orange-600' : 'border-gray-400'
                        }`}>
                          {currentOfferType === 'regular' && (
                            <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">उपलब्ध: 1 नगवर</p>
                          <p className="text-xs text-gray-600">किंमत ₹{selectedProduct.price}/ प्रति नग</p>
                        </div>
                      </div>
                      {productQuantity > 1 && regularPricing.discount === 0 && (
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-700">₹{Math.round(regularPricing.total)}</p>
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Option 2: Bulk Offer */}
                  <button
                    onClick={() => {
                      setSelectedOffers(prev => ({ ...prev, [selectedProduct.id]: 'bulk' }));
                      setProductQuantity(selectedProduct.specialOffer.quantity); // Auto-set quantity to bulkRequiredQty
                    }}
                    className={`w-full text-left rounded-lg p-3 border-2 transition ${
                      currentOfferType === 'bulk' 
                        ? 'bg-emerald-50 border-emerald-500 shadow-md' 
                        : 'bg-white border-orange-200'
                    } cursor-pointer hover:border-emerald-400`}
                    data-testid="offer-radio-bulk"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          currentOfferType === 'bulk' ? 'border-emerald-600' : 'border-gray-400'
                        }`}>
                          {currentOfferType === 'bulk' && (
                            <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-emerald-800 text-sm">उपलब्ध: {selectedProduct.specialOffer.quantity} नगवर</p>
                          <p className="text-xs text-emerald-700 font-semibold">
                            ऑफर किंमत ₹{selectedProduct.specialOffer.offerPricePerUnit}/ प्रति नग
                          </p>
                        </div>
                      </div>
                      {bulkPricing && bulkPricing.discount > 0 && (
                        <div className="text-right">
                          <div className="flex items-center space-x-1 mb-1">
                            <span className="text-xl">💰</span>
                            <span className="text-emerald-700 font-bold text-sm">{formatDiscount(bulkPricing.discount)}</span>
                          </div>
                          <p className="text-xs text-gray-600">एकूण: ₹{Math.round(bulkPricing.total)}</p>
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-800 mb-1">प्रमाण निवडा</p>
                {hasSpecialOffer && productQuantity >= selectedProduct.specialOffer.quantity && currentOfferType === 'bulk' && (
                  <p className="text-xs text-emerald-600">
                    {bulkPricing.itemsAtOfferPrice} ऑफर + {bulkPricing.itemsAtRegularPrice > 0 ? `${bulkPricing.itemsAtRegularPrice} नियमित` : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-4 bg-gray-100 rounded-lg px-3 py-2">
                <button
                  onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}
                  className="bg-white hover:bg-gray-200 w-9 h-9 rounded-md flex items-center justify-center font-bold text-gray-700 transition shadow-sm"
                  data-testid="detail-quantity-minus"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="font-bold text-gray-800 text-xl w-10 text-center" data-testid="detail-quantity-value">{productQuantity}</span>
                <button
                  onClick={() => setProductQuantity(productQuantity + 1)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white w-9 h-9 rounded-md flex items-center justify-center font-bold transition shadow-sm"
                  data-testid="detail-quantity-plus"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Video Section */}
          {videoEmbedUrl && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100">
                <h2 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <span>📹</span>
                  <span>वापराची पद्धत</span>
                </h2>
              </div>
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={videoEmbedUrl}
                  title="Product Video"
                  className="absolute top-0 left-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  data-testid="product-video"
                ></iframe>
              </div>
            </div>
          )}

          {/* Specifications Section */}
          {selectedProduct.specifications && Object.values(selectedProduct.specifications).some(val => val) && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100">
                <h2 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                  <span>⭐</span>
                  <span>महत्वाचे गुणधर्म</span>
                </h2>
              </div>
              <div className="p-4">
                <table className="w-full text-sm" data-testid="specifications-table">
                  <tbody className="divide-y divide-gray-200">
                    {selectedProduct.specifications.ingredients && (
                      <tr>
                        <td className="py-3 pr-4 font-semibold text-gray-700">घटक</td>
                        <td className="py-3 text-gray-600">{selectedProduct.specifications.ingredients}</td>
                      </tr>
                    )}
                    {selectedProduct.specifications.quantity && (
                      <tr>
                        <td className="py-3 pr-4 font-semibold text-gray-700">प्रमाण</td>
                        <td className="py-3 text-gray-600">{selectedProduct.specifications.quantity}</td>
                      </tr>
                    )}
                    {selectedProduct.specifications.usageMethod && (
                      <tr>
                        <td className="py-3 pr-4 font-semibold text-gray-700">वापरण्याची पद्धत</td>
                        <td className="py-3 text-gray-600">{selectedProduct.specifications.usageMethod}</td>
                      </tr>
                    )}
                    {selectedProduct.specifications.effectiveness && (
                      <tr>
                        <td className="py-3 pr-4 font-semibold text-gray-700">परिणामकारकता</td>
                        <td className="py-3 text-gray-600">{selectedProduct.specifications.effectiveness}</td>
                      </tr>
                    )}
                    {selectedProduct.specifications.applicableCrops && (
                      <tr>
                        <td className="py-3 pr-4 font-semibold text-gray-700">पिकांसाठी लागू</td>
                        <td className="py-3 text-gray-600">{selectedProduct.specifications.applicableCrops}</td>
                      </tr>
                    )}
                    {selectedProduct.specifications.additionalInfo && (
                      <tr>
                        <td className="py-3 pr-4 font-semibold text-gray-700">अतिरिक्त माहिती</td>
                        <td className="py-3 text-gray-600">{selectedProduct.specifications.additionalInfo}</td>
                      </tr>
                    )}
                    {selectedProduct.specifications.specialNotes && (
                      <tr>
                        <td className="py-3 pr-4 font-semibold text-gray-700">विशेष टिप्पनी</td>
                        <td className="py-3 text-gray-600">{selectedProduct.specifications.specialNotes}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Description Section */}
          {selectedProduct.description && (
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="font-bold text-gray-800 mb-2 text-sm">विस्तृत वर्णन</h3>
              <p className="text-gray-600 leading-relaxed text-sm">{selectedProduct.description}</p>
            </div>
          )}
        </div>

        {/* Sticky Footer - Buy Now Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-40">
          <div className="container mx-auto px-4 py-3">
            <button
              onClick={() => {
                addToCart(selectedProduct, productQuantity, currentOfferType);
                setShowCart(true);
              }}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-4 rounded-xl transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
              data-testid="detail-buy-now-btn"
            >
              <span className="text-lg">खरेदी करा</span>
              <span className="text-xl">→</span>
            </button>
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
            {displayProducts.map(product => {
              const discountPercent = product.mrp && product.price < product.mrp 
                ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                : null;
              
              const hasSpecialOffer = product.specialOffer?.offerName && 
                                     product.specialOffer?.quantity && 
                                     product.specialOffer?.offerPricePerUnit;
              
              return (
                <div 
                  key={product.id} 
                  onClick={() => setSelectedProduct(product)}
                  className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden transform hover:scale-[1.02] active:scale-[0.98]"
                  data-testid={`product-card-${product.id}`}
                >
                  {/* Product Image */}
                  <div className="relative">
                    <img 
                      src={product.image || 'https://via.placeholder.com/400x300?text=Product+Image'} 
                      alt={product.name}
                      className="w-full h-36 object-cover"
                    />
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-3 space-y-2">
                    {/* Product Name */}
                    <h3 className="text-base font-normal text-gray-800 line-clamp-2 leading-tight" data-testid="product-name">
                      {product.name}
                    </h3>
                    
                    {/* Price Section */}
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-900" data-testid="product-price">
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
                      <div className="bg-red-50 border border-red-200 rounded-md px-2 py-1">
                        <span className="text-xs font-bold text-red-600" data-testid="product-offer">
                          {product.offer}
                        </span>
                      </div>
                    )}
                    
                    {/* Special Offer Text */}
                    {hasSpecialOffer && (
                      <p className="text-xs font-bold text-red-600">
                        ऑफर किंमत ₹{product.specialOffer.offerPricePerUnit}/ प्रति नग
                      </p>
                    )}
                    
                    {/* Buy Now Button - Full Width Dark Green */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product, 1, 'regular');
                        setShowCart(true);
                      }}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-lg transition-all duration-200 shadow-md"
                      data-testid="buy-now-btn"
                    >
                      खरेदी करा
                    </button>
                  </div>
                </div>
              );
            })}
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

            {/* Address Section */}
            <div className="p-4 border-b-2 border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">📍</span>
                  <h3 className="font-bold text-gray-800">आपला डिलिव्हरी पत्ता</h3>
                </div>
                <button
                  onClick={deliveryAddress ? handleEditAddress : () => setShowAddressDialog(true)}
                  className="text-emerald-700 hover:text-emerald-800 font-bold text-sm flex items-center space-x-1"
                  data-testid="add-address-btn"
                >
                  <Plus className="w-4 h-4" />
                  <span>{deliveryAddress ? 'पत्ता बदला' : 'पत्ता जोडा'}</span>
                </button>
              </div>
              
              {deliveryAddress ? (
                <div className="bg-white rounded-lg p-3 border border-gray-200" data-testid="address-display">
                  <p className="font-bold text-gray-800 text-sm">{deliveryAddress.name}</p>
                  <p className="text-gray-600 text-xs mt-1">
                    {deliveryAddress.addressLine}, {deliveryAddress.cityVillage}, {deliveryAddress.state}, {deliveryAddress.pincode}
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2" data-testid="address-error">
                  <span className="text-red-500 text-lg">⚠️</span>
                  <p className="text-red-700 text-sm font-semibold">कृपया डिलिव्हरी पत्ता जोडा</p>
                </div>
              )}
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
                  {cartTotals.items.map(item => {
                    const pricing = item.pricing;
                    const hasSpecialOffer = item.specialOffer?.offerName && 
                                           item.specialOffer?.quantity && 
                                           item.specialOffer?.offerPricePerUnit;
                    const currentOfferType = item.offerType || 'regular';
                    
                    return (
                      <div key={item.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-md transition">
                        <div className="flex space-x-3">
                          <img 
                            src={item.image || 'https://via.placeholder.com/80x80?text=Product'} 
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-bold text-gray-800 text-sm leading-tight">{item.name}</h3>
                                {currentOfferType === 'bulk' && hasSpecialOffer && (
                                  <span className="inline-block mt-1 bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                    🎁 {item.specialOffer.offerName}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-500 hover:text-red-700 ml-2 p-1 hover:bg-red-50 rounded transition"
                                data-testid="cart-remove-item"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            
                            {/* Offer Selection - Only show if special offer exists */}
                            {hasSpecialOffer && (
                              <div className="mb-2 space-y-1">
                                <div className="flex items-center space-x-2">
                                  {/* Regular Offer */}
                                  <button
                                    onClick={() => updateCartOfferType(item.id, 'regular')}
                                    className={`flex-1 text-left rounded-md px-2 py-1.5 border text-xs transition ${
                                      currentOfferType === 'regular' 
                                        ? 'bg-orange-50 border-orange-400 font-bold' 
                                        : 'bg-gray-50 border-gray-300'
                                    }`}
                                    data-testid="cart-offer-regular"
                                  >
                                    <div className="flex items-center space-x-1">
                                      <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                                        currentOfferType === 'regular' ? 'border-orange-600' : 'border-gray-400'
                                      }`}>
                                        {currentOfferType === 'regular' && (
                                          <div className="w-1.5 h-1.5 rounded-full bg-orange-600"></div>
                                        )}
                                      </div>
                                      <span>नियमित</span>
                                    </div>
                                  </button>
                                  
                                  {/* Bulk Offer */}
                                  <button
                                    onClick={() => updateCartOfferType(item.id, 'bulk')}
                                    className={`flex-1 text-left rounded-md px-2 py-1.5 border text-xs transition ${
                                      currentOfferType === 'bulk' 
                                        ? 'bg-emerald-50 border-emerald-500 font-bold' 
                                        : 'bg-gray-50 border-gray-300'
                                    }`}
                                    data-testid="cart-offer-bulk"
                                  >
                                    <div className="flex items-center space-x-1">
                                      <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                                        currentOfferType === 'bulk' ? 'border-emerald-600' : 'border-gray-400'
                                      }`}>
                                        {currentOfferType === 'bulk' && (
                                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                                        )}
                                      </div>
                                      <span>बल्क ऑफर</span>
                                    </div>
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {/* Price Display */}
                            {currentOfferType === 'bulk' && hasSpecialOffer && pricing.discount > 0 ? (
                              <div className="mb-2 space-y-1">
                                <div className="flex items-center space-x-2">
                                  <p className="text-emerald-600 font-bold text-base">₹{Math.round(pricing.total)}</p>
                                  <p className="text-gray-400 text-xs line-through">₹{Math.round(pricing.subtotal)}</p>
                                </div>
                                {pricing.itemsAtOfferPrice > 0 && (
                                  <p className="text-xs text-emerald-700">
                                    {pricing.itemsAtOfferPrice} @ ₹{item.specialOffer.offerPricePerUnit}
                                    {pricing.itemsAtRegularPrice > 0 && ` + ${pricing.itemsAtRegularPrice} @ ₹${item.price}`}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-emerald-600 font-bold text-base mb-2">₹{item.price} × {item.quantity}</p>
                            )}
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 bg-gray-100 rounded-lg p-1">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="bg-white hover:bg-gray-200 w-7 h-7 rounded-md flex items-center justify-center font-bold text-gray-700 transition"
                                  data-testid="cart-quantity-minus"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="font-bold text-gray-800 w-8 text-center" data-testid="cart-quantity-value">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white w-7 h-7 rounded-md flex items-center justify-center font-bold transition"
                                  data-testid="cart-quantity-plus"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-gray-200 bg-amber-50 p-5 space-y-4">
                {/* Bill Breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="font-semibold">मुल्य:</span>
                    <span className="font-bold">₹{Math.round(cartTotals.subtotal)}</span>
                  </div>
                  {cartTotals.discount > 0 && (
                    <div className="flex items-center justify-between text-emerald-700">
                      <span className="font-semibold">डिस्काउंट:</span>
                      <span className="font-bold">- ₹{Math.round(cartTotals.discount)}</span>
                    </div>
                  )}
                  <div className="border-t-2 border-dashed border-gray-300 pt-2"></div>
                  <div className="flex items-center justify-between text-xl">
                    <span className="font-bold text-gray-800">एकूण रक्कम:</span>
                    <span className="font-bold text-emerald-700">₹{Math.round(totalAmount)}</span>
                  </div>
                  <p className="text-xs text-gray-600 text-center">देय रक्कमेमध्ये जीएसटी व अन्य करांचा समावेश</p>
                </div>
                <button
                  onClick={handleWhatsAppCheckout}
                  disabled={!deliveryAddress}
                  className={`w-full font-bold py-4 rounded-xl transition flex items-center justify-center space-x-2 shadow-lg ${
                    deliveryAddress 
                      ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  data-testid="whatsapp-order-btn"
                >
                  {deliveryAddress ? (
                    <>
                      <span className="text-lg">ऑर्डर करा</span>
                      <span className="text-xl">💬</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">🔒</span>
                      <span className="text-lg">ऑर्डर करा (पत्ता आवश्यक)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Address Dialog */}
      {showAddressDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-60" onClick={() => setShowAddressDialog(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Dialog Header */}
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white p-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">डिलिव्हरी पत्ता जोडा</h2>
              <button 
                onClick={() => setShowAddressDialog(false)} 
                className="hover:bg-emerald-600 p-2 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dialog Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  नाव <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addressForm.name}
                  onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                  placeholder="आपले पूर्ण नाव"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none transition"
                  data-testid="address-name-input"
                />
              </div>

              {/* Address Line (Nearby, Landmark, Road) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  पत्ता/लँडमार्क <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addressForm.addressLine}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                  placeholder="जवळ, लँडमार्क, रस्ता (उदा: Near To Shetakri Chowk, बस्ती)"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none transition"
                  data-testid="address-line-input"
                />
              </div>

              {/* City/Village */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  गाव/शहर <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addressForm.cityVillage}
                  onChange={(e) => setAddressForm({ ...addressForm, cityVillage: e.target.value })}
                  placeholder="गाव किंवा शहराचे नाव (उदा: Savargaon, जुनर)"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none transition"
                  data-testid="address-city-input"
                />
              </div>

              {/* State and Pincode Row */}
              <div className="grid grid-cols-2 gap-3">
                {/* State (Prefilled) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    राज्य <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 focus:border-emerald-500 focus:outline-none transition"
                    data-testid="address-state-input"
                  />
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    पिनकोड <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.pincode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setAddressForm({ ...addressForm, pincode: value });
                    }}
                    placeholder="६ अंकी"
                    maxLength="6"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none transition"
                    data-testid="address-pincode-input"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveAddress}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-lg transition shadow-md"
                data-testid="save-address-btn"
              >
                पत्ता सेव्ह करा
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
