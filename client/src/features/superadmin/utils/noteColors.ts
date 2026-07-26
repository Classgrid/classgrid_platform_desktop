export const getTagColor = (tag: string) => {
  const normalized = tag.toLowerCase().trim();
  
  if (normalized.includes('aws')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  if (normalized.includes('prod')) return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
  if (normalized.includes('secret') || normalized.includes('auth')) return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
  if (normalized.includes('db') || normalized.includes('data')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  if (normalized.includes('front')) return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
  if (normalized.includes('back') || normalized.includes('api')) return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
  if (normalized.includes('bug') || normalized.includes('fix')) return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
  
  // Default fallback colors based on string hash for consistency
  const colors = [
    'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
    'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20',
    'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20',
  ];
  
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};
