import { useEffect, useMemo, useRef, useState } from "react";

// ```widget: a small interactive card the AI writes itself (HTML + CSS + JS), for anything no built-in block covers
// (polls, sliders, matching, ordering, reveal cards, mini quizzes, calculators...).
// It runs in a sandboxed iframe with no same-origin access (no cookies, token or storage of this app) and a CSP
// that blocks all network requests except https images/fonts. Its only channel back is postMessage:
//   classgrid.ask("text")  → sends that text as the user's next message (only right after a click inside the card)
//   automatic height updates so the card fits its content.

const MIN_HEIGHT = 40;
const MAX_HEIGHT = 2400;

function themeVars(dark: boolean) {
  return dark
    ? "--cg-bg:transparent;--cg-card:#1A1A19;--cg-card-2:#262625;--cg-text:#F0EFED;--cg-muted:#A6A6A3;--cg-border:rgba(255,255,255,.12);--cg-accent:#10B981;--cg-accent-text:#04140E;--cg-danger:#F87171;--cg-warning:#FBBF24;"
    : "--cg-bg:transparent;--cg-card:#FFFFFF;--cg-card-2:#F4F4F3;--cg-text:#2C2C2B;--cg-muted:#6B6B69;--cg-border:rgba(0,0,0,.1);--cg-accent:#059669;--cg-accent-text:#FFFFFF;--cg-danger:#DC2626;--cg-warning:#D97706;";
}

function buildDoc(code: string, id: string, dark: boolean) {
  const csp = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src https: data:; media-src https:; form-action 'none'; base-uri 'none'";
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root{${themeVars(dark)}color-scheme:${dark ? "dark" : "light"}}
*{box-sizing:border-box}
html,body{margin:0;padding:0;}body{display:flow-root;background:transparent;color:var(--cg-text);font:16px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow:hidden}
button{font:inherit;color:inherit;cursor:pointer}
img{max-width:100%}
</style>
<script>
(function(){
  var ID=${JSON.stringify(id)};
  window.classgrid={ask:function(t){parent.postMessage({cgWidget:ID,type:"ask",text:String(t||"")},"*")}};
  function size(){var b=document.body;if(!b)return;parent.postMessage({cgWidget:ID,type:"height",value:Math.ceil(b.getBoundingClientRect().height)},"*")}
  window.addEventListener("load",size);
  document.addEventListener("load",function(){size()},true); // images and fonts that load later
  [100,400,1000,2500].forEach(function(ms){setTimeout(size,ms)}); // in case the first layout measured 0
  document.addEventListener("click",function(){setTimeout(size,50)},true);
  document.addEventListener("DOMContentLoaded",function(){size();if(window.ResizeObserver){new ResizeObserver(size).observe(document.body)}});
})();
</script></head><body>${code}</body></html>`;
}

export function WidgetBlock({ code, isTyping, onAsk }: { code: string; isTyping?: boolean; onAsk?: (text: string) => void }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(160);
  const id = useMemo(() => Math.random().toString(36).slice(2), []);
  const dark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const doc = useMemo(() => buildDoc(code, id, dark), [code, id, dark]);
  const onAskRef = useRef(onAsk);
  onAskRef.current = onAsk;
  const lastAsk = useRef(0);
  const loadedAt = useRef(0);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const frame = frameRef.current;
      if (!frame || e.source !== frame.contentWindow) return;
      const msg = e.data;
      if (!msg || typeof msg !== "object" || msg.cgWidget !== id) return;
      if (msg.type === "height" && Number.isFinite(msg.value)) {
        setHeight(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, msg.value)));
      } else if (msg.type === "ask" && typeof msg.text === "string" && msg.text.trim()) {
        // Only a real click inside the card may send a message: the iframe must have focus,
        // not right after load, and at most once every 1.5 s
        const now = Date.now();
        if (document.activeElement !== frame || now - loadedAt.current < 600 || now - lastAsk.current < 1500) return;
        lastAsk.current = now;
        onAskRef.current?.(msg.text.trim().slice(0, 1000));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [id]);

  // The block is still being written: show a placeholder instead of re-running half the code on every token
  if (isTyping) {
    return (
      <div className="my-4 flex h-28 items-center justify-center rounded-2xl border border-black/10 text-[14px] text-[#6B6B69] dark:border-white/10 dark:text-[#A6A6A3]">
        <span className="animate-pulse">Building interactive card…</span>
      </div>
    );
  }

  return (
    <iframe
      ref={frameRef}
      title="Interactive card"
      sandbox="allow-scripts"
      srcDoc={doc}
      onLoad={() => { loadedAt.current = Date.now(); }}
      className="my-4 block w-full border-0 bg-transparent"
      style={{ height, colorScheme: dark ? "dark" : "light" }}
    />
  );
}
