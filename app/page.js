'use client';

import { useState, useMemo, useEffect } from 'react';
import { ShoppingCart, Search, Phone, Plus, X, ChevronLeft, ChevronRight, Minus, Menu, LogOut, Settings, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { calculateOfferPricing, calculateCartTotal, formatDiscount, calculateCartWeight, calculateDeliveryCharge } from '@/lib/offerCalculations';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import CropView from '@/components/CropView';
import AllCropsView from '@/components/AllCropsView';
import BlogDetailView from '@/components/BlogDetailView';

// Predefined Categories - Always show these 4
const PREDEFINED_CATEGORIES = [
  { name: 'बीज', icon: 'https://customer-assets.emergentagent.com/job_wave-hello-115/artifacts/k2emiz37_seed.png', slug: 'seeds' },
  { name: 'पोषण', icon: 'https://customer-assets.emergentagent.com/job_wave-hello-115/artifacts/ipngkbvw_nutrition.png', slug: 'nutrition' },
  { name: 'संरक्षण', icon: 'https://customer-assets.emergentagent.com/job_wave-hello-115/artifacts/9881c6ec_protection.png', slug: 'protection' },
  { name: 'हार्डवेअर', icon: 'https://customer-assets.emergentagent.com/job_wave-hello-115/artifacts/qunfy0qm_hardware.png', slug: 'hardware' }
];

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

export default function Home() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null); // State for crop navigation
  const [selectedBlog, setSelectedBlog] = useState(null); // State for blog detail view
  const [showAllCrops, setShowAllCrops] = useState(false); // State for all crops view
  const [currentBanner, setCurrentBanner] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedOffers, setSelectedOffers] = useState({}); // Track offer type: 'regular' or 'bulk'
  const [productQuantity, setProductQuantity] = useState(1); // Quantity for product detail page
  const [showShareMenu, setShowShareMenu] = useState(false); // Share menu toggle
  const [copySuccess, setCopySuccess] = useState(false); // Copy link feedback
  const [showSidebar, setShowSidebar] = useState(false); // Burger menu sidebar
  
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
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart]);

  // Handle history API for all navigation states
  useEffect(() => {
    if (selectedProduct || showSearch || selectedCategory || selectedCrop || selectedBlog || showAllCrops) {
      // Push a new state when any modal/view opens
      window.history.pushState({ 
        modalOpen: !!selectedProduct,
        searchOpen: showSearch,
        categoryOpen: !!selectedCategory,
        cropOpen: !!selectedCrop,
        blogOpen: !!selectedBlog,
        allCropsOpen: showAllCrops
      }, '');
      
      const handlePopState = (event) => {
        // Close modal/view when back button is pressed
        if (selectedProduct) {
          setSelectedProduct(null);
          setProductQuantity(1);
        } else if (selectedBlog) {
          setSelectedBlog(null);
        } else if (selectedCrop) {
          setSelectedCrop(null);
        } else if (showAllCrops) {
          setShowAllCrops(false);
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
  }, [selectedProduct, showSearch, selectedCategory, selectedCrop, selectedBlog, showAllCrops]);

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

  // Close share menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showShareMenu && !event.target.closest('[data-testid="share-icon"]') && !event.target.closest('.absolute')) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu]);

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
        setProducts(data.products || []);
        setBanners(data.banners || []);
        setBlogs(data.blogs || []);
        
        // Track homepage view (only once per session)
        trackView(data.id);
      }
    } catch (error) {
      console.log('No shop data yet:', error.message);
      // Set placeholder data
      setShopData({
        shop_name: 'Shop Name',
        shop_number: '0000000000',
        shop_address: 'Shop Address',
        social_links: { instagram: '', facebook: '', youtube: '' }
      });
      setProducts([]);
      setBanners([]);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Track homepage view
  const trackView = async (shopId) => {
    try {
      // Check if already viewed in this session
      const viewedKey = `shop_viewed_${shopId}`;
      if (sessionStorage.getItem(viewedKey)) {
        return; // Already counted this session
      }

      // Get current overview data
      const { data, error } = await supabase
        .from('shop_data')
        .select('overview')
        .eq('id', shopId)
        .single();

      if (error) throw error;

      const currentOverview = data?.overview || { totalViews: 0, totalOrders: 0, orderHistory: [] };
      const updatedOverview = {
        ...currentOverview,
        totalViews: (currentOverview.totalViews || 0) + 1
      };

      // Update view count
      await supabase
        .from('shop_data')
        .update({ overview: updatedOverview })
        .eq('id', shopId);

      // Mark as viewed in this session
      sessionStorage.setItem(viewedKey, 'true');
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  // Handle product, crop, and blog URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product');
    const openCart = urlParams.get('openCart');
    const cropParam = urlParams.get('crop');
    const blogId = urlParams.get('blog');
    
    if (productId && products.length > 0) {
      const product = products.find(p => p.id === productId);
      if (product) {
        setSelectedProduct(product);
      }
    }
    
    // Handle crop and blog navigation from URL
    if (cropParam && blogs.length > 0) {
      const decodedCrop = decodeURIComponent(cropParam);
      setSelectedCrop(decodedCrop);
      
      // If blog ID is also present, open that specific blog
      if (blogId) {
        const blog = blogs.find(b => b.id === blogId && b.selectedCrop === decodedCrop);
        if (blog) {
          setSelectedBlog(blog);
        }
      }
    }
    
    if (openCart === 'true') {
      setShowCart(true);
      // Remove the parameter from URL
      window.history.replaceState({}, '', '/');
    }
  }, [products, blogs]);

  // Auto-slide banners every 3 seconds
  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % banners.length);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  // Enhanced search functionality with keyword mapping - Category Aware
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    
    // First filter products by category if on category page
    const productsToSearch = selectedCategory 
      ? products.filter(p => p.category === selectedCategory)
      : products;
    
    // Then apply search filter
    return productsToSearch.filter(product => {
      const matchesName = product.name?.toLowerCase().includes(query);
      const matchesDescription = product.description?.toLowerCase().includes(query);
      const matchesCategory = product.category?.toLowerCase().includes(query);
      
      // Search in hidden keywords
      const matchesKeywords = product.searchKeywords?.some(keyword => 
        keyword.toLowerCase().includes(query) || query.includes(keyword.toLowerCase())
      );
      
      return matchesName || matchesDescription || matchesCategory || matchesKeywords;
    });
  }, [searchQuery, products, selectedCategory]);

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
    return true;
  };

  // Add all products to cart
  const addAllToCart = (productsToAdd) => {
    try {
      let updatedCart = [...cart];
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
      
      setCart(updatedCart);
      return addedCount;
    } catch (error) {
      console.error('Error adding all to cart:', error);
      return 0;
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

  // Calculate cart weight and delivery charges
  const cartWeight = useMemo(() => {
    return calculateCartWeight(cart);
  }, [cart]);

  const deliveryCharge = useMemo(() => {
    return calculateDeliveryCharge(cartWeight, shopData?.delivery?.slabs || []);
  }, [cartWeight, shopData?.delivery?.slabs]);

  const totalAmount = cartTotals.total + deliveryCharge;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const generateWhatsAppMessage = () => {
    // Shop and customer details
    let message = `दुकान: ${shopData?.shop_name || 'Shop Name'}\n\n`;
    message += `ग्राहक नाव: ${deliveryAddress?.name || ''}\n`;
    message += `पत्ता: ${deliveryAddress?.addressLine || ''}, ${deliveryAddress?.cityVillage || ''}, ${deliveryAddress?.state || ''}, ${deliveryAddress?.pincode || ''}\n\n`;
    message += 'मला खरेदी करायची आहे:\n\n';
    
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
    
    // Add product total before delivery
    message += `\nउत्पादने एकूण: ₹${Math.round(cartTotals.total)}\n`;
    
    // Add delivery charges with weight info
    if (deliveryCharge > 0) {
      const weightInKg = (cartWeight / 1000).toFixed(2);
      message += `डिलिव्हरी शुल्क (${weightInKg}kg): ₹${deliveryCharge}\n`;
    } else {
      message += `डिलिव्हरी शुल्क: विनामूल्य\n`;
    }
    
    message += `\nएकूण देय रक्कम: ₹${Math.round(totalAmount)}`;
    return encodeURIComponent(message);
  };

  const handleWhatsAppCheckout = async () => {
    if (cart.length === 0) {
      alert('कृपया प्रथम कार्टमध्ये उत्पादने जोडा!');
      return;
    }
    if (!deliveryAddress) {
      alert('कृपया प्रथम डिलिव्हरी पत्ता जोडा!');
      return;
    }
    
    // Track order before opening WhatsApp
    await trackOrder();
    
    const whatsappUrl = `https://wa.me/${shopData?.shop_number}?text=${generateWhatsAppMessage()}`;
    window.open(whatsappUrl, '_blank');
  };

  // Track order in overview
  const trackOrder = async () => {
    try {
      if (!shopData?.id) return;

      // Get current overview data
      const { data, error } = await supabase
        .from('shop_data')
        .select('overview')
        .eq('id', shopData.id)
        .single();

      if (error) throw error;

      const currentOverview = data?.overview || { totalViews: 0, totalOrders: 0, orderHistory: [] };
      
      // Prepare order details
      const orderDetails = {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orderDate: new Date().toISOString(),
        customerName: deliveryAddress.name,
        customerAddress: `${deliveryAddress.addressLine}, ${deliveryAddress.cityVillage}, ${deliveryAddress.state}, ${deliveryAddress.pincode}`,
        products: cartTotals.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.pricing.itemsAtOfferPrice > 0 ? item.specialOffer.offerPricePerUnit : item.price,
          total: item.pricing.total
        })),
        subtotal: cartTotals.subtotal,
        discount: cartTotals.discount,
        totalAmount: totalAmount
      };

      // Update overview with new order
      const updatedOverview = {
        ...currentOverview,
        totalOrders: (currentOverview.totalOrders || 0) + 1,
        orderHistory: [...(currentOverview.orderHistory || []), orderDetails]
      };

      // Save to database
      await supabase
        .from('shop_data')
        .update({ overview: updatedOverview })
        .eq('id', shopData.id);

    } catch (error) {
      console.error('Error tracking order:', error);
    }
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
        <header className="bg-gradient-to-r from-[#177B3B] to-[#01582E] text-white sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={handleCloseModal}
                className="flex items-center space-x-2 hover:bg-white/10 px-3 py-2 rounded-xl transition bg-white/5 backdrop-blur-sm"
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
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-full transition-all duration-200"
                    data-testid="share-icon"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  {showShareMenu && (
                    <div className="absolute right-0 top-12 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-48 z-50">
                      <button
                        onClick={() => {
                          const productUrl = `${window.location.origin}?product=${selectedProduct.id}`;
                          navigator.clipboard.writeText(productUrl).then(() => {
                            setCopySuccess(true);
                            setTimeout(() => {
                              setCopySuccess(false);
                              setShowShareMenu(false);
                            }, 1500);
                          });
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 transition"
                        data-testid="copy-link-btn"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium">{copySuccess ? '✓ Copied!' : 'Copy Link'}</span>
                      </button>
                      <button
                        onClick={() => {
                          const productUrl = `${window.location.origin}?product=${selectedProduct.id}`;
                          const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(productUrl)}`;
                          window.open(whatsappShareUrl, '_blank');
                          setShowShareMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 transition"
                        data-testid="share-whatsapp-btn"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        <span className="text-sm font-medium">Share to WhatsApp</span>
                      </button>
                    </div>
                  )}
                </div>
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
                  className="bg-gradient-to-r from-[#177B3B] to-[#01582E] hover:from-[#1a8e45] hover:to-[#016a37] text-white w-9 h-9 rounded-md flex items-center justify-center font-bold transition shadow-sm"
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
                // Close the product detail modal
                setSelectedProduct(null);
                setProductQuantity(1);
                // Open the cart
                setShowCart(true);
              }}
              className="w-full bg-gradient-to-r from-[#177B3B] to-[#01582E] hover:from-[#1a8e45] hover:to-[#016a37] text-white font-bold py-4 rounded-xl transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
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

  // Show AllCropsView if showAllCrops is true
  if (showAllCrops) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-[#177B3B] to-[#01582E] text-white sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => {
                    if (window.history.state?.allCropsOpen) {
                      window.history.back();
                    } else {
                      setShowAllCrops(false);
                    }
                  }}
                  className="flex items-center space-x-2 hover:bg-white/10 px-3 py-2 rounded-xl transition bg-white/5 backdrop-blur-sm"
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
                      className="p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 active:scale-95 bg-white/5 backdrop-blur-sm"
                    >
                      <Menu className="w-5 h-5" />
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
                  className="relative p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 active:scale-95 bg-white/5 backdrop-blur-sm"
                  data-testid="cart-button"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        <AllCropsView 
          blogs={blogs}
          onBack={() => setShowAllCrops(false)}
          onSelectCrop={(cropName) => {
            setSelectedCrop(cropName);
            setShowAllCrops(false);
          }}
          shopData={shopData}
        />
      </div>
    );
  }

  // Show BlogDetailView if a blog is selected
  if (selectedBlog && selectedCrop) {
    return (
      <BlogDetailView
        blog={selectedBlog}
        cropName={selectedCrop}
        back={() => setSelectedBlog(null)}
        shopData={shopData}
        addToCart={addToCart}
        addAllToCart={addAllToCart}
        openCart={() => {
          setSelectedBlog(null);
          setSelectedCrop(null);
          setShowCart(true);
        }}
      />
    );
  }

  // Show CropView if a crop is selected
  if (selectedCrop) {
    return (
      <CropView 
        cropName={selectedCrop}
        back={() => setSelectedCrop(null)}
        shopData={shopData}
        blogs={blogs}
        cart={cart}
        addToCart={addToCart}
        addAllToCart={addAllToCart}
        openCart={() => {
          setSelectedCrop(null);
          setShowCart(true);
        }}
        onSelectBlog={(blog) => setSelectedBlog(blog)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#177B3B] to-[#01582E] text-white sticky top-0 z-50 rounded-b-[32px]">
        <div className="container mx-auto px-4 py-4">
          {/* Top Row: Logo, Shop Info, Cart */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3" onClick={() => { setSelectedCategory(null); setSelectedCrop(null); setShowAllCrops(false); setShowSearch(false); setSearchQuery(''); }} style={{ cursor: 'pointer' }}>
              {/* Logo */}
              <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
  <img 
    src="/images/logo.png" 
    alt="Logo" 
    className="w-full h-full object-contain"
  />
</div>
              <div>
                <h1 className="text-base md:text-lg font-bold leading-tight uppercase tracking-wide">{shopData?.shop_name || 'SHOP NAME'}</h1>
                <p className="text-xs text-white/90 uppercase">{shopData?.shop_address || 'SHOP ADDRESS'}</p>
              </div>
            </div>
            
            {/* Right Side: Menu & Cart */}
            <div className="flex items-center space-x-2">
              {/* Admin Menu */}
              {user && (
                <div className="relative">
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 active:scale-95 bg-white/5 backdrop-blur-sm"
                  >
                    <Menu className="w-5 h-5" />
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
              
              {/* Cart Button with Badge */}
              <button 
                onClick={() => setShowCart(true)}
                className="relative p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 active:scale-95 bg-white/5 backdrop-blur-sm"
                data-testid="cart-button"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar Row */}
          <div className="relative">
            <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg">
              <input
                type="text"
                placeholder="Search for products, brands and more"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearch(true);
                  setSelectedCategory(null);
                }}
                onFocus={() => setShowSearch(true)}
                className="w-full pl-5 pr-14 py-3 text-gray-700 placeholder-gray-500 focus:outline-none bg-transparent"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#177B3B] hover:bg-[#01582E] p-2.5 rounded-xl transition-all duration-200">
                <Search className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Banner Carousel */}
      {!showSearch && !selectedCategory && banners.length > 0 && (
        <section className="relative overflow-hidden bg-gray-50 px-4 pt-6">
          <div className="relative h-40 rounded-3xl overflow-hidden">
            {banners.map((banner, index) => {
              const BannerContent = () => (
                <div className="relative h-full flex items-center justify-center overflow-hidden bg-gray-100">
                  {banner.image ? (
                    <img src={applyCloudinaryOptimization(banner.image)} alt={`Banner ${banner.order || index + 1}`} className="w-full h-full object-cover" />
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
              {/* Banner Navigation Dots */}
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBanner(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentBanner ? 'bg-white w-6' : 'bg-white/60 w-2'
                    }`}
                  />
                ))}
              </div>
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
                className="bg-gradient-to-br from-white to-gray-50 p-3 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 flex flex-col items-center space-y-2 relative border border-[#177B3B]/30 hover:border-[#177B3B]"
              >
                <div className="w-12 h-12 flex items-center justify-center">
                  <img 
                    src={category.icon} 
                    alt={category.name}
                    className="w-full h-full object-contain"
                    style={{
                      filter: 'brightness(0) saturate(100%) invert(32%) sepia(98%) saturate(558%) hue-rotate(103deg) brightness(93%) contrast(89%)'
                    }}
                  />
                </div>
                <h3 className="text-xs font-semibold text-gray-800 text-center leading-tight">{category.name}</h3>
                <span className={`text-[10px] font-bold ${category.count > 0 ? 'text-[#177B3B]' : 'text-gray-400'}`}>
                  {category.count > 0 ? `${category.count} उत्पादने` : '0 उत्पादने'}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Products Section */}
      <section className="container mx-auto px-4 py-8 flex-1">
        {(showSearch && searchQuery) || selectedCategory ? (
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
            ) : (
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
            )}
          </div>
        ) : null}

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
          <div className="grid grid-cols-2 gap-2">
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
                  className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden transform hover:scale-[1.03] active:scale-[0.98] border border-gray-100"
                  data-testid={`product-card-${product.id}`}
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
                          setShowCart(true);
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
        )}
      </section>

      {/* Divider Section */}
      {!showSearch && !selectedCategory && (
        <section className="container mx-auto px-4 py-8">
          <div className="border-t-2 border-[#177B3B]/30"></div>
        </section>
      )}


      {/* Blogs Section */}
      {!showSearch && !selectedCategory && blogs.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">कृषी माहिती</h2>
            <p className="text-gray-600">शेती संबंधित माहिती, तंत्रज्ञान, सल्ले</p>
          </div>

          {/* Horizontal Crop Selector */}
          <div className="mb-12 overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex space-x-6 min-w-max px-2">
              {(() => {
                // Complete crop list - matching AllCropsView
                const CROP_CATEGORIES = [
                  {
                    name: 'नगदी पिके',
                    crops: ['ऊस', 'कापूस', 'कॉफी', 'तंबाखू', 'केसरी', 'अळशी']
                  },
                  {
                    name: 'भाज्या',
                    crops: ['वांगी', 'कोबी', 'पत्ता कोबी', 'टोमॅटो', 'डिंक गवार', 'कांदा', 'बटाटा', 'गवार', 'कारले', 'चवळी', 'तिखट मिरची', 'भेंडी', 'दुधी भोपळा', 'कॉलीफ्लॉवर', 'आले', 'घेवडा', 'दोडका', 'हळद', 'डांगर भोपळा', 'ढोबळी मिरची', 'शेवगा', 'काकडी', 'गाजर', 'मुळा', 'पालक', 'ब्रॉकली', 'घोसाळे', 'टिंडा', 'ढेमसे', 'लसूण', 'कोथिंबीर', 'मेथी पाला', 'कांद्याची पात']
                  },
                  {
                    name: 'डाळी',
                    crops: ['उडीद', 'चणा', 'मुग', 'तूर', 'मसूर', 'राजमा']
                  },
                  {
                    name: 'तेलबिया',
                    crops: ['तीळ', 'एरंड', 'भुईमूग', 'मोहरी', 'सोयाबीन', 'सूर्यफूल', 'कुसुम']
                  },
                  {
                    name: 'तृणधान्ये',
                    crops: ['बाजरी', 'मका', 'भात', 'गहू', 'गोड मका', 'ज्वार', 'नाचणी', 'वरई', 'जव']
                  },
                  {
                    name: 'फळे',
                    crops: ['कलिंगड', 'पपई', 'आंबा', 'डाळिंब', 'खरबूज', 'केळे', 'द्राक्षे', 'मोसंबी', 'संत्रा', 'लिंबू', 'काजू', 'अंजीर', 'पेरू', 'सीताफळ', 'बीट', 'रामफळ', 'जांभूळ', 'बोर', 'कोकम', 'फणस', 'नारळ', 'सुपारी', 'ड्रॅगन फ्रूट', 'अवोकाडो']
                  },
                  {
                    name: 'मसाले',
                    crops: ['जिरे', 'बडीशेप', 'मेथी', 'धणे', 'काळी मिरी', 'तमालपत्र', 'लवंग']
                  },
                  {
                    name: 'फुले',
                    crops: ['गुलाब', 'झेंडू', 'निशिगंध']
                  }
                ];

                // Flatten all crops with their categories
                const allCrops = CROP_CATEGORIES.flatMap(category => 
                  category.crops.map(crop => {
                    // Find first blog post for this crop
                    const cropBlogs = blogs.filter(blog => blog.selectedCrop === crop);
                    const firstBlogImage = cropBlogs.length > 0 ? cropBlogs[0].image : null;
                    
                    return {
                      name: crop,
                      image: firstBlogImage || `/images/crops/${crop}.webp`, // Use first blog image or fallback to static
                      category: category.name
                    };
                  })
                );
                
                // Add post count and index to each crop
                const cropsWithData = allCrops.map((crop, index) => ({
                  ...crop,
                  postCount: blogs.filter(blog => blog.selectedCrop === crop.name).length,
                  originalIndex: index // Keep original order for "latest" logic
                }));
                
                // Sort by post count (desc), then by original index (asc for latest)
                const sortedCrops = cropsWithData
                  .filter(crop => crop.postCount > 0) // Only crops with posts
                  .sort((a, b) => {
                    if (b.postCount !== a.postCount) {
                      return b.postCount - a.postCount; // Higher post count first
                    }
                    return a.originalIndex - b.originalIndex; // If equal, show "latest" (earlier in list)
                  });
                
                // Get top 6 crops only
                const topCrops = sortedCrops.slice(0, 6);
                
                return [
                  ...topCrops.map((crop, index) => (
                    <button
                      key={`crop-${index}`}
                      onClick={() => {
                        setSelectedCrop(crop.name);
                      }}
                      className="flex-shrink-0 flex flex-col items-center space-y-2 transition-all duration-300 hover:transform hover:scale-105"
                      data-testid={`crop-selector-${crop.name}`}
                    >
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-4 border-white shadow-lg hover:shadow-xl flex items-center justify-center overflow-hidden">
                        <img 
                          src={crop.image} 
                          alt={crop.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/80x80/f59e0b/ffffff?text=' + encodeURIComponent(crop.name.charAt(0));
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-center whitespace-nowrap text-gray-700">
                        {crop.name}
                      </span>
                    </button>
                  )),
                  // Add "सर्व पीके" button as 7th item
                  <button
                    key="all-crops"
                    onClick={() => setShowAllCrops(true)}
                    className="flex-shrink-0 flex flex-col items-center space-y-2 transition-all duration-300 hover:transform hover:scale-105"
                    data-testid="crop-selector-all"
                  >
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#177B3B]/20 via-[#01582E]/20 to-[#177B3B]/30 border-4 border-white shadow-lg hover:shadow-xl flex items-center justify-center overflow-hidden">
                      <svg className="w-12 h-12 text-[#177B3B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-center whitespace-nowrap text-gray-700">
                      सर्व पीके
                    </span>
                  </button>
                ];
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.filter(blog => !blog.selectedCrop).map(blog => {
              // Define layout aspect ratios
              const layoutAspects = {
                standard: 16/9,
                portrait: 4/5,
                square: 1,
                wide: 21/9
              };
              const aspect = layoutAspects[blog.layout || 'standard'];
              
              return (
                <div key={blog.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col">
                  <div className="relative w-full bg-gray-100" style={{ paddingBottom: `${(1 / aspect) * 100}%` }}>
                    <img 
                      src={applyCloudinaryOptimization(blog.image) || 'https://via.placeholder.com/400x300?text=Blog+Image'} 
                      alt="Blog"
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
              );
            })}
          </div>
          
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
        </section>
      )}

      {/* FAQ Section - SEO Optimized */}
      {!showSearch && !selectedCategory && (
        <section className="bg-gradient-to-b from-gray-50 to-white py-12 mt-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2" data-testid="faq-title">
                वारंवार विचारले जाणारे प्रश्न
              </h2>
              <p className="text-gray-600">लोंढे कृषी सेवा केंद्र - कसबे तडवळे, धाराशिव</p>
            </div>
            
            <Accordion type="single" collapsible className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Question 1 - Location */}
              <AccordionItem value="item-1" className="border-b border-gray-200">
                <AccordionTrigger className="px-6 py-5 hover:bg-emerald-50 text-base font-semibold text-gray-800" data-testid="faq-q1">
                  लोंढे कृषी सेवा केंद्र कुठे आहे?
                </AccordionTrigger>
                <AccordionContent className="px-6 py-4 text-gray-700 leading-relaxed" data-testid="faq-a1">
                  आमचे कृषी केंद्र कसबे तडवळे ता. धाराशिव जि. धाराशिव पिन कोडं - 413405 येथे स्थित आहे. आमच्या दुकानात सर्व प्रकारचे शेतीचे बियाणे, खत, हार्डवेअर, औषधे आणि व्यावसायिक मार्गदर्शन सेवा उपलब्ध आहेत. संपर्क करण्यासाठी +91 87667 78588 या नंबरवर कॉल करा. आम्ही सकाळी 8:00 ते संध्याकाळी 8:00 पर्यंत सेवा देतो आणि शेतकऱ्यांना सर्वोत्तम कृषी उत्पादने व तांत्रिक मार्गदर्शन प्रदान करतो.
                </AccordionContent>
              </AccordionItem>

              {/* Question 2 - Best Agrishop */}
              <AccordionItem value="item-2" className="border-b border-gray-200">
                <AccordionTrigger className="px-6 py-5 hover:bg-emerald-50 text-base font-semibold text-gray-800" data-testid="faq-q2">
                  धाराशिव जवळ सर्वोत्तम कृषी दुकान कोणते आहे?
                </AccordionTrigger>
                <AccordionContent className="px-6 py-4 text-gray-700 leading-relaxed" data-testid="faq-a2">
                  लोंढे कृषी सेवा केंद्र हे धाराशिव परिसरातील सर्वोत्तम व विश्वासार्ह कृषी दुकान आहे. आमच्याकडे शेतीचे प्रमाणित बियाणे, सेंद्रिय व रासायनिक खते, कीटक व रोग नियंत्रण औषधे, शेती हार्डवेअर साधने आणि आधुनिक कृषी उपकरणे मोठ्या प्रमाणात उपलब्ध आहेत. आमची खासियत म्हणजे प्रत्येक उत्पादनासाठी तज्ञ मार्गदर्शन, स्पर्धात्मक किमती, घरपोच वितरण सेवा आणि शेतकऱ्यांना पिक व्यवस्थापनाचा मोफत सल्ला. आम्ही शेतकरी बांधवांना केवळ उत्पादने विकत नाही तर त्यांच्या शेतीच्या यशासाठी सतत मार्गदर्शन करतो.
                </AccordionContent>
              </AccordionItem>

              {/* Question 3 - Products Available */}
              <AccordionItem value="item-3" className="border-b border-gray-200">
                <AccordionTrigger className="px-6 py-5 hover:bg-emerald-50 text-base font-semibold text-gray-800" data-testid="faq-q3">
                  लोंढे कृषी सेवा केंद्र येथे कोणत्या प्रकारची बियाणे, खते आणि औषधे उपलब्ध आहेत?
                </AccordionTrigger>
                <AccordionContent className="px-6 py-4 text-gray-700 leading-relaxed" data-testid="faq-a3">
                  आमच्याकडे संपूर्ण कृषी उत्पादनांची विस्तृत श्रेणी उपलब्ध आहे. बियाणे विभागात भाजीपाला बियाणे, हायब्रीड पीक बियाणे, भात, ज्वारी, बाजरी, कापूस व इतर सर्व हंगामी पिकांचे प्रमाणित बियाणे मिळते. खते विभागात युरिया, डीएपी, एनपीके, सेंद्रिय खत, जैविक खते व सूक्ष्म पोषक द्रव्ये उपलब्ध आहेत. औषधे विभागात कीटकनाशके, बुरशीनाशके, तणनाशके आणि वाढ नियामक औषधे सर्व कंपन्यांचे उपलब्ध आहेत. याशिवाय शेतीसाठी आवश्यक हार्डवेअर साधने, स्प्रे पंप, ड्रिप इरिगेशन साहित्य आणि आधुनिक कृषी तंत्रज्ञान उत्पादने देखील मिळतात.
                </AccordionContent>
              </AccordionItem>

              {/* Question 4 - Technical Guidance */}
              <AccordionItem value="item-4" className="border-b border-gray-200">
                <AccordionTrigger className="px-6 py-5 hover:bg-emerald-50 text-base font-semibold text-gray-800" data-testid="faq-q4">
                  आम्हाला तांत्रिक मार्गदर्शन किंवा शेती सल्ला मिळतो का?
                </AccordionTrigger>
                <AccordionContent className="px-6 py-4 text-gray-700 leading-relaxed" data-testid="faq-a4">
                  होय, नक्कीच! लोंढे कृषी सेवा केंद्रात आम्ही केवळ उत्पादने विकत नाही तर शेतकऱ्यांना संपूर्ण तांत्रिक मार्गदर्शन व शेती सल्लामसलत मोफत देतो. आमच्याकडे अनुभवी कृषी तज्ञ आहेत जे पिक निवड, खत व्यवस्थापन, कीटक-रोग नियंत्रण, योग्य औषधांचा वापर, मृदा परीक्षण, पाण्याचे व्यवस्थापन आणि उत्पन्न वाढीसाठी आधुनिक तंत्रज्ञान यावर सविस्तर मार्गदर्शन करतात. तुम्ही कोणत्याही शेती समस्येसाठी +91 87667 78588 वर संपर्क करू शकता किंवा थेट आमच्या केंद्रावर येऊन तज्ञांशी चर्चा करू शकता. आम्ही शेतकऱ्यांच्या यशासाठी कटिबद्ध आहोत.
                </AccordionContent>
              </AccordionItem>

              {/* Question 5 - Delivery Service */}
              <AccordionItem value="item-5" className="border-b border-gray-200">
                <AccordionTrigger className="px-6 py-5 hover:bg-emerald-50 text-base font-semibold text-gray-800" data-testid="faq-q5">
                  घरपोच वितरण सेवा उपलब्ध आहे का?
                </AccordionTrigger>
                <AccordionContent className="px-6 py-4 text-gray-700 leading-relaxed" data-testid="faq-a5">
                  होय, आम्ही धाराशिव आणि आजूबाजूच्या सर्व गावांमध्ये घरपोच वितरण सेवा पुरवतो. तुम्ही WhatsApp (+91 87667 78588) द्वारे किंवा फोन कॉलवर तुमची ऑर्डर देऊ शकता आणि आम्ही लवकरात लवकर तुमच्या शेतावर किंवा घरी उत्पादने पोहोचवतो. मोठ्या ऑर्डरसाठी मोफत डिलिव्हरी सेवा उपलब्ध आहे. आमचे वाहन दररोज धाराशिव जिल्ह्यातील विविध गावांमध्ये जाते आणि शेतकऱ्यांना त्यांच्या दारात आवश्यक बियाणे, खते, औषधे पोहोचवते. यामुळे शेतकऱ्यांना वेळ आणि वाहतूक खर्च वाचतो. आपल्या सेवेत आपले समाधान हा आमचा ध्यास आहे.
                </AccordionContent>
              </AccordionItem>

              {/* Question 6 - Order Process & Payment */}
              <AccordionItem value="item-6">
                <AccordionTrigger className="px-6 py-5 hover:bg-emerald-50 text-base font-semibold text-gray-800" data-testid="faq-q6">
                  ऑर्डर कशी करावी आणि पेमेंटची पद्धत काय आहे?
                </AccordionTrigger>
                <AccordionContent className="px-6 py-4 text-gray-700 leading-relaxed" data-testid="faq-a6">
                  ऑर्डर करणे अगदी सोपे आहे! तुम्ही आमच्या वेबसाईटवर उत्पादने निवडून कार्टमध्ये जोडा आणि WhatsApp द्वारे थेट ऑर्डर पाठवा. किंवा तुम्ही +91 87667 78588 या नंबरवर फोन करून किंवा WhatsApp मेसेज पाठवून तुमची गरज सांगू शकता. पेमेंटसाठी आम्ही सर्व पद्धती स्वीकारतो - रोख, UPI, PhonePe, Google Pay, बँक ट्रान्सफर आणि विश्वासू ग्राहकांसाठी उधारी सुविधा देखील उपलब्ध आहे. आमच्या दुकानात थेट येऊन देखील उत्पादने खरेदी करू शकता. प्रत्येक उत्पादनासाठी योग्य बिल व हमी दिली जाते. तुमच्या सोयीनुसार कोणत्याही पद्धतीने खरेदी करा आणि तुमच्या शेतीला उत्तम उत्पादने मिळवा.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            {/* SEO Keywords Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                लोंढे कृषी सेवा केंद्र | कसबे तडवळे | धाराशिव | शेतीचे बियाणे | खत | औषधे | हार्डवेअर | कृषी मार्गदर्शन
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      {!showSearch && !selectedCategory && (
        <footer className="bg-gradient-to-r from-[#177B3B] to-[#01582E] text-white py-8 mt-auto rounded-t-[32px]">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">आमच्याशी संपर्क साधा</h3>
              {/* Social Media Icons inline */}
              {shopData?.social_links && (shopData.social_links.instagram || shopData.social_links.facebook || shopData.social_links.youtube) && (
                <div className="flex items-center space-x-3">
                  {shopData.social_links.instagram && (
                    <a
                      href={shopData.social_links.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all duration-200 group"
                      aria-label="Instagram"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  )}
                  
                  {shopData.social_links.facebook && (
                    <a
                      href={shopData.social_links.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all duration-200 group"
                      aria-label="Facebook"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  )}
                  
                  {shopData.social_links.youtube && (
                    <a
                      href={shopData.social_links.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all duration-200 group"
                      aria-label="YouTube"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>
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
            
            <div className="border-t border-white/20 mt-6 pt-6">
              <div className="flex items-center justify-between">
                <p className="text-white/80">© 2025 {shopData?.shop_name || 'Shop Name'}. सर्व हक्क राखीव.</p>
                {!user && (
                  <button
                    onClick={() => router.push('/login')}
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition flex items-center space-x-1.5 text-sm font-semibold"
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
            <div className="bg-gradient-to-r from-[#177B3B] to-[#01582E] text-white p-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">माझी कार्ट</h2>
                <p className="text-sm text-white/80">{cartItemCount} वस्तू</p>
              </div>
              <button onClick={() => setShowCart(false)} className="hover:bg-[#177B3B]/80 p-2 rounded-full transition">
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
                  className="text-[#177B3B] hover:text-[#01582E] font-bold text-sm flex items-center space-x-1"
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
                                  <span className="inline-block mt-1 bg-[#177B3B]/10 text-[#177B3B] text-[10px] px-2 py-0.5 rounded-full font-bold">
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
                                        ? 'bg-[#177B3B]/10 border-[#177B3B] font-bold' 
                                        : 'bg-gray-50 border-gray-300'
                                    }`}
                                    data-testid="cart-offer-bulk"
                                  >
                                    <div className="flex items-center space-x-1">
                                      <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                                        currentOfferType === 'bulk' ? 'border-[#177B3B]' : 'border-gray-400'
                                      }`}>
                                        {currentOfferType === 'bulk' && (
                                          <div className="w-1.5 h-1.5 rounded-full bg-[#177B3B]"></div>
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
                                  <p className="text-[#177B3B] font-bold text-base">₹{Math.round(pricing.total)}</p>
                                  <p className="text-gray-400 text-xs line-through">₹{Math.round(pricing.subtotal)}</p>
                                </div>
                                {pricing.itemsAtOfferPrice > 0 && (
                                  <p className="text-xs text-[#177B3B]">
                                    {pricing.itemsAtOfferPrice} @ ₹{item.specialOffer.offerPricePerUnit}
                                    {pricing.itemsAtRegularPrice > 0 && ` + ${pricing.itemsAtRegularPrice} @ ₹${item.price}`}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-[#177B3B] font-bold text-base mb-2">₹{item.price} × {item.quantity}</p>
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
                                  className="bg-gradient-to-r from-[#177B3B] to-[#01582E] hover:from-[#1a8e45] hover:to-[#016a37] text-white w-7 h-7 rounded-md flex items-center justify-center font-bold transition"
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
                    <div className="flex items-center justify-between text-[#177B3B]">
                      <span className="font-semibold">डिस्काउंट:</span>
                      <span className="font-bold">- ₹{Math.round(cartTotals.discount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2"></div>
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="font-semibold">उत्पादने एकूण:</span>
                    <span className="font-bold">₹{Math.round(cartTotals.total)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-700">
                    <div className="flex items-center space-x-1">
                      <span className="text-base">📦</span>
                      <span className="font-semibold">डिलिव्हरी शुल्क</span>
                      <span className="text-xs text-gray-500">({(cartWeight / 1000).toFixed(2)}kg)</span>
                    </div>
                    <span className="font-bold">
                      {deliveryCharge > 0 ? `₹${deliveryCharge}` : 'विनामूल्य'}
                    </span>
                  </div>
                  <div className="border-t-2 border-dashed border-gray-300 pt-2"></div>
                  <div className="flex items-center justify-between text-xl">
                    <span className="font-bold text-gray-800">एकूण देय रक्कम:</span>
                    <span className="font-bold text-[#177B3B]">₹{Math.round(totalAmount)}</span>
                  </div>
                  <p className="text-xs text-gray-600 text-center">देय रक्कमेमध्ये जीएसटी व अन्य करांचा समावेश</p>
                </div>
                <button
                  onClick={handleWhatsAppCheckout}
                  disabled={!deliveryAddress}
                  className={`w-full font-bold py-4 rounded-xl transition flex items-center justify-center space-x-2 shadow-lg ${
                    deliveryAddress 
                      ? 'bg-gradient-to-r from-[#177B3B] to-[#01582E] hover:from-[#1a8e45] hover:to-[#016a37] text-white' 
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
            <div className="bg-gradient-to-r from-[#177B3B] to-[#01582E] text-white p-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">डिलिव्हरी पत्ता जोडा</h2>
              <button 
                onClick={() => setShowAddressDialog(false)} 
                className="hover:bg-[#177B3B]/80 p-2 rounded-full transition"
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
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#177B3B] focus:outline-none transition"
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
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#177B3B] focus:outline-none transition"
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
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#177B3B] focus:outline-none transition"
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
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#177B3B] focus:outline-none transition"
                    data-testid="address-pincode-input"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveAddress}
                className="w-full bg-gradient-to-r from-[#177B3B] to-[#01582E] hover:from-[#1a8e45] hover:to-[#016a37] text-white font-bold py-3 rounded-lg transition shadow-md"
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
