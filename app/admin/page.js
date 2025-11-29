'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { Store, Package, Image as ImageIcon, User, LogOut, Save, Plus, X, Edit2, Trash2, Upload } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Shop Data
  const [shopData, setShopData] = useState({
    shop_name: '',
    shop_number: '',
    shop_address: '',
    products: [],
    banners: []
  });

  // Pending Products Queue (from Local Storage)
  const [pendingProducts, setPendingProducts] = useState([]);

  // Predefined Categories
  const PREDEFINED_CATEGORIES = [
    { name: 'बीज', icon: '🌱', slug: 'seeds' },
    { name: 'पोषण', icon: '🌿', slug: 'nutrition' },
    { name: 'संरक्षण', icon: '🛡️', slug: 'protection' },
    { name: 'हार्डवेअर', icon: '🔧', slug: 'hardware' }
  ];

  // Product Form
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    price: '',
    description: '',
    category: '',
    image: '',
    featured: false,
    searchKeywords: []
  });
  const [editingProduct, setEditingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Banner Form
  const [bannerForm, setBannerForm] = useState({
    id: '',
    image: '',
    link: '',
    order: 1
  });
  const [editingBanner, setEditingBanner] = useState(false);
  const [uploadingBannerImage, setUploadingBannerImage] = useState(false);

  useEffect(() => {
    checkAuth();
    loadPendingProducts();
  }, []);

  // Local Storage Management Functions
  const PENDING_PRODUCTS_KEY = 'admin_pending_products';

  const loadPendingProducts = () => {
    try {
      const stored = localStorage.getItem(PENDING_PRODUCTS_KEY);
      if (stored) {
        setPendingProducts(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading pending products:', error);
    }
  };

  const savePendingProductToStorage = (product) => {
    try {
      const stored = localStorage.getItem(PENDING_PRODUCTS_KEY);
      const pending = stored ? JSON.parse(stored) : [];
      
      // Check if editing an existing pending product
      const existingIndex = pending.findIndex(p => p.id === product.id);
      if (existingIndex !== -1) {
        pending[existingIndex] = product;
      } else {
        pending.push(product);
      }
      
      localStorage.setItem(PENDING_PRODUCTS_KEY, JSON.stringify(pending));
      setPendingProducts(pending);
    } catch (error) {
      console.error('Error saving to local storage:', error);
      throw error;
    }
  };

  const removePendingProductFromStorage = (productId) => {
    try {
      const stored = localStorage.getItem(PENDING_PRODUCTS_KEY);
      const pending = stored ? JSON.parse(stored) : [];
      const filtered = pending.filter(p => p.id !== productId);
      localStorage.setItem(PENDING_PRODUCTS_KEY, JSON.stringify(filtered));
      setPendingProducts(filtered);
    } catch (error) {
      console.error('Error removing from local storage:', error);
    }
  };

  const clearPendingProducts = () => {
    try {
      localStorage.removeItem(PENDING_PRODUCTS_KEY);
      setPendingProducts([]);
    } catch (error) {
      console.error('Error clearing local storage:', error);
    }
  };

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      await fetchShopData(currentUser.id);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchShopData = async (adminId) => {
    try {
      const { data, error } = await supabase
        .from('shop_data')
        .select('*')
        .eq('admin_id', adminId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setShopData({
          id: data.id,
          shop_name: data.shop_name || '',
          shop_number: data.shop_number || '',
          shop_address: data.shop_address || '',
          products: data.products || [],
          banners: data.banners || []
        });
      }
    } catch (error) {
      console.error('Error fetching shop data:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSaveShopInfo = async () => {
    if (!shopData.shop_name || !shopData.shop_number || !shopData.shop_address) {
      showMessage('error', 'Please fill all shop information fields');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        admin_id: user.id,
        shop_name: shopData.shop_name,
        shop_number: shopData.shop_number,
        shop_address: shopData.shop_address,
        products: shopData.products,
        banners: shopData.banners,
        updated_at: new Date().toISOString()
      };

      if (shopData.id) {
        const { error } = await supabase
          .from('shop_data')
          .update(dataToSave)
          .eq('id', shopData.id);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('shop_data')
          .insert([dataToSave])
          .select()
          .single();
        
        if (error) throw error;
        setShopData(prev => ({ ...prev, id: data.id }));
      }

      showMessage('success', 'Shop information saved successfully!');
    } catch (error) {
      console.error('Error saving shop info:', error);
      showMessage('error', 'Failed to save shop information');
    } finally {
      setSaving(false);
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size - max 100KB for products
    const maxSize = 100 * 1024; // 100KB in bytes
    if (file.size > maxSize) {
      showMessage('error', 'Product image must be less than 100KB');
      e.target.value = ''; // Clear the input
      return;
    }

    setUploadingImage(true);
    try {
      const imageUrl = await uploadToCloudinary(file);
      setProductForm(prev => ({ ...prev, image: imageUrl }));
      showMessage('success', 'Image uploaded successfully!');
    } catch (error) {
      showMessage('error', 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Generate search keywords for product - Rule-based expansion
  const generateSearchKeywords = (productName) => {
    const keywords = new Set();
    
    // Helper: Roman to Devanagari transliteration
    const romanToDevanagari = (text) => {
      const charMap = {
        'a': 'अ', 'aa': 'आ', 'i': 'इ', 'ee': 'ई', 'u': 'उ', 'oo': 'ऊ',
        'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ',
        'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ', 'ch': 'च', 'chh': 'छ',
        'j': 'ज', 'jh': 'झ', 't': 'ट', 'th': 'ठ', 'd': 'ड', 'dh': 'ढ',
        'n': 'न', 'p': 'प', 'ph': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म',
        'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व', 'w': 'व', 'sh': 'श',
        's': 'स', 'h': 'ह', 'z': 'ज', 'f': 'फ'
      };
      
      let result = '';
      let i = 0;
      const lower = text.toLowerCase();
      
      while (i < lower.length) {
        let matched = false;
        // Try 3-char, 2-char, then 1-char matches
        for (let len = 3; len >= 1; len--) {
          const substr = lower.substr(i, len);
          if (charMap[substr]) {
            result += charMap[substr];
            i += len;
            matched = true;
            break;
          }
        }
        if (!matched) {
          result += lower[i];
          i++;
        }
      }
      return result;
    };
    
    // Helper: Devanagari to Roman transliteration
    const devanagariToRoman = (text) => {
      const charMap = {
        'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
        'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
        'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'च': 'ch', 'छ': 'chh',
        'ज': 'j', 'झ': 'jh', 'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh',
        'ण': 'n', 'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
        'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
        'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh',
        'स': 's', 'ह': 'h', 'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u',
        'ू': 'oo', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', '्': ''
      };
      
      let result = '';
      for (let char of text) {
        result += charMap[char] || char;
      }
      return result;
    };
    
    // Helper: Apply phonetic substitutions
    const applyPhoneticSubstitutions = (text) => {
      const variants = [text];
      const rules = [
        { from: /k/g, to: 'c' },
        { from: /c/g, to: 'k' },
        { from: /ph/g, to: 'f' },
        { from: /f/g, to: 'ph' },
        { from: /v/g, to: 'w' },
        { from: /w/g, to: 'v' },
        { from: /z/g, to: 'j' },
        { from: /j/g, to: 'z' },
        { from: /s/g, to: 'sh' },
        { from: /sh/g, to: 's' }
      ];
      
      // Apply each rule once to create variants
      rules.forEach(rule => {
        if (rule.from.test(text)) {
          variants.push(text.replace(rule.from, rule.to));
        }
      });
      
      return variants;
    };
    
    // Helper: Normalize delimiters
    const normalizeDelimiters = (text) => {
      const variants = [text];
      if (text.includes('-') || text.includes('_')) {
        variants.push(text.replace(/[-_]/g, ' '));
        variants.push(text.replace(/[-_]/g, ''));
      }
      if (text.includes(' ')) {
        variants.push(text.replace(/\s+/g, '-'));
        variants.push(text.replace(/\s+/g, '_'));
        variants.push(text.replace(/\s+/g, ''));
      }
      return variants;
    };
    
    // Helper: Check if text is primarily Devanagari
    const isDevanagari = (text) => {
      return /[\u0900-\u097F]/.test(text);
    };
    
    // Step 1: Add original and case variants
    keywords.add(productName);
    keywords.add(productName.toLowerCase());
    keywords.add(productName.toUpperCase());
    keywords.add(productName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '));
    
    // Step 2: Normalize delimiters
    normalizeDelimiters(productName).forEach(variant => {
      keywords.add(variant);
      keywords.add(variant.toLowerCase());
    });
    
    // Step 3: Split into words and add individual words
    const words = productName.toLowerCase().split(/[\s\-_]+/).filter(w => w.length > 0);
    words.forEach(word => {
      keywords.add(word);
      keywords.add(word.toLowerCase());
    });
    
    // Step 4: Bidirectional transliteration
    const baseTexts = [productName, ...words];
    baseTexts.forEach(text => {
      if (isDevanagari(text)) {
        // Devanagari → Roman
        const romanized = devanagariToRoman(text);
        keywords.add(romanized);
        keywords.add(romanized.toLowerCase());
        
        // Apply phonetic substitutions on romanized
        applyPhoneticSubstitutions(romanized).forEach(v => keywords.add(v.toLowerCase()));
      } else {
        // Roman → Devanagari
        const devanagariVariant = romanToDevanagari(text);
        keywords.add(devanagariVariant);
        
        // Apply phonetic substitutions on original
        applyPhoneticSubstitutions(text).forEach(v => {
          keywords.add(v.toLowerCase());
          // Also transliterate phonetic variants
          keywords.add(romanToDevanagari(v));
        });
      }
    });
    
    // Step 5: Smart filtering - keep meaningful keywords
    const filtered = Array.from(keywords).filter(kw => {
      // Remove empty, very short (< 2 chars), or pure punctuation
      return kw && kw.trim().length >= 2 && /[a-zA-Z\u0900-\u097F]/.test(kw);
    });
    
    // Step 6: Limit to ~20-30 most relevant keywords
    // Prioritize: original, lowercase, words, then variants
    const prioritized = [];
    const addUnique = (kw) => {
      const normalized = kw.trim().toLowerCase();
      if (!prioritized.some(p => p.toLowerCase() === normalized)) {
        prioritized.push(kw);
      }
    };
    
    // Priority 1: Original forms
    addUnique(productName);
    addUnique(productName.toLowerCase());
    
    // Priority 2: Words
    words.forEach(w => addUnique(w));
    
    // Priority 3: Other variants
    filtered.forEach(kw => {
      if (prioritized.length < 30) {
        addUnique(kw);
      }
    });
    
    return prioritized.slice(0, 30);
  };

  const handleAddProduct = async () => {
    if (!productForm.name || !productForm.price || !productForm.category) {
      showMessage('error', 'Please fill all required product fields');
      return;
    }

    // Check product limit - max 100 products (saved + pending)
    const totalProducts = shopData.products.length + pendingProducts.length;
    if (!editingProduct && totalProducts >= 100) {
      showMessage('error', 'Maximum 100 products allowed');
      return;
    }

    setSaving(true);
    try {
      // Generate search keywords
      const searchKeywords = generateSearchKeywords(productForm.name);
      
      const newProduct = {
        id: editingProduct ? productForm.id : uuidv4(),
        name: productForm.name,
        price: parseFloat(productForm.price),
        description: productForm.description,
        category: productForm.category,
        image: productForm.image,
        featured: productForm.featured || false,
        searchKeywords: searchKeywords,
        isPending: true // Mark as pending/staged
      };

      // Save to Local Storage instead of Supabase
      savePendingProductToStorage(newProduct);

      setProductForm({ id: '', name: '', price: '', description: '', category: '', image: '', featured: false, searchKeywords: [] });
      setEditingProduct(false);
      showMessage('success', editingProduct ? 'Product updated in queue!' : 'Product added to queue! Click "Save All" to commit.');
    } catch (error) {
      console.error('Error staging product:', error);
      showMessage('error', 'Failed to stage product');
    } finally {
      setSaving(false);
    }
  };

  const handleEditProduct = (product) => {
    setProductForm(product);
    setEditingProduct(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBulkSaveProducts = async () => {
    if (pendingProducts.length === 0) {
      showMessage('error', 'No pending products to save');
      return;
    }

    if (!confirm(`Are you sure you want to save ${pendingProducts.length} pending product(s) to the database?`)) {
      return;
    }

    setSaving(true);
    try {
      // Merge pending products with existing saved products
      const productsToSave = pendingProducts.map(p => {
        const { isPending, ...productData } = p; // Remove isPending flag
        return productData;
      });

      const updatedProducts = [...shopData.products, ...productsToSave];

      // Single bulk transaction to Supabase
      const { error } = await supabase
        .from('shop_data')
        .update({ products: updatedProducts, updated_at: new Date().toISOString() })
        .eq('admin_id', user.id);

      if (error) throw error;

      // Update state and clear pending queue
      setShopData(prev => ({ ...prev, products: updatedProducts }));
      clearPendingProducts();
      
      showMessage('success', `Successfully saved ${productsToSave.length} product(s) to database!`);
    } catch (error) {
      console.error('Error bulk saving products:', error);
      showMessage('error', 'Failed to save products. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (productId, isPending = false) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    // If product is pending (in Local Storage), just remove from queue
    if (isPending) {
      removePendingProductFromStorage(productId);
      showMessage('success', 'Pending product removed from queue!');
      return;
    }

    // Otherwise, delete from Supabase
    setSaving(true);
    try {
      const updatedProducts = shopData.products.filter(p => p.id !== productId);

      const { error } = await supabase
        .from('shop_data')
        .update({ products: updatedProducts, updated_at: new Date().toISOString() })
        .eq('admin_id', user.id);

      if (error) throw error;

      setShopData(prev => ({ ...prev, products: updatedProducts }));
      showMessage('success', 'Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      showMessage('error', 'Failed to delete product');
    } finally {
      setSaving(false);
    }
  };

  const handleBannerImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size - max 200KB for banners
    const maxSize = 200 * 1024; // 200KB in bytes
    if (file.size > maxSize) {
      showMessage('error', 'Banner image must be less than 200KB');
      e.target.value = ''; // Clear the input
      return;
    }

    setUploadingBannerImage(true);
    try {
      const imageUrl = await uploadToCloudinary(file);
      setBannerForm(prev => ({ ...prev, image: imageUrl }));
      showMessage('success', 'Banner image uploaded successfully!');
    } catch (error) {
      showMessage('error', 'Failed to upload banner image');
    } finally {
      setUploadingBannerImage(false);
    }
  };

  const handleAddBanner = async () => {
    if (!bannerForm.image) {
      showMessage('error', 'Please upload a banner image');
      return;
    }

    // Check banner limit - max 5 banners
    if (!editingBanner && shopData.banners.length >= 5) {
      showMessage('error', 'Maximum 5 banners allowed');
      return;
    }

    setSaving(true);
    try {
      const newBanner = {
        id: editingBanner ? bannerForm.id : uuidv4(),
        image: bannerForm.image,
        link: bannerForm.link || '',
        order: parseInt(bannerForm.order) || 1
      };

      let updatedBanners;
      if (editingBanner) {
        updatedBanners = shopData.banners.map(b => 
          b.id === bannerForm.id ? newBanner : b
        );
      } else {
        updatedBanners = [...shopData.banners, newBanner];
      }

      // Sort by order
      updatedBanners.sort((a, b) => (a.order || 1) - (b.order || 1));

      const { error } = await supabase
        .from('shop_data')
        .update({ banners: updatedBanners, updated_at: new Date().toISOString() })
        .eq('admin_id', user.id);

      if (error) throw error;

      setShopData(prev => ({ ...prev, banners: updatedBanners }));
      setBannerForm({ id: '', image: '', link: '', order: 1 });
      setEditingBanner(false);
      showMessage('success', editingBanner ? 'Banner updated!' : 'Banner added successfully!');
    } catch (error) {
      console.error('Error saving banner:', error);
      showMessage('error', 'Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const handleEditBanner = (banner) => {
    setBannerForm(banner);
    setEditingBanner(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBanner = async (bannerId) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    setSaving(true);
    try {
      const updatedBanners = shopData.banners.filter(b => b.id !== bannerId);

      const { error } = await supabase
        .from('shop_data')
        .update({ banners: updatedBanners, updated_at: new Date().toISOString() })
        .eq('admin_id', user.id);

      if (error) throw error;

      setShopData(prev => ({ ...prev, banners: updatedBanners }));
      showMessage('success', 'Banner deleted successfully!');
    } catch (error) {
      console.error('Error deleting banner:', error);
      showMessage('error', 'Failed to delete banner');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white shadow-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-emerald-100">{user?.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition flex items-center space-x-2"
              >
                <Store className="w-4 h-4" />
                <span>View Shop</span>
              </button>
              <button
                onClick={handleSignOut}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Message Toast */}
      {message.text && (
        <div className={`fixed top-20 right-4 z-50 px-6 py-4 rounded-lg shadow-xl animate-fade-in ${
          message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white font-semibold`}>
          {message.text}
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md p-2 mb-6 flex space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
              activeTab === 'profile' 
                ? 'bg-emerald-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
              activeTab === 'shop' 
                ? 'bg-emerald-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Store className="w-5 h-5" />
            <span>Shop Info</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
              activeTab === 'products' 
                ? 'bg-emerald-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Products ({shopData.products.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
              activeTab === 'banners' 
                ? 'bg-emerald-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            <span>Banners ({shopData.banners.length})</span>
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Management</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">User ID</label>
                <input
                  type="text"
                  value={user?.id || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> To change your email or password, please use Supabase authentication settings.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Shop Info Tab */}
        {activeTab === 'shop' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Shop Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Shop Name *</label>
                <input
                  type="text"
                  value={shopData.shop_name}
                  onChange={(e) => setShopData(prev => ({ ...prev, shop_name: e.target.value }))}
                  placeholder="Enter shop name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Shop Phone Number *</label>
                <input
                  type="tel"
                  value={shopData.shop_number}
                  onChange={(e) => setShopData(prev => ({ ...prev, shop_number: e.target.value }))}
                  placeholder="Enter phone number (e.g., 917385311748)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Shop Address *</label>
                <textarea
                  value={shopData.shop_address}
                  onChange={(e) => setShopData(prev => ({ ...prev, shop_address: e.target.value }))}
                  placeholder="Enter complete shop address"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSaveShopInfo}
                disabled={saving}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>{saving ? 'Saving...' : 'Save Shop Information'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Add/Edit Product Form */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter product name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price *</label>
                    <input
                      type="number"
                      value={productForm.price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="Enter price"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {PREDEFINED_CATEGORIES.map(cat => (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => setProductForm(prev => ({ ...prev, category: cat.name }))}
                        className={`px-2 py-2 rounded-md border-2 transition flex flex-col items-center space-y-0.5 ${
                          productForm.category === cat.name
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : 'border-gray-300 hover:border-emerald-400'
                        }`}
                      >
                        <span className="text-xl">{cat.icon}</span>
                        <span className="text-xs font-semibold">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mark as Featured Product</label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setProductForm(prev => ({ ...prev, featured: !prev.featured }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        productForm.featured ? 'bg-emerald-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          productForm.featured ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-sm text-gray-600">
                      {productForm.featured ? 'Featured (will show on homepage)' : 'Not featured'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter product description"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Image (Max 100KB)</label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    {uploadingImage && (
                      <div className="flex items-center space-x-2 text-emerald-600">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                        <span className="text-sm">Uploading image...</span>
                      </div>
                    )}
                    {productForm.image && (
                      <div className="relative w-32 h-32">
                        <img src={productForm.image} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleAddProduct}
                    disabled={saving || uploadingImage}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
                    data-testid="add-product-btn"
                  >
                    <Plus className="w-5 h-5" />
                    <span>{saving ? 'Adding to Queue...' : editingProduct ? 'Update Product (Queue)' : 'Add to Queue'}</span>
                  </button>
                  {editingProduct && (
                    <button
                      onClick={() => {
                        setProductForm({ id: '', name: '', price: '', description: '', category: '', image: '', featured: false, searchKeywords: [] });
                        setEditingProduct(false);
                      }}
                      className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-3 rounded-lg transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                {!editingProduct && pendingProducts.length > 0 && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Tip:</strong> You have {pendingProducts.length} pending product(s). Click "Save All" below to commit them to the database.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Products List */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    All Products ({shopData.products.length + pendingProducts.length}/100)
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Saved: {shopData.products.length} | Pending: {pendingProducts.length}
                  </p>
                </div>
                {pendingProducts.length > 0 && (
                  <button
                    onClick={handleBulkSaveProducts}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg transition flex items-center space-x-2 disabled:opacity-50"
                    data-testid="save-all-btn"
                  >
                    <Save className="w-5 h-5" />
                    <span>{saving ? 'Saving...' : `Save All (${pendingProducts.length})`}</span>
                  </button>
                )}
              </div>
              
              {shopData.products.length === 0 && pendingProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No products added yet</p>
              ) : (
                <div className="space-y-6">
                  {/* Pending Products Section */}
                  {pendingProducts.length > 0 && (
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="h-px flex-1 bg-orange-200"></div>
                        <h4 className="text-sm font-bold text-orange-600 uppercase tracking-wide">
                          Pending Products (Not Saved Yet)
                        </h4>
                        <div className="h-px flex-1 bg-orange-200"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingProducts.map(product => (
                          <div key={product.id} className="border-2 border-orange-300 bg-orange-50 rounded-lg p-3 hover:shadow-lg transition relative">
                            <div className="absolute top-2 left-2 z-10">
                              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-md">
                                ⏳ PENDING
                              </span>
                            </div>
                            <div className="flex gap-3 mt-6">
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-800 mb-1 pr-20">{product.name}</h4>
                                <p className="text-emerald-600 font-bold text-lg mb-1">₹{product.price}</p>
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs text-gray-500">Category: {product.category}</p>
                                  {product.featured && (
                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold">⭐ Featured</span>
                                  )}
                                </div>
                              </div>
                              <img 
                                src={product.image || 'https://via.placeholder.com/200x150?text=No+Image'} 
                                alt={product.name}
                                className="absolute top-3 right-3 w-16 h-16 object-cover rounded-lg"
                              />
                            </div>
                            <div className="flex space-x-2 mt-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition flex items-center justify-center space-x-1"
                                data-testid={`edit-pending-${product.id}`}
                              >
                                <Edit2 className="w-4 h-4" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id, true)}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition flex items-center justify-center space-x-1"
                                data-testid={`delete-pending-${product.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Saved Products Section */}
                  {shopData.products.length > 0 && (
                    <div>
                      {pendingProducts.length > 0 && (
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="h-px flex-1 bg-emerald-200"></div>
                          <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-wide">
                            Saved Products
                          </h4>
                          <div className="h-px flex-1 bg-emerald-200"></div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {shopData.products.map(product => (
                          <div key={product.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-lg transition relative">
                            <div className="flex gap-3">
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-800 mb-1 pr-20">{product.name}</h4>
                                <p className="text-emerald-600 font-bold text-lg mb-1">₹{product.price}</p>
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs text-gray-500">Category: {product.category}</p>
                                  {product.featured && (
                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold">⭐ Featured</span>
                                  )}
                                </div>
                              </div>
                              <img 
                                src={product.image || 'https://via.placeholder.com/200x150?text=No+Image'} 
                                alt={product.name}
                                className="absolute top-3 right-3 w-16 h-16 object-cover rounded-lg"
                              />
                            </div>
                            <div className="flex space-x-2 mt-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition flex items-center justify-center space-x-1"
                                data-testid={`edit-saved-${product.id}`}
                              >
                                <Edit2 className="w-4 h-4" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id, false)}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition flex items-center justify-center space-x-1"
                                data-testid={`delete-saved-${product.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Banners Tab */}
        {activeTab === 'banners' && (
          <div className="space-y-6">
            {/* Add/Edit Banner Form */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Banner Order/Sequence *</label>
                  <select
                    value={bannerForm.order}
                    onChange={(e) => setBannerForm(prev => ({ ...prev, order: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5].map(num => {
                      // Get existing banner orders except current editing banner
                      const existingOrders = shopData.banners
                        .filter(b => !editingBanner || b.id !== bannerForm.id)
                        .map(b => b.order);
                      
                      // Only show available sequences
                      if (!existingOrders.includes(num)) {
                        return <option key={num} value={num}>Banner {num}</option>;
                      }
                      return null;
                    })}
                    {editingBanner && (
                      <option value={bannerForm.order}>Banner {bannerForm.order} (current)</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Banner Image * (Max 200KB)</label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerImageUpload}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    {uploadingBannerImage && (
                      <div className="flex items-center space-x-2 text-emerald-600">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                        <span className="text-sm">Uploading banner image...</span>
                      </div>
                    )}
                    {bannerForm.image && (
                      <div className="relative w-full h-48">
                        <img src={bannerForm.image} alt="Banner Preview" className="w-full h-full object-cover rounded-lg" />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Target Link/URL (Optional)</label>
                  <input
                    type="url"
                    value={bannerForm.link}
                    onChange={(e) => setBannerForm(prev => ({ ...prev, link: e.target.value }))}
                    placeholder="https://example.com (leave empty if not clickable)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleAddBanner}
                    disabled={saving || uploadingBannerImage}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                    <span>{saving ? 'Saving...' : editingBanner ? 'Update Banner' : 'Add Banner'}</span>
                  </button>
                  {editingBanner && (
                    <button
                      onClick={() => {
                        setBannerForm({ id: '', image: '', link: '', order: 1 });
                        setEditingBanner(false);
                      }}
                      className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-3 rounded-lg transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Banners List */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">All Banners ({shopData.banners.length}/5)</h3>
              {shopData.banners.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No banners added yet</p>
              ) : (
                <div className="space-y-4">
                  {shopData.banners.map(banner => (
                    <div key={banner.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                      <div className="flex items-center justify-between mb-3">
                        <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-bold">
                          Banner {banner.order || 1}
                        </span>
                        {banner.link && (
                          <span className="text-xs text-gray-500 flex items-center">
                            🔗 Clickable
                          </span>
                        )}
                      </div>
                      <div className="relative h-40 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                        {banner.image ? (
                          <img src={banner.image} alt={`Banner ${banner.order}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No image
                          </div>
                        )}
                      </div>
                      {banner.link && (
                        <p className="text-xs text-gray-600 mb-3 truncate">
                          <strong>Link:</strong> {banner.link}
                        </p>
                      )}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditBanner(banner)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition flex items-center justify-center space-x-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition flex items-center justify-center space-x-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}