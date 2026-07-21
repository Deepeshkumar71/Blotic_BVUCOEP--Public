/**
 * Find Missing Icons Script
 * Scans all files for icon imports and ensures they're all exported
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const iconsFile = path.join(srcDir, 'components', 'icons', 'index.ts');

// Find all icon imports in the codebase
function findAllIconImports() {
  const icons = new Set();
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !['node_modules', '.git', 'dist'].includes(file)) {
        scanDirectory(fullPath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Match icon imports from @/components/icons
        const importMatches = content.match(/import\s*{([^}]+)}\s*from\s*['"]@\/components\/icons['"]/g);
        
        if (importMatches) {
          importMatches.forEach(match => {
            const iconsMatch = match.match(/{\s*([^}]+)\s*}/);
            if (iconsMatch) {
              const iconsList = iconsMatch[1];
              // Split by comma and clean up
              iconsList.split(',').forEach(icon => {
                const cleanIcon = icon.trim().replace(/\s+as\s+\w+/, ''); // Remove aliases
                if (cleanIcon && !cleanIcon.includes('//')) {
                  icons.add(cleanIcon);
                }
              });
            }
          });
        }
      }
    }
  }
  
  scanDirectory(srcDir);
  return Array.from(icons).sort();
}

// Get currently exported icons
function getCurrentlyExported() {
  const content = fs.readFileSync(iconsFile, 'utf8');
  const exports = new Set();
  
  const exportMatches = content.match(/export\s*{\s*([^}]+)\s*}\s*from\s*['"]lucide-react['"]/g);
  
  if (exportMatches) {
    exportMatches.forEach(match => {
      const iconsMatch = match.match(/{\s*([^}]+)\s*}/);
      if (iconsMatch) {
        const iconsList = iconsMatch[1];
        iconsList.split(',').forEach(icon => {
          const cleanIcon = icon.trim().replace(/\s+as\s+\w+/, '');
          if (cleanIcon) {
            exports.add(cleanIcon);
          }
        });
      }
    });
  }
  
  return Array.from(exports).sort();
}

console.log('🔍 Scanning for icon usage...');

const usedIcons = findAllIconImports();
const exportedIcons = getCurrentlyExported();

console.log(`📊 Found ${usedIcons.length} unique icons in use`);
console.log(`📦 Currently exporting ${exportedIcons.length} icons`);

const missing = usedIcons.filter(icon => !exportedIcons.includes(icon));

if (missing.length > 0) {
  console.log(`\n❌ Missing ${missing.length} icons:`);
  missing.forEach(icon => console.log(`   - ${icon}`));
  
  // Generate export statements for missing icons
  console.log(`\n📝 Add these exports to icons/index.ts:`);
  missing.forEach(icon => {
    console.log(`export { ${icon} } from 'lucide-react';`);
  });
} else {
  console.log('\n✅ All icons are properly exported!');
}

const unused = exportedIcons.filter(icon => !usedIcons.includes(icon));
if (unused.length > 0) {
  console.log(`\n⚠️  ${unused.length} exported but unused icons (can be removed for smaller bundle):`);
  unused.slice(0, 10).forEach(icon => console.log(`   - ${icon}`));
  if (unused.length > 10) {
    console.log(`   ... and ${unused.length - 10} more`);
  }
}
