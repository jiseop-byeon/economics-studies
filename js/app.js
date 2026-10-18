const KEY = "cheoeum-v1";

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && Array.isArray(s.lessons)) {
      if (!s.readAt || typeof s.readAt !== "object") s.readAt = {};
      // 예전 기록은 날짜 하나였다. 여러 번 읽은 날짜를 모두 남기도록 배열로 바꾼다.
      for (const k of Object.keys(s.readAt)) {
        if (!Array.isArray(s.readAt[k])) s.readAt[k] = s.readAt[k] ? [s.readAt[k]] : [];
      }
      return s;
    }
  } catch (_) {}
  return { lessons: [], readAt: {} };
}
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function readDates(s, id) {
  return (s.readAt && s.readAt[id]) || [];
}
function fmtDate(v, long) {
  const [y, m, d] = v.split("-").map(Number);
  return long ? `${y}년 ${m}월 ${d}일` : `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}`;
}
function readDate(s, id, long) {
  const ds = readDates(s, id);
  return ds.length ? fmtDate(ds[ds.length - 1], long) : "";
}
function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) {} }

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function glossText(t) {
  return [t.hanja, t.en].filter(Boolean).map(esc).join(" · ");
}
function glossLine(t, tag) {
  const g = glossText(t);
  if (!g) return "";
  const name = tag || "span";
  return `<${name} class="title-gloss">${g}</${name}>`;
}

const terms = () => window.TERMS || [];
const pillars = () => window.PILLARS || [];
const domains = () => window.DOMAINS || [];
const articles = () => window.ARTICLES || [];
const TREE = window.TREE || {};
const BOOK_PAGE = "https://www.bok.or.kr/portal/bbs/B0000249/view.do?nttId=10096081&menuNo=200765";
const BOOK_PDF = "https://www.bok.or.kr/fileSrc/portal/5cbf35f51f3842dd9ed1fba7cef5199a/1/74ac2f04b15c4debac64fd6931aea9fd.pdf";
const PDF_OFFSET = 18;
const tracks = () => window.TRACKS || [];

const PATH = [
  { id: "map", domain: "output", why: "뉴스를 사람 이름이 아니라 가계, 기업, 정부, 외국으로 읽는다. 국내총생산은 그 주고받음을 한 줄로 모은 것이며, 매출을 그냥 더하면 같은 밀가루가 두 번 들어가는 이유까지 계산한다." },
  { id: "cycle", domain: "output", why: "생산의 합계는 해마다 같은 속도로 늘지 않는다. 지금이 잠재 수준보다 위인지 아래인지, 명목 성장과 실질 성장의 나눗셈, 선행지수와 동행지수, 기저효과를 구분한다. 뒤의 일자리와 한국은행 강의에서 이 갭을 다시 쓴다." },
  { id: "prices", domain: "prices", why: "합계가 커진 것이 물건이 늘어서인지, 값만 올라서인지를 가린다. 밥·월세·교통의 가중평균으로 물가 3.5%를 직접 만들고, 월급이 3% 오를 때 살 수 있는 양이 왜 줄어드는지도 나누어 본다." },
  { id: "jobs", domain: "work", why: "그 생산을 누가 하는지가 일자리이다. 구직을 포기하면 실업률 분모에서 빠져 숫자가 좋아 보이는 함정을 1,000명으로 계산한다. 고용률과 구인배수를 함께 읽는 이유까지 다룬다." },
  { id: "household", domain: "work", why: "월급에서 세금과 갚을 돈을 빼야 쓸 수 있는 돈이 나온다. DSR과 DTI가 다른 숫자인 이유, 스트레스 DSR이 이자에 더하는 제도가 아닌 이유를 구분한다. 이자가 복리로 불어나는 식은 다음 강의에서 다룬다." },
  { id: "rates", domain: "money", why: "빚과 예금의 값이 금리이다. 1,000만 원을 연 5%로 10년 맡기면 복리로 16,288,946원이 되는 이유, 물가 3%를 뺀 실질금리가 왜 1%포인트와 다른지를 계산한다. 대출 금리의 기준칸인 코픽스와 KOFR의 이름도 여기서 익힌다." },
  { id: "banks", domain: "finance", why: "그 금리를 주고받는 곳이 은행이다. 짧은 예금으로 긴 대출을 만드는 틈, 2025년 9월 1일부터 적용된 예금보험 1억 원의 경계, 자기자본비율의 나눗셈, 결제가 확정되는 순간까지 다룬다." },
  { id: "policy", domain: "money", why: "은행끼리 하루짜리 돈을 빌리는 금리를 한국은행이 옮긴다. 기준금리 위아래 0.50%포인트 복도, 2026년 8월 27일의 결정, 테일러 준칙의 예시 계산을 담는다. 그 준칙은 한국은행의 실제 공식이 아니다." },
  { id: "fiscal", domain: "gov", why: "정부가 걷고 쓰는 살림이다. 적자는 한 해의 흐름이고 국가채무는 쌓인 잔액이다. 채무 비율의 분자와 분모가 따로 움직이는 것을 계산으로 본다." },
  { id: "fx", domain: "world", why: "외국과 거래하면 환율이 붙는다. 100달러가 1,300원과 1,400원에서 얼마인지, 숫자가 커지면 누가 이득인지, 삼불원칙과 J커브까지 읽는다." },
  { id: "bonds", domain: "markets", why: "금리의 가격표가 채권이다. 1년 뒤 10,000원의 오늘 가격이 금리 5%와 4%에서 9,524원, 9,615원이 되는 계산과, 듀레이션이 그 가격을 얼마나 흔드는지를 본다." },
  { id: "stocks", domain: "markets", why: "채권이 약속이라면 주식은 이익의 몫이다. 같은 주가로 PER, PBR, 배당수익률을 계산하고, 그 배수가 사고팔라는 신호가 아닌 이유를 적는다." },
  { id: "housing", domain: "markets", why: "집은 사는 곳이자 가장 큰 대출이 붙는 자산이다. LTV에 보증금이 더해지는 이유, 전세로 집값 −10%가 집주인 돈 −50%가 되는 계산, 역전세와 깡통전세의 차이를 구분한다." },
  { id: "crypto", domain: "markets", why: "예금, 주식, 코인은 발행하는 주체와 보호 장치가 다르다. 비트코인, 스테이블코인, 중앙은행 디지털화폐, 예금토큰, 프로젝트 한강을 구분하고, 가상자산이 예금보험 밖에 있는 이유를 정리한다." },
  { id: "desk", domain: "tools", why: "여기까지 익힌 단어로 발표 한 장을 읽는다. 전년과 전월이 같은 달에 동시에 참일 수 있는 이유, 이 사이트를 만든 날 옮겨 적은 공표 세 줄, FedWatch가 연준의 공식 전망이 아닌 이유를 적는다." },
  { id: "frame", domain: "tools", why: "상품 이름 앞에 네 칸을 둔다. 기대하는 수익, 잃을 수 있는 폭, 현금이 되는 속도, 돈이 묶이는 시간이다. 빌린 돈이 있을 때 자산 −10%가 내 돈 −50%가 되는 식을 다시 계산한다. 종목은 고르지 않는다." }
];

const LAYERS = {
  1: { name: "큰 개념", line: "가장 중요하고 가장 쉬운 개념. 여기서 경제 전체를 한 번 거칠게 본다." },
  2: { name: "작동 원리", line: "큰 개념이 어떻게 움직이는지. 뉴스 문장의 대부분이 이 층에서 읽힌다." },
  3: { name: "제도와 도구", line: "실제로 쓰는 지표, 규제, 상품, 기구. 정책 보고서가 이 층의 용어로 쓰인다." },
  4: { name: "세부", line: "특수한 변형, 고유한 기구와 협정, 지난 사건, 새로 생긴 용어." }
};

const domainName = (id) => domains().find((d) => d.id === id)?.name || id;
const trackName = (id) => tracks().find((t) => t.id === id)?.name || id;

function lessons() {
  const by = new Map((window.LESSONS || []).map((l) => [l.id, l]));
  return PATH.map((step, i) => {
    const src = by.get(step.id);
    if (!src) return null;
    return Object.assign({}, src, { no: String(i + 1).padStart(2, "0"), domain: step.domain, why: step.why });
  }).filter(Boolean);
}

const termIndex = new Map();
function node(id) {
  if (!termIndex.size) {
    terms().forEach((t) => termIndex.set(t.id, t));
    pillars().forEach((p) => termIndex.set(p.id, Object.assign({ pillar: true }, p)));
  }
  return termIndex.get(id);
}
const byId = node;
const byTitle = (title) => terms().find((t) => t.title === title);
const layerOf = (id) => (TREE[id] || [])[0] || 0;
const parentOf = (id) => (TREE[id] || [])[1] || null;
function domainOf(id) {
  const n = node(id);
  if (!n) return "";
  if (n.pillar) return n.domain;
  return domains().find((d) => d.tracks.includes(n.track))?.id || "";
}
let kidsMap = null;
function childrenOf(id) {
  if (!kidsMap) {
    kidsMap = {};
    Object.keys(TREE).forEach((k) => {
      const p = parentOf(k);
      if (p) (kidsMap[p] = kidsMap[p] || []).push(k);
    });
  }
  return (kidsMap[id] || []).slice().sort((a, b) => layerOf(a) - layerOf(b));
}
function ancestors(id) {
  const out = [];
  let p = parentOf(id);
  while (p && out.length < 6) { out.unshift(p); p = parentOf(p); }
  return out;
}
const articleId = (domain, layer) => `${domain}-${layer}`;
const articleOf = (domain, layer) => articles().find((a) => a.domain === domain && a.layer === layer);
function readingOrder() {
  const out = [];
  [1, 2, 3, 4].forEach((l) => domains().forEach((d) => { const a = articleOf(d.id, l); if (a) out.push(a); }));
  return out;
}
const membersOf = (domain, layer) => Object.keys(TREE).filter((id) => layerOf(id) === layer && domainOf(id) === domain);

function normTitle(s) {
  return String(s ?? "").normalize("NFKC").replace(/[\u0000-\u001F\u007F​-‏⁠﻿]/g, "").replace(/\s+/g, "").toLowerCase();
}

function byRelated(name) {
  const n = normTitle(name);
  if (!n) return null;
  const all = terms();
  const exact = all.filter((t) => normTitle(t.title) === n);
  if (exact.length === 1) return exact[0];
  const hits = all.filter((t) => {
    const tk = normTitle(t.title);
    if (!tk) return false;
    if (t.title.split("/").map(normTitle).includes(n)) return true;
    if (tk.startsWith(n) && /^[(/]/.test(tk.slice(n.length))) return true;
    if (n.startsWith(tk) && tk.length >= 4 && /^[(/]/.test(n.slice(tk.length))) return true;
    return false;
  });
  const ids = [...new Set(hits.map((h) => h.id))];
  return ids.length === 1 ? hits[0] : null;
}

function lessonForTerm(t) {
  return lessons().find((l) => (l.core || []).includes(t.title)) || null;
}

const termChip = (id) => {
  const n = node(id);
  return n ? `<a class="chip" href="#/term/${esc(id)}">${esc(n.title)}</a>` : "";
};
const layerTag = (id) => `${layerOf(id)}층 · ${esc(domainName(domainOf(id)))}`;

function parse() {
  const raw = (location.hash || "#/").replace(/^#/, "");
  const parts = raw.split("/").filter(Boolean);
  return { name: parts[0] || "home", arg: parts[1] ? decodeURIComponent(parts[1]) : "" };
}

function setNav(name) {
  const map = { home: "#/", learn: "#/learn", map: "#/learn", read: "#/learn", lesson: "#/learn", terms: "#/terms", term: "#/terms", sources: "#/sources" };
  document.querySelectorAll(".nav a:not(.sibling)").forEach((a) => {
    a.setAttribute("aria-current", a.getAttribute("href") === map[name] ? "page" : "false");
  });
}

function atlasHtml() {
  const go = (domain) => articleOf(domain, 1) ? `#/read/${articleId(domain, 1)}` : "#/learn";
  return `
      <figure class="atlas">
        <div class="atlas-board">
          <a class="place foreign" href="${go("world")}">
            <span class="place-k">외국</span>
            <span>우리 물건을 사 가거나, 우리에게 판다.</span>
          </a>
          <p class="flow">수출은 나가고 수입은 들어온다. 바꿀 때의 값이 환율이다.</p>
          <a class="place home" href="${go("work")}">
            <span class="place-k">가계<i class="han">家計</i></span>
            <span>일하고, 벌고, 쓴다.</span>
          </a>
          <div class="exchange">
            <span>일 →</span>
            <span>← 임금</span>
            <span>← 상품</span>
          </div>
          <a class="place firm" href="${go("output")}">
            <span class="place-k">기업<i class="han">企業</i></span>
            <span>사람을 쓰고, 물건을 만든다.</span>
          </a>
          <p class="flow">세금은 정부로 가고, 정부 지출은 다시 가계와 기업으로 온다.</p>
          <a class="place gov" href="${go("gov")}">
            <span class="place-k">정부</span>
            <span>걷어서 쓰고, 모자라면 빚을 진다.</span>
          </a>
          <div class="atlas-core">
            <a href="${go("prices")}"><b>물가<i class="han">物價</i></b><span>상품의 값</span></a>
            <a href="${go("money")}"><b>금리<i class="han">金利</i></b><span>돈의 시간값</span></a>
            <a href="${go("world")}"><b>환율<i class="han">換率</i></b><span>외국과 바꿀 때의 값</span></a>
          </div>
          <div class="atlas-floor">
            <a href="${go("finance")}"><b>금융<i class="han">金融</i></b><span>쓰고 남은 돈은 은행, 채권, 주식, 집으로 간다.</span></a>
            <a href="${go("money")}"><b>한국은행<i class="han">韓國銀行</i></b><span>은행끼리 하루짜리 돈을 빌리는 금리를 옮긴다.</span></a>
          </div>
        </div>
        <p class="atlas-read">뉴스는 이 가운데 한 줄이 커지거나 막힌 이야기이다. 칸을 누르면 그 분야의 1층 글로 간다.</p>
      </figure>`;
}

function rateMeeting() {
  const M = window.MEETINGS && window.MEETINGS.baseRate;
  if (!M) return null;
  const now = today();
  const next = (M.schedule || []).find((d) => d > now);
  const md = (d) => `${Number(d.slice(5, 7))}.${Number(d.slice(8))}`;
  return { last: M.last, next, md };
}

function homeStats() {
  const E = window.ECOS;
  if (!E || !E.stats) return "";
  const pick = [
    ["한국은행 기준금리", "기준금리", "t154"],
    ["원/달러 환율(종가)", "원/달러 환율", "p11"],
    ["소비자물가 상승률(전년 동월 대비, 계산값)", "물가 상승률", "t347"],
    ["경제성장률(실질, 계절조정 전기대비)", "경제성장률(전기 대비)", "t031"],
    ["실업률", "실업률", "t403"],
    ["경상수지", "경상수지(한 달)", "t028"]
  ];
  const tiles = pick.map(([key, label, id]) => {
    const st = E.stats[key];
    if (!st) return "";
    const rm = id === "t154" ? rateMeeting() : null;
    const when = rm && rm.last ? `${rm.last.short}(제${rm.last.name.match(/제(\d+)차/)?.[1] || "?"}차) 결정${rm.next ? ` · 다음 ${rm.md(rm.next)}` : ""}` : ecosCycle(st.cycle);
    return `<a class="now-tile" href="#/term/${id}"><span class="now-label">${esc(label)}</span><strong>${esc(ecosValue(st))}</strong><span class="now-when">${esc(when)}</span></a>`;
  }).join("");
  return `<section class="now"><p class="kicker">지금 숫자</p><div class="now-grid">${tiles}</div><p class="meta">한국은행 ECOS 100대 통계지표, ${esc(E.fetched)} 조회. 칸을 누르면 그 용어로 간다.</p></section>`;
}

function home() {
  const s = load();
  const order = readingOrder();
  const next = order.find((a) => !s.lessons.includes(a.id)) || order[0];
  const started = order.some((a) => s.lessons.includes(a.id));
  const count = (l) => Object.keys(TREE).filter((id) => layerOf(id) === l).length;
  const firstOf = (l) => order.find((a) => a.layer === l);
  return `
    <section class="landing">
      <h1>탑다운으로 공부하는 경제교재</h1>
      <p class="dek">가장 중요한 개념에서 시작해 세부까지, 『경제금융용어 800선』의 787개 용어를 네 층으로 내려간다.</p>
      <div class="row">
        ${next ? `<a class="btn" href="#/read/${esc(next.id)}">${started ? "이어서 읽기" : "1층부터 읽기"}</a>` : ""}
        <a class="btn-quiet" href="#/learn">전체 목록</a>
      </div>
      <ol class="ladder">
        ${[1, 2, 3, 4].map((l) => {
          const f = firstOf(l);
          return `<li><a href="${f ? `#/read/${esc(f.id)}` : "#/learn"}">
            <span class="ladder-no">${l}층</span>
            <span class="ladder-body"><strong>${esc(LAYERS[l].name)}</strong><span>${esc(LAYERS[l].line)}</span></span>
            <span class="ladder-count">${count(l)}</span>
          </a></li>`;
        }).join("")}
      </ol>
      ${homeStats()}
      <form class="home-search" id="home-search" role="search">
        <input class="search" id="hq" type="search" placeholder="용어 찾기: DSR, 환율, 기준금리" aria-label="용어 검색">
      </form>
    </section>`;
}

function learn() {
  const s = load();
  const mark = (id) => {
    if (!s.lessons.includes(id)) return "";
    const n = readDates(s, id).length;
    return `<span class="toc-done">${n > 1 ? n + "회독" : "읽음"}${readDate(s, id) ? " " + readDate(s, id) : ""}</span>`;
  };
  const floor = (l) => {
    const rows = domains().map((d) => {
      const a = articleOf(d.id, l);
      const n = membersOf(d.id, l).length;
      if (!a || !n) return "";
      // 마우스를 올리면 그 글이 다루는 용어를 글에 나오는 순서대로 보여 준다.
      const names = [...a.html.matchAll(/<h3><a href="#\/term\/([tp]\d+)">/g)].map((m) => (node(m[1]) || {}).title).filter(Boolean);
      return `<li><a href="#/read/${esc(a.id)}">
        <span class="toc-domain">${esc(d.name)}</span>
        <span class="toc-title">${esc(a.title)}</span>
        <span class="toc-count"><span class="toc-terms" data-tip="${esc(names.join(" · "))}">용어 ${n}개</span>${mark(a.id)}</span>
      </a></li>`;
    }).join("");
    const total = Object.keys(TREE).filter((id) => layerOf(id) === l).length;
    return `
      <section class="toc-head"><h2><span>${l}층</span> ${esc(LAYERS[l].name)}</h2><p>${esc(LAYERS[l].line)} ${total}개.</p></section>
      <ol class="toc">${rows}</ol>`;
  };
  const ls = lessons();
  return `
    <p class="kicker">개념</p>
    <h1>위층부터 한 층씩 내려간다.</h1>
    <p class="dek">층마다 열 개 분야의 글이 있다. 한 층을 모두 읽고 내려가도 되고, 한 분야를 끝까지 내려가도 된다.</p>
    <p class="meta"><a href="#/map">0층 · 가계, 기업, 정부, 외국의 주고받음을 한 장으로 보기 →</a></p>
    ${[1, 2, 3, 4].map(floor).join("")}
    <section class="toc-head"><h2>계산으로 다시 보기</h2><p>2층의 원리를 숫자로 직접 계산해 보는 강의 ${ls.length}편.</p></section>
    <ol class="toc">${ls.map((l) => `<li><a href="#/lesson/${esc(l.id)}">
      <span class="toc-domain">${esc(domainName(l.domain))}</span>
      <span class="toc-title">${esc(l.title)}</span>
      <span class="toc-count">${l.minutes}분${mark(l.id)}</span>
    </a></li>`).join("")}</ol>`;
}

function mapView() {
  return `
    <p class="kicker">0층</p>
    <h1>한 장의 지도</h1>
    <p class="dek">가계, 기업, 정부, 외국이 주고받고, 그 값에 이름이 붙는다. 칸을 누르면 그 분야의 1층 글로 간다.</p>
    ${atlasHtml()}
    <p class="meta"><a href="#/learn">← 개념 목록</a></p>`;
}

function markButton(id, done) {
  const s = load();
  const ds = done ? readDates(s, id) : [];
  if (!ds.length) return `<button class="btn" type="button" id="mark" data-id="${esc(id)}">읽음으로 표시</button>`;
  const log = ds.map((d, i) => `${i + 1}회독 ${fmtDate(d)}`).join(" · ");
  const todayDone = ds.includes(today());
  return `<p class="meta read-log">${esc(log)}</p>`
    + `<button class="btn${todayDone ? "-quiet" : ""}" type="button" id="mark" data-id="${esc(id)}"${todayDone ? " disabled" : ""}>${todayDone ? "오늘 읽음 기록됨" : "오늘 다시 읽음"}</button>`
    + `<button class="btn-quiet" type="button" id="unmark" data-id="${esc(id)}">마지막 기록 지우기</button>`;
}

function withGloss(html) {
  return html.replace(/<h3><a href="#\/term\/([tp]\d+)">([^<]*)<\/a><\/h3>/g, (m, id, title) => {
    const n = node(id);
    return `<h3><a href="#/term/${id}">${title}</a>${n ? glossLine(n) : ""}</h3>`;
  });
}

function articleView(id) {
  const a = articles().find((x) => x.id === id);
  if (!a) return `<h1>글을 찾지 못했다.</h1><p><a href="#/learn">층별 목록으로</a></p>`;
  const s = load();
  const order = readingOrder();
  const i = order.findIndex((x) => x.id === id);
  const prev = order[i - 1];
  const next = order[i + 1];
  const up = a.layer > 1 ? articleOf(a.domain, a.layer - 1) : null;
  const down = a.layer < 4 ? articleOf(a.domain, a.layer + 1) : null;
  const ls = a.layer === 2 ? lessons().filter((l) => l.domain === a.domain) : [];
  return `
    <article class="lesson">
      <p class="kicker">${a.layer}층 ${esc(LAYERS[a.layer].name)} · ${esc(domainName(a.domain))}</p>
      <h1>${esc(a.title)}</h1>
      <p class="dek">${esc(a.dek)}</p>
      <div class="row updown">
        ${up ? `<a class="chip" href="#/read/${esc(up.id)}">↑ ${up.layer}층 · ${esc(domainName(up.domain))}</a>` : ""}
        ${down ? `<a class="chip" href="#/read/${esc(down.id)}">↓ ${down.layer}층 · ${esc(domainName(down.domain))}</a>` : ""}
      </div>
      <div class="article">${withGloss(a.html)}</div>
      ${ls.length ? `<h2>계산으로 다시 보기</h2><div class="chips">${ls.map((l) => `<a class="chip" href="#/lesson/${esc(l.id)}">${esc(l.no)} ${esc(l.title)}</a>`).join("")}</div>` : ""}
      <div class="row">${markButton(a.id, s.lessons.includes(a.id))}</div>
      <div class="pager">
        ${prev ? `<a href="#/read/${esc(prev.id)}">← ${prev.layer}층 · ${esc(domainName(prev.domain))}</a>` : "<span></span>"}
        ${next ? `<a href="#/read/${esc(next.id)}">${next.layer}층 · ${esc(domainName(next.domain))} →</a>` : `<a href="#/learn">층별 목록</a>`}
      </div>
    </article>`;
}

function lessonView(id) {
  const l = lessons().find((x) => x.id === id);
  if (!l) return `<h1>강의를 찾지 못했다.</h1>`;
  const s = load();
  const idx = lessons().findIndex((x) => x.id === id);
  const prev = lessons()[idx - 1];
  const next = lessons()[idx + 1];
  const cores = (l.core || []).map((title) => {
    const t = byTitle(title);
    return t ? termChip(t.id) : "";
  }).join("");
  const art = articleOf(l.domain, 2);
  return `
    <article class="lesson">
      <p class="kicker">계산 강의 ${esc(l.no)} · ${esc(domainName(l.domain))} · ${l.minutes}분</p>
      <h1>${esc(l.title)}</h1>
      <p class="dek">${esc(l.dek)}</p>
      ${l.why ? `<p class="bridge"><span class="bridge-kicker">이 강의가 다루는 것</span>${esc(l.why)}</p>` : ""}
      ${l.html}
      ${cores ? `<h2>이 강의의 용어</h2><div class="chips">${cores}</div>` : ""}
      ${art ? `<p class="meta"><a href="#/read/${esc(art.id)}">2층 · ${esc(domainName(l.domain))} 글로 돌아가기</a></p>` : ""}
      <div class="row">${markButton(l.id, s.lessons.includes(l.id))}</div>
      <div class="pager">
        ${prev ? `<a href="#/lesson/${esc(prev.id)}">← ${esc(prev.title)}</a>` : "<span></span>"}
        ${next ? `<a href="#/lesson/${esc(next.id)}">${esc(next.title)} →</a>` : `<a href="#/learn">층별 목록</a>`}
      </div>
    </article>`;
}

function allNodes() {
  return pillars().map((p) => node(p.id)).concat(terms());
}

function termsView(arg) {
  const isDomain = domains().some((d) => d.id === arg);
  const q = arg && !isDomain ? arg : "";
  const domainChips = [`<button class="chip" type="button" data-domain="" aria-pressed="${isDomain ? "false" : "true"}">모든 분야</button>`]
    .concat(domains().map((d) => `<button class="chip" type="button" data-domain="${esc(d.id)}" aria-pressed="${d.id === arg ? "true" : "false"}">${esc(d.name)}</button>`)).join("");
  const layerChips = [`<button class="chip" type="button" data-layer="" aria-pressed="true">모든 층</button>`]
    .concat([1, 2, 3, 4].map((l) => `<button class="chip" type="button" data-layer="${l}" aria-pressed="false">${l}층</button>`)).join("");
  return `
    <p class="kicker">용어 ${terms().length} · 기둥 개념 ${pillars().length}</p>
    <h1>용어를 찾고, 위아래로 옮겨 간다.</h1>
    <p class="dek">표제어는 한국은행 『경제금융용어 800선』(2026)을 따른다. 설명은 이 사이트가 처음 공부하는 사람을 위해 따로 쓴 문장이다. 기둥 개념은 책의 표제어가 아니라 아래 용어들을 묶으려고 세운 큰 개념이다.</p>
    <input class="search" id="q" type="search" placeholder="예: DSR, 환율, 기준금리" value="${esc(q)}" aria-label="용어 검색">
    <div class="chips" id="layers">${layerChips}</div>
    <div class="chips" id="filters">${domainChips}</div>
    <div class="term-list" id="list"></div>`;
}

function paintTerms(domain, layer) {
  const q = (document.getElementById("q")?.value || "").trim().toLowerCase();
  const list = allNodes().filter((t) => {
    if (domain && domainOf(t.id) !== domain) return false;
    if (layer && layerOf(t.id) !== layer) return false;
    if (!q) return true;
    return (t.title + " " + (t.hanja || "") + " " + (t.en || "") + t.one + (t.body || "")).toLowerCase().includes(q);
  }).sort((a, b) => layerOf(a.id) - layerOf(b.id));
  const host = document.getElementById("list");
  if (!host) return;
  host.innerHTML = list.slice(0, 400).map((t) => `
    <a class="term-link" href="#/term/${esc(t.id)}">
      <strong>${esc(t.title)}${glossLine(t, "span")}</strong>
      <span class="tag">${layerTag(t.id)}${t.pillar ? " · 기둥" : ""}</span>
      <span>${esc(t.one)}</span>
    </a>`).join("") || `<p>해당하는 용어가 없다.</p>`;
  if (list.length > 400) host.insertAdjacentHTML("beforeend", `<p class="meta">앞 400개만 보여 준다. 검색어를 더 좁히면 나머지를 찾을 수 있다.</p>`);
}


function ecosCycle(c) {
  const s = String(c || "");
  if (/^\d{8}$/.test(s)) return `${s.slice(0, 4)}.${Number(s.slice(4, 6))}.${Number(s.slice(6))}`;
  if (/^\d{6}$/.test(s)) return `${s.slice(0, 4)}년 ${Number(s.slice(4))}월`;
  if (/^\d{4}Q\d$/.test(s)) return `${s.slice(0, 4)}년 ${s.slice(5)}분기`;
  if (/^\d{4}$/.test(s)) return `${s}년`;
  return s;
}
function ecosValue(st) {
  const f = (v, d) => v.toLocaleString("ko-KR", { maximumFractionDigits: d });
  const u = st.unit || "";
  const conv = { "십억원": [1e3, "조 원"], "백만원": [1e6, "조 원"], "백만달러": [1e2, "억 달러"], "천달러": [1e5, "억 달러"], "천명": [10, "만 명"], "조원": [1, "조 원"] };
  if (conv[u]) return `${f(st.value / conv[u][0], 1)}${conv[u][1]}`;
  if (u.includes("=")) return `${f(st.value, 2)} (${u})`;
  if (u === "%") return `${f(st.value, 3)}%`;
  return `${f(st.value, 2)}${u ? " " + u : ""}`;
}
function ecosBox(id) {
  const E = window.ECOS;
  if (!E || !E.links || !E.links[id] || !E.links[id].length) return "";
  const rows = E.links[id].map((n) => E.stats[n]).filter(Boolean).map((st) =>
    `<li><span class="stat-name">${esc(st.name)}</span><strong>${esc(ecosValue(st))}</strong><span class="stat-when">${esc(ecosCycle(st.cycle))}</span></li>`).join("");
  const rm = id === "t154" ? rateMeeting() : null;
  const meet = rm && rm.last ? `<p class="meeting-line">최근 결정: ${esc(rm.last.name)}, ${esc(rm.last.date.replace(/-/g, "."))}, ${esc(rm.last.result)}.${rm.next ? ` 다음 통화정책방향 결정 회의는 ${esc(rm.next.replace(/-/g, "."))} 예정이다.` : ""}</p>` : "";
  return `<div class="note stat-box"><p class="note-kicker">지금 숫자</p><ul class="stat-list">${rows}</ul>${meet}<p class="meta">출처: 한국은행 경제통계시스템(ECOS) 100대 통계지표, ${esc(E.fetched)} 조회. 발표마다 바뀐다.</p></div>`;
}

function termView(id) {
  const t = byId(id);
  if (!t) return `<h1>용어를 찾지 못했다.</h1>`;
  const layer = layerOf(id);
  const crumbs = ancestors(id).map((p) => `<a href="#/term/${esc(p)}">${esc(node(p)?.title || p)}</a>`);
  const kids = childrenOf(id);
  const rel = (t.related || []).map((name) => {
    const hit = byRelated(name);
    return hit && hit.id !== id ? termChip(hit.id) : "";
  }).join("");
  const art = articleOf(domainOf(id), layer);
  const lesson = t.pillar ? null : lessonForTerm(t);
  return `
    <article class="lesson">
      <p class="kicker">${layerTag(id)}${t.pillar ? " · 기둥 개념" : ""}</p>
      ${crumbs.length ? `<p class="crumbs">${crumbs.join(" › ")} › <span>${esc(t.title)}</span></p>` : ""}
      <h1>${esc(t.title)}${glossLine(t)}</h1>
      <p class="dek">${esc(t.one)}</p>
      ${(t.body || "").split(/(?<=다\.|요\.|까\.|죠\.|니다\.)\s+/).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join("")}
      ${t.pillar ? `<div class="note"><p class="note-kicker">기둥 개념</p><p>이 개념은 『800선』의 표제어가 아니다. 아래의 용어들을 한데 묶으려고 이 사이트가 세운 큰 개념이며, 자세한 설명은 1층 글에 있다.</p></div>` : ""}
      ${t.watch ? `<div class="note"><p class="note-kicker">헷갈리기 쉬운 점</p><p>${esc(t.watch)}</p></div>` : ""}
      ${ecosBox(id)}
      ${t.page ? `<p class="source-line">원문: 한국은행 『경제금융용어 800선』(2026) ${t.page}쪽 · <a href="${BOOK_PDF}#page=${t.page + PDF_OFFSET}" target="_blank" rel="noopener">PDF에서 이 쪽 열기</a> · <a href="${BOOK_PAGE}" target="_blank" rel="noopener">한국은행 자료실</a></p>` : ""}
      ${kids.length ? `<h2>더 깊이</h2><div class="chips">${kids.map((k) => `<a class="chip" href="#/term/${esc(k)}">${esc(node(k)?.title || k)} <small>${layerOf(k)}층</small></a>`).join("")}</div>` : ""}
      ${rel ? `<h2>함께 보면 좋은 용어</h2><div class="chips">${rel}</div>` : ""}
      <div class="row">
        ${art ? `<a class="btn" href="#/read/${esc(art.id)}">이 용어를 설명하는 글 · ${layer}층 ${esc(domainName(art.domain))}</a>` : ""}
        ${lesson ? `<a class="btn-quiet" href="#/lesson/${esc(lesson.id)}">계산 강의 ${esc(lesson.no)} ${esc(lesson.title)}</a>` : ""}
      </div>
    </article>`;
}

function sources() {
  const rows = window.SOURCES || [];
  const body = rows.map((g) => `
    <h2>${esc(g.name)}</h2>
    <ul>${g.links.map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a>${l.why ? ` — ${esc(l.why)}` : ""}</li>`).join("")}</ul>`).join("");
  return `
    <article class="lesson">
      <p class="kicker">출처</p>
      <h1>숫자는 여기서 다시 확인한다.</h1>
      <p class="meta">원문 PDF: <a href="${BOOK_PAGE}" target="_blank" rel="noopener">한국은행 『경제금융용어 800선』 다운로드 페이지</a></p>
      <p class="dek">글과 강의에 적은 공표 숫자는 그 날짜의 자료이다. 다음 발표가 나오면 기관 페이지의 숫자를 따른다. 한국은행 책의 문장은 싣지 않았다.</p>
      ${body}
      <div class="note">
        <p class="note-kicker">학습 범위</p>
        <p>표제어 787개는 한국은행이 2026년 1월에 발간한 『경제금융용어 800선』의 표제어이다. 책 한 권으로 세면 800선이고, 표제어 가운데 둘을 슬래시로 묶은 항목이 있어 이 사이트의 카드 수는 787이다. 기둥 개념 ${pillars().length}개는 층을 세우려고 이 사이트가 더한 개념이다. 원문은 한국은행 경제교육 자료와 정부간행물 안내에서 볼 수 있다. 이 사이트는 그 해설을 옮기지 않았다.</p>
      </div>
    </article>`;
}

function render() {
  const { name, arg } = parse();
  setNav(name);
  const main = document.getElementById("main");
  if (name === "home") main.innerHTML = home();
  else if (name === "learn") main.innerHTML = learn();
  else if (name === "map") main.innerHTML = mapView();
  else if (name === "read") main.innerHTML = articleView(arg);
  else if (name === "lesson") main.innerHTML = lessonView(arg);
  else if (name === "terms") main.innerHTML = termsView(arg);
  else if (name === "term") main.innerHTML = termView(arg);
  else if (name === "sources") main.innerHTML = sources();
  else main.innerHTML = home();

  main.querySelectorAll("[data-reveal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const box = btn.parentElement.querySelector(".answer");
      if (box) box.hidden = false;
      btn.hidden = true;
    });
  });
  const mark = document.getElementById("mark");
  if (mark) mark.onclick = () => {
    const s = load();
    const id = mark.dataset.id;
    const ds = readDates(s, id);
    if (!ds.includes(today())) s.readAt[id] = ds.concat(today());
    if (!s.lessons.includes(id)) s.lessons = s.lessons.concat(id);
    save(s);
    render();
  };
  const unmark = document.getElementById("unmark");
  if (unmark) unmark.onclick = () => {
    const s = load();
    const id = unmark.dataset.id;
    const ds = readDates(s, id).slice(0, -1);
    if (ds.length) s.readAt[id] = ds;
    else {
      delete s.readAt[id];
      s.lessons = s.lessons.filter((x) => x !== id);
    }
    save(s);
    render();
  };
  const hs = document.getElementById("home-search");
  if (hs) hs.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = document.getElementById("hq").value.trim();
    location.hash = v ? `#/terms/${encodeURIComponent(v)}` : "#/terms";
  });
  if (name === "terms") {
    let domain = domains().some((d) => d.id === arg) ? arg : "";
    let layer = 0;
    const q = document.getElementById("q");
    const go = () => paintTerms(domain, layer);
    q.addEventListener("input", go);
    const wire = (hostId, key, set) => {
      const host = document.getElementById(hostId);
      host.addEventListener("click", (e) => {
        const b = e.target.closest(`[data-${key}]`);
        if (!b) return;
        set(b.dataset[key]);
        host.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c === b ? "true" : "false"));
        go();
      });
    };
    wire("filters", "domain", (v) => { domain = v; });
    wire("layers", "layer", (v) => { layer = Number(v) || 0; });
    go();
  }
  window.scrollTo(0, 0);
}

function setTheme(light) {
  const root = document.documentElement;
  if (light) root.dataset.theme = "light"; else delete root.dataset.theme;
  try { localStorage.setItem("cheoeum-theme", light ? "light" : "dark"); } catch (_) {}
  const btn = document.getElementById("theme");
  if (btn) { btn.textContent = light ? "어둡게" : "밝게"; btn.setAttribute("aria-pressed", light ? "true" : "false"); }
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", light ? "#f7f4ec" : "#142033");
}
setTheme(document.documentElement.dataset.theme === "light");
document.getElementById("theme").addEventListener("click", () => setTheme(document.documentElement.dataset.theme !== "light"));

addEventListener("hashchange", render);
addEventListener("scroll", () => {
  document.querySelector(".top").classList.toggle("scrolled", scrollY > 4);
}, { passive: true });
render();
