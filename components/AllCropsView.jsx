'use client';

import { useMemo } from 'react';

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

export default function AllCropsView({ blogs, onBack, onSelectCrop, shopData }) {
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

  return (
    <div className="min-h-screen bg-gray-50">
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
                      onClick={() => onSelectCrop(crop.name)}
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
