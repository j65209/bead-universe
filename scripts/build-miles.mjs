#!/usr/bin/env node
// 친구 전용 '마일리지 항공권'(beaduniverse.kr/miles) 만들기 — 2026-11-25
// 본체 j65209/beaduniverse mileage/index.html 에서 오피스 · 수집기 · 저장소 열쇠를 걷어낸 보기 전용 화면을 만든다.
// 쓰는 법: node scripts/build-miles.mjs <mileage/index.html>   → miles/index.html
// 본체를 고쳤으면 다시 돌려 올린다. 걷어낼 자리를 못 찾거나 내부 말이 남으면 멈춘다.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const src = process.argv[2];
if (!src) throw new Error('본체 mileage/index.html 경로를 주세요');
let h = fs.readFileSync(src, 'utf8');
function sub(a, b, name) {
  const n = h.replace(a, () => b);
  if (n === h) throw new Error('자리를 못 찾음: ' + name);
  h = n;
}
const between = (from, to, b, name) => {
  const i = h.indexOf(from), j = h.indexOf(to, i + 1);
  if (i < 0 || j < 0) throw new Error('자리를 못 찾음: ' + name);
  h = h.slice(0, i) + b + h.slice(j);
};

// 머리: 잠금 · 되돌리기 · 오피스 안 화면 스크립트
between('<script src="../boss-guard.js', '<meta http-equiv="Cache-Control"', '<meta name="referrer" content="no-referrer">\n', 'boss-guard');
between('<link rel="icon"', '<link rel="stylesheet"', '<link rel="icon" type="image/png" sizes="32x32" href="../favicon-32.png">\n', 'icon');
sub('<title>마일리지 항공권 · 비드유니버스</title>', '<title>마일리지 항공권</title>', 'title');
sub('  <a class="back" href="../">← 오피스</a>\n', '', 'back');
sub('<small>대한항공 · 대표 전용</small>', '<small>대한항공</small>', 'small');
sub(/<button class="pill" id="statusBtn"[^>]*>([\s\S]*?)<\/button>/, '<span class="pill"><span class="dot" id="statusDot"></span><span id="statusTxt">불러오는 중</span></span>', 'pill');
sub(/<div class="modal" id="statusModal"[^\n]*\n/, '', 'statusModal');
between('<div id="lock"', '<div class="toast"', '<div id="lock" class="lock" hidden>\n  <h2>열 수 없는 링크예요</h2>\n  <p>받은 링크를 처음부터 끝까지 그대로 열었는지 확인해 주세요. 그래도 안 열리면 링크가 꺼진 거예요.</p>\n</div>\n', 'lock');

// 자료: 저장소 열쇠 대신 링크 글자로 서버 함수만
between("  const SB_URL =", '  const $ = id', "  const API = 'https://ckyjkxbqsyjoqpuqwoce.supabase.co/functions/v1/mile-share';\n", 'SB');
between("  const me = (lsGet(", '  /* ── 기준값', `  const KEY = new URLSearchParams(location.hash.slice(1)).get('k') || lsGet('mlf_key') || '';
  function lockOut() { S.data = null; $('app').hidden = true; $('lock').hidden = false; try { localStorage.removeItem('mlf_key'); } catch (e) { /* noop */ } }
  if (!KEY) { $('lock').hidden = false; return; }
  $('app').hidden = false;
  window.addEventListener('hashchange', () => location.reload());

`, 'gate');
between('  async function rpc(', '  /* ── 자료 ── */', `  async function getCal() {
    if (typeof DecompressionStream === 'undefined') throw new Error('브라우저를 최신으로 올려 주세요');
    const r = await fetch(API, { cache: 'no-store', headers: { 'x-mile-key': KEY } });
    if (r.status === 403) { const e = new Error('link'); e.link = true; throw e; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    lsSet('mlf_key', KEY);
    return new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json();
  }

`, 'rpc');
sub("const [cal, st] = await Promise.all([rpc('ke_award_calendar'), rpc('ke_award_status').catch(() => null)]);", 'const cal = await getCal();', 'load');
sub('      S.status = st;\n', '', 'load status');
sub('      console.warn(e);\n', '      if (e.link) { lockOut(); return; }\n      console.warn(e);\n', 'load link');
sub("LS = { cab: 'ml_cabins_v2', dir: 'ml_dir_v1', region: 'ml_region_v1', tab: 'ml_tab_v1', rt: 'ml_rt_v1', fresh: 'ml_fresh_v1' }", "LS = { cab: 'mlf_cabins', dir: 'mlf_dir', region: 'mlf_region', tab: 'mlf_tab', rt: 'mlf_rt', fresh: 'mlf_fresh' }", 'LS');

// 상태 알약: 마지막으로 새로 읽은 때만
between('  function r2Info()', '  function renderStatusPill()', `  function statusInfo() {
    const t = ((S.data && S.data.r2 && S.data.r2.state) || {}).last_run_at;
    if (!t) return { cls: '', txt: '확인 시각 모름' };
    const age = Date.now() - Date.parse(t);
    return { cls: age > 3 * 3600e3 ? 'bad' : age > 50 * 6e4 ? 'warn' : 'ok', txt: rel(t) + ' 확인' };
  }
`, 'statusInfo');
between('  function renderNotices()', '  function renderSummary()', `  function renderNotices() {
    $('notices').innerHTML = S.src === 'r2' ? '' : '<div class="notice">지금은 좌석이 <b>있다 · 없다</b>만 보여요. 예약 전 <b>성인 2명</b>으로 다시 확인하세요.</div>';
  }
`, 'notices');
between('  /* ── 수집 상태 · 수집기 승인', '  /* ── 이벤트', '', 'status modal');
sub(/    if \(e\.target\.closest\('\[data-open-status\]'\)\)[^\n]*\n[^\n]*data-approve[^\n]*\n[^\n]*data-revoke[^\n]*\n/, '', 'status clicks');
sub("if (!$('statusModal').hidden) closeModal('statusModal'); else if (!$('placeModal').hidden)", "if (!$('placeModal').hidden)", 'esc');
sub("if ($('placeModal').hidden && $('statusModal').hidden)", "if ($('placeModal').hidden)", 'closeModal');
sub("  $('statusBtn').addEventListener('click', openStatus);\n", '', 'statusBtn');

// 주석(내부 말) 걷기 — 문자열 · 템플릿 · 정규식 안은 건드리지 않는다
function stripJs(code) {
  let out = '', i = 0; const tpl = []; let prev = '';
  while (i < code.length) {
    const c = code[i], d = code[i + 1];
    if (c === '/' && d === '/') { while (i < code.length && code[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { const j = code.indexOf('*/', i + 2); i = j + 2; out += ' '; continue; }
    if (c === '/' && /[(,=:[!&|?{};>\n]/.test(prev || '(')) {
      let j = i + 1, cls = false;
      for (; j < code.length; j++) { if (code[j] === '\\') { j++; continue; } if (code[j] === '[') cls = true; else if (code[j] === ']') cls = false; else if (code[j] === '/' && !cls) break; }
      out += code.slice(i, j + 1); i = j + 1; prev = '/'; continue;
    }
    if (c === "'" || c === '"') { let j = i + 1; for (; code[j] !== c; j++) if (code[j] === '\\') j++; out += code.slice(i, j + 1); i = j + 1; prev = c; continue; }
    if (c === '`' || (c === '}' && tpl.length && tpl[tpl.length - 1] === 0)) {
      if (c === '}') tpl.pop();
      let j = i + 1;
      for (; j < code.length; j++) { if (code[j] === '\\') { j++; continue; } if (code[j] === '`') break; if (code[j] === '$' && code[j + 1] === '{') break; }
      if (code[j] === '$') { out += code.slice(i, j + 2); i = j + 2; tpl.push(0); prev = '{'; } else { out += code.slice(i, j + 1); i = j + 1; prev = '`'; }
      continue;
    }
    if (tpl.length) { if (c === '{') tpl[tpl.length - 1]++; else if (c === '}') tpl[tpl.length - 1]--; }
    out += c; if (!/\s/.test(c)) prev = c; i++;
  }
  return out.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n');
}
h = h.replace(/(<style>)([\s\S]*?)(<\/style>)/g, (_, a, b, c) => a + b.replace(/\/\*[\s\S]*?\*\//g, '') + c);
h = h.replace(/(<script>)([\s\S]*?)(<\/script>)/g, (_, a, b, c) => { const j = stripJs(b); new vm.Script(j); return a + j + c; });
h = h.replace(/<!--[\s\S]*?-->/g, '');

for (const w of ['전승훈', '전수빈', '사장님', '대표', '오피스', '관리자', '맥미니', '로마일', 'roamile', '수집', 'eyJ', 'SB_KEY', 'rpc(', 'boss', 'brightbeed', 'PIN', 'S.status', 'statusModal', 'statusBtn', 'openStatus', 'setCollector', 'r2Info', 'R2_GROUPS,'])
  if (h.includes(w)) { const i = h.indexOf(w); throw new Error('내부 말이 남음: ' + w + ' → ' + h.slice(Math.max(0, i - 60), i + 60)); }

const out = path.join(path.dirname(new URL(import.meta.url).pathname), '../miles/index.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, h);
console.log('만듦', out, h.length);
