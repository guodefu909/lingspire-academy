const fs = require("fs");
const path = require("path");
const https = require("https");

const WORDS = [
  "apple","banana","pear","orange","grape","watermelon","strawberry","peach","lemon","cherry","mango","pineapple","kiwi","coconut","blueberry",
  "cat","dog","bird","fish","pig","cow","sheep","horse","rabbit","duck","chicken","monkey","tiger","lion","elephant","bear","wolf","snake","frog","mouse","panda","deer","eagle","shark","whale",
  "red","blue","green","yellow","black","white","pink","purple","brown","gray","gold","silver",
  "book","pen","bag","desk","chair","ball","car","bus","bike","boat","phone","clock","key","door","window","bed","table","cup","umbrella","camera",
  "bread","rice","egg","milk","cake","noodle","pizza","soup","meat","cheese","candy","juice","coffee","tea","sandwich",
  "head","hand","foot","eye","ear","nose","mouth","arm","leg","finger","tooth","hair","knee","neck","shoulder",
  "father","mother","brother","sister","baby","grandpa","grandma","uncle","aunt","friend",
  "sun","moon","star","rain","snow","cloud","tree","flower","river","mountain","fire","sea","wind","rainbow","island",
  "shirt","pants","shoes","hat","dress","coat","sock","jacket","skirt","glove",
  "teacher","student","school","pencil","ruler","eraser","map","computer","guitar","piano",
  "run","swim","jump","dance","sing","draw","read","write","cook","play"
];

const OUTPUT_DIR = path.join(__dirname, "..", "public", "assets", "words");
const WIDTH = 128;
const HEIGHT = 128;
const CONCURRENCY = 3;
const TIMEOUT = 60000;

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const total = WORDS.length;
  let completed = 0;
  let skipped = 0;
  let failed = 0;
  const failedWords = [];

  const queue = [...WORDS];

  async function download(word) {
    const filePath = path.join(OUTPUT_DIR, `${word}.jpg`);
    if (fs.existsSync(filePath)) {
      skipped++;
      completed++;
      logProgress();
      return;
    }

    const url = `https://image.pollinations.ai/prompt/${word}?width=${WIDTH}&height=${HEIGHT}&nologo=true`;

    try {
      const buffer = await fetchWithTimeout(url, TIMEOUT);
      fs.writeFileSync(filePath, buffer);
    } catch (err) {
      console.error(`\n  FAIL ${word}: ${err.message}`);
      failed++;
      failedWords.push(word);
    }
    completed++;
    logProgress();
  }

  function logProgress() {
    const pct = ((completed / total) * 100).toFixed(1);
    process.stdout.write(`\r${completed}/${total} (${pct}%)  skip:${skipped}  fail:${failed}`);
  }

  async function worker() {
    while (queue.length > 0) {
      const word = queue.shift();
      await download(word);
    }
  }

  console.log(`Downloading ${total} word images to ${OUTPUT_DIR}...\n`);
  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  console.log("\n");

  if (failedWords.length > 0) {
    console.log(`Failed (${failedWords.length}): ${failedWords.join(", ")}`);
    console.log("Run the script again to retry failed words.");
  } else {
    console.log("All done!");
  }
}

function fetchWithTimeout(url, timeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      req.destroy();
      reject(new Error("timeout"));
    }, timeout);

    const req = https.get(url, { headers: { "User-Agent": "spirit-world-downloader" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        clearTimeout(timer);
        https.get(res.headers.location, { headers: { "User-Agent": "spirit-world-downloader" } }, (redirectRes) => {
          const chunks = [];
          redirectRes.on("data", (c) => chunks.push(c));
          redirectRes.on("end", () => {
            clearTimeout(timer);
            resolve(Buffer.concat(chunks));
          });
        }).on("error", (e) => { clearTimeout(timer); reject(e); });
        return;
      }

      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        clearTimeout(timer);
        resolve(Buffer.concat(chunks));
      });
    });

    req.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
  });
}

main().catch(console.error);
