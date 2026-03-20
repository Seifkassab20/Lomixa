const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(getFiles(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) { 
      results.push(file);
    }
  });
  return results;
}

const files = getFiles('src/pages');
files.push('src/components/Sidebar.tsx', 'src/components/Topbar.tsx', 'src/components/Layout.tsx');

let extractedKeys = {};
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Match t('key') || 'Fallback' and t(var)
  // Simple regex for string literal arguments in t()
  const regex = /t\(['"]([^'"]+)['"]\)(?:\s*\|\|\s*['"]([^'"]+)['"])?/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    const fallback = match[2];
    if (!extractedKeys[key]) extractedKeys[key] = fallback || key;
  }
});

let i18nContent = fs.readFileSync('src/i18n.ts', 'utf8');

// VERY HACKY way to find keys currently in i18n
const existingKeysMatch = Array.from(i18nContent.matchAll(/([a-zA-Z0-9_]+):\s*['"]/g)).map(m => m[1]);

let missingKeys = Object.keys(extractedKeys).filter(k => !existingKeysMatch.includes(k));

console.log('Missing keys count:', missingKeys.length);

if (missingKeys.length > 0) {
    let englishAdditions = '\n      // ── Auto-Extracted Keys ──────────────────────────────────\n';
    let arabicAdditions = '\n      // ── Auto-Extracted Keys ──────────────────────────────────\n';
    
    missingKeys.forEach(k => {
        let fallback = extractedKeys[k] || k;
        let camelToTitle = fallback; 
        if (fallback === k && fallback.length > 3) {
            camelToTitle = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        }
        
        englishAdditions += `      ${k}: '${camelToTitle.replace(/'/g, "\\'")}',\n`;
        arabicAdditions += `      ${k}: '* ${camelToTitle.replace(/'/g, "\\'")}',\n`;
    });
    
    i18nContent = i18nContent.replace(/(\s*)(topDoctors:\s*'Top Doctors by Visits',)/, '$1$2' + englishAdditions);
    i18nContent = i18nContent.replace(/(\s*)(topDoctors:\s*'أكثر الأطباء زيارات',)/, '$1$2' + arabicAdditions);
    
    fs.writeFileSync('src/i18n.ts', i18nContent);
    console.log('Injected missing keys to i18n.ts.');
}
