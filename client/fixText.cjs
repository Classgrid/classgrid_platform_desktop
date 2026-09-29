const fs = require('fs');
const path = 'src/features/auth/pages/';

const files = fs.readdirSync(path).filter(f => f.endsWith('LoginPage.tsx'));
files.forEach(file => {
  let content = fs.readFileSync(path + file, 'utf8');
  const target = 'className="flex h-screen flex-col items-center justify-center bg-background dark:bg-[#0f0f0f] text-white text-center"';
  const replacement = 'className="flex h-screen flex-col items-center justify-center bg-background dark:bg-[#0f0f0f] text-foreground dark:text-white text-center"';
  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path + file, content);
    console.log('Successfully updated ' + file);
  } else {
    console.log('Target not found in ' + file);
  }
});
