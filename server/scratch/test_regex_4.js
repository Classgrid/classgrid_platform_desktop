// CLASSGRID USES CLOUDFLARE USAGE TO CALCULATE TOKENS, NOT GPT-TOKENIZER (WHICH IS ONLY A FALLBACK)
const content = `policy \n\n ,\ntutorial`;

let text = content
          .replace(/(?:\r?\n)+\s*,\s*(?:\r?\n)+/g, ', ')
          .replace(/(\S)(?:\r?\n)+\s*,/g, '$1,')
          .replace(/,\s*(?:\r?\n)+\s*(\S)/g, ', $1');

console.log(JSON.stringify(text));
