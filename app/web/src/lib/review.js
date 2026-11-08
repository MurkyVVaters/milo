// Captured frames are compressed, with their actual presentation times.
// Keep only the selected frame decoded; a raw 30-second bitmap list is huge.
export const CAPTURE_SECONDS = 30;
export const CAPTURE_BYTES = 64 * 1024 * 1024;

export function frameAt(frames, time) {
  let lo = 0, hi = frames.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (frames[mid].time <= time) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export function reviewTime(seconds) {
  const ms = Math.max(0, Math.round(seconds * 1000));
  return `${Math.floor(ms / 60000).toString().padStart(2, '0')}:${Math.floor(ms / 1000 % 60).toString().padStart(2, '0')}.${(ms % 1000).toString().padStart(3, '0')}`;
}

export class FrameCapture {
  frames = [];
  bytes = 0;
  pending = null;
  error = null;
  full = false;
  constructor(now) { this.started = now; }

  add(frame, now) {
    if (this.pending || this.error || this.full) return;
    const time = (now - this.started) / 1000;
    const width = frame.displayWidth ?? frame.width;
    const height = frame.displayHeight ?? frame.height;
    let canvas;
    try {
      canvas = new OffscreenCanvas(width, height);
      canvas.getContext('2d').drawImage(frame, 0, 0);
    } catch (error) { this.error = error; return; }
    this.pending = canvas.convertToBlob({ type: 'image/jpeg', quality: 0.88 })
      .then(blob => {
        if (this.bytes + blob.size > CAPTURE_BYTES) { this.full = true; return; }
        this.frames.push({ time, blob });
        this.bytes += blob.size;
      })
      .catch(error => { this.error = error; })
      .finally(() => { this.pending = null; });
  }
}
