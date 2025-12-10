/**
 * Dynamic imports for code splitting
 */

export const dynamicImports = {
  // Lazy load heavy components
  CropModal: () => import('@/components/CropModal'),
  RichTextEditor: () => import('@/components/RichTextEditor'),
  ErrorBoundary: () => import('@/components/ErrorBoundary'),
  
  // Lazy load chart libraries (if used)
  Recharts: () => import('recharts'),
  
  // Lazy load Radix UI components on demand
  Dialog: () => import('@radix-ui/react-dialog'),
  Accordion: () => import('@radix-ui/react-accordion'),
  Dropdown: () => import('@radix-ui/react-dropdown-menu'),
};

/**
 * Preload critical components
 */
export function preloadCriticalComponents() {
  if (typeof window !== 'undefined') {
    // Preload components that are likely to be used soon
    setTimeout(() => {
      dynamicImports.Dialog();
    }, 2000);
  }
}

/**
 * Tree-shake unused Radix UI components
 * Import only what you need from each package
 */
export const optimizedRadixImports = {
  // Example: Instead of importing entire package, import specific components
  // import * as Dialog from '@radix-ui/react-dialog' // BAD
  // import { Root, Trigger, Content } from '@radix-ui/react-dialog' // GOOD
};
