# Performance Testing Checklist ✅

Use this checklist to verify all optimizations are working correctly.

---

## 🔍 Pre-Testing Setup

### 1. Clear Browser Cache
- [ ] Open DevTools (F12)
- [ ] Go to Application tab
- [ ] Clear Storage -> Clear site data
- [ ] Or use Incognito/Private mode

### 2. Test Environment
- [ ] Test on real device (not just emulator)
- [ ] Test on 3G/4G (not just WiFi)
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile and desktop

---

## 📊 Performance Metrics Testing

### 1. Run Lighthouse Audit
```
1. Open Chrome DevTools (F12)
2. Go to Lighthouse tab
3. Select "Performance" category
4. Click "Analyze page load"
5. Wait for report
```

**Expected Scores:**
- [ ] Performance: ≥90/100
- [ ] Accessibility: ≥90/100
- [ ] Best Practices: ≥90/100
- [ ] SEO: ≥90/100

### 2. Check Core Web Vitals

**Open browser console and verify:**
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] FID (First Input Delay) < 100ms
- [ ] CLS (Cumulative Layout Shift) < 0.1

---

## 🖼️ Image Optimization Testing

### 1. Verify WebP/AVIF Format
```
1. Open Network tab
2. Reload page
3. Filter by "Img"
4. Check response headers for Content-Type
```
- [ ] Images served as WebP or AVIF
- [ ] Images have proper Cache-Control headers
- [ ] Images load progressively (blur → sharp)

### 2. Check Image Sizes
```
1. Look at Network tab
2. Find image requests
3. Check transferred size
```
- [ ] Product images < 50 KB each
- [ ] Banner images < 100 KB each
- [ ] Total images < 500 KB for homepage

### 3. Lazy Loading
```
1. Open Network tab
2. Scroll down slowly
3. Watch for new image requests
```
- [ ] Images below fold don't load immediately
- [ ] Images load as you scroll near them
- [ ] No layout shift when images load

---

## 📦 Bundle Size Testing

### 1. Run Bundle Analyzer
```bash
cd /app
yarn analyze
```

**Expected Results:**
- [ ] Opens browser at localhost:8888
- [ ] Main bundle < 200 KB
- [ ] Total JS < 400 KB
- [ ] No duplicate libraries

### 2. Check Chunk Splitting
```
1. Build the app: yarn build
2. Check .next/static/chunks/
3. Verify multiple smaller chunks exist
```
- [ ] Multiple chunk files present
- [ ] Largest chunk < 150 KB
- [ ] Third-party libs in separate chunks

---

## 🚀 Loading Speed Testing

### 1. First Load
```
1. Clear cache completely
2. Open DevTools Network tab
3. Reload page
4. Note "DOMContentLoaded" time
```
- [ ] DOMContentLoaded < 2s
- [ ] Total load time < 4s
- [ ] First paint < 1.5s

### 2. Subsequent Loads
```
1. Reload page again (with cache)
2. Note load time
```
- [ ] Page loads < 1s
- [ ] Uses cached resources
- [ ] API responses from cache

### 3. Navigation Speed
```
1. Click on a product
2. Note time to render
3. Go back
4. Check responsiveness
```
- [ ] Product modal opens < 300ms
- [ ] Back button responds instantly
- [ ] No lag or freeze

---

## 💾 Caching Testing

### 1. API Cache
```
1. Open browser console
2. Navigate to homepage
3. Look for "[Cache]" logs
4. Reload page
5. Verify "Cache hit" logs
```
- [ ] First load: Cache miss (fetches from API)
- [ ] Second load: Cache hit (no API call)
- [ ] Cache expires after 10 minutes

### 2. LocalStorage Cache
```
1. Open DevTools -> Application tab
2. Go to Local Storage
3. Check for "app_cache_" entries
```
- [ ] shop_data cached
- [ ] cart data persisted
- [ ] Expiry timestamps present

### 3. Cart Persistence
```
1. Add items to cart
2. Close browser tab
3. Reopen site
4. Verify cart items restored
```
- [ ] Cart items persist across sessions
- [ ] Quantities preserved
- [ ] Offer types maintained

---

## 🔄 Virtual Scrolling Testing

### 1. Large Product List
```
1. Navigate to a category with 100+ products
2. Open DevTools -> Elements tab
3. Scroll through products
4. Check DOM element count
```
- [ ] Only visible products in DOM
- [ ] DOM updates as you scroll
- [ ] Smooth 60fps scrolling
- [ ] No lag with 1000+ products

### 2. Memory Usage
```
1. Open DevTools -> Performance tab
2. Start recording
3. Scroll through products
4. Stop recording
5. Check memory graph
```
- [ ] Memory usage stays flat
- [ ] No memory leaks
- [ ] Garbage collection works

---

## ⚡ React Performance Testing

### 1. Re-render Testing
```
1. Open React DevTools
2. Go to Profiler tab
3. Start recording
4. Perform actions (add to cart, search)
5. Stop recording
```
- [ ] ProductCard doesn't re-render unnecessarily
- [ ] Search input debounced (300ms)
- [ ] Cart updates efficient

### 2. Component Profiling
```
Check in Profiler for:
- Render count per component
- Render duration
- Why each component rendered
```
- [ ] Memoized components render less
- [ ] No wasted renders
- [ ] State updates batched

---

## 🌐 Network Optimization Testing

### 1. Connection Preloading
```
1. Open Network tab
2. Check "Priority" column
3. Look for preconnect/dns-prefetch
```
- [ ] Preconnect to Cloudinary
- [ ] Preconnect to customer-assets
- [ ] DNS prefetch working

### 2. HTTP/2 Testing
```
1. Look at Network tab
2. Check Protocol column
3. Verify h2 (HTTP/2)
```
- [ ] Using HTTP/2
- [ ] Multiplexing enabled
- [ ] Server push ready

### 3. Compression
```
1. Check Network tab
2. Look at response headers
3. Verify Content-Encoding
```
- [ ] Gzip or Brotli compression
- [ ] CSS/JS compressed
- [ ] Compression ratio > 70%

---

## 📱 Mobile Performance Testing

### 1. Throttling Test
```
1. Open DevTools
2. Go to Network tab
3. Select "Fast 3G" throttling
4. Reload page
```
- [ ] Page loads < 5s on 3G
- [ ] Images progressive loading
- [ ] Essential content visible first

### 2. Touch Responsiveness
```
Test on real mobile device:
- Tap buttons
- Scroll lists
- Swipe cards
```
- [ ] Tap delay < 100ms
- [ ] Smooth scrolling
- [ ] No lag on interactions

### 3. Battery Impact
```
1. Test for 5 minutes
2. Check battery usage
3. Compare with similar apps
```
- [ ] Reasonable battery consumption
- [ ] No excessive CPU usage
- [ ] Efficient animations

---

## 🔧 Build Optimization Testing

### 1. Production Build
```bash
cd /app
yarn build:production
```

**Check build output:**
- [ ] Build completes successfully
- [ ] No errors or warnings
- [ ] Bundle sizes reported

### 2. Build Metrics
```
Look at build output for:
- Page sizes
- First Load JS
- Shared chunks
```
- [ ] Homepage < 100 KB First Load JS
- [ ] Product page < 120 KB
- [ ] Shared by all < 80 KB

### 3. Source Maps
```
Check .next/static/ folder
```
- [ ] No .map files in production
- [ ] Code minified
- [ ] Tree-shaking applied

---

## 🐛 Error Testing

### 1. Error Boundaries
```
1. Force an error in a component
2. Verify error boundary catches it
3. Check user sees friendly message
```
- [ ] App doesn't crash completely
- [ ] Error logged to console
- [ ] User can continue using app

### 2. Network Failures
```
1. Go offline
2. Try to load data
3. Check error handling
```
- [ ] Graceful degradation
- [ ] Clear error messages
- [ ] Retry functionality works

---

## 📈 Before/After Comparison

### Document Your Results

#### Before Optimizations:
- Bundle Size: _____ KB
- Load Time: _____ s
- LCP: _____ s
- API Calls: _____
- Lighthouse Score: _____ /100

#### After Optimizations:
- Bundle Size: _____ KB (-___%)
- Load Time: _____ s (-___%)
- LCP: _____ s (-___%)
- API Calls: _____ (-___%)
- Lighthouse Score: _____ /100 (+___ points)

---

## ✅ Final Checklist

### Critical Tests (Must Pass)
- [ ] Lighthouse Performance > 85
- [ ] LCP < 3s
- [ ] Total bundle < 500 KB
- [ ] Images optimized (WebP/AVIF)
- [ ] Caching working correctly
- [ ] Virtual scrolling smooth
- [ ] No console errors
- [ ] Mobile responsive

### Recommended Tests
- [ ] Bundle analyzer shows optimization
- [ ] Re-renders minimized
- [ ] Network preconnects working
- [ ] Cart persistence working
- [ ] Search debounced
- [ ] Memory usage stable

### Nice to Have
- [ ] HTTP/2 enabled
- [ ] Service worker (future)
- [ ] Offline support (future)
- [ ] PWA installable

---

## 🚨 Common Issues & Solutions

### Issue: Images not loading
**Check:**
- Next.js config remote patterns
- Cloudinary URLs correct
- Network tab for 404s

### Issue: Bundle still large
**Solution:**
1. Run `yarn analyze`
2. Identify large packages
3. Consider code splitting

### Issue: Slow API calls
**Solution:**
1. Check network tab for slow requests
2. Verify caching working
3. Consider API optimization

### Issue: Layout shift (CLS)
**Solution:**
1. Add explicit width/height to images
2. Reserve space for dynamic content
3. Use CSS aspect-ratio

---

## 📞 Support

If you encounter issues:
1. Check console for errors
2. Review `/app/PERFORMANCE_OPTIMIZATIONS.md`
3. Run `yarn analyze` for bundle issues
4. Use React DevTools Profiler

---

## 🎯 Success Criteria

**Your app is optimized if:**
- ✅ Lighthouse Performance > 90
- ✅ Bundle size reduced by 40%+
- ✅ Load time reduced by 50%+
- ✅ Smooth on mobile devices
- ✅ API calls reduced by 70%+
- ✅ No console errors
- ✅ Users report faster experience

---

*Last Updated: December 2025*
