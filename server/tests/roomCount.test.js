const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeRoomCount } = require('../utils/roomCount');

test('normalizeRoomCount preserves large positive integers', () => {
  assert.equal(normalizeRoomCount('16'), 16);
  assert.equal(normalizeRoomCount(16), 16);
  assert.equal(normalizeRoomCount('13'), 13);
});

test('normalizeRoomCount falls back to 1 for invalid values', () => {
  assert.equal(normalizeRoomCount(undefined), 1);
  assert.equal(normalizeRoomCount('abc'), 1);
  assert.equal(normalizeRoomCount(0), 1);
});
