// 내용 점검: 표제어가 모두 글에 들어갔는지, 링크·태그·괄호가 맞는지, 『800선』 문장을 20자 넘게 그대로 옮긴 곳이 없는지 본다.
// 실행: node scripts/check.js [book.txt]   (book.txt는 reference의 PDF를 pdftotext로 풀어 만든다. 없으면 대조를 건너뛴다.)
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
global.window = {};
["course", "terms", "tree", "articles"].forEach((f) => require(path.join(ROOT, "js", f + ".js")));
const T = window.TERMS, TR = window.TREE, A = window.ARTICLES, D = window.DOMAINS, P = window.PILLARS;
const dom = (id) => id[0] === "p" ? P.find((p) => p.id === id).domain : D.find((d) => d.tracks.includes(T.find((t) => t.id === id).track)).id;
const ids = new Set(Object.keys(TR));
const lessons = new Set(window.LESSONS.map((l) => l.id));
const TAGS = ["h2","h3","p","ul","li","strong","a","div","figure","figcaption","svg","g","defs","marker","path","line","polyline","polygon","rect","circle","ellipse","text","tspan","title","details","summary"];
let err = 0;
const e = (m) => { err++; if (err < 40) console.log(m); };
const covered = {};
const parens = (s, where) => { let o = 0; for (const ch of s) { if (ch === "(") o++; if (ch === ")") o--; if (o < 0) { e("괄호 순서 " + where); return; } } if (o) e("괄호 짝 " + where); };
for (const a of A) {
  for (const m of a.html.matchAll(/<h3><a href="#\/term\/([tp]\d+)">/g)) {
    const id = m[1];
    if (covered[id]) e("h3 중복 " + id);
    covered[id] = a.id;
    if (dom(id) !== a.domain || TR[id][0] !== a.layer) e("자리 어긋남 " + id + " in " + a.id);
  }
  for (const m of a.html.matchAll(/#\/term\/([^"]+)"/g)) if (!ids.has(m[1])) e("끊긴 링크 " + m[1] + " in " + a.id);
  for (const m of a.html.matchAll(/#\/lesson\/([^"]+)"/g)) if (!lessons.has(m[1])) e("끊긴 강의 링크 " + m[1] + " in " + a.id);
  for (const m of a.html.matchAll(/<\/?([a-z0-9]+)/g)) if (!TAGS.includes(m[1])) e("허용 안 된 태그 " + m[1] + " in " + a.id);
  if (a.html.includes("<p></p>")) e("빈 문단 " + a.id);
  parens(a.html.replace(/<[^>]+>/g, ""), a.id);
}
for (const t of T) for (const f of ["one", "body", "watch"]) { parens(t[f] || "", t.id + " " + f); if (/<[a-z]/.test(t[f] || "")) e("카드에 태그 " + t.id); }
console.log("빠진 표제어", [...ids].filter((id) => !covered[id]).length);
const bookPath = process.argv[2];
if (bookPath && fs.existsSync(bookPath)) {
  const book = fs.readFileSync(bookPath, "utf8").replace(/\s+/g, "");
  const grams = new Set();
  for (let i = 0; i + 20 <= book.length; i++) grams.add(book.slice(i, i + 20));
  const name = (s) => /[A-Za-z]{6}/.test(s) || /[一-鿿]{4}/.test(s);
  const ex = [];
  const scan = (id, txt) => { for (let i = 0; i + 20 <= txt.length; i++) { const g = txt.slice(i, i + 20); if (grams.has(g) && !name(g)) { ex.push(id + ": " + g); i += 20; } } };
  for (const a of A) scan(a.id, a.html.replace(/<figure.*?<\/figure>/g, "").replace(/<h3>.*?<\/h3>/g, "").replace(/<[^>]+>/g, "").replace(/\s+/g, ""));
  for (const t of T) scan(t.id, (t.one + t.body + t.watch).replace(/\s+/g, ""));
  console.log("책과 겹친 곳", ex.length, ex.slice(0, 10));
}
console.log("오류", err);
process.exit(err ? 1 : 0);
