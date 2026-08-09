/**

从边缘泛洪填充去除背景色（不会误删角色内部像素）
用法: node tools/remove-bg.js <input.png> <output.png> [threshold]
*/
const fs = require("fs");
const PNG = require("pngjs").PNG;
const input = process.argv[2];
const output = process.argv[3];
const threshold = parseInt(process.argv[4]) || 35;

if (!input || !output) {
  console.log("Usage: node remove-bg.js <input.png> <output.png> [threshold]");
  process.exit(1);
}

const data = fs.readFileSync(input);
const png = PNG.sync.read(data);
const w = png.width;
const h = png.height;

function colorDist(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

const tl = { r: png.data[0], g: png.data[1], b: png.data[2] };
const trIdx = (w - 1) * 4;
const tr = {
  r: png.data[trIdx],
  g: png.data[trIdx + 1],
  b: png.data[trIdx + 2],
};
const blIdx = (h - 1) * w * 4;
const bl = {
  r: png.data[blIdx],
  g: png.data[blIdx + 1],
  b: png.data[blIdx + 2],
};
const brIdx = ((h - 1) * w + w - 1) * 4;
const br = {
  r: png.data[brIdx],
  g: png.data[brIdx + 1],
  b: png.data[brIdx + 2],
};
const bgR = Math.round((tl.r + tr.r + bl.r + br.r) / 4);
const bgG = Math.round((tl.g + tr.g + bl.g + br.g) / 4);
const bgB = Math.round((tl.b + tr.b + bl.b + br.b) / 4);
console.log(`Background: rgb(${bgR}, ${bgG}, ${bgB}), threshold: ${threshold}`);

const visited = new Uint8Array(w * h);
const isBackground = new Uint8Array(w * h);

const queue = [];
for (let x = 0; x < w; x++) {
  queue.push(x);
  queue.push((h - 1) * w + x);
}
for (let y = 1; y < h - 1; y++) {
  queue.push(y * w);
  queue.push(y * w + w - 1);
}

let head = 0;
while (head < queue.length) {
  const pos = queue[head++];
  if (visited[pos]) continue;
  visited[pos] = 1;

  const x = pos % w;
  const y = (pos - x) / w;
  const idx = pos * 4;
  const r = png.data[idx],
    g = png.data[idx + 1],
    b = png.data[idx + 2];

  if (colorDist(r, g, b, bgR, bgG, bgB) > threshold) continue;

  isBackground[pos] = 1;
  if (x > 0 && !visited[pos - 1]) queue.push(pos - 1);
  if (x < w - 1 && !visited[pos + 1]) queue.push(pos + 1);
  if (y > 0 && !visited[pos - w]) queue.push(pos - w);
  if (y < h - 1 && !visited[pos + w]) queue.push(pos + w);
}

let removed = 0;
for (let i = 0; i < w * h; i++) {
  if (isBackground[i]) {
    png.data[i * 4 + 3] = 0;
    removed++;
  }
}

const outBuf = PNG.sync.write(png);
fs.writeFileSync(output, outBuf);
console.log(
  `Done! Removed ${removed} pixels (${((removed / (w * h)) * 100).toFixed(1)}%)`,
);
