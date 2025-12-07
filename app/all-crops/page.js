'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ShoppingCart, Menu, LogOut, Settings } from 'lucide-react';
import { supabase, getCurrentUser } from '@/lib/supabase';

// Crop data with images and categories
const CROPS_DATA = [
  // भाज्या (Vegetables)
  { name: 'बटाटा', image: '/images/crops/बटाटा.webp', category: 'भाज्या' },
  { name: 'कोबी', image: '/images/crops/कोबी.webp', category: 'भाज्या' },
  { name: 'टोमॅटो', image: '/images/crops/टोमॅटो.webp', category: 'भाज्या' },
  { name: 'कांदा', image: '/images/crops/कांदा.webp', category: 'भाज्या' },
  
  // धान्य (Grains)
  { name: 'गहू', image: '/images/crops/गहू.webp', category: 'धान्य' },
  { name: 'भात', image: '/images/crops/भात.webp', category: 'धान्य' },
  { name: 'डिंक गवार', image: '/images/crops/डिंकगवार.webp', category: 'धान्य' },
  { name: 'गवार', image: '/images/crops/गवार.webp', category: 'धान्य' },
  
  // नगदी पिके (Cash Crops)
  { name: 'ऊस', image: '/images/crops/ऊस.webp', category: 'नगदी पिके' },
  { name: 'कापूस', image: '/images/crops/कापूस.webp', category: 'नगदी पिके' }
];

export default function AllCropsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

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
        const cart = JSON.parse(savedCart);
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        setCartItemCount(count);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
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
        setBlogs(data.blogs || []);
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

  // Group crops by category with post counts, showing only crops with posts
  const groupedCrops = useMemo(() => {
    const cropsWithCounts = CROPS_DATA.map(crop => ({
      ...crop,
      postCount: blogs.filter(blog => blog.selectedCrop === crop.name).length
    })).filter(crop => crop.postCount > 0); // Only show crops with at least 1 post

    const grouped = {};
    cropsWithCounts.forEach(crop => {
      if (!grouped[crop.category]) {
        grouped[crop.category] = [];
      }
      grouped[crop.category].push(crop);
    });

    return grouped;
  }, [blogs]);

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
                onClick={() => router.push('/')}
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2" data-testid="all-crops-title">
              सर्व पीके
            </h1>
            <p className="text-gray-600 text-lg">
              आपल्या पिकाबद्दलची संपूर्ण माहिती येथे उपलब्ध आहे
            </p>
          </div>
        </div>
      </section>

      {/* Crops Grid by Category */}
      <section className="container mx-auto px-4 py-12">
        {Object.keys(groupedCrops).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌾</div>
            <p className="text-gray-500 text-lg mb-2">अद्याप कोणत्याही पिकासाठी पोस्ट उपलब्ध नाहीत</p>
            <p className="text-gray-400 text-sm">लवकरच आम्ही पिकांबद्दल माहिती जोडू</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedCrops).map(([category, crops]) => (
              <div key={category}>
                {/* Category Header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-emerald-500 pb-2">
                    {category}
                  </h2>
                </div>

                {/* Crops Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                  {crops.map((crop, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        router.push(`/crops/${encodeURIComponent(crop.name)}`);
                      }}
                      className="flex flex-col items-center space-y-2 transition-all duration-300 hover:transform hover:scale-105 bg-white p-4 rounded-xl shadow-md hover:shadow-xl"
                      data-testid={`crop-card-${crop.name}`}
                    >
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-4 border-emerald-200 shadow-lg hover:shadow-xl flex items-center justify-center overflow-hidden">
                        <img 
                          src={crop.image} 
                          alt={crop.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/80x80/f59e0b/ffffff?text=' + encodeURIComponent(crop.name.charAt(0));
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-center text-gray-700">
                        {crop.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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
