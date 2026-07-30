const fs = require('fs');
const files = [
    'server/src/services/domain-change-email.service.js',
    'server/test_custom_domain_direct.cjs'
];

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/\\\$\{/g, '${');
    content = content.replace(/\\\`/g, '`'); // also fix escaped backticks if any
    fs.writeFileSync(f, content);
    console.log("Fixed " + f);
});
