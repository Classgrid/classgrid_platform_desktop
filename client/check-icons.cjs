const fs = require('fs');
const sidebarStr = fs.readFileSync('src/config/sidebar.ts', 'utf8');
const match = sidebarStr.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/);
const icons = match[1].split(',').map(i => i.trim()).filter(Boolean);
const lucide = require('lucide-react');
icons.forEach(icon => {
  const val = lucide[icon];
  if (typeof val === 'object' && !val.$$typeof) console.log('PLAIN OBJECT: ' + icon);
});
