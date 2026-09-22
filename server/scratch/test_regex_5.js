const content = `policy\n\n,\n\ntutorial\n\n,\n\nfaq\n\n,\n\nnotes\n\n, and\n\narticle`;

let text = content
          .replace(/[\r\n]+\s*,/g, ',')
          .replace(/,\s*[\r\n]+/g, ', ')
          .replace(/[\r\n]+\s*\//g, '/')
          .replace(/\/\s*[\r\n]+/g, '/ ')
          .replace(/\(\s*[\r\n]+/g, '(')
          .replace(/[\r\n]+\s*\)/g, ')');

console.log(JSON.stringify(text));
