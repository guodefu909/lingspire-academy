const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const inputFile = path.join(__dirname, "..", "assets", "单词对战地图-1.png");
const outputFile = inputFile;
const targetSize = 768;

const original = PNG.sync.read(fs.readFileSync(inputFile));
console.log(`Original: ${original.width}x${original.height}`);

const scale = targetSize / original.width;
const output = new PNG({ width: targetSize, height: targetSize });

for (let y = 0; y < targetSize; y++) {
  for (let x = 0; x < targetSize; x++) {
    const srcX = Math.floor(x / scale);
    const srcY = Math.floor(y / scale);
    const srcIdx = (srcY * original.width + srcX) * 4;
    const dstIdx = (y * targetSize + x) * 4;
    output.data[dstIdx] = original.data[srcIdx];
    output.data[dstIdx + 1] = original.data[srcIdx + 1];
    output.data[dstIdx + 2] = original.data[srcIdx + 2];
    output.data[dstIdx + 3] = original.data[srcIdx + 3];
  }
}

fs.writeFileSync(outputFile, PNG.sync.write(output));
const newSize = fs.statSync(outputFile).size;
console.log(`Resized: ${targetSize}x${targetSize}, ${Math.round(newSize / 1024)}KB`);
