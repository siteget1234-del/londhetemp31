'use client';

import { useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { applyCloudinaryOptimization } from '@/lib/imageOptimization';

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

export default function CropView({ cropName, back, shopData, blogs, cart, addToCart, addAllToCart, openCart, onSelectBlog }) {
  // Find crop data
  const cropData = CROPS_DATA.find(c => c.name === cropName);
  
  // Filter blogs for this specific crop
  const cropBlogs = blogs.filter(blog => blog.selectedCrop === cropName);

  // Scroll to top when crop page opens
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [cropName]);

  // Helper function to extract preview text from HTML
  const getPreviewText = (htmlContent, maxLength = 150) => {
    // Remove HTML tags
    const text = htmlContent.replace(/<[^>]*>/g, '');
    // Trim and limit length
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Helper function to extract title from blog HTML (first h1, h2, or first line)
  const getBlogTitle = (htmlContent) => {
    // Try to extract h1 first
    const h1Match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match) return h1Match[1].replace(/<[^>]*>/g, '');
    
    // Try h2
    const h2Match = htmlContent.match(/<h2[^>]*>(.*?)<\/h2>/i);
    if (h2Match) return h2Match[1].replace(/<[^>]*>/g, '');
    
    // Fall back to first paragraph or first 60 chars
    const pMatch = htmlContent.match(/<p[^>]*>(.*?)<\/p>/i);
    if (pMatch) {
      const text = pMatch[1].replace(/<[^>]*>/g, '');
      return text.length > 60 ? text.substring(0, 60) + '...' : text;
    }
    
    // Last resort: first 60 chars of plain text
    const plainText = htmlContent.replace(/<[^>]*>/g, '');
    return plainText.length > 60 ? plainText.substring(0, 60) + '...' : plainText;
  };

  // Format date (if createdAt exists, otherwise show default)
  const formatDate = (blog) => {
    if (blog.createdAt) {
      return new Date(blog.createdAt).toLocaleDateString('mr-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    return 'नवीनतम';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#177B3B] to-[#01582E] text-white py-4 px-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={back}
            className="flex items-center space-x-2 hover:bg-white/10 px-3 py-2 rounded-xl transition bg-white/5 backdrop-blur-sm"
            data-testid="back-from-crop-btn"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>मुख्यपृष्ठ</span>
          </button>
          <h1 className="text-xl font-bold" data-testid="crop-view-title">
            {cropName}
          </h1>
        </div>
      </header>

      {/* Blog Previews Section */}
      <section className="container mx-auto px-4 py-12 flex-1">
        {cropBlogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌾</div>
            <p className="text-gray-500 text-lg mb-2">या पिकासाठी अद्याप पोस्ट उपलब्ध नाहीत</p>
            <p className="text-gray-400 text-sm">लवकरच आम्ही या पिकासाठी माहिती जोडू</p>
          </div>
        ) : (
          <div className="space-y-6">
            {cropBlogs.map(blog => {
              const title = getBlogTitle(blog.text);
              const previewText = getPreviewText(blog.text);
              const date = formatDate(blog);
              
              return (
                <div 
                  key={blog.id}
                  onClick={() => onSelectBlog(blog)}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
                  data-testid={`crop-blog-preview-${blog.id}`}
                >
                  <div className="flex gap-4 p-4">
                    {/* Blog Image - Thumbnail */}
                    <div className="flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
                      <img 
                        src={applyCloudinaryOptimization(blog.image) || 'https://via.placeholder.com/128x128?text=Blog'} 
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Blog Preview Content */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-800 line-clamp-2 mb-2" data-testid="blog-preview-title">
                        {title}
                      </h3>
                      
                      {/* Date */}
                      <p className="text-xs text-gray-500 mb-2" data-testid="blog-preview-date">
                        📅 {date}
                      </p>
                      
                      {/* Preview Text */}
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2" data-testid="blog-preview-text">
                        {previewText}
                      </p>
                      
                      {/* Read More Link */}
                      <div className="flex items-center text-[#177B3B] font-semibold text-sm">
                        <span>संपूर्ण वाचा</span>
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

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
