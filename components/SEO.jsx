'use client';

import Head from 'next/head';

/**
 * SEO Component for better search engine optimization
 * @param {Object} props - SEO properties
 */
export default function SEO({
  title = 'लोंढे कृषी सेवा केंद्र - कसबे तडवळे धाराशिव',
  description = 'कृषी उत्पादने, बियाणे, खते, संरक्षण साधने - धाराशिव, महाराष्ट्र',
  keywords = 'कृषी, बियाणे, खते, संरक्षण साधने, धाराशिव, महाराष्ट्र, शेती, agriculture, seeds, fertilizers',
  ogImage = '/logo.png',
  ogType = 'website',
  canonicalUrl,
  noindex = false,
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://clean-slate-70.preview.emergentagent.com';
  const fullCanonicalUrl = canonicalUrl || baseUrl;

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name=\"description\" content={description} />
      <meta name=\"keywords\" content={keywords} />
      {noindex && <meta name=\"robots\" content=\"noindex, nofollow\" />}
      
      {/* Canonical URL */}
      <link rel=\"canonical\" href={fullCanonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property=\"og:type\" content={ogType} />
      <meta property=\"og:url\" content={fullCanonicalUrl} />
      <meta property=\"og:title\" content={title} />
      <meta property=\"og:description\" content={description} />
      <meta property=\"og:image\" content={`${baseUrl}${ogImage}`} />
      <meta property=\"og:site_name\" content=\"लोंढे कृषी सेवा केंद्र\" />
      <meta property=\"og:locale\" content=\"mr_IN\" />
      
      {/* Twitter */}
      <meta property=\"twitter:card\" content=\"summary_large_image\" />
      <meta property=\"twitter:url\" content={fullCanonicalUrl} />
      <meta property=\"twitter:title\" content={title} />
      <meta property=\"twitter:description\" content={description} />
      <meta property=\"twitter:image\" content={`${baseUrl}${ogImage}`} />
      
      {/* Mobile Optimization */}
      <meta name=\"theme-color\" content=\"#177B3B\" />
      <meta name=\"mobile-web-app-capable\" content=\"yes\" />
      <meta name=\"apple-mobile-web-app-capable\" content=\"yes\" />
      <meta name=\"apple-mobile-web-app-status-bar-style\" content=\"default\" />
      <meta name=\"apple-mobile-web-app-title\" content=\"लोंढे कृषी\" />
      
      {/* Performance hints */}
      <link rel=\"dns-prefetch\" href=\"https://qdxsvknytevymbuvnpct.supabase.co\" />
      <link rel=\"dns-prefetch\" href=\"https://res.cloudinary.com\" />
      <link rel=\"preconnect\" href=\"https://qdxsvknytevymbuvnpct.supabase.co\" />
      <link rel=\"preconnect\" href=\"https://res.cloudinary.com\" />
    </Head>
  );
}
