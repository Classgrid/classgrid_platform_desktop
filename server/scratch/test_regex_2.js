const tests = [
  "policy\n\n,\n\ntutorial", // What I tested
  "policy  \n,\n  tutorial", // Markdown line breaks
  "policy<br>,<br>tutorial", // HTML breaks
  "policy\n\n\n,\n\n\ntutorial", // Triple breaks
  "policy\r\n\r\n,\r\n\r\ntutorial", // Windows breaks
];

for (const content of tests) {
    let text = content
      .replace(/^[•]\s/gm, '- ')
      .replace(/^\s{4}[◦]\s/gm, '    - ')
      .replace(/(^[ \t]*[-*][ \t].*)\n{2,}(?=[ \t]*[-*][ \t])/gm, '$1\n'); 

    const parts = text.split(/(```[\s\S]*?```)/g);
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) { 
        parts[i] = parts[i]
          .replace(/\n+\s*,\s*\n+/g, ', ')
          .replace(/([a-zA-Z0-9])\n+\s*,/g, '$1,')
          .replace(/,\n+\s*([a-zA-Z0-9])/g, ', $1')
          .replace(/\(\n+\s*/g, '(')
          .replace(/\s*\n+\)/g, ')')
          .replace(/<br\s*\/?>/gi, ' '); // New test
      }
    }
    console.log(JSON.stringify(content));
    console.log("->", JSON.stringify(parts.join('')));
    console.log("-------------------");
}
