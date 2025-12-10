// robots.txt route for SEO
export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /
Allow: /about
Disallow: /admin
Disallow: /login

Sitemap: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://clean-slate-70.preview.emergentagent.com'}/sitemap.xml`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
