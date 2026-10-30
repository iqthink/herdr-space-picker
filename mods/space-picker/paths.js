// Pure path/search helpers; no filesystem access or shell interpolation.
export function normalize(value, home) {
  let path = value.trim();
  if (path === '~') path = home;
  else if (path.startsWith('~/')) path = home + path.slice(1);
  if (!path.startsWith('/')) return null;
  // Preserve . and ..: lexical resolution changes the meaning across symlinks.
  return path.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
}

export function display(path, home) {
  return path === home ? '~' : path.startsWith(home + '/') ? '~' + path.slice(home.length) : path;
}

export function completion(value, home) {
  const path = normalize(value, home);
  if (!path) return null;
  if (value.trim().endsWith('/') || value.trim() === '~' || /\/\.\.$/.test(path)) return { dir: path, prefix: '' };
  const slash = path.lastIndexOf('/');
  return { dir: path.slice(0, slash) || '/', prefix: path.slice(slash + 1).toLowerCase() };
}

export function search(paths, query, home) {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return [...new Set(paths)].filter(path => tokens.every(token => display(path, home).toLowerCase().includes(token)))
    .sort((a, b) => {
      const leaf = p => p.split('/').pop().toLowerCase();
      const q = query.trim().toLowerCase();
      return Number(leaf(b).startsWith(q)) - Number(leaf(a).startsWith(q)) || a.localeCompare(b);
    });
}
