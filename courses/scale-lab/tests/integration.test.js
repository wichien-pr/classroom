import test from 'node:test';
import assert from 'node:assert/strict';
import { classroomLink } from '../src/integration.js';
test('optional same-origin return navigation, never credential URLs', () => {
  assert.equal(classroomLink(''), '');
  assert.equal(classroomLink('https://evil.test'), '');
  assert.equal(classroomLink('//evil.test'), '');
  assert.match(classroomLink('/'), /href="\/"/);
  assert.match(classroomLink('/'), /ออกจากคลาส · กลับหน้าแรก/);
});
