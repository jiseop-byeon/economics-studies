// 커밋할 때마다 사이트 갱신 시각(한국 시각)을 js/meta.js에 적고, index.html의 캐시 번호를 바꾼다.
// .git/hooks/pre-commit에서 부른다. 손으로 돌려도 된다: node scripts/stamp.js
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const kst = new Date(Date.now() + 9 * 3600 * 1000).toISOString();
const stamp = `${kst.slice(0, 10)} ${kst.slice(11, 16)}`;
fs.writeFileSync(path.join(ROOT, "js/meta.js"),
  "// scripts/stamp.js가 커밋 때마다 고친다. 사이트 내용이 마지막으로 바뀐 한국 시각.\n" +
  `window.SITE = { updated: "${stamp}" };\n`);
const idx = path.join(ROOT, "index.html");
const v = kst.slice(0, 16).replace(/[-T:]/g, "");
fs.writeFileSync(idx, fs.readFileSync(idx, "utf8").replace(/js\/meta\.js\?v=[0-9a-z]*/, `js/meta.js?v=${v}`));
console.log("stamped", stamp);
