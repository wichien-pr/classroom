#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../appworks/platform-assets/presence.js', import.meta.url), 'utf8');
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
function harness() {
  let now = 0, sequence = 0, nextResponse;
  const timers = new Map(), calls = [], nodes = new Map();
  function node() {
    const listeners = new Map();
    return {dataset: {}, hidden: true, setAttribute() {}, replaceChildren() {}, append() {}, focus() {}, contains() { return true; },
      addEventListener(type, fn) { listeners.set(type, fn); },
      emit(type) { listeners.get(type)?.({}); }};
  }
  const root = node(), document = node(), window = node();
  Object.assign(document, {
    visibilityState: 'visible', currentScript: {dataset: {csrf: 'test'}},
    querySelector: () => root, createElement: node,
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); }
  });
  const response = (status = 200) => ({status, ok: status === 200,
    json: async () => ({total: 0, members: [], page: 1, pages: 2})});
  vm.runInNewContext(source, {document, window, AbortController,
    setTimeout(fn, delay) { const id = ++sequence; timers.set(id, {at: now + delay, fn}); return id; },
    clearTimeout(id) { timers.delete(id); },
    fetch(url, options) {
      calls.push({at: now, method: options.method});
      if (nextResponse) { const handler = nextResponse; nextResponse = undefined; return handler(options.signal); }
      return Promise.resolve(response());
    }
  });
  return {calls, document, window, timers,
    click(id) { document.getElementById(`presence-${id}`).emit('click'); },
    reply(status) { nextResponse = () => Promise.resolve(response(status)); },
    hold() {
      let release;
      nextResponse = signal => new Promise((resolve, reject) => {
        release = () => resolve(response());
        signal.addEventListener('abort', () => reject(new Error('aborted')));
      });
      return () => release();
    },
    async advance(target) {
      await flush();
      while (true) {
        const due = [...timers].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        now = due[1].at; timers.delete(due[0]); due[1].fn(); await flush();
      }
      now = target; await flush();
    }
  };
}

for (const status of [401, 403]) test(`GET ${status} cancels the heartbeat and stops requests`, async () => {
  const h = harness(); await h.advance(20000);
  h.reply(status); h.click('toggle'); await flush();
  assert.equal(h.timers.size, 0);
  await h.advance(150000); h.click('retry'); h.window.emit('pageshow'); await flush();
  assert.equal(h.calls.length, 2);
});

test('pagehide during an in-flight heartbeat cannot rearm it; pageshow resumes', async () => {
  const h = harness(); await h.advance(20000);
  h.hold(); h.click('retry'); h.window.emit('pagehide'); await flush();
  assert.equal(h.timers.size, 0);
  await h.advance(150000);
  assert.equal(h.calls.length, 2);
  h.window.emit('pageshow'); await flush();
  assert.equal(h.calls.at(-1).at, 150000);
  await h.advance(180000); assert.equal(h.calls.at(-1).at, 180000);
});

test('hidden document aborts a busy GET and resumes heartbeats on visibility', async () => {
  const h = harness(); await h.advance(25000);
  h.hold(); h.click('toggle'); await h.advance(30000);
  h.document.visibilityState = 'hidden'; h.document.emit('visibilitychange'); await flush();
  assert.equal(h.timers.size, 0);
  await h.advance(150000); assert.equal(h.calls.length, 2);
  h.document.visibilityState = 'visible'; h.document.emit('visibilitychange'); await flush();
  assert.equal(h.calls.at(-1).at, 150000);
  await h.advance(180000); assert.equal(h.calls.at(-1).at, 180000);
});

test('timed-out GET drains the pending heartbeat without losing the schedule', async () => {
  const h = harness(); await h.advance(25000); h.hold(); h.click('toggle');
  await h.advance(65000);
  assert.deepEqual(h.calls.filter(c => c.method === 'POST').map(c => c.at), [0, 35000, 65000]);
});

test('heartbeat due during a GET runs immediately after the GET finishes', async () => {
  const h = harness();
  await h.advance(25000);
  const release = h.hold(); h.click('toggle');
  await h.advance(30000);
  assert.equal(h.calls.length, 2);
  await h.advance(32000); release(); await flush();
  assert.deepEqual(h.calls.filter(c => c.method === 'POST').map(c => c.at), [0, 32000]);
  await h.advance(62000);
  assert.equal(h.calls.at(-1).method, 'POST');
  assert.equal(h.calls.at(-1).at, 62000);
});

test('panel/page GET interactions every 20s do not postpone heartbeats beyond 120s', async () => {
  const h = harness();
  for (let t = 20000; t <= 140000; t += 20000) {
    await h.advance(t);
    if (t === 20000) h.click('toggle'); else h.click('next');
    await flush();
  }
  assert.deepEqual(h.calls.filter(c => c.method === 'POST').map(c => c.at), [0, 30000, 60000, 90000, 120000]);
  assert.equal(h.calls.filter(c => c.method === 'GET').length, 7);
});
