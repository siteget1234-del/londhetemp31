'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { ChevronLeft, MapPin, Phone, Clock, Award, Users, Leaf, Truck, ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AboutUs() {
  const [shopData, setShopData] = useState(null);

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      const { data, error } = await supabase
        .from('shop_data')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      if (data) {
        setShopData(data);
      }
    } catch (error) {
      console.error('Error fetching shop data:', error);
    }
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <Head>
        <title>आमच्याबद्दल - लोंढे कृषी सेवा केंद्र | कसबे तडवळे धाराशिव</title>
        <meta name="description" content="लोंढे कृषी सेवा केंद्र - कसबे तडवळे धाराशिव 413405 येथील विश्वसनीय कृषी सेवा केंद्र. बियाणे, खते, पोषण, संरक्षण साधने आणि हार्डवेअर उत्पादने उपलब्ध. शेतकऱ्यांसाठी एक विश्वसनीय भागीदार." />
        <meta name="keywords" content="लोंढे कृषी सेवा केंद्र, कसबे तडवळे, धाराशिव, कृषी उत्पादने, बियाणे, खते, कीटकनाशके, शेती साधने, महाराष्ट्र" />
        <meta property="og:title" content="आमच्याबद्दल - लोंढे कृषी सेवा केंद्र" />
        <meta property="og:description" content="लोंढे कृषी सेवा केंद्र - कसबे तडवळे धाराशिव येथील विश्वसनीय कृषी सेवा केंद्र" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="/about" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        {/* Header */}
        <header className="bg-gradient-to-r from-[#177B3B] to-[#01582E] text-white sticky top-0 z-50 shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center space-x-3">
              <Link 
                href="/"
                className="flex items-center space-x-2 hover:bg-white/10 px-3 py-2 rounded-xl transition bg-white/5 backdrop-blur-sm"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>मुख्यपृष्ठ</span>
              </Link>
              <h1 className="text-lg font-bold">आमच्याबद्दल</h1>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Hero Section */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-[#177B3B] to-[#01582E] text-white p-8 text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                लोंढे कृषी सेवा केंद्र
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-2">
                कसबे तडवळे, धाराशिव - 413405
              </p>
              <p className="text-lg text-white/80">
                महाराष्ट्र
              </p>
            </div>

            <div className="p-8">
              {/* Introduction */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <Leaf className="w-7 h-7 text-[#177B3B] mr-2" />
                  आमचे ध्येय
                </h2>
                <p className="text-gray-700 leading-relaxed text-lg mb-4">
                  लोंढे कृषी सेवा केंद्र हे कसबे तडवळे, धाराशिव येथील एक अग्रगण्य आणि विश्वसनीय कृषी सेवा केंद्र आहे. 
                  आम्ही शेतकऱ्यांना उच्च दर्जाच्या कृषी उत्पादनांची पुरवठा करून त्यांच्या शेती व्यवसायात यशस्वी होण्यास मदत करतो.
                </p>
                <p className="text-gray-700 leading-relaxed text-lg">
                  आमचा उद्देश शेतकऱ्यांना सर्वोत्तम बियाणे, खते, पोषण, संरक्षण साधने आणि आधुनिक हार्डवेअर 
                  उत्पादने प्रदान करून त्यांच्या पिकाचे उत्पादन वाढवणे आणि शेतीला अधिक नफा मिळवून देणे हा आहे.
                </p>
              </div>

              {/* Services Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <ShoppingCart className="w-7 h-7 text-[#177B3B] mr-2" />
                  आमच्या सेवा आणि उत्पादने
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Seed Products */}
                  <div className="bg-emerald-50 rounded-xl p-6 border-2 border-emerald-200">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mr-3">
                        <Leaf className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">बियाणे</h3>
                    </div>
                    <p className="text-gray-700">
                      प्रमाणित आणि उच्च उत्पादन देणारे विविध प्रकारचे शेतकी बियाणे - भाजीपाला बियाणे, 
                      धान्य पिके, तेलबिया पिके इ.
                    </p>
                  </div>

                  {/* Nutrition Products */}
                  <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                        <Leaf className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">पोषण</h3>
                    </div>
                    <p className="text-gray-700">
                      पिकांच्या पोषणासाठी आवश्यक खते, सूक्ष्म पोषक द्रव्ये, जैविक खते 
                      आणि मिट्टी सुधारक उत्पादने.
                    </p>
                  </div>

                  {/* Protection Products */}
                  <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mr-3">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">संरक्षण</h3>
                    </div>
                    <p className="text-gray-700">
                      कीटक, रोग आणि तण नियंत्रणासाठी प्रभावी कीटकनाशके, बुरशीनाशके 
                      आणि तणनाशके.
                    </p>
                  </div>

                  {/* Hardware Products */}
                  <div className="bg-orange-50 rounded-xl p-6 border-2 border-orange-200">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mr-3">
                        <Truck className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">हार्डवेअर</h3>
                    </div>
                    <p className="text-gray-700">
                      फवारणी यंत्रे, सिंचन साधने, शेती साधने आणि इतर आवश्यक 
                      हार्डवेअर उपकरणे.
                    </p>
                  </div>
                </div>
              </div>

              {/* Why Choose Us */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <Award className="w-7 h-7 text-[#177B3B] mr-2" />
                  आम्हाला का निवडावे?
                </h2>

                <div className="space-y-4">
                  <div className="flex items-start space-x-4 bg-gray-50 rounded-xl p-4">
                    <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">✓</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg mb-1">प्रामाणिक आणि विश्वसनीय</h3>
                      <p className="text-gray-700">
                        आम्ही फक्त प्रमाणित आणि उच्च दर्जाची उत्पादने पुरवतो. शेतकऱ्यांचा विश्वास हीच आमची ताकद आहे.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 bg-gray-50 rounded-xl p-4">
                    <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">✓</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg mb-1">तांत्रिक मार्गदर्शन</h3>
                      <p className="text-gray-700">
                        उत्पादनांबरोबरच आम्ही शेतकऱ्यांना योग्य मार्गदर्शन आणि तांत्रिक सल्ला देतो.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 bg-gray-50 rounded-xl p-4">
                    <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">✓</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg mb-1">स्पर्धात्मक किंमती</h3>
                      <p className="text-gray-700">
                        आम्ही गुणवत्तेशी तडजोड न करता स्पर्धात्मक किंमतीत उत्पादने उपलब्ध करवतो.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 bg-gray-50 rounded-xl p-4">
                    <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">✓</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg mb-1">डिलिव्हरी सुविधा</h3>
                      <p className="text-gray-700">
                        आपल्या दारापर्यंत उत्पादने पोहोचवण्यासाठी आम्ही डिलिव्हरी सुविधा देतो.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-8 border-2 border-emerald-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <Phone className="w-7 h-7 text-[#177B3B] mr-2" />
                  संपर्क माहिती
                </h2>

                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <MapPin className="w-6 h-6 text-[#177B3B] flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-gray-800 mb-1">पत्ता</h3>
                      <p className="text-gray-700 text-lg">
                        लोंढे कृषी सेवा केंद्र<br />
                        कसबे तडवळे<br />
                        धाराशिव - 413405<br />
                        महाराष्ट्र, भारत
                      </p>
                    </div>
                  </div>

                  {shopData?.shop_number && (
                    <div className="flex items-start space-x-4">
                      <Phone className="w-6 h-6 text-[#177B3B] flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-gray-800 mb-1">फोन</h3>
                        <a 
                          href={`tel:+91${shopData.shop_number}`}
                          className="text-[#177B3B] text-lg font-semibold hover:underline"
                        >
                          +91 {shopData.shop_number}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-4">
                    <Clock className="w-6 h-6 text-[#177B3B] flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-gray-800 mb-1">कामकाजाचा वेळ</h3>
                      <p className="text-gray-700">
                        सोमवार - शनिवार: 9:00 AM - 7:00 PM<br />
                        रविवार: 9:00 AM - 1:00 PM
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="mt-8 grid md:grid-cols-2 gap-4">
                  <a
                    href={`https://wa.me/91${shopData?.shop_number}?text=${encodeURIComponent('नमस्कार! मला उत्पादनांबद्दल माहिती हवी आहे.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span>WhatsApp वर संपर्क करा</span>
                  </a>

                  <a
                    href={`tel:+91${shopData?.shop_number}`}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
                  >
                    <Phone className="w-6 h-6" />
                    <span>आता फोन करा</span>
                  </a>
                </div>
              </div>

              {/* Commitment Section */}
              <div className="mt-8 text-center bg-gradient-to-r from-[#177B3B]/10 to-[#01582E]/10 rounded-2xl p-8 border-2 border-[#177B3B]/30">
                <Users className="w-16 h-16 text-[#177B3B] mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-3">आमची वचनबद्धता</h2>
                <p className="text-gray-700 text-lg leading-relaxed">
                  लोंढे कृषी सेवा केंद्र - शेतकऱ्यांच्या समृद्धीसाठी तुमचा विश्वासू भागीदार!<br />
                  आम्ही शेतकऱ्यांच्या प्रत्येक गरजेची काळजी घेतो आणि त्यांच्या यशासाठी सतत प्रयत्नशील आहोत.
                </p>
              </div>
            </div>
          </div>

          {/* Back to Home Button */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#177B3B] to-[#01582E] hover:from-[#1a8e45] hover:to-[#016a37] text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>मुख्यपृष्ठावर परत या</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
