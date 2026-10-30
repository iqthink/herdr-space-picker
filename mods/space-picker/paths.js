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
  const ranked = [];
  for (const path of new Set(paths)) {
    const text = display(path, home).toLowerCase();
    let fuzzy = 0;
    let matched = true;
    for (const token of tokens) {
      if (text.includes(token)) continue;
      // Match missing letters within a single folder segment, not across unrelated parents.
      if (token.length < 3 || !text.split('/').some(segment => subsequence(token, segment))) {
        matched = false; break;
      }
      fuzzy++;
    }
    if (matched) ranked.push({ path, fuzzy, prefix: text.split('/').pop().startsWith(query.trim().toLowerCase()) });
  }
  return ranked.sort((a, b) => a.fuzzy - b.fuzzy || Number(b.prefix) - Number(a.prefix) || a.path.localeCompare(b.path))
    .map(result => result.path);
}

function subsequence(needle, text) {
  let at = 0;
  for (const character of text) if (character === needle[at]) at++;
  return at === needle.length;
}
