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
