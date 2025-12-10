'use client';

import { memo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import ProductCard from './ProductCard';

const VirtualProductGrid = memo(function VirtualProductGrid({ products, onProductClick }) {
  const parentRef = useRef(null);
  
  // Calculate number of columns based on screen width
  const getColumnCount = () => {
    if (typeof window === 'undefined') return 2;
    if (window.innerWidth >= 1024) return 4;
    if (window.innerWidth >= 768) return 3;
    return 2;
  };
  
  const columnCount = getColumnCount();
  const rowCount = Math.ceil(products.length / columnCount);
  
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 280, []), // Estimated row height
    overscan: 2,
  });
  
  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columnCount;
          const rowProducts = products.slice(startIndex, startIndex + columnCount);
          
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 px-4">
                {rowProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => onProductClick(product)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default VirtualProductGrid;
