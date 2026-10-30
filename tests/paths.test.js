import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, display, completion, search } from '../mods/space-picker/paths.js';

const home = '/Users/example';
test('home expansion accepts absolute paths and rejects ambiguous relative paths', () => {
  assert.equal(normalize(' ~/code/ ', home), home + '/code');
  assert.equal(normalize('~', home), home);
  assert.equal(normalize('code', home), null);
  assert.equal(normalize('/', home), '/');
  assert.equal(normalize('//Volumes//Projects/', home), '/Volumes/Projects');
});
test('parent segments stay intact so the filesystem resolves directory symlinks', () => {
  assert.equal(normalize('~/hq/..', home), home + '/hq/..');
  assert.deepEqual(completion('~/hq/..', home), { dir: home + '/hq/..', prefix: '' });
});
test('completion distinguishes parent prefixes and directory contents', () => {
  assert.deepEqual(completion('~/code/he', home), { dir: home + '/code', prefix: 'he' });
  assert.deepEqual(completion('~/code/ ', home), { dir: home + '/code', prefix: '' });
  assert.deepEqual(completion('~/.co', home), { dir: home, prefix: '.co' });
  assert.deepEqual(completion('~/.', home), { dir: home, prefix: '.' });
  assert.deepEqual(completion('/', home), { dir: '/', prefix: '' });
});
test('home display respects directory boundaries', () => {
  assert.equal(display(home + '/code', home), '~/code');
  assert.equal(display(home + '-other/code', home), home + '-other/code');
});
test('search deduplicates, matches multiple words and ranks folder-name prefixes', () => {
  const paths = [home + '/code/app', home + '/code/app', home + '/app/code'];
  assert.deepEqual(search(paths, 'app', home), [home + '/code/app', home + '/app/code']);
  assert.deepEqual(search(paths, 'CODE APP', home).length, 2);
  assert.deepEqual(search(paths, 'missing', home), []);
});


test('deep folder search tolerates omitted letters and ranks literal matches first', () => {
  const fuzzy = home + '/hq/company/clients/waterstone-studio';
  const literal = home + '/notes/waterstne';
  assert.deepEqual(search([fuzzy, literal], 'waterstne', home), [literal, fuzzy]);
  assert.deepEqual(search([fuzzy], 'clients waterstne', home), [fuzzy]);
});

test('fuzzy tokens cannot stitch letters across unrelated directory segments', () => {
  assert.deepEqual(search([home + '/water/stne'], 'waterstne', home), []);
  assert.deepEqual(search([home + '/project'], 'pj', home), []);
});

test('limited search returns the same top results as a full ranking over a large index', () => {
  const index = Array.from({ length: 20000 }, (_, i) => `${home}/hq/group-${i % 97}/project-${i}`);
  index.push(home + '/code/project', home + '/code/projcet-x');
  const full = search(index, 'project', home);
  assert.equal(full.length, 20001);
  assert.deepEqual(search(index, 'project', home, 60), full.slice(0, 60));
  assert.equal(full[0], home + '/code/project');
  assert.deepEqual(search(index, 'projct', home, 5), search(index, 'projct', home).slice(0, 5));
});

test('limit keeps exact and prefix matches ahead of fuzzy ones regardless of input order', () => {
  const fuzzy = Array.from({ length: 500 }, (_, i) => `${home}/a/waterstone-${i}`);
  const literal = home + '/z/waterstne';
  assert.equal(search([...fuzzy, literal], 'waterstne', home, 3)[0], literal);
  assert.deepEqual(search([...fuzzy, literal], 'waterstne', home, 3).length, 3);
});
