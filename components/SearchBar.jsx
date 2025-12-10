'use client';

import { Search } from 'lucide-react';
import { useDebounce } from '@/lib/performance';
import { useState, useCallback } from 'react';

const SearchBar = ({ onSearch, value, onFocus }) => {
  const [localValue, setLocalValue] = useState(value || '');
  
  const debouncedSearch = useDebounce((searchValue) => {
    onSearch(searchValue);
  }, 300);
  
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedSearch(newValue);
  }, [debouncedSearch]);
  
  return (
    <div className="relative">
      <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg">
        <input
          type="text"
          placeholder="Search for products, brands and more"
          value={localValue}
          onChange={handleChange}
          onFocus={onFocus}
          className="w-full pl-5 pr-14 py-3 text-gray-700 placeholder-gray-500 focus:outline-none bg-transparent"
        />
        <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#177B3B] hover:bg-[#01582E] p-2.5 rounded-xl transition-all duration-200">
          <Search className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
