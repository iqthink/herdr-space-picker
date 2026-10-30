import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as paths from '../mods/space-picker/paths.js';

// Exercise the real controller with host calls stubbed; rendering is checked by Herdr.
const source = (await readFile(new URL('../mods/space-picker/main.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\n/gm, '').replace('export default class', 'return class');

function controller() {
  const data = {};
  const commands = [];
  const closed = [];
  const bindings = {
    ...paths, View: class {}, shared: key => data[key], setShared: (key, value) => { data[key] = value; },
    props: () => ({ overlay: 'picker-one' }), run: (...args) => commands.push(args), closeOverlay: id => closed.push(id),
  };
  const Picker = new Function(...Object.keys(bindings), source)(...Object.values(bindings));
  const picker = new Picker();
  Object.assign(picker, { home: '/home/user', query: '~/pro', matches: ['/home/user/project'], at: 0, index: [] });
  let pending;
  const cx = { notify() {}, spawn(fn) { pending = fn(cx); } };
  return { picker, cx, data, commands, closed, done: () => pending };
}

test('partial path fallback is captured before async validation', async () => {
  const { picker, cx, commands, closed, done } = controller();
  let release;
  const first = new Promise(resolve => { release = resolve; });
  picker.request = path => path === '/home/user/pro' ? first : Promise.resolve(path);
  picker.open(picker.selected(), cx);
  picker.query = '~/different';
  picker.matches = ['/home/user/different'];
  release(null);
  await done();
  assert.deepEqual(commands, [['space.new', { folder: '/home/user/project' }]]);
  assert.deepEqual(closed, ['picker-one']);
});

test('invalid paths leave the dialog open and create no terminal', async () => {
  const { picker, cx, commands, closed, done } = controller();
  picker.matches = [];
  picker.request = async () => null;
  picker.open('/missing', cx);
  await done();
  assert.equal(commands.length, 0);
  assert.equal(closed.length, 0);
  assert.match(picker.error, /Cannot open/);
  assert.equal(picker.busy, false);
});

test('recents keep the chosen symlink path and deduplicate canonical identities', async () => {
  const { picker, cx, data, done } = controller();
  data['space-picker.recents'] = ['/home/user/old-link'];
  data['space-picker.identities'] = { '/home/user/old-link': '/storage/project' };
  picker.request = async () => '/storage/project';
  picker.open('/home/user/hq', cx);
  await done();
  assert.deepEqual(data['space-picker.recents'], ['/home/user/hq']);
});
