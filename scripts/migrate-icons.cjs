/**
 * Icon Import Migration Script
 * Automatically updates lucide-react imports to use centralized @/components/icons
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const excludeDirs = ['node_modules', '.git', 'dist', 'build'];

// Files to process
const filesToUpdate = [
  'src/pages/Register.tsx',
  'src/pages/Profile.tsx',
  'src/pages/WriteBlog.tsx',
  'src/pages/Blogs.tsx',
  'src/pages/BlogView.tsx',
  'src/pages/CoreTeam.tsx',
  'src/pages/EventsRedesigned.tsx',
  'src/pages/Attendance.tsx',
  'src/pages/Admin.tsx',
  'src/pages/Settings.tsx',
  'src/pages/ForgotPassword.tsx',
  'src/pages/ForgotPasswordNew.tsx',
  'src/pages/ResetPassword.tsx',
  'src/pages/PrivacyPolicy.tsx',
  'src/pages/TermsOfUse.tsx',
  'src/pages/SessionExpired.tsx',
  'src/pages/AuthCallback.tsx',
  'src/components/QRScanner.tsx',
  'src/components/ProductionDebug.tsx',
  'src/components/PasswordResetDialog.tsx',
  'src/components/Gallery.tsx',
  'src/hooks/useUserSessions.ts',
];

function updateFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // Pattern to match lucide-react imports
  const importPattern = /import\s*{([^}]+)}\s*from\s*['"]lucide-react['"]/g;
  
  let hasChanges = false;
  content = content.replace(importPattern, (match, icons) => {
    hasChanges = true;
    return `import {${icons}} from "@/components/icons"`;
  });

  if (hasChanges) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    return true;
  } else {
    console.log(`⏭️  Skipped (no lucide-react imports): ${filePath}`);
    return false;
  }
}

console.log('🚀 Starting icon import migration...\n');

let updatedCount = 0;
let skippedCount = 0;

filesToUpdate.forEach(file => {
  if (updateFile(file)) {
    updatedCount++;
  } else {
    skippedCount++;
  }
});

console.log(`\n📊 Migration Summary:`);
console.log(`   ✅ Updated: ${updatedCount} files`);
console.log(`   ⏭️  Skipped: ${skippedCount} files`);
console.log(`\n✨ Icon migration complete!`);
