/**

缩小精灵图帧尺寸，减少文件体积
用法: node tools/resize-sprite.js <input.png> <output.png> <oldFrameSize> <newFrameSize>
例: node tools/resize-sprite.js player-walk.png player-walk.png 256 64
*/
const fs = require("fs");
const PNG = require("pngjs").PNG;
const input = process.argv[2];
const output = process.argv[3];
const oldSize = parseInt(process.argv[4]) || 256;
const newSize = parseInt(process.argv[5]) || 64;

if (!input || !output) {
  console.log(
    "Usage: node resize-sprite.js <input.png> <output.png> <oldFrameSize> <newFrameSize>",
  );
  process.exit(1);
}

const data = fs.readFileSync(input);
const src = PNG.sync.read(data);
const sw = src.width;
const sh = src.height;
const cols = sw / oldSize;
const rows = sh / oldSize;
const dw = cols * newSize;
const dh = rows * newSize;

console.log(`Source: ${sw}x${sh} (${cols}x${rows} frames of ${oldSize}px)`);
console.log(`Target: ${dw}x${dh} (${cols}x${rows} frames of ${newSize}px)`);

const dst = new PNG({ width: dw, height: dh });

for (let fy = 0; fy < rows; fy++) {
  for (let fx = 0; fx < cols; fx++) {
    for (let py = 0; py < newSize; py++) {
      for (let px = 0; px < newSize; px++) {
        const srcX = Math.floor(fx * oldSize + (px * oldSize) / newSize);
        const srcY = Math.floor(fy * oldSize + (py * oldSize) / newSize);
        const srcIdx = (srcY * sw + srcX) * 4;
        const dstIdx = (fy * newSize + py) * dw + (fx * newSize + px);
        dst.data[dstIdx * 4] = src.data[srcIdx];
        dst.data[dstIdx * 4 + 1] = src.data[srcIdx + 1];
        dst.data[dstIdx * 4 + 2] = src.data[srcIdx + 2];
        dst.data[dstIdx * 4 + 3] = src.data[srcIdx + 3];
      }
    }
  }
}

const outBuf = PNG.sync.write(dst);
fs.writeFileSync(output, outBuf);

const oldKB = Math.round((sw * sh * 4) / 1024);
const newKB = Math.round(outBuf.length / 1024);
console.log(
  `Done! ${oldKB}KB -> ${newKB}KB (${Math.round((1 - newKB / oldKB) * 100)}% smaller)`,
);
