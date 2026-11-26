// 로컬에서 사이트를 미리 보는 아주 작은 정적 서버. 실행: node scripts/serve.js [포트]
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2" };
const port = Number(process.env.PORT) || Number(process.argv[2]) || 8765;
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(ROOT, path.normalize(p));
  if (!f.startsWith(ROOT) || /[\\/]\.|reading-backup|reference/.test(path.relative(ROOT, f))) { res.writeHead(404); return res.end(); }
  fs.readFile(f, (err, buf) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(buf);
  });
}).listen(port, "127.0.0.1", () => console.log("http://127.0.0.1:" + port));
