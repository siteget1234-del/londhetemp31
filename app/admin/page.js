'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { Store, Package, Image as ImageIcon, User, LogOut, Save, Plus, X, Edit2, Trash2, Upload, BarChart3, Download, FileUp, Layout } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { compressImageTwoStep } from '@/lib/imageCompression';
import CropModal from '@/components/CropModal';
import dynamic from 'next/dynamic';

// Dynamically import RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Crop Modal States
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [cropType, setCropType] = useState(null); // 'product' or 'banner'

  // Shop Data
  const [shopData, setShopData] = useState({
    shop_name: '',
    shop_number: '',
    shop_address: '',
    social_links: {
      instagram: '',
      facebook: '',
      youtube: ''
    },
    delivery: {
      partnerName: '',
      slabs: []
    },
    products: [],
    banners: [],
    blogs: [],
    overview: {
      totalViews: 0,
      totalOrders: 0,
      orderHistory: []
    }
  });

  // Delivery Setup States
  const [newSlab, setNewSlab] = useState({ weight: '', price: '' });
  
  // Generate weight options from 0.5kg to 20kg in 0.5kg increments
  const WEIGHT_OPTIONS = Array.from({ length: 40 }, (_, i) => {
    const weight = (i + 1) * 0.5;
    return `${weight}kg`;
  });

  // Pending Products Queue (from Local Storage)
  const [pendingProducts, setPendingProducts] = useState([]);
  
  // Selection mode state (for saved products only)
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [longPressTimer, setLongPressTimer] = useState(null);

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
    mrp: '',
    weight: '', // Product weight (stored in grams)
    weightUnit: 'gram', // Display unit: 'gram' or 'kg'
    offer: '',
    category: '',
    image: '',
    videoUrl: '',
    stockQuantity: '', // Stock quantity for inventory management
    specifications: {
      ingredients: '',
      quantity: '',
      usageMethod: '',
      effectiveness: '',
      applicableCrops: '',
      additionalInfo: '',
      specialNotes: ''
    },
    featured: false,
    searchKeywords: [],
    specialOffer: {
      offerName: '',
      quantity: '',
      offerPricePerUnit: ''
    }
  });
  const [editingProduct, setEditingProduct] = useState(false);
  const [editingProductType, setEditingProductType] = useState(null); // 'saved' or 'pending'
  const [uploadingImage, setUploadingImage] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(null);

  // Banner Form
  const [bannerForm, setBannerForm] = useState({
    id: '',
    image: '',
    link: '',
    order: 1
  });
  const [editingBanner, setEditingBanner] = useState(false);
  const [uploadingBannerImage, setUploadingBannerImage] = useState(false);
  const [bannerCompressionProgress, setBannerCompressionProgress] = useState(null);

  // Crop Categories and List
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

  // Blog Form
  const [blogForm, setBlogForm] = useState({
    id: '',
    image: '',
    text: '',
    layout: 'standard', // Layout options: 'standard', 'portrait', 'square', 'wide'
    selectedCrop: '', // Selected crop for filtering
    attachedProducts: [] // Product IDs attached to this crop-blog
  });
  const [editingBlog, setEditingBlog] = useState(false);
  const [uploadingBlogImage, setUploadingBlogImage] = useState(false);
  const [blogImageFile, setBlogImageFile] = useState(null); // Store file for cropping
  const [showProductSelector, setShowProductSelector] = useState(false); // Product selector modal

  // Import/Export States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

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
        // Parse social_links from JSON string or set default
        let socialLinks = { instagram: '', facebook: '', youtube: '' };
        if (data.social_links) {
          try {
            socialLinks = typeof data.social_links === 'string' 
              ? JSON.parse(data.social_links) 
              : data.social_links;
          } catch (e) {
            console.error('Error parsing social_links:', e);
          }
        }
        
        // Parse delivery from JSONB or set default
        let delivery = { partnerName: '', slabs: [] };
        if (data.delivery) {
          try {
            delivery = typeof data.delivery === 'string' 
              ? JSON.parse(data.delivery) 
              : data.delivery;
          } catch (e) {
            console.error('Error parsing delivery:', e);
          }
        }
        
        setShopData({
          id: data.id,
          shop_name: data.shop_name || '',
          shop_number: data.shop_number || '',
          shop_address: data.shop_address || '',
          social_links: socialLinks,
          delivery: delivery,
          products: data.products || [],
          banners: data.banners || [],
          blogs: data.blogs || [],
          overview: data.overview || {
            totalViews: 0,
            totalOrders: 0,
            orderHistory: []
          }
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

  // Delivery Setup Functions
  const handleAddSlab = () => {
    if (!newSlab.weight || !newSlab.price) {
      showMessage('error', 'Please select weight and enter price');
      return;
    }

    // Check if slab already exists
    if (shopData.delivery.slabs.some(slab => slab.weight === newSlab.weight)) {
      showMessage('error', 'This weight slab already exists');
      return;
    }

    setShopData(prev => ({
      ...prev,
      delivery: {
        ...prev.delivery,
        slabs: [...prev.delivery.slabs, { weight: newSlab.weight, price: parseFloat(newSlab.price) }]
      }
    }));

    setNewSlab({ weight: '', price: '' });
    showMessage('success', 'Delivery slab added');
  };

  const handleRemoveSlab = (weight) => {
    setShopData(prev => ({
      ...prev,
      delivery: {
        ...prev.delivery,
        slabs: prev.delivery.slabs.filter(slab => slab.weight !== weight)
      }
    }));
    showMessage('success', 'Delivery slab removed');
  };

  // Get available weight options (excluding already added slabs)
  const getAvailableWeightOptions = () => {
    const usedWeights = shopData.delivery.slabs.map(slab => slab.weight);
    return WEIGHT_OPTIONS.filter(weight => !usedWeights.includes(weight));
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
        social_links: JSON.stringify(shopData.social_links),
        delivery: shopData.delivery,
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

  const uploadToCloudinary = async (file, applyTransformations = false) => {
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
      let imageUrl = data.secure_url;
      
      // Apply Cloudinary transformations for auto-compression and auto-format
      if (applyTransformations && imageUrl) {
        // Insert transformation parameters after '/upload/'
        imageUrl = imageUrl.replace('/upload/', '/upload/f_auto,q_auto/');
      }
      
      return imageUrl;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please select a valid image file');
      e.target.value = '';
      return;
    }

    // Open crop modal
    setCropFile(file);
    setCropType('product');
    setShowCropModal(true);
    e.target.value = ''; // Clear input
  };

  const handleCropComplete = async (croppedBlob) => {
    setShowCropModal(false);
    
    if (cropType === 'product') {
      setUploadingImage(true);
      setCompressionProgress(null);
    } else if (cropType === 'banner') {
      setUploadingBannerImage(true);
      setBannerCompressionProgress(null);
    } else if (cropType === 'blog') {
      setUploadingBlogImage(true);
    }
    
    try {
      // Convert blob to file - Now as WebP format
      const webpFileName = cropFile.name.replace(/\.[^/.]+$/, '.webp');
      const croppedFile = new File([croppedBlob], webpFileName, { type: 'image/webp' });
      
      const fileSizeKB = croppedFile.size / 1024;
      let fileToUpload = croppedFile;
      
      // Determine target size and progress setter
      const isProduct = cropType === 'product';
      const isBanner = cropType === 'banner';
      const isBlog = cropType === 'blog';
      const targetSize = isProduct ? 20 : 50;
      const progressSetter = isProduct ? setCompressionProgress : setBannerCompressionProgress;
      
      // For blogs: Validate 200KB limit
      if (isBlog) {
        if (fileSizeKB > 200) {
          showMessage('error', `Cropped WebP image (${fileSizeKB.toFixed(0)}KB) still exceeds 200KB. Please select a smaller original image.`);
          setUploadingBlogImage(false);
          setCropFile(null);
          setCropType(null);
          setBlogImageFile(null);
          return;
        }
        // Upload blog image directly
        const imageUrl = await uploadToCloudinary(croppedFile, false);
        setBlogForm(prev => ({ ...prev, image: imageUrl }));
        showMessage('success', `Blog image cropped to WebP & uploaded (${fileSizeKB.toFixed(0)}KB)!`);
      }
      // For banners: Skip compression entirely (Cloudinary will handle it)
      else if (isBanner) {
        progressSetter({ 
          step: 1, 
          message: 'Preparing WebP banner for upload...', 
          progress: 50 
        });
        // Use the cropped WebP file as-is without compression
        fileToUpload = croppedFile;
        
        // Upload image to Cloudinary
        progressSetter({ 
          step: 3, 
          message: 'Uploading WebP to cloud...', 
          progress: 95 
        });
        
        const imageUrl = await uploadToCloudinary(fileToUpload, true);
        setBannerForm(prev => ({ ...prev, image: imageUrl }));
        showMessage('success', `Banner cropped to WebP & uploaded! Cloudinary will optimize on delivery.`);
        progressSetter(null);
      } else {
        // For products: Apply WebP compression logic
        // Skip compression if image is already under target size
        if (fileSizeKB < targetSize) {
          progressSetter({ 
            step: 1, 
            message: `WebP image already optimized (${fileSizeKB.toFixed(2)}KB). Skipping compression...`, 
            progress: 50 
          });
          // Use the cropped WebP file as-is without compression
          fileToUpload = croppedFile;
        } else {
          // Enhanced Two-Step WebP Compression
          fileToUpload = await compressImageTwoStep(croppedFile, cropType, (progress) => {
            progressSetter(progress);
          });
        }
        
        // Upload image to Cloudinary
        progressSetter({ 
          step: 3, 
          message: 'Uploading WebP to cloud...', 
          progress: 95 
        });
        
        const imageUrl = await uploadToCloudinary(fileToUpload, false);
        setProductForm(prev => ({ ...prev, image: imageUrl }));
        
        const finalSizeKB = fileToUpload.size / 1024;
        if (fileSizeKB < targetSize) {
          showMessage('success', `Image cropped to WebP & uploaded (${fileSizeKB.toFixed(2)}KB)!`);
        } else {
          showMessage('success', `Image cropped to WebP, compressed (${finalSizeKB.toFixed(2)}KB) & uploaded!`);
        }
        progressSetter(null);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      showMessage('error', 'Failed to compress/upload image');
      if (cropType === 'product') {
        setCompressionProgress(null);
      } else if (cropType === 'banner') {
        setBannerCompressionProgress(null);
      }
    } finally {
      if (cropType === 'product') {
        setUploadingImage(false);
      } else if (cropType === 'banner') {
        setUploadingBannerImage(false);
      } else if (cropType === 'blog') {
        setUploadingBlogImage(false);
      }
      setCropFile(null);
      setCropType(null);
      setBlogImageFile(null);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setCropFile(null);
    setCropType(null);
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

    // Validate weight
    if (!productForm.weight || parseInt(productForm.weight) <= 0) {
      showMessage('error', 'Please enter a valid product weight (whole numbers only)');
      return;
    }

    // No product limit - unlimited products allowed
    // const totalProducts = shopData.products.length + pendingProducts.length;
    // if (!editingProduct && totalProducts >= 100) {
    //   showMessage('error', 'Maximum 100 products allowed');
    //   return;
    // }

    setSaving(true);
    try {
      // Generate search keywords
      const searchKeywords = generateSearchKeywords(productForm.name);
      
      // Convert weight to grams (always store in grams)
      let weightInGrams = parseInt(productForm.weight);
      if (productForm.weightUnit === 'kg') {
        weightInGrams = weightInGrams * 1000;
      }
      
      const newProduct = {
        id: editingProduct ? productForm.id : uuidv4(),
        name: productForm.name,
        price: parseFloat(productForm.price),
        mrp: productForm.mrp ? parseFloat(productForm.mrp) : null,
        weight: weightInGrams, // Always stored in grams
        offer: productForm.offer || '',
        category: productForm.category,
        image: productForm.image,
        videoUrl: productForm.videoUrl || '',
        stockQuantity: productForm.stockQuantity ? parseInt(productForm.stockQuantity) : 0,
        specifications: productForm.specifications || {},
        featured: productForm.featured || false,
        searchKeywords: searchKeywords,
        specialOffer: (productForm.specialOffer.offerName && productForm.specialOffer.quantity && productForm.specialOffer.offerPricePerUnit) 
          ? {
              offerName: productForm.specialOffer.offerName,
              quantity: parseInt(productForm.specialOffer.quantity),
              offerPricePerUnit: parseFloat(productForm.specialOffer.offerPricePerUnit)
            }
          : null
      };

      // Check if we're editing a saved product (directly update to database)
      if (editingProduct && editingProductType === 'saved') {
        const updatedProducts = shopData.products.map(p => 
          p.id === newProduct.id ? newProduct : p
        );

        const { error } = await supabase
          .from('shop_data')
          .update({ products: updatedProducts, updated_at: new Date().toISOString() })
          .eq('admin_id', user.id);

        if (error) throw error;

        setShopData(prev => ({ ...prev, products: updatedProducts }));
        showMessage('success', 'Product updated successfully!');
      } else {
        // Save to Local Storage for pending products
        newProduct.isPending = true; // Mark as pending/staged
        savePendingProductToStorage(newProduct);
        showMessage('success', editingProduct ? 'Product updated in queue!' : 'Product added to queue! Click "Save All" to commit.');
      }

      setProductForm({ 
        id: '', 
        name: '', 
        price: '', 
        mrp: '', 
        weight: '',
        weightUnit: 'gram',
        offer: '', 
        category: '', 
        image: '', 
        videoUrl: '', 
        stockQuantity: '',
        specifications: {
          ingredients: '',
          quantity: '',
          usageMethod: '',
          effectiveness: '',
          applicableCrops: '',
          additionalInfo: '',
          specialNotes: ''
        },
        featured: false, 
        searchKeywords: [],
        specialOffer: {
          offerName: '',
          quantity: '',
          offerPricePerUnit: ''
        }
      });
      setEditingProduct(false);
      setEditingProductType(null);
    } catch (error) {
      console.error('Error saving product:', error);
      showMessage('error', 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  // Helper function to format weight for display
  const formatWeight = (weightInGrams) => {
    if (!weightInGrams) return '';
    
    if (weightInGrams >= 1000 && weightInGrams % 1000 === 0) {
      return `${weightInGrams / 1000} kg`;
    }
    return `${weightInGrams} g`;
  };

  const handleEditProduct = (product, productType = 'pending') => {
    // Convert weight from grams to display format
    let displayWeight = product.weight || '';
    let displayUnit = 'gram';
    
    if (displayWeight) {
      // If weight is divisible by 1000 and >= 1000, display as kg
      if (displayWeight >= 1000 && displayWeight % 1000 === 0) {
        displayWeight = displayWeight / 1000;
        displayUnit = 'kg';
      }
    }
    
    // Ensure specialOffer is properly initialized
    const formattedProduct = {
      ...product,
      weight: displayWeight,
      weightUnit: displayUnit,
      specialOffer: product.specialOffer || {
        offerName: '',
        quantity: '',
        offerPricePerUnit: ''
      },
      specifications: product.specifications || {
        ingredients: '',
        quantity: '',
        usageMethod: '',
        effectiveness: '',
        applicableCrops: '',
        additionalInfo: '',
        specialNotes: ''
      }
    };
    setProductForm(formattedProduct);
    setEditingProduct(true);
    setEditingProductType(productType);
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

  // Long press and selection handlers
  const handleLongPressStart = (productId) => {
    const timer = setTimeout(() => {
      // Activate selection mode and select this product
      setIsSelectionMode(true);
      setSelectedProducts([productId]);
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleProductClick = (productId, product) => {
    if (isSelectionMode) {
      // In selection mode, toggle selection
      setSelectedProducts(prev => 
        prev.includes(productId) 
          ? prev.filter(id => id !== productId)
          : [...prev, productId]
      );
    }
    // Removed: Normal mode edit behavior - users should use Edit button instead
  };

  const handleSelectAllProducts = () => {
    if (selectedProducts.length === shopData.products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(shopData.products.map(p => p.id));
    }
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedProducts([]);
  };

  const handleDeleteMultiple = async () => {
    if (selectedProducts.length === 0) {
      showMessage('error', 'Please select at least one product to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} product(s)?`)) return;

    setSaving(true);
    try {
      const updatedProducts = shopData.products.filter(p => !selectedProducts.includes(p.id));

      const { error } = await supabase
        .from('shop_data')
        .update({ products: updatedProducts, updated_at: new Date().toISOString() })
        .eq('admin_id', user.id);

      if (error) throw error;

      setShopData(prev => ({ ...prev, products: updatedProducts }));
      showMessage('success', `${selectedProducts.length} product(s) deleted successfully!`);
      
      // Exit selection mode
      setIsSelectionMode(false);
      setSelectedProducts([]);
    } catch (error) {
      console.error('Error deleting products:', error);
      showMessage('error', 'Failed to delete some products');
    } finally {
      setSaving(false);
    }
  };

  const handleBannerImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please select a valid image file');
      e.target.value = '';
      return;
    }

    // Validate file size - 2MB limit for banners
    const maxSizeBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSizeBytes) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      showMessage('error', `File size (${fileSizeMB}MB) exceeds 2MB limit. Please select a smaller image.`);
      e.target.value = '';
      return;
    }

    // Open crop modal
    setCropFile(file);
    setCropType('banner');
    setShowCropModal(true);
    e.target.value = ''; // Clear input
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

  // Blog Layout Configurations
  const BLOG_LAYOUTS = {
    standard: { name: 'Standard (16:9)', aspect: 16/9, description: 'Landscape banner style' },
    portrait: { name: 'Portrait (4:5)', aspect: 4/5, description: 'Instagram-like vertical' },
    square: { name: 'Square (1:1)', aspect: 1, description: 'Balanced square format' },
    wide: { name: 'Wide (21:9)', aspect: 21/9, description: 'Cinematic ultra-wide' }
  };

  // Blog Handlers
  const handleBlogImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please select a valid image file');
      e.target.value = '';
      return;
    }

    // Validate file size - 200KB limit
    const maxSizeKB = 200;
    const fileSizeKB = file.size / 1024;
    if (fileSizeKB > maxSizeKB) {
      showMessage('error', `Image size (${fileSizeKB.toFixed(0)}KB) exceeds 200KB limit. Please select a smaller image.`);
      e.target.value = '';
      return;
    }

    // Open crop modal with blog layout aspect ratio
    setBlogImageFile(file);
    setCropFile(file);
    setCropType('blog');
    setShowCropModal(true);
    e.target.value = '';
  };

  const handleAddBlog = async () => {
    if (!blogForm.image || !blogForm.text || !blogForm.layout) {
      showMessage('error', 'Please upload an image, select layout, and enter text');
      return;
    }

    // Validate text length - 1500 character limit
    if (blogForm.text.length > 1500) {
      showMessage('error', `Text exceeds 1,500 character limit (current: ${blogForm.text.length})`);
      return;
    }

    setSaving(true);
    try {
      const newBlog = {
        id: editingBlog ? blogForm.id : uuidv4(),
        image: blogForm.image,
        text: blogForm.text,
        layout: blogForm.layout,
        selectedCrop: blogForm.selectedCrop || '', // Add crop filter
        attachedProducts: blogForm.attachedProducts || [], // Attached products for crops
        createdAt: editingBlog ? blogForm.createdAt : new Date().toISOString()
      };

      let updatedBlogs;
      if (editingBlog) {
        updatedBlogs = shopData.blogs.map(b => 
          b.id === blogForm.id ? newBlog : b
        );
      } else {
        updatedBlogs = [...shopData.blogs, newBlog];
      }

      const { error } = await supabase
        .from('shop_data')
        .update({ blogs: updatedBlogs, updated_at: new Date().toISOString() })
        .eq('admin_id', user.id);

      if (error) throw error;

      setShopData(prev => ({ ...prev, blogs: updatedBlogs }));
      setBlogForm({ id: '', image: '', text: '', layout: 'standard', selectedCrop: '', attachedProducts: [] });
      setEditingBlog(false);
      showMessage('success', editingBlog ? 'Blog updated!' : 'Blog added successfully!');
    } catch (error) {
      console.error('Error saving blog:', error);
      showMessage('error', 'Failed to save blog');
    } finally {
      setSaving(false);
    }
  };

  const handleEditBlog = (blog) => {
    setBlogForm({
      ...blog,
      attachedProducts: blog.attachedProducts || [] // Ensure attachedProducts is always an array
    });
    setEditingBlog(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBlog = async (blogId) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    setSaving(true);
    try {
      const updatedBlogs = shopData.blogs.filter(b => b.id !== blogId);

      const { error } = await supabase
        .from('shop_data')
        .update({ blogs: updatedBlogs, updated_at: new Date().toISOString() })
        .eq('admin_id', user.id);

      if (error) throw error;

      setShopData(prev => ({ ...prev, blogs: updatedBlogs }));
      showMessage('success', 'Blog deleted successfully!');
    } catch (error) {
      console.error('Error deleting blog:', error);
      showMessage('error', 'Failed to delete blog');
    } finally {
      setSaving(false);
    }
  };


  // Export Products to CSV
  const handleExportProducts = () => {
    if (shopData.products.length === 0) {
      showMessage('error', 'No products to export');
      return;
    }

    try {
      // Define CSV headers (ALL fields from product form - organized logically)
      const headers = [
        // Basic Product Information
        'id', 'name', 'category', 'featured',
        // Pricing & Stock
        'price', 'mrp', 'weight_grams', 'offer', 'stockQuantity',
        // Media
        'image', 'videoUrl',
        // Specifications (महत्वाचे गुणधर्म)
        'spec_ingredients', 'spec_quantity', 'spec_usageMethod', 
        'spec_effectiveness', 'spec_applicableCrops', 'spec_additionalInfo', 'spec_specialNotes',
        // Special Offers (विशेष ऑफर)
        'specialOffer_name', 'specialOffer_quantity', 'specialOffer_pricePerUnit'
      ];

      // Convert products to CSV rows
      const rows = shopData.products.map(product => {
        return [
          // Basic Product Information
          product.id || '',
          product.name || '',
          product.category || '',
          product.featured ? 'true' : 'false',
          // Pricing & Stock
          product.price || '',
          product.mrp || '',
          product.weight || '', // Weight in grams
          product.offer || '',
          product.stockQuantity || '',
          // Media
          product.image || '',
          product.videoUrl || '',
          // Specifications (महत्वाचे गुणधर्म)
          product.specifications?.ingredients || '',
          product.specifications?.quantity || '',
          product.specifications?.usageMethod || '',
          product.specifications?.effectiveness || '',
          product.specifications?.applicableCrops || '',
          product.specifications?.additionalInfo || '',
          product.specifications?.specialNotes || '',
          // Special Offers (विशेष ऑफर)
          product.specialOffer?.offerName || '',
          product.specialOffer?.quantity || '',
          product.specialOffer?.offerPricePerUnit || ''
        ].map(field => {
          // Escape quotes and wrap in quotes if contains comma or newline
          const stringField = String(field);
          if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
            return `"${stringField.replace(/"/g, '""')}"`;
          }
          return stringField;
        }).join(',');
      });

      // Combine headers and rows
      const csvContent = [headers.join(','), ...rows].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showMessage('success', `Exported ${shopData.products.length} products successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      showMessage('error', 'Failed to export products');
    }
  };

  // Generate Sample CSV for download with ALL fields populated
  const handleDownloadSampleCSV = () => {
    // Headers matching export format (ALL fields organized logically)
    const headers = [
      // Basic Product Information
      'id', 'name', 'category', 'featured',
      // Pricing & Stock
      'price', 'mrp', 'weight_grams', 'offer', 'stockQuantity',
      // Media
      'image', 'videoUrl',
      // Specifications (महत्वाचे गुणधर्म)
      'spec_ingredients', 'spec_quantity', 'spec_usageMethod', 
      'spec_effectiveness', 'spec_applicableCrops', 'spec_additionalInfo', 'spec_specialNotes',
      // Special Offers (विशेष ऑफर)
      'specialOffer_name', 'specialOffer_quantity', 'specialOffer_pricePerUnit'
    ];

    // Comprehensive sample rows with ALL fields properly filled
    const sampleRows = [
      [
        // Basic Product Information
        uuidv4(),
        'कटाई लप भारी देरी (Sample Product)',
        'बीज',
        'true',
        // Pricing & Stock
        '120',
        '150',
        '1000', // Weight in grams (1 kg)
        '20% OFF',
        '100',
        // Media
        'https://example.com/product-image-compressed.jpg',
        'https://www.youtube.com/watch?v=sample123',
        // Specifications (महत्वाचे गुणधर्म) - ALL FIELDS
        'NPK 19:19:19, Zinc 2%',
        '1 किलो (1 Kg)',
        'फवारणी किंवा ड्रिप (Spray or Drip)',
        '7-10 दिवसांत परिणाम (Results in 7-10 days)',
        'ऊस, कापूस, सोयाबीन, भाजीपाला (Sugarcane, Cotton, Soybean, Vegetables)',
        'पाण्यात विरघळणारे, जैविक (Water soluble, Organic)',
        'थंड जागी साठवा, मुलांपासून दूर ठेवा (Store in cool place, keep away from children)',
        // Special Offers (विशेष ऑफर) - ALL FIELDS
        'खरेदी करा 10 युनिट्स (Buy 10 Units)',
        '10',
        '110'
      ],
      [
        // Second sample product with different data
        uuidv4(),
        'Premium Fertilizer उत्तम खत',
        'पोषण',
        'false',
        // Pricing & Stock
        '250',
        '300',
        '5000', // Weight in grams (5 kg)
        '16% OFF',
        '50',
        // Media
        'https://example.com/fertilizer-image.jpg',
        '',
        // Specifications (ALL FIELDS - showing different examples)
        'Nitrogen 20%, Phosphorus 10%, Potassium 10%',
        '5 किलो बॅग (5 Kg Bag)',
        'जमिनीत मिसळा (Mix with soil)',
        '15-20 दिवसांत सुधारणा दिसेल (Improvement visible in 15-20 days)',
        'सर्व पिकांसाठी (For all crops)',
        'एकर प्रति 10-15 किलो वापरा (Use 10-15 kg per acre)',
        'पाऊस येण्यापूर्वी वापरा (Use before rainfall)',
        // Special Offers
        '',
        '',
        ''
      ]
    ];

    // Escape and format each cell
    const formatCell = (field) => {
      const stringField = String(field);
      if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };

    const formattedRows = sampleRows.map(row => row.map(formatCell).join(','));
    const csvContent = [headers.join(','), ...formattedRows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_products_import.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage('success', 'Sample CSV downloaded! Contains 2 example products with ALL fields filled.');
  };

  // Parse CSV and Import Products
  const handleImportProducts = async () => {
    if (!importFile) {
      showMessage('error', 'Please select a CSV file');
      return;
    }

    setImporting(true);
    try {
      const text = await importFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        showMessage('error', 'CSV file is empty or invalid');
        setImporting(false);
        return;
      }

      // Parse CSV
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
      const products = [];

      for (let i = 1; i < lines.length; i++) {
        const values = [];
        let currentValue = '';
        let insideQuotes = false;

        // Handle CSV with quoted values
        for (let char of lines[i]) {
          if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            values.push(currentValue.trim().replace(/^"(.*)"$/, '$1').replace(/""/g, '"'));
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim().replace(/^"(.*)"$/, '$1').replace(/""/g, '"'));

        if (values.length !== headers.length) {
          console.warn(`Skipping row ${i + 1}: column count mismatch`);
          continue;
        }

        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index];
        });

        // Construct product object
        const product = {
          id: rowData.id || uuidv4(),
          name: rowData.name || '',
          price: parseFloat(rowData.price) || 0,
          mrp: rowData.mrp ? parseFloat(rowData.mrp) : null,
          weight: rowData.weight_grams ? parseInt(rowData.weight_grams) : null, // Weight in grams
          offer: rowData.offer || '',
          category: rowData.category || '',
          image: rowData.image || '',
          videoUrl: rowData.videoUrl || '',
          stockQuantity: parseInt(rowData.stockQuantity) || 0,
          featured: rowData.featured === 'true',
          specifications: {
            ingredients: rowData.spec_ingredients || '',
            quantity: rowData.spec_quantity || '',
            usageMethod: rowData.spec_usageMethod || '',
            effectiveness: rowData.spec_effectiveness || '',
            applicableCrops: rowData.spec_applicableCrops || '',
            additionalInfo: rowData.spec_additionalInfo || '',
            specialNotes: rowData.spec_specialNotes || ''
          },
          searchKeywords: generateSearchKeywords(rowData.name || ''),
          specialOffer: (rowData.specialOffer_name && rowData.specialOffer_quantity && rowData.specialOffer_pricePerUnit) ? {
            offerName: rowData.specialOffer_name,
            quantity: parseInt(rowData.specialOffer_quantity),
            offerPricePerUnit: parseFloat(rowData.specialOffer_pricePerUnit)
          } : null
        };

        // Validate required fields
        if (!product.name || !product.price || !product.category || !product.weight) {
          console.warn(`Skipping row ${i + 1}: missing required fields (name, price, category, or weight)`);
          continue;
        }

        products.push(product);
      }

      if (products.length === 0) {
        showMessage('error', 'No valid products found in CSV');
        setImporting(false);
        return;
      }

      // Update or add products
      const existingProducts = [...shopData.products];
      let updatedCount = 0;
      let addedCount = 0;

      products.forEach(newProduct => {
        const existingIndex = existingProducts.findIndex(p => p.id === newProduct.id);
        if (existingIndex !== -1) {
          // Update existing product
          existingProducts[existingIndex] = newProduct;
          updatedCount++;
        } else {
          // Add new product
          existingProducts.push(newProduct);
          addedCount++;
        }
      });

      // Save to database
      const { error } = await supabase
        .from('shop_data')
        .update({ products: existingProducts, updated_at: new Date().toISOString() })
        .eq('admin_id', user.id);

      if (error) throw error;

      setShopData(prev => ({ ...prev, products: existingProducts }));
      setShowImportModal(false);
      setImportFile(null);
      
      showMessage('success', `Import successful! Added: ${addedCount}, Updated: ${updatedCount}`);
    } catch (error) {
      console.error('Import error:', error);
      showMessage('error', 'Failed to import products. Please check CSV format.');
    } finally {
      setImporting(false);
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
        {/* Icon-Only Tabs */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center justify-around">
            {/* Profile Tab */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'profile' 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
              data-testid="tab-profile"
            >
              <User className={`${activeTab === 'profile' ? 'w-7 h-7' : 'w-6 h-6'}`} />
              {activeTab === 'profile' && (
                <span className="text-xs font-semibold">Profile</span>
              )}
            </button>

            {/* Shop Info Tab */}
            <button
              onClick={() => setActiveTab('shop')}
              className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'shop' 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
              data-testid="tab-shop"
            >
              <Store className={`${activeTab === 'shop' ? 'w-7 h-7' : 'w-6 h-6'}`} />
              {activeTab === 'shop' && (
                <span className="text-xs font-semibold">Shop Info</span>
              )}
            </button>

            {/* Products Tab */}
            <button
              onClick={() => setActiveTab('products')}
              className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-lg font-semibold transition relative ${
                activeTab === 'products' 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
              data-testid="tab-products"
            >
              <Package className={`${activeTab === 'products' ? 'w-7 h-7' : 'w-6 h-6'}`} />
              {shopData.products.length > 0 && (
                <span className={`absolute -top-1 -right-1 ${activeTab === 'products' ? 'bg-emerald-600' : 'bg-gray-400'} text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold`}>
                  {shopData.products.length}
                </span>
              )}
              {activeTab === 'products' && (
                <span className="text-xs font-semibold">Products</span>
              )}
            </button>

            {/* Banners Tab */}
            <button
              onClick={() => setActiveTab('banners')}
              className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-lg font-semibold transition relative ${
                activeTab === 'banners' 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
              data-testid="tab-banners"
            >
              <ImageIcon className={`${activeTab === 'banners' ? 'w-7 h-7' : 'w-6 h-6'}`} />
              {shopData.banners.length > 0 && (
                <span className={`absolute -top-1 -right-1 ${activeTab === 'banners' ? 'bg-emerald-600' : 'bg-gray-400'} text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold`}>
                  {shopData.banners.length}
                </span>
              )}
              {activeTab === 'banners' && (
                <span className="text-xs font-semibold">Banners</span>
              )}
            </button>

            {/* Blogs Tab */}
            <button
              onClick={() => setActiveTab('blogs')}
              className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-lg font-semibold transition relative ${
                activeTab === 'blogs' 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
              data-testid="tab-blogs"
            >
              <Layout className={`${activeTab === 'blogs' ? 'w-7 h-7' : 'w-6 h-6'}`} />
              {shopData.blogs.length > 0 && (
                <span className={`absolute -top-1 -right-1 ${activeTab === 'blogs' ? 'bg-emerald-600' : 'bg-gray-400'} text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold`}>
                  {shopData.blogs.length}
                </span>
              )}
              {activeTab === 'blogs' && (
                <span className="text-xs font-semibold">Blogs</span>
              )}
            </button>

            {/* Overview Tab */}
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'overview' 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
              data-testid="tab-overview"
            >
              <BarChart3 className={`${activeTab === 'overview' ? 'w-7 h-7' : 'w-6 h-6'}`} />
              {activeTab === 'overview' && (
                <span className="text-xs font-semibold">Overview</span>
              )}
            </button>
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Management</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                <input
                  type="text"
                  value={user?.email ? user.email.replace('@gmail.com', '') : ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email (for authentication)</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-generated from mobile number</p>
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
                  <strong>Note:</strong> To change your mobile number or password, please use Supabase authentication settings.
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
              
              {/* Social Media Links Section */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                  <span>🔗</span>
                  <span>Social Media Links</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      value={shopData.social_links?.instagram || ''}
                      onChange={(e) => setShopData(prev => ({ 
                        ...prev, 
                        social_links: { ...prev.social_links, instagram: e.target.value }
                      }))}
                      placeholder="https://instagram.com/yourshop"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Facebook URL
                    </label>
                    <input
                      type="url"
                      value={shopData.social_links?.facebook || ''}
                      onChange={(e) => setShopData(prev => ({ 
                        ...prev, 
                        social_links: { ...prev.social_links, facebook: e.target.value }
                      }))}
                      placeholder="https://facebook.com/yourshop"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      YouTube URL
                    </label>
                    <input
                      type="url"
                      value={shopData.social_links?.youtube || ''}
                      onChange={(e) => setShopData(prev => ({ 
                        ...prev, 
                        social_links: { ...prev.social_links, youtube: e.target.value }
                      }))}
                      placeholder="https://youtube.com/@yourshop"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Setup Section */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                  <span>🚚</span>
                  <span>Delivery Setup</span>
                </h3>
                
                {/* Delivery Partner Name */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Delivery Partner Name
                  </label>
                  <input
                    type="text"
                    value={shopData.delivery?.partnerName || ''}
                    onChange={(e) => setShopData(prev => ({ 
                      ...prev, 
                      delivery: { ...prev.delivery, partnerName: e.target.value }
                    }))}
                    placeholder="Enter delivery partner name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                {/* Add New Slab */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Add Delivery Slab
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <select
                        value={newSlab.weight}
                        onChange={(e) => setNewSlab(prev => ({ ...prev, weight: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">Select Weight</option>
                        {getAvailableWeightOptions().map(weight => (
                          <option key={weight} value={weight}>{weight}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        value={newSlab.price}
                        onChange={(e) => setNewSlab(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="Price (₹)"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={handleAddSlab}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Slab</span>
                    </button>
                  </div>
                </div>

                {/* Display Added Slabs */}
                {shopData.delivery?.slabs && shopData.delivery.slabs.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Delivery Slabs ({shopData.delivery.slabs.length})
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {shopData.delivery.slabs
                        .sort((a, b) => parseFloat(a.weight) - parseFloat(b.weight))
                        .map((slab) => (
                          <div 
                            key={slab.weight}
                            className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">📦</span>
                              <div>
                                <p className="font-semibold text-gray-800">{slab.weight}</p>
                                <p className="text-sm text-emerald-600 font-medium">₹{slab.price}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveSlab(slab.weight)}
                              className="text-red-500 hover:text-red-700 transition"
                              title="Remove slab"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
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
                      placeholder="उत्पादनाचे नाव"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Selling Price (विक्री किंमत) *</label>
                    <input
                      type="number"
                      value={productForm.price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="₹ विक्री किंमत"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">MRP (किरकोळ किंमत)</label>
                    <input
                      type="number"
                      value={productForm.mrp}
                      onChange={(e) => setProductForm(prev => ({ ...prev, mrp: e.target.value }))}
                      placeholder="₹ MRP (strikethrough साठी)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Product Weight (उत्पादन वजन) *</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={productForm.weight}
                        onChange={(e) => setProductForm(prev => ({ ...prev, weight: e.target.value }))}
                        placeholder="Weight"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        min="1"
                        step="1"
                      />
                      <select
                        value={productForm.weightUnit}
                        onChange={(e) => setProductForm(prev => ({ ...prev, weightUnit: e.target.value }))}
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                      >
                        <option value="gram">Gram</option>
                        <option value="kg">Kg</option>
                      </select>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Whole numbers only. Will be stored in grams.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Product Quantity (स्टॉक प्रमाण) *</label>
                    <input
                      type="number"
                      value={productForm.stockQuantity}
                      onChange={(e) => setProductForm(prev => ({ ...prev, stockQuantity: e.target.value }))}
                      placeholder="स्टॉकमधील प्रमाण (उदा: 100)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Available stock for this product</p>
                  </div>
                </div>
                
                {/* Special Offer Section - Moved here */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl shadow-sm p-4 border-2 border-red-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-2xl">🎁</span>
                    <h3 className="text-base font-bold text-gray-800">विशेष ऑफर (Special Offer)</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Offer Name</label>
                      <input
                        type="text"
                        value={productForm.specialOffer.offerName}
                        onChange={(e) => setProductForm(prev => ({ 
                          ...prev, 
                          specialOffer: { ...prev.specialOffer, offerName: e.target.value }
                        }))}
                        placeholder="उदा: खरेदी करा 10"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Select Quantity (Batch Size)</label>
                      <select
                        value={productForm.specialOffer.quantity}
                        onChange={(e) => setProductForm(prev => ({ 
                          ...prev, 
                          specialOffer: { ...prev.specialOffer, quantity: e.target.value }
                        }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="">निवडा</option>
                        {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Offer Price - Per Unit</label>
                      <input
                        type="number"
                        value={productForm.specialOffer.offerPricePerUnit}
                        onChange={(e) => setProductForm(prev => ({ 
                          ...prev, 
                          specialOffer: { ...prev.specialOffer, offerPricePerUnit: e.target.value }
                        }))}
                        placeholder="₹ प्रति युनिट"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  {productForm.specialOffer.offerName && productForm.specialOffer.quantity && productForm.specialOffer.offerPricePerUnit && (
                    <div className="mt-3 bg-white border border-red-300 rounded-lg p-2">
                      <p className="text-xs text-gray-700">
                        <strong>Auto Description:</strong> {productForm.specialOffer.offerName} - {productForm.specialOffer.quantity} युनिट्स @ ₹{productForm.specialOffer.offerPricePerUnit}/युनिट (एकूण: ₹{productForm.specialOffer.quantity * productForm.specialOffer.offerPricePerUnit})
                      </p>
                    </div>
                  )}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Video URL (YouTube)</label>
                  <input
                    type="url"
                    value={productForm.videoUrl}
                    onChange={(e) => setProductForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">वापरण्याची पद्धत दाखवणारा YouTube video URL</p>
                </div>
                
                {/* Specifications Section */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">महत्वाचे गुणधर्म (Specifications)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">घटक (Ingredients)</label>
                      <input
                        type="text"
                        value={productForm.specifications.ingredients}
                        onChange={(e) => setProductForm(prev => ({ 
                          ...prev, 
                          specifications: { ...prev.specifications, ingredients: e.target.value }
                        }))}
                        placeholder="उदा: NPK 19:19:19"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">प्रमाण (Quantity)</label>
                      <input
                        type="text"
                        value={productForm.specifications.quantity}
                        onChange={(e) => setProductForm(prev => ({ 
                          ...prev, 
                          specifications: { ...prev.specifications, quantity: e.target.value }
                        }))}
                        placeholder="उदा: 1 किग्रॅ"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">वापरण्याची पद्धत (Usage Method)</label>
                      <input
                        type="text"
                        value={productForm.specifications.usageMethod}
                        onChange={(e) => setProductForm(prev => ({ 
                          ...prev, 
                          specifications: { ...prev.specifications, usageMethod: e.target.value }
                        }))}
                        placeholder="उदा: फवारणी किंवा ड्रिप"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">परिणामकारकता (Effectiveness)</label>
                      <input
                        type="text"
                        value={productForm.specifications.effectiveness}
                        onChange={(e) => setProductForm(prev => ({ 
                          ...prev, 
                          specifications: { ...prev.specifications, effectiveness: e.target.value }
                        }))}
                        placeholder="उदा: 7-10 दिवसात"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">पिकांसाठी लागू (Applicable Crops)</label>
                      <input
                        type="text"
                        value={productForm.specifications.applicableCrops}
                        onChange={(e) => setProductForm(prev => ({ 
                          ...prev, 
                          specifications: { ...prev.specifications, applicableCrops: e.target.value }
                        }))}
                        placeholder="उदा: ऊस, कापूस, सोयाबीन"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">अतिरिक्त माहिती (Additional Info)</label>
                      <input
                        type="text"
                        value={productForm.specifications.additionalInfo}
                        onChange={(e) => setProductForm(prev => ({ 
                          ...prev, 
                          specifications: { ...prev.specifications, additionalInfo: e.target.value }
                        }))}
                        placeholder="कोणतीही अतिरिक्त माहिती"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">विशेष टिप्पनी (Special Notes)</label>
                    <textarea
                      value={productForm.specifications.specialNotes}
                      onChange={(e) => setProductForm(prev => ({ 
                        ...prev, 
                        specifications: { ...prev.specifications, specialNotes: e.target.value }
                      }))}
                      placeholder="विशेष सूचना किंवा टिप्पणी"
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Image (Target: ≤20KB)</label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    
                    {/* Compression Progress Indicator */}
                    {uploadingImage && compressionProgress && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-blue-800">
                            {compressionProgress.step === 1 ? '⚡ Step 1: Fast Compression' : 
                             compressionProgress.step === 2 ? '🎯 Step 2: Precise Compression' : 
                             compressionProgress.step === 3 ? '☁️ Uploading...' : 
                             '🔄 Processing...'}
                          </span>
                          {compressionProgress.progress && (
                            <span className="text-xs font-bold text-blue-600">
                              {Math.round(compressionProgress.progress)}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-blue-700">{compressionProgress.message}</p>
                        {compressionProgress.progress && (
                          <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${compressionProgress.progress}%` }}
                            ></div>
                          </div>
                        )}
                        {compressionProgress.originalSize && (
                          <p className="text-xs text-gray-600">
                            Original: {compressionProgress.originalSize}KB
                            {compressionProgress.finalSize && ` → Compressed: ${compressionProgress.finalSize}KB`}
                          </p>
                        )}
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
                        setProductForm({ 
                          id: '', 
                          name: '', 
                          price: '', 
                          mrp: '', 
                          offer: '', 
                          category: '', 
                          image: '', 
                          videoUrl: '', 
                          stockQuantity: '',
                          specifications: {
                            ingredients: '',
                            quantity: '',
                            usageMethod: '',
                            effectiveness: '',
                            applicableCrops: '',
                            additionalInfo: '',
                            specialNotes: ''
                          },
                          featured: false, 
                          searchKeywords: [],
                          specialOffer: {
                            offerName: '',
                            quantity: '',
                            offerPricePerUnit: ''
                          }
                        });
                        setEditingProduct(false);
                        setEditingProductType(null);
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
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Contextual Action Bar - appears in selection mode at top of container */}
              {isSelectionMode ? (
                <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-red-700 text-white shadow-xl mb-4 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <button
                        onClick={handleCancelSelection}
                        className="hover:bg-red-800 p-1.5 rounded-full transition flex-shrink-0"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <h3 className="text-base font-semibold whitespace-nowrap">
                        {selectedProducts.length} Selected
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={handleSelectAllProducts}
                        className="bg-red-800 hover:bg-red-900 px-2.5 py-1.5 rounded-lg font-semibold transition text-sm whitespace-nowrap"
                      >
                        {selectedProducts.length === shopData.products.length ? 'Deselect All' : 'Select All'}
                      </button>
                      <button
                        onClick={handleDeleteMultiple}
                        disabled={saving}
                        className="bg-white text-red-600 hover:bg-gray-100 font-semibold px-2.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 disabled:opacity-50 text-sm whitespace-nowrap"
                        data-testid="delete-selected-btn"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{saving ? 'Deleting...' : 'Delete'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 pb-4">
                  {/* Header Row with Title and Buttons */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-800">
                      All Products ({shopData.products.length + pendingProducts.length})
                    </h3>
                    <div className="flex items-center space-x-2">
                      {/* Import Button */}
                      <button
                        onClick={() => setShowImportModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-lg transition flex items-center space-x-2"
                        data-testid="import-products-btn"
                      >
                        <FileUp className="w-4 h-4" />
                        <span>Import</span>
                      </button>
                      
                      {/* Export Button */}
                      <button
                        onClick={handleExportProducts}
                        disabled={shopData.products.length === 0}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-lg transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid="export-products-btn"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Stats Row */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Saved: {shopData.products.length} | Pending: {pendingProducts.length}
                    </p>
                    <div>
                      {pendingProducts.length > 0 && (
                        <button
                          onClick={handleBulkSaveProducts}
                          disabled={saving}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg transition flex items-center space-x-2 disabled:opacity-50"
                          data-testid="save-all-btn"
                        >
                          <Save className="w-5 h-5" />
                          <span>{saving ? 'Saving...' : `Save All (${pendingProducts.length})`}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className={`px-6 pb-6 ${isSelectionMode ? 'pt-20' : ''}`}>
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
                                {product.weight && (
                                  <p className="text-sm text-purple-600 font-semibold mb-1">
                                    ⚖️ Weight: {formatWeight(product.weight)}
                                  </p>
                                )}
                                {product.stockQuantity !== undefined && (
                                  <p className="text-sm text-blue-600 font-semibold mb-1">
                                    📦 Stock: {product.stockQuantity} units
                                  </p>
                                )}
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
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => handleEditProduct(product, 'pending')}
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
                      {!isSelectionMode && (
                        <p className="text-xs text-gray-500 mb-3 text-center italic">
                          💡 Long press on any product to activate selection mode
                        </p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {shopData.products.map(product => (
                          <div 
                            key={product.id} 
                            className={`border rounded-lg p-3 transition relative select-none ${
                              selectedProducts.includes(product.id) 
                                ? 'border-red-500 bg-red-50 border-2 shadow-lg' 
                                : 'border-gray-200 hover:shadow-lg'
                            } ${isSelectionMode ? 'cursor-pointer' : ''}`}
                            onMouseDown={(e) => {
                              if (!isSelectionMode && e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                                handleLongPressStart(product.id);
                              }
                            }}
                            onMouseUp={handleLongPressEnd}
                            onMouseLeave={handleLongPressEnd}
                            onTouchStart={(e) => {
                              if (!isSelectionMode && e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                                handleLongPressStart(product.id);
                              }
                            }}
                            onTouchEnd={handleLongPressEnd}
                            onClick={(e) => {
                              if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                                handleProductClick(product.id, product);
                              }
                            }}
                          >
                            {selectedProducts.includes(product.id) && (
                              <div className="absolute top-2 left-2 z-10">
                                <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            )}
                            <div className="flex gap-3">
                              <div className={`flex-1 ${selectedProducts.includes(product.id) ? 'pl-8' : ''}`}>
                                <h4 className="font-bold text-gray-800 mb-1 pr-20">{product.name}</h4>
                                <p className="text-emerald-600 font-bold text-lg mb-1">₹{product.price}</p>
                                {product.weight && (
                                  <p className="text-sm text-purple-600 font-semibold mb-1">
                                    ⚖️ Weight: {formatWeight(product.weight)}
                                  </p>
                                )}
                                {product.stockQuantity !== undefined && (
                                  <p className="text-sm text-blue-600 font-semibold mb-1">
                                    📦 Stock: {product.stockQuantity} units
                                  </p>
                                )}
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
                            {!isSelectionMode && (
                              <div className="mt-2 flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditProduct(product, 'saved');
                                  }}
                                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition flex items-center justify-center space-x-1"
                                  data-testid={`edit-saved-${product.id}`}
                                >
                                  <Edit2 className="w-4 h-4" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteProduct(product.id, false);
                                  }}
                                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition flex items-center justify-center space-x-1"
                                  data-testid={`delete-saved-${product.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  </div>
                )}
              </div>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Banner Image * (Target: ≤50KB)</label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerImageUpload}
                      disabled={uploadingBannerImage}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    
                    {/* Banner Compression Progress Indicator */}
                    {uploadingBannerImage && bannerCompressionProgress && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-purple-800">
                            {bannerCompressionProgress.step === 1 ? '⚡ Step 1: Fast Compression' : 
                             bannerCompressionProgress.step === 2 ? '🎯 Step 2: Precise Compression' : 
                             bannerCompressionProgress.step === 3 ? '☁️ Uploading...' : 
                             '🔄 Processing...'}
                          </span>
                          {bannerCompressionProgress.progress && (
                            <span className="text-xs font-bold text-purple-600">
                              {Math.round(bannerCompressionProgress.progress)}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-purple-700">{bannerCompressionProgress.message}</p>
                        {bannerCompressionProgress.progress && (
                          <div className="w-full bg-purple-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${bannerCompressionProgress.progress}%` }}
                            ></div>
                          </div>
                        )}
                        {bannerCompressionProgress.originalSize && (
                          <p className="text-xs text-gray-600">
                            Original: {bannerCompressionProgress.originalSize}KB
                            {bannerCompressionProgress.finalSize && ` → Compressed: ${bannerCompressionProgress.finalSize}KB`}
                          </p>
                        )}
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

        {/* Blogs Tab */}
        {activeTab === 'blogs' && (
          <div className="space-y-6">
            {/* Add/Edit Blog Form */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
                <span>{editingBlog ? 'Edit Blog' : 'Add New Blog'}</span>
                {editingBlog && (
                  <span className="text-sm font-normal text-gray-500">(Editing)</span>
                )}
              </h2>
              <div className="space-y-6">
                {/* Layout Selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                    <Layout className="w-4 h-4" />
                    <span>Select Blog Layout *</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(BLOG_LAYOUTS).map(([key, layout]) => (
                      <button
                        key={key}
                        onClick={() => setBlogForm(prev => ({ ...prev, layout: key }))}
                        className={`relative p-4 border-2 rounded-lg transition ${
                          blogForm.layout === key
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-300 hover:border-emerald-300'
                        }`}
                      >
                        {/* Layout Preview Box */}
                        <div className="flex items-center justify-center mb-2">
                          <div 
                            className={`bg-gradient-to-br from-gray-300 to-gray-400 rounded ${
                              blogForm.layout === key ? 'shadow-md' : ''
                            }`}
                            style={{ 
                              width: '80px',
                              height: `${80 / layout.aspect}px`
                            }}
                          />
                        </div>
                        <p className="text-xs font-semibold text-gray-800 text-center mb-1">{layout.name}</p>
                        <p className="text-xs text-gray-600 text-center">{layout.description}</p>
                        {blogForm.layout === key && (
                          <div className="absolute top-2 right-2">
                            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Choose a layout that matches your content style. Image will be cropped to fit the selected aspect ratio.
                  </p>
                </div>

                {/* Blog Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Blog Image * <span className="text-red-600 font-normal">(Max 200KB)</span>
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBlogImageUpload}
                      disabled={uploadingBlogImage}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    
                    {uploadingBlogImage && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-blue-800">📤 Uploading image...</p>
                      </div>
                    )}
                    
                    {blogForm.image && (
                      <div className="relative rounded-lg overflow-hidden border-2 border-emerald-200">
                        <div 
                          className="relative w-full bg-gray-100"
                          style={{ 
                            paddingBottom: `${(1 / BLOG_LAYOUTS[blogForm.layout].aspect) * 100}%`
                          }}
                        >
                          <img 
                            src={blogForm.image} 
                            alt="Blog Preview" 
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => setBlogForm(prev => ({ ...prev, image: '' }))}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Crop Selection Dropdown */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    पीक निवड (Crop Selection)
                  </label>
                  <select
                    value={blogForm.selectedCrop}
                    onChange={(e) => setBlogForm(prev => ({ ...prev, selectedCrop: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">सर्व पिके (All Crops)</option>
                    {CROP_CATEGORIES.map(category => (
                      <optgroup key={category.name} label={category.name}>
                        {category.crops.map(crop => (
                          <option key={crop} value={crop}>{crop}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 विशिष्ट पिकासाठी blog filter करण्यासाठी पीक निवडा. रिक्त ठेवल्यास सर्व users साठी दाखवेल.
                  </p>
                </div>

                {/* Product Attachment Section - Only show when specific crop is selected */}
                {blogForm.selectedCrop && (
                  <div className="border-2 border-emerald-200 rounded-lg p-4 bg-emerald-50">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                      <Package className="w-5 h-5 text-emerald-600" />
                      <span>उत्पादने जोडा (Attach Products)</span>
                    </label>
                    <p className="text-xs text-gray-600 mb-3">
                      या पिकाच्या blog खाली दाखवण्यासाठी उत्पादने निवडा
                    </p>
                    
                    {/* Selected Products Display */}
                    {blogForm.attachedProducts?.length > 0 && (
                      <div className="mb-3 space-y-2">
                        <p className="text-sm font-semibold text-emerald-700">
                          निवडलेली उत्पादने ({blogForm.attachedProducts?.length}):
                        </p>
                        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                          {blogForm.attachedProducts?.map(productId => {
                            const product = shopData.products.find(p => p.id === productId);
                            if (!product) return null;
                            return (
                              <div 
                                key={productId}
                                className="flex items-center justify-between bg-white p-2 rounded-lg border border-emerald-200"
                              >
                                <div className="flex items-center space-x-3">
                                  {product.image && (
                                    <img 
                                      src={product.image} 
                                      alt={product.name}
                                      className="w-12 h-12 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">{product.name}</p>
                                    <p className="text-xs text-gray-500">₹{product.price}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setBlogForm(prev => ({
                                      ...prev,
                                      attachedProducts: (prev.attachedProducts || []).filter(id => id !== productId)
                                    }));
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  data-testid={`remove-product-${productId}`}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Add Products Button */}
                    <button
                      type="button"
                      onClick={() => setShowProductSelector(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center space-x-2"
                      data-testid="select-products-btn"
                    >
                      <Plus className="w-4 h-4" />
                      <span>उत्पादने निवडा</span>
                    </button>
                  </div>
                )}

                {/* Product Selector Modal */}
                {showProductSelector && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                      {/* Modal Header */}
                      <div className="flex items-center justify-between p-6 border-b">
                        <h3 className="text-xl font-bold text-gray-800">उत्पादने निवडा</h3>
                        <button
                          onClick={() => setShowProductSelector(false)}
                          className="text-gray-400 hover:text-gray-600 transition"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                      
                      {/* Modal Body */}
                      <div className="flex-1 overflow-y-auto p-6">
                        {shopData.products.length === 0 ? (
                          <div className="text-center py-12">
                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">उत्पादने उपलब्ध नाहीत</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {shopData.products.map(product => {
                              const isSelected = blogForm.attachedProducts?.includes(product.id);
                              return (
                                <div
                                  key={product.id}
                                  onClick={() => {
                                    setBlogForm(prev => ({
                                      ...prev,
                                      attachedProducts: isSelected
                                        ? (prev.attachedProducts || []).filter(id => id !== product.id)
                                        : [...(prev.attachedProducts || []), product.id]
                                    }));
                                  }}
                                  className={`cursor-pointer border-2 rounded-lg p-3 transition ${
                                    isSelected 
                                      ? 'border-emerald-500 bg-emerald-50' 
                                      : 'border-gray-200 hover:border-emerald-300'
                                  }`}
                                  data-testid={`product-selector-${product.id}`}
                                >
                                  {product.image && (
                                    <img 
                                      src={product.image} 
                                      alt={product.name}
                                      className="w-full h-32 object-cover rounded mb-2"
                                    />
                                  )}
                                  <h4 className="font-semibold text-sm text-gray-800 mb-1">{product.name}</h4>
                                  <p className="text-xs text-gray-600 mb-2">{product.category}</p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-emerald-600 font-bold">₹{product.price}</span>
                                    {isSelected && (
                                      <div className="bg-emerald-500 text-white rounded-full p-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      
                      {/* Modal Footer */}
                      <div className="border-t p-6 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600">
                            निवडलेली: <span className="font-bold text-emerald-600">{blogForm.attachedProducts?.length || 0}</span> उत्पादने
                          </p>
                          <button
                            onClick={() => setShowProductSelector(false)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-lg transition"
                            data-testid="done-selecting-btn"
                          >
                            पूर्ण (Done)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rich Text Editor */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Blog Content * <span className="text-red-600 font-normal">(Max 1,500 characters)</span>
                  </label>
                  <RichTextEditor
                    value={blogForm.text}
                    onChange={(content) => setBlogForm(prev => ({ ...prev, text: content }))}
                    maxLength={1500}
                    placeholder="Write your blog content with rich formatting..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleAddBlog}
                    disabled={saving || uploadingBlogImage}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                    <span>{saving ? 'Saving...' : editingBlog ? 'Update Blog' : 'Add Blog'}</span>
                  </button>
                  {editingBlog && (
                    <button
                      onClick={() => {
                        setBlogForm({ id: '', image: '', text: '', layout: 'standard', selectedCrop: '', attachedProducts: [] });
                        setEditingBlog(false);
                      }}
                      className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-3 rounded-lg transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Blogs List */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">All Blogs ({shopData.blogs.length})</h3>
              {shopData.blogs.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-semibold">No blogs added yet</p>
                  <p className="text-sm text-gray-400 mt-1">Create your first blog post to engage your customers</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shopData.blogs.map(blog => (
                    <div key={blog.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                      <div className="relative w-full bg-gray-100">
                        {blog.image ? (
                          <div 
                            className="relative w-full"
                            style={{ 
                              paddingBottom: `${(1 / (BLOG_LAYOUTS[blog.layout || 'standard'].aspect)) * 100}%`
                            }}
                          >
                            <img 
                              src={blog.image} 
                              alt="Blog" 
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-32 flex items-center justify-center text-gray-400">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                        {/* Layout Badge */}
                        <div className="absolute top-2 left-2">
                          <span className="bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded">
                            {BLOG_LAYOUTS[blog.layout || 'standard'].name}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        {/* Selected Crop Badge */}
                        <div className="mb-2 flex flex-wrap gap-2">
                          {blog.selectedCrop && (
                            <span className="inline-flex items-center bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-1 rounded">
                              <span className="mr-1">🌾</span>
                              {blog.selectedCrop}
                            </span>
                          )}
                          {blog.attachedProducts && blog.attachedProducts.length > 0 && (
                            <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                              <Package className="w-3 h-3 mr-1" />
                              {blog.attachedProducts.length} उत्पादने
                            </span>
                          )}
                        </div>
                        <div 
                          className="text-sm text-gray-700 mb-3 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: blog.text }}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditBlog(blog)}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition flex items-center justify-center space-x-1 text-sm font-semibold"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteBlog(blog.id)}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition flex items-center justify-center space-x-1 text-sm font-semibold"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Total Views Card */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-semibold mb-1">Total Views</p>
                    <h3 className="text-4xl font-bold">{shopData.overview?.totalViews || 0}</h3>
                    <p className="text-blue-100 text-xs mt-2">Homepage visits</p>
                  </div>
                  <div className="bg-white/20 p-4 rounded-full">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Total Orders Card */}
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-semibold mb-1">Total Orders</p>
                    <h3 className="text-4xl font-bold">{shopData.overview?.totalOrders || 0}</h3>
                    <p className="text-emerald-100 text-xs mt-2">WhatsApp orders placed</p>
                  </div>
                  <div className="bg-white/20 p-4 rounded-full">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Order History */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
                <span>📋</span>
                <span>Order History</span>
              </h2>
              
              {!shopData.overview?.orderHistory || shopData.overview.orderHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-gray-500 text-lg">No orders yet</p>
                  <p className="text-gray-400 text-sm mt-2">Orders will appear here when customers place orders via WhatsApp</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date & Time</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Address</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Products</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Subtotal</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Discount</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {shopData.overview.orderHistory.slice().reverse().map((order, index) => (
                        <tr key={order.id || index} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(order.orderDate).toLocaleDateString('en-IN', { 
                                day: '2-digit', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(order.orderDate).toLocaleTimeString('en-IN', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-semibold text-gray-900">{order.customerName}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-600 max-w-xs truncate" title={order.customerAddress}>
                              {order.customerAddress}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900">
                              {order.products.map((product, idx) => (
                                <div key={idx} className="mb-1">
                                  <span className="font-medium">{product.name}</span>
                                  <span className="text-gray-500"> × {product.quantity}</span>
                                  <span className="text-gray-400 text-xs"> @ ₹{product.price}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="text-sm font-medium text-gray-900">₹{order.subtotal.toFixed(2)}</div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="text-sm font-medium text-red-600">
                              {order.discount > 0 ? `-₹${order.discount.toFixed(2)}` : '-'}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="text-sm font-bold text-emerald-600">₹{order.totalAmount.toFixed(2)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Crop Modal */}
      {/* Import Products Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileUp className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">Import Products from CSV</h2>
                </div>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                  }}
                  className="hover:bg-white/20 p-2 rounded-full transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center space-x-2">
                  <span>📋</span>
                  <span>Important Instructions</span>
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start space-x-2">
                    <span className="font-bold mt-0.5">1.</span>
                    <span><strong>Download the sample CSV</strong> - Contains ALL product fields including specifications (महत्वाचे गुणधर्म), special offers (विशेष ऑफर), pricing, and media</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="font-bold mt-0.5">2.</span>
                    <span>Fill in your product data following the same column structure - ALL columns are included</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="font-bold mt-0.5">3.</span>
                    <span className="font-semibold">⚠️ CRITICAL: Product image links MUST point to images under 20KB in size</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="font-bold mt-0.5">4.</span>
                    <span>Images larger than 20KB will cause upload issues and may be rejected</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="font-bold mt-0.5">5.</span>
                    <span>Use services like TinyPNG or Cloudinary to compress images before uploading</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="font-bold mt-0.5">6.</span>
                    <span>Required fields: <strong>name, price, category</strong> - All other fields are optional</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="font-bold mt-0.5">7.</span>
                    <span>If a product ID already exists, it will be <strong>updated</strong> with new data</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="font-bold mt-0.5">8.</span>
                    <span>Products will be saved <strong>directly to the database</strong></span>
                  </li>
                </ul>
              </div>

              {/* Download Sample CSV */}
              <div className="border-2 border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">Step 1: Download Sample CSV</h3>
                <button
                  onClick={handleDownloadSampleCSV}
                  className="w-full bg-gray-100 hover:bg-gray-200 border-2 border-gray-300 text-gray-800 font-semibold px-4 py-3 rounded-lg transition flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Sample CSV Template</span>
                </button>
                <p className="text-xs text-gray-600 mt-2 font-medium">
                  ✅ Contains 2 example products with <strong>ALL fields</strong> populated: name, price, category, specifications (महत्वाचे गुणधर्म), special offers (विशेष ऑफर), and more
                </p>
              </div>

              {/* Upload CSV */}
              <div className="border-2 border-emerald-200 rounded-lg p-4 bg-emerald-50">
                <h3 className="font-bold text-gray-900 mb-3">Step 2: Upload Your CSV File</h3>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                />
                {importFile && (
                  <p className="text-sm text-emerald-700 mt-2 font-semibold">
                    ✓ Selected: {importFile.name}
                  </p>
                )}
              </div>

              {/* Warning */}
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <h3 className="font-bold text-red-900 mb-2 flex items-center space-x-2">
                  <span>⚠️</span>
                  <span>Warning</span>
                </h3>
                <p className="text-sm text-red-800">
                  Make sure all image URLs in your CSV point to compressed images (under 20KB). 
                  Large images will slow down your shop and may cause failures. 
                  We recommend uploading images through the normal product form which automatically compresses them.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={handleImportProducts}
                  disabled={!importFile || importing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-5 h-5" />
                  <span>{importing ? 'Importing...' : 'Import Products'}</span>
                </button>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                  }}
                  disabled={importing}
                  className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-3 rounded-lg transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCropModal && cropFile && (
        <CropModal
          file={cropFile}
          aspectRatio={
            cropType === 'product' ? 4 / 3 : 
            cropType === 'banner' ? 21 / 9 : 
            cropType === 'blog' ? BLOG_LAYOUTS[blogForm.layout].aspect : 
            1
          }
          title={
            cropType === 'product' ? 'Crop Product Image (4:3 ratio)' : 
            cropType === 'banner' ? 'Crop Banner Image (21:9 ratio - Ultra Wide)' : 
            cropType === 'blog' ? `Crop Blog Image (${BLOG_LAYOUTS[blogForm.layout].name})` : 
            'Crop Image'
          }
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}