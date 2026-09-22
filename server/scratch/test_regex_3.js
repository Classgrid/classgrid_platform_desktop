const content = `policy\n\n,\n\ntutorial\n\n,\n\nfaq\n\n,\n\nnotes\n\n, and\n\narticle`;

let text = content
          .replace(/(?:\r?\n)+\s*,\s*(?:\r?\n)+/g, ', ')
          .replace(/(\S)(?:\r?\n)+\s*,/g, '$1,')
          .replace(/,\s*(?:\r?\n)+\s*(\S)/g, ', $1');

console.log(JSON.stringify(text));
