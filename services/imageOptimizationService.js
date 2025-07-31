// Image optimization service for efficient image delivery
import { getBrowserImageSupport, detectImageFormat, logImageLoad, logImageError } from './imageUtils';

class ImageOptimizationService {
  constructor() {
    this.browserSupport = null;
    this.loadedFormats = new Map();
    this.failedFormats = new Set();
  }

  // Initialize browser support detection
  async init() {
    if (typeof window !== 'undefined' && !this.browserSupport) {
      this.browserSupport = getBrowserImageSupport();
      
      console.log('🖼️ Image Optimization Service initialized:', {
        browserSupport: this.browserSupport,
        userAgent: navigator.userAgent.split(' ').pop(),
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get the optimal image source for a given base name
  getOptimalImageSrc(baseName, formats = ['avif', 'webp', 'jpg', 'png']) {
    if (!this.browserSupport) {
      return `${baseName}.png`; // Fallback if not initialized
    }

    // Check for AVIF support first (best compression)
    if (formats.includes('avif') && this.browserSupport.avif) {
      return `${baseName}.avif`;
    }

    // Check for WebP support (good compression)
    if (formats.includes('webp') && this.browserSupport.webp) {
      return `${baseName}.webp`;
    }

    // Fallback to JPEG if available
    if (formats.includes('jpg')) {
      return `${baseName}.jpg`;
    }

    // Final fallback to PNG
    return `${baseName}.png`;
  }

  // Create picture element sources for responsive images
  createPictureSources(baseName, formats = ['avif', 'webp', 'jpg', 'png']) {
    const sources = [];

    if (formats.includes('avif')) {
      sources.push({
        srcSet: `${baseName}.avif`,
        type: 'image/avif'
      });
    }

    if (formats.includes('webp')) {
      sources.push({
        srcSet: `${baseName}.webp`,
        type: 'image/webp'
      });
    }

    if (formats.includes('jpg')) {
      sources.push({
        srcSet: `${baseName}.jpg`,
        type: 'image/jpeg'
      });
    }

    return sources;
  }

  // Handle image load events with logging
  handleImageLoad(event, additionalInfo = {}) {
    const src = event.target.currentSrc || event.target.src;
    const format = detectImageFormat(src);
    
    // Track successful loads
    this.loadedFormats.set(src, format);
    
    logImageLoad(format, src, {
      ...additionalInfo,
      service: 'ImageOptimizationService'
    });

    return format;
  }

  // Handle image error events with logging
  handleImageError(event, additionalInfo = {}) {
    const src = event.target.src;
    const format = detectImageFormat(src);
    
    // Track failed loads
    this.failedFormats.add(src);
    
    logImageError(format, src, {
      ...additionalInfo,
      service: 'ImageOptimizationService'
    });

    return format;
  }

  // Get performance statistics
  getPerformanceStats() {
    const stats = {
      totalLoaded: this.loadedFormats.size,
      totalFailed: this.failedFormats.size,
      formatBreakdown: {},
      compressionSavings: 0
    };

    // Calculate format breakdown
    for (const [src, format] of this.loadedFormats) {
      stats.formatBreakdown[format] = (stats.formatBreakdown[format] || 0) + 1;
    }

    // Estimate compression savings
    const avifCount = stats.formatBreakdown['AVIF'] || 0;
    const webpCount = stats.formatBreakdown['WebP'] || 0;
    
    stats.compressionSavings = (avifCount * 0.5) + (webpCount * 0.25); // Estimated savings

    return stats;
  }

  // Preload critical images
  preloadImage(src, type = 'image/webp') {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.type = type;
      document.head.appendChild(link);
      
      console.log(`🚀 Preloading image: ${src} (${type})`);
    }
  }

  // Check if an image format is supported
  isFormatSupported(format) {
    if (!this.browserSupport) return false;
    
    switch (format.toLowerCase()) {
      case 'avif':
        return this.browserSupport.avif;
      case 'webp':
        return this.browserSupport.webp;
      default:
        return true; // PNG, JPEG are universally supported
    }
  }
}

// Create singleton instance
const imageOptimizationService = new ImageOptimizationService();

// Auto-initialize on client side
if (typeof window !== 'undefined') {
  imageOptimizationService.init();
}

export default imageOptimizationService;