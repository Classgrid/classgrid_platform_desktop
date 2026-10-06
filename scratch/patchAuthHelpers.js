const fs = require('fs');
const p = 'client/src/features/auth/auth-helpers.ts';
let c = fs.readFileSync(p, 'utf8');

const target = 'export function getRedirectPath(role: string | null | undefined) {\n  const normalized = normalizeAuthRole(role);';
const target2 = 'export function getRedirectPath(role: string | null | undefined) {\r\n  const normalized = normalizeAuthRole(role);';
const replacement = `export function getRedirectPath(role: string | null | undefined) {
  if (typeof window !== 'undefined') {
    const subdomain = window.location.hostname.split('.')[0];
    if (subdomain === 'chat') return '/agent';
  }
  const normalized = normalizeAuthRole(role);`;

if (c.includes(target)) {
  c = c.replace(target, replacement);
  fs.writeFileSync(p, c);
  console.log('Done 1');
} else if (c.includes(target2)) {
  c = c.replace(target2, replacement);
  fs.writeFileSync(p, c);
  console.log('Done 2');
} else {
  console.log('Not found');
}
