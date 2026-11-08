import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FrameCapture, CAPTURE_BYTES, frameAt, reviewTime } from './review.js';

test('seeking uses actual irregular frame timestamps and clamps at both ends', () => {
  const frames = [0.006, 0.023, 0.071, 0.4].map(time => ({ time }));
  for (const [time, index] of [[-1, 0], [0.006, 0], [0.022, 0], [0.023, 1], [0.07, 1], [0.071, 2], [9, 3]]) {
    assert.equal(frameAt(frames, time), index);
  }
  assert.equal(reviewTime(59.9996), '01:00.000');
  assert.equal(reviewTime(-1), '00:00.000');
});

test('capture coalesces encodes, preserves times and bounds retained memory', async () => {
  const original = globalThis.OffscreenCanvas;
  let complete;
  let draws = 0;
  globalThis.OffscreenCanvas = class {
    getContext() { return { drawImage() { draws++; } }; }
    convertToBlob() { return new Promise(resolve => { complete = resolve; }); }
  };
  try {
    const capture = new FrameCapture(1000);
    const frame = { width: 100, height: 200 };
    capture.add(frame, 1000);
    capture.add(frame, 1016);
    assert.equal(draws, 1, 'only one encoding may retain a raw frame');
    complete({ size: CAPTURE_BYTES - 1 });
    await capture.pending;
    capture.add(frame, 1071);
    complete({ size: 2 });
    await capture.pending;
    assert.equal(capture.full, true);
    assert.equal(capture.frames.length, 1);
    assert.equal(capture.bytes, CAPTURE_BYTES - 1);
    capture.add(frame, 1088);
    assert.equal(draws, 2);
    assert.equal(capture.frames[0].time, 0);
  } finally { globalThis.OffscreenCanvas = original; }
});

test('encoding errors are handled and stop accepting frames', async () => {
  const original = globalThis.OffscreenCanvas;
  globalThis.OffscreenCanvas = class {
    getContext() { return { drawImage() {} }; }
    convertToBlob() { return Promise.reject(new Error('encode failed')); }
  };
  try {
    const capture = new FrameCapture(0);
    capture.add({ width: 1, height: 1 }, 5);
    await capture.pending;
    assert.equal(capture.error.message, 'encode failed');
    assert.equal(capture.pending, null);
    assert.equal(capture.frames.length, 0);
  } finally { globalThis.OffscreenCanvas = original; }
});
