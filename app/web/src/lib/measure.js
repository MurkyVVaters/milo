// Reported bounds only. Coordinates and distances are device points.
import { describe } from './ax.js';
import { matchesFrontApp } from './sdk.js';
export const number = (n) => String(Math.round(n * 10) / 10);
const valid = (r) => r && ['x', 'y', 'width', 'height'].every(k => Number.isFinite(r[k])) && r.width > 0 && r.height > 0;
const encloses = (a, b) => a.x <= b.x + .01 && a.y <= b.y + .01 && a.x + a.width + .01 >= b.x + b.width && a.y + a.height + .01 >= b.y + b.height;
const same = (a, b) => ['x', 'y', 'width', 'height'].every(k => Math.abs(a[k] - b[k]) <= 2);
const cache = new WeakMap();
export function candidates(frame) {
  const prior = cache.get(frame);
  if (prior?.sdk === frame.sdk && prior?.tree === frame.tree) return prior.elements;
  const screen = { x: 0, y: 0, ...frame.points };
  const all = [];
  const add = (rect, label, source, component = false, tagged = false) => {
    if (!valid(rect) || !encloses(screen, rect) || same(screen, rect)) return;
    const old = all.find(e => same(e.rect, rect));
    if (old) {
      if (source === 'sdk') { old.rect = { ...rect }; old.source = source; }
      old.component ||= component;
      if (tagged) { old.label = old.source === 'accessibility' || old.label.includes('"') ? `${label} · ${old.label}` : label; old.tagged = true; }
      return;
    }
    all.push({ id: `e${all.length + 1}`, rect: { ...rect }, label, source, component, tagged });
  };
  const walkAX = (node, depth = 0) => {
    if (!node || node.hidden) return;
    if (depth && !/Window|Application/.test(node.role || '')) add(node.frame, describe(node), 'accessibility', /Group|SearchField|Button|TextField|Switch|Slider/.test(node.role || '') && valid(node.frame) && node.frame.width * node.frame.height < screen.width * screen.height * .6);
    for (const child of node.children || []) walkAX(child, depth + 1);
  };
  walkAX(frame.tree);
  if (frame.sdk && matchesFrontApp(frame.sdk, frame.tree)) {
    const walk = (node, depth = 0) => {
      if (node.hidden) return;
      if (depth && !/Window$/.test(node.type || '')) add(node.frame, node.hosts || node.type || 'View', 'sdk', !!(node.background || node.cornerRadius) && valid(node.frame) && node.frame.width * node.frame.height < screen.width * screen.height * .6);
      for (const child of node.children || []) walk(child, depth + 1);
    };
    for (const window of frame.sdk.windows || []) walk(window);
    for (const tag of frame.sdk.tags || []) add(tag.frame, tag.name || 'Tagged view', 'sdk', valid(tag.frame) && tag.frame.width * tag.frame.height < screen.width * screen.height * .6, true);
  }
  cache.set(frame, { sdk: frame.sdk, tree: frame.tree, elements: all });
  return all;
}
export function measure(all, region, orientation = 'portrait', level = 'elements') {
  const inside = all.filter(e => encloses(region, e.rect));
  const leaves = inside.filter(a => !inside.some(b => a !== b && encloses(a.rect, b.rect) && !same(a.rect, b.rect)));
  const selected = level === 'components' ? leaves.map(leaf => {
    const parents = inside.filter(e => e.component && e !== leaf && encloses(e.rect, leaf.rect) && !same(e.rect, leaf.rect));
    parents.sort((a,b) => Number(!!b.tagged) - Number(!!a.tagged) || a.rect.width*a.rect.height - b.rect.width*b.rect.height || a.id.localeCompare(b.id));
    return parents[0] || leaf;
  }) : leaves;
  const unique = [...new Map(selected.map(e => [e.id,e])).values()];
  const elements = level === 'components' ? unique.filter(a => !unique.some(b => a !== b && encloses(b.rect,a.rect) && !same(a.rect,b.rect))) : unique;
  const gaps = [];
  for (const a of elements) for (const axis of ['x', 'y']) {
    const cross = axis === 'x' ? 'y' : 'x';
    const size = axis === 'x' ? 'width' : 'height';
    const breadth = axis === 'x' ? 'height' : 'width';
    const end = a.rect[axis] + a.rect[size];
    const neighbors = elements.filter(b => b !== a && b.rect[axis] >= end && Math.min(a.rect[cross] + a.rect[breadth], b.rect[cross] + b.rect[breadth]) > Math.max(a.rect[cross], b.rect[cross]));
    neighbors.sort((b, c) => b.rect[axis] - c.rect[axis] || b.rect[cross] - c.rect[cross] || b.id.localeCompare(c.id));
    const b = neighbors[0];
    if (!b) continue;
    const mid = (Math.max(a.rect[cross], b.rect[cross]) + Math.min(a.rect[cross] + a.rect[breadth], b.rect[cross] + b.rect[breadth])) / 2;
    gaps.push({ from: a.id, to: b.id, axis, distance: b.rect[axis] - end, start: axis === 'x' ? { x: end, y: mid } : { x: mid, y: end }, end: axis === 'x' ? { x: b.rect.x, y: mid } : { x: mid, y: b.rect.y } });
  }
  return { version: 1, units: 'pt', level, orientation, coordinateSpace: 'framebuffer', region: { ...region }, elements, gaps };
}

// Shared label placement for the interactive overlay and exported screenshots.
export function drawing(data) {
  const occupied = [];
  const label = (text, x, y, key, detail) => {
    const rect = { x, y: y - 12, width: text.length * 6 + 8, height: 15 };
    const hidden = occupied.some(r => r.x < rect.x + rect.width && rect.x < r.x + r.width && r.y < rect.y + rect.height && rect.y < r.y + r.height);
    if (!hidden) occupied.push(rect);
    return { text, rect, hidden, key, detail };
  };
  const labels = data.gaps.map((g, i) => {
    const a = data.elements.find(e => e.id === g.from), b = data.elements.find(e => e.id === g.to);
    return label(`${number(g.distance)} pt`, (g.start.x + g.end.x) / 2, (g.start.y + g.end.y) / 2, `g${i}`, `${a.label} (${a.source}) → ${b.label} (${b.source})`);
  });
  for (const e of data.elements) labels.push(label(`${number(data.orientation?.startsWith('landscape') ? e.rect.height : e.rect.width)} × ${number(data.orientation?.startsWith('landscape') ? e.rect.width : e.rect.height)} pt`, e.rect.x, e.rect.y, e.id, `${e.label} · ${e.source} bounds`));
  return labels;
}
export function drawMeasurements(ctx, data, scale = 1) {
  ctx.save(); ctx.scale(scale, scale);
  ctx.strokeStyle = '#0b8fe8'; ctx.lineWidth = 1;
  for (const e of data.elements) ctx.strokeRect(e.rect.x, e.rect.y, e.rect.width, e.rect.height);
  for (const g of data.gaps) {
    ctx.beginPath(); ctx.moveTo(g.start.x, g.start.y); ctx.lineTo(g.end.x, g.end.y);
    for (const p of [g.start, g.end]) { ctx.moveTo(p.x - (g.axis === 'y' ? 3 : 0), p.y - (g.axis === 'x' ? 3 : 0)); ctx.lineTo(p.x + (g.axis === 'y' ? 3 : 0), p.y + (g.axis === 'x' ? 3 : 0)); }
    ctx.stroke();
  }
  ctx.font = '10px monospace';
  for (const l of drawing(data).filter(l => !l.hidden)) {
    ctx.fillStyle = '#086fba'; ctx.fillRect(l.rect.x, l.rect.y, l.rect.width, l.rect.height);
    ctx.fillStyle = '#fff'; ctx.fillText(l.text, l.rect.x + 4, l.rect.y + 11);
  }
  ctx.restore();
}

export function pointerPoint(u, v, points, orientation = 'portrait') {
  u = Math.max(0, Math.min(1, u)); v = Math.max(0, Math.min(1, v));
  const [x, y] = orientation === 'landscape-right' ? [v, 1 - u] : orientation === 'landscape-left' ? [1 - v, u] : orientation === 'portrait-upside-down' ? [1 - u, 1 - v] : [u, v];
  return { x: x * points.width, y: y * points.height };
}
