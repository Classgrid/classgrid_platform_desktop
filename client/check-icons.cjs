const fs = require('fs');
const sidebarStr = fs.readFileSync('src/config/sidebar.ts', 'utf8');
const match = sidebarStr.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/);
if (match) {
  const icons = match[1].split(',').map(i => i.trim()).filter(Boolean);
  const lucide = require('lucide-react');
  icons.forEach(icon => {
    if (!lucide[icon]) console.log('MISSING L: ' + icon);
    else if (typeof lucide[icon] !== 'function' && typeof lucide[icon] !== 'object') console.log('INVALID TYPE: ' + icon);
  });
} else {
  console.log('No lucide import found');
}
