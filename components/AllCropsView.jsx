'use client';

import { useMemo } from 'react';

// Complete crop data matching admin dashboard categories
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

// This will be computed dynamically in the component using blogs data

export default function AllCropsView({ blogs, onBack, onSelectCrop, shopData }) {
  // Group crops by category with post counts, showing only crops with posts
  const groupedCrops = useMemo(() => {
    // Build dynamic CROPS_DATA with first blog images
    const CROPS_DATA_DYNAMIC = CROP_CATEGORIES.flatMap(category => 
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
    
    const cropsWithCounts = CROPS_DATA_DYNAMIC.map(crop => ({
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
      <section className="container mx-auto px-4 py-12 flex-1">
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
                  <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-[#177B3B] pb-2">
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
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-4 border-[#177B3B]/30 shadow-lg hover:shadow-xl flex items-center justify-center overflow-hidden">
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
      <footer className="bg-gradient-to-r from-[#177B3B] to-[#01582E] text-white py-8 mt-auto rounded-t-[32px]">
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
