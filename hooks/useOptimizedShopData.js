'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getCachedItem, setCachedItem } from '@/lib/cacheUtils';

const CACHE_KEY = 'shop_data';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export function useOptimizedShopData() {
  const [shopData, setShopData] = useState(null);
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchShopData = useCallback(async (skipCache = false) => {
    try {
      // Check cache first
      if (!skipCache) {
        const cached = getCachedItem(CACHE_KEY);
        if (cached) {
          setShopData(cached.shopData);
          setProducts(cached.products || []);
          setBanners(cached.banners || []);
          setBlogs(cached.blogs || []);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('shop_data')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) throw fetchError;
      
      if (data) {
        // Parse social_links from JSON string if needed
        let parsedData = { ...data };
        if (data.social_links && typeof data.social_links === 'string') {
          try {
            parsedData.social_links = JSON.parse(data.social_links);
          } catch (e) {
            console.error('Error parsing social_links:', e);
            parsedData.social_links = { instagram: '', facebook: '', youtube: '' };
          }
        }
        
        const cacheData = {
          shopData: parsedData,
          products: data.products || [],
          banners: data.banners || [],
          blogs: data.blogs || [],
        };
        
        // Cache the data
        setCachedItem(CACHE_KEY, cacheData, CACHE_TTL);
        
        setShopData(parsedData);
        setProducts(data.products || []);
        setBanners(data.banners || []);
        setBlogs(data.blogs || []);
        
        // Track homepage view (only once per session)
        trackView(data.id);
      }
    } catch (err) {
      console.log('No shop data yet:', err.message);
      setError(err);
      // Set placeholder data
      setShopData({
        shop_name: 'Shop Name',
        shop_number: '0000000000',
        shop_address: 'Shop Address',
        social_links: { instagram: '', facebook: '', youtube: '' }
      });
      setProducts([]);
      setBanners([]);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const trackView = async (shopId) => {
    try {
      // Check if already viewed in this session
      const viewedKey = `shop_viewed_${shopId}`;
      if (sessionStorage.getItem(viewedKey)) {
        return; // Already counted this session
      }

      // Get current overview data
      const { data, error } = await supabase
        .from('shop_data')
        .select('overview')
        .eq('id', shopId)
        .single();

      if (error) throw error;

      const currentOverview = data?.overview || { totalViews: 0, totalOrders: 0, orderHistory: [] };
      const updatedOverview = {
        ...currentOverview,
        totalViews: (currentOverview.totalViews || 0) + 1
      };

      // Update view count
      await supabase
        .from('shop_data')
        .update({ overview: updatedOverview })
        .eq('id', shopId);

      // Mark as viewed in this session
      sessionStorage.setItem(viewedKey, 'true');
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  return {
    shopData,
    products,
    banners,
    blogs,
    loading,
    error,
    refetch: () => fetchShopData(true),
  };
}
