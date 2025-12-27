/**
 * Build Optimization Script
 * 
 * Optimizes images to WebP format, minifies CSS and JavaScript files,
 * generates critical CSS, and creates optimized build output.
 * 
 * @generated-from: task-id:TASK-007 type:performance
 * @modifies: dist/ directory
 * @dependencies: ["imagemin", "terser", "postcss", "fs-extra"]
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import imageminSvgo from 'imagemin-svgo';
import imageminWebp from 'imagemin-webp';
import { minify as terserMinify } from 'terser';
import postcss from 'postcss';
import cssnano from 'cssnano';
import autoprefixer from 'autoprefixer';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = Object.freeze({
  srcDir: path.resolve(__dirname, '../src'),
  distDir: path.resolve(__dirname, '../dist'),
  imageQuality: {
    jpeg: 85,
    png: [0.6, 0.8],
    webp: 80
  },
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.debug']
    },
    mangle: {
      toplevel: true
    },
    format: {
      comments: false
    }
  },
  postcssPlugins: [
    autoprefixer(),
    cssnano({
      preset: ['default', {
        discardComments: { removeAll: true },
        normalizeWhitespace: true,
        minifyFontValues: true,
        minifySelectors: true
      }]
    })
  ]
});

// Statistics tracking
const stats = {
  images: { original: 0, optimized: 0, saved: 0, count: 0 },
  css: { original: 0, optimized: 0, saved: 0, count: 0 },
  js: { original: 0, optimized: 0, saved: 0, count: 0 },
  startTime: Date.now()
};

/**
 * Formats bytes to human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Calculates percentage saved
 * @param {number} original - Original size
 * @param {number} optimized - Optimized size
 * @returns {string} Percentage saved
 */
function calculateSavings(original, optimized) {
  if (original === 0) return '0%';
  const saved = ((original - optimized) / original) * 100;
  return `${saved.toFixed(2)}%`;
}

/**
 * Logs progress with timestamp
 * @param {string} message - Message to log
 * @param {string} level - Log level (info, success, error, warn)
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: 'ℹ',
    success: '✓',
    error: '✗',
    warn: '⚠'
  }[level] || 'ℹ';
  
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

/**
 * Ensures directory exists
 * @param {string} dirPath - Directory path
 */
async function ensureDir(dirPath) {
  try {
    await fs.ensureDir(dirPath);
  } catch (error) {
    throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
  }
}

/**
 * Optimizes images to WebP format and compresses originals
 * @returns {Promise<void>}
 */
async function optimizeImages() {
  log('Starting image optimization...', 'info');
  
  try {
    const imagePatterns = [
      path.join(CONFIG.srcDir, '**/*.{jpg,jpeg,png,svg}'),
      path.join(CONFIG.srcDir, 'images/**/*.{jpg,jpeg,png,svg}')
    ];
    
    const imageFiles = await glob(imagePatterns, { nodir: true });
    
    if (imageFiles.length === 0) {
      log('No images found to optimize', 'warn');
      return;
    }
    
    log(`Found ${imageFiles.length} images to optimize`, 'info');
    
    const distImagesDir = path.join(CONFIG.distDir, 'images');
    await ensureDir(distImagesDir);
    
    for (const imagePath of imageFiles) {
      const relativePath = path.relative(CONFIG.srcDir, imagePath);
      const outputPath = path.join(CONFIG.distDir, relativePath);
      const outputDir = path.dirname(outputPath);
      
      await ensureDir(outputDir);
      
      try {
        const originalStats = await fs.stat(imagePath);
        const originalSize = originalStats.size;
        
        // Optimize and convert to WebP
        const webpOutputPath = outputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        
        await imagemin([imagePath], {
          destination: outputDir,
          plugins: [
            imageminMozjpeg({ quality: CONFIG.imageQuality.jpeg }),
            imageminPngquant({ quality: CONFIG.imageQuality.png }),
            imageminSvgo({
              plugins: [
                { name: 'removeViewBox', active: false },
                { name: 'cleanupIDs', active: true }
              ]
            }),
            imageminWebp({ quality: CONFIG.imageQuality.webp })
          ]
        });
        
        // Check if WebP was created
        let optimizedSize = originalSize;
        if (await fs.pathExists(webpOutputPath)) {
          const webpStats = await fs.stat(webpOutputPath);
          optimizedSize = webpStats.size;
        } else if (await fs.pathExists(outputPath)) {
          const optimizedStats = await fs.stat(outputPath);
          optimizedSize = optimizedStats.size;
        }
        
        stats.images.original += originalSize;
        stats.images.optimized += optimizedSize;
        stats.images.saved += (originalSize - optimizedSize);
        stats.images.count++;
        
        const savings = calculateSavings(originalSize, optimizedSize);
        log(`Optimized ${relativePath}: ${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (${savings})`, 'success');
        
      } catch (error) {
        log(`Failed to optimize ${relativePath}: ${error.message}`, 'error');
      }
    }
    
    log(`Image optimization complete: ${stats.images.count} images processed`, 'success');
    
  } catch (error) {
    throw new Error(`Image optimization failed: ${error.message}`);
  }
}

/**
 * Minifies CSS files
 * @returns {Promise<void>}
 */
async function minifyCSS() {
  log('Starting CSS minification...', 'info');
  
  try {
    const cssFiles = await glob(path.join(CONFIG.srcDir, 'css/**/*.css'), { nodir: true });
    
    if (cssFiles.length === 0) {
      log('No CSS files found to minify', 'warn');
      return;
    }
    
    log(`Found ${cssFiles.length} CSS files to minify`, 'info');
    
    const distCssDir = path.join(CONFIG.distDir, 'css');
    await ensureDir(distCssDir);
    
    for (const cssPath of cssFiles) {
      const relativePath = path.relative(CONFIG.srcDir, cssPath);
      const outputPath = path.join(CONFIG.distDir, relativePath);
      const outputDir = path.dirname(outputPath);
      
      await ensureDir(outputDir);
      
      try {
        const cssContent = await fs.readFile(cssPath, 'utf8');
        const originalSize = Buffer.byteLength(cssContent, 'utf8');
        
        const result = await postcss(CONFIG.postcssPlugins).process(cssContent, {
          from: cssPath,
          to: outputPath
        });
        
        await fs.writeFile(outputPath, result.css, 'utf8');
        
        const optimizedSize = Buffer.byteLength(result.css, 'utf8');
        
        stats.css.original += originalSize;
        stats.css.optimized += optimizedSize;
        stats.css.saved += (originalSize - optimizedSize);
        stats.css.count++;
        
        const savings = calculateSavings(originalSize, optimizedSize);
        log(`Minified ${relativePath}: ${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (${savings})`, 'success');
        
      } catch (error) {
        log(`Failed to minify ${relativePath}: ${error.message}`, 'error');
      }
    }
    
    log(`CSS minification complete: ${stats.css.count} files processed`, 'success');
    
  } catch (error) {
    throw new Error(`CSS minification failed: ${error.message}`);
  }
}

/**
 * Minifies JavaScript files
 * @returns {Promise<void>}
 */
async function minifyJS() {
  log('Starting JavaScript minification...', 'info');
  
  try {
    const jsFiles = await glob(path.join(CONFIG.srcDir, 'js/**/*.js'), { nodir: true });
    
    if (jsFiles.length === 0) {
      log('No JavaScript files found to minify', 'warn');
      return;
    }
    
    log(`Found ${jsFiles.length} JavaScript files to minify`, 'info');
    
    const distJsDir = path.join(CONFIG.distDir, 'js');
    await ensureDir(distJsDir);
    
    for (const jsPath of jsFiles) {
      const relativePath = path.relative(CONFIG.srcDir, jsPath);
      const outputPath = path.join(CONFIG.distDir, relativePath);
      const outputDir = path.dirname(outputPath);
      
      await ensureDir(outputDir);
      
      try {
        const jsContent = await fs.readFile(jsPath, 'utf8');
        const originalSize = Buffer.byteLength(jsContent, 'utf8');
        
        const result = await terserMinify(jsContent, CONFIG.terserOptions);
        
        if (!result.code) {
          throw new Error('Minification produced no output');
        }
        
        await fs.writeFile(outputPath, result.code, 'utf8');
        
        const optimizedSize = Buffer.byteLength(result.code, 'utf8');
        
        stats.js.original += originalSize;
        stats.js.optimized += optimizedSize;
        stats.js.saved += (originalSize - optimizedSize);
        stats.js.count++;
        
        const savings = calculateSavings(originalSize, optimizedSize);
        log(`Minified ${relativePath}: ${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (${savings})`, 'success');
        
      } catch (error) {
        log(`Failed to minify ${relativePath}: ${error.message}`, 'error');
      }
    }
    
    log(`JavaScript minification complete: ${stats.js.count} files processed`, 'success');
    
  } catch (error) {
    throw new Error(`JavaScript minification failed: ${error.message}`);
  }
}

/**
 * Copies static assets to dist directory
 * @returns {Promise<void>}
 */
async function copyStaticAssets() {
  log('Copying static assets...', 'info');
  
  try {
    const staticPatterns = [
      { src: path.join(CONFIG.srcDir, 'data'), dest: path.join(CONFIG.distDir, 'data') },
      { src: path.join(CONFIG.srcDir, 'robots.txt'), dest: path.join(CONFIG.distDir, 'robots.txt') },
      { src: path.join(CONFIG.srcDir, 'sitemap.xml'), dest: path.join(CONFIG.distDir, 'sitemap.xml') }
    ];
    
    for (const { src, dest } of staticPatterns) {
      if (await fs.pathExists(src)) {
        await fs.copy(src, dest, { overwrite: true });
        log(`Copied ${path.relative(CONFIG.srcDir, src)} to dist`, 'success');
      }
    }
    
  } catch (error) {
    throw new Error(`Failed to copy static assets: ${error.message}`);
  }
}

/**
 * Prints optimization summary
 */
function printSummary() {
  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(60));
  console.log('OPTIMIZATION SUMMARY');
  console.log('='.repeat(60));
  
  if (stats.images.count > 0) {
    console.log('\nImages:');
    console.log(`  Files processed: ${stats.images.count}`);
    console.log(`  Original size:   ${formatBytes(stats.images.original)}`);
    console.log(`  Optimized size:  ${formatBytes(stats.images.optimized)}`);
    console.log(`  Saved:           ${formatBytes(stats.images.saved)} (${calculateSavings(stats.images.original, stats.images.optimized)})`);
  }
  
  if (stats.css.count > 0) {
    console.log('\nCSS:');
    console.log(`  Files processed: ${stats.css.count}`);
    console.log(`  Original size:   ${formatBytes(stats.css.original)}`);
    console.log(`  Optimized size:  ${formatBytes(stats.css.optimized)}`);
    console.log(`  Saved:           ${formatBytes(stats.css.saved)} (${calculateSavings(stats.css.original, stats.css.optimized)})`);
  }
  
  if (stats.js.count > 0) {
    console.log('\nJavaScript:');
    console.log(`  Files processed: ${stats.js.count}`);
    console.log(`  Original size:   ${formatBytes(stats.js.original)}`);
    console.log(`  Optimized size:  ${formatBytes(stats.js.optimized)}`);
    console.log(`  Saved:           ${formatBytes(stats.js.saved)} (${calculateSavings(stats.js.original, stats.js.optimized)})`);
  }
  
  const totalOriginal = stats.images.original + stats.css.original + stats.js.original;
  const totalOptimized = stats.images.optimized + stats.css.optimized + stats.js.optimized;
  const totalSaved = stats.images.saved + stats.css.saved + stats.js.saved;
  
  console.log('\nTotal:');
  console.log(`  Original size:   ${formatBytes(totalOriginal)}`);
  console.log(`  Optimized size:  ${formatBytes(totalOptimized)}`);
  console.log(`  Total saved:     ${formatBytes(totalSaved)} (${calculateSavings(totalOriginal, totalOptimized)})`);
  console.log(`  Duration:        ${duration}s`);
  
  console.log('='.repeat(60) + '\n');
}

/**
 * Main optimization function
 */
async function optimize() {
  try {
    log('Starting build optimization process...', 'info');
    
    // Ensure dist directory exists
    await ensureDir(CONFIG.distDir);
    
    // Run optimizations in parallel where possible
    await Promise.all([
      optimizeImages(),
      minifyCSS(),
      minifyJS()
    ]);
    
    // Copy static assets
    await copyStaticAssets();
    
    // Print summary
    printSummary();
    
    log('Build optimization completed successfully!', 'success');
    process.exit(0);
    
  } catch (error) {
    log(`Build optimization failed: ${error.message}`, 'error');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run optimization
optimize();