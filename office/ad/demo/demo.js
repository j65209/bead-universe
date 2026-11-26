/* 오피스앱 체험판 (beaduniverse.kr/office/ad/demo/) — 2026-11-26
   앱 화면 <head> 맨 앞에서 먼저 돈다 (오피스 본창 · 안에 뜨는 도구 창 모두).
   1) 저장소 분리: 이 창의 localStorage 는 'bbdemo::' 앞글자로만 — 진짜 오피스(같은 주소)의 로그인과 안 섞인다
   2) 보기 전용 고정: 잠금 해제 · 보기 권한 · 방문자 이름은 늘 같은 값 (관리자 · 대표 화면은 안 열림)
   3) 저장 막기: 읽기 말고 서버로 가는 요청은 전부 보내지 않는다 + 입력칸 잠금
   4) 가림: 매출 · 금액 · 단가 숫자, 고객 이름 · 대화 · 전화번호 · 메일, 직원 이름
   5) 맨 위 남은 시간 (24시간이 지나면 PIN 이 끊기고 화면이 닫힌다) */
(function () {
  'use strict';
  if (window.__bbDemo) return;
  window.__bbDemo = true;

  var W = window, D = document;
  var TOP = (function () { try { return W.top === W || !W.top.__bbDemo; } catch (e) { return true; } })();
  var PFX = 'bbdemo::';
  var SB = 'https://ckyjkxbqsyjoqpuqwoce.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNreWpreGJxc3lqb3FwdXF3b2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MjI2NzEsImV4cCI6MjA5Mzk5ODY3MX0.C8WIGqf-zIYkCq0dGWTMjIYuPM-IVInMn1p6FaWbVKA';
  var APP = 'https://j65209.github.io/beaduniverse/';
  var DEMO = location.origin + '/office/ad/demo/';
  var VIEWER_PIN = '0017';                 // 프록시 '보기' 값 (GET 만 됨). 관리자 값은 절대 보내지 않음
  var ME = '방문자';

  // ---------- 1) 저장소 분리 + 2) 보기 전용 고정 ----------
  var FIXED = {
    brightbeed_unlocked: '1', brightbeed_role: 'viewer', brightbeed_auth_ver: '4',
    brightbeed_viewer_ver: '2', brightbeed_diary_me: ME
  };
  var SP = Storage.prototype, oGet = SP.getItem, oSet = SP.setItem, oDel = SP.removeItem, oKey = SP.key, oClear = SP.clear;
  var ls; try { ls = W.localStorage; } catch (e) { ls = null; }
  var lenDesc = Object.getOwnPropertyDescriptor(SP, 'length');
  function own(s) { return s === ls; }
  function ownKeys(s) {
    var out = [], n = lenDesc ? lenDesc.get.call(s) : 0;
    for (var i = 0; i < n; i++) { var k = oKey.call(s, i); if (k && k.indexOf(PFX) === 0) out.push(k.slice(PFX.length)); }
    return out;
  }
  SP.getItem = function (k) {
    if (!own(this)) return oGet.call(this, k);
    k = String(k);
    if (Object.prototype.hasOwnProperty.call(FIXED, k)) return FIXED[k];
    if (k === 'brightbeed_master_ver' || k === 'bb_boss_tok') return null;
    return oGet.call(this, PFX + k);
  };
  SP.setItem = function (k, v) {
    if (!own(this)) return oSet.call(this, k, v);
    k = String(k);
    if (Object.prototype.hasOwnProperty.call(FIXED, k)) return;
    try { return oSet.call(this, PFX + k, v); } catch (e) { }
  };
  SP.removeItem = function (k) { if (!own(this)) return oDel.call(this, k); if (k === '__all') return; return oDel.call(this, PFX + String(k)); };
  SP.key = function (i) { if (!own(this)) return oKey.call(this, i); var a = ownKeys(this).concat(Object.keys(FIXED)); return a[i] == null ? null : a[i]; };
  SP.clear = function () { if (!own(this)) return oClear.call(this); var s = this; ownKeys(s).forEach(function (k) { oDel.call(s, PFX + k); }); };
  try {
    Object.defineProperty(SP, 'length', { configurable: true, get: function () { return own(this) ? ownKeys(this).length + 5 : lenDesc.get.call(this); } });
  } catch (e) { }

  // ---------- 3) 저장 막기 ----------
  var READ_RPC = {};
  ('dlog_boot dlog_find dlog_get dlog_links dlog_page_json dlog_poll dlog_src dlog_txt dlog_versions erp_calc_stock erp_num erp_poll ' +
   'mdx_meta mdx_poll mdx_read_ok mdx_rows_get mdx_tab_refs mkt_meeting_has mkt_meeting_missing po_catalog_src po_md_links po_md_panel ' +
   'tool_news_open office_watch_dur office_watch_hm office_demo_check').split(' ').forEach(function (n) { READ_RPC[n] = 1; });

  function allowed(method, url) {
    method = (method || 'GET').toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true;
    var m = /\/rest\/v1\/rpc\/([a-z0-9_]+)/i.exec(url || '');
    return !!(m && method === 'POST' && READ_RPC[m[1]]);
  }
  var lastToast = 0;
  function toast(msg) {
    var now = Date.now(); if (now - lastToast < 2500) return; lastToast = now;
    var host; try { host = TOP ? D : W.top.document; } catch (e) { host = D; }
    if (!host.body) return;
    var t = host.getElementById('bbDemoToast');
    if (!t) { t = host.createElement('div'); t.id = 'bbDemoToast'; host.body.appendChild(t); }
    t.textContent = msg || '체험판이라 저장 · 수정은 되지 않아요';
    t.className = 'on';
    clearTimeout(t._h); t._h = setTimeout(function () { t.className = ''; }, 2600);
  }
  function fixHeaders(h) {
    try {
      if (!h) return h;
      if (h instanceof Headers) { if (h.has('X-Brightbeed-PIN')) h.set('X-Brightbeed-PIN', VIEWER_PIN); return h; }
      var o = {}; for (var k in h) o[k] = /^x-brightbeed-pin$/i.test(k) ? VIEWER_PIN : h[k];
      return o;
    } catch (e) { return h; }
  }
  // 앱 쪽 html 을 받아 다른 창에 쓰는 경우(도구 창) — 그 화면에도 이 파일을 맨 앞에 넣는다
  var SELF = '<script src="' + DEMO + 'demo.js?v=1"><\/script>';
  function isAppHtml(u) { return u.indexOf(APP) === 0 && /(\.html?|\/)(\?|#|$)/.test(u); }

  var oFetch = W.fetch;
  W.fetch = function (input, init) {
    init = init || {};
    var url = typeof input === 'string' ? input : (input && input.url) || String(input);
    try { url = new URL(url, D.baseURI).href; } catch (e) { }
    var method = init.method || (input && input.method) || 'GET';
    if (!allowed(method, url)) {
      toast();
      return Promise.resolve(new Response(JSON.stringify({ error: 'demo_read_only' }), { status: 403, headers: { 'content-type': 'application/json' } }));
    }
    if (init.headers) init = Object.assign({}, init, { headers: fixHeaders(init.headers) });
    else if (input && typeof input !== 'string' && input.headers && input.headers.has && input.headers.has('X-Brightbeed-PIN')) {
      input = new Request(input, { headers: fixHeaders(new Headers(input.headers)) });
    }
    var p = oFetch.call(W, input, init);
    if (!isAppHtml(url)) return p;
    return p.then(function (r) {
      if (!r.ok) return r;
      return r.text().then(function (html) {
        html = html.replace(/<head[^>]*>/i, function (m) { return m + SELF; });
        return new Response(html, { status: r.status, headers: { 'content-type': 'text/html; charset=utf-8' } });
      });
    });
  };
  var XO = XMLHttpRequest.prototype.open, XS = XMLHttpRequest.prototype.send, XH = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.open = function (m, u) { this.__m = m; this.__u = u; return XO.apply(this, arguments); };
  XMLHttpRequest.prototype.setRequestHeader = function (k, v) { if (/^x-brightbeed-pin$/i.test(k)) v = VIEWER_PIN; return XH.call(this, k, v); };
  XMLHttpRequest.prototype.send = function () {
    if (!allowed(this.__m, String(this.__u))) { toast(); try { this.abort(); } catch (e) { } return; }
    return XS.apply(this, arguments);
  };
  try { navigator.sendBeacon = function () { return true; }; } catch (e) { }
  try { if (navigator.serviceWorker) navigator.serviceWorker.register = function () { return Promise.reject(new Error('demo')); }; } catch (e) { }
  try { if (W.Notification) { W.Notification.requestPermission = function () { return Promise.resolve('denied'); }; } } catch (e) { }

  // 앱 안 새 창 · 링크 — 앱 주소면 체험판 주소로 바꿔 연다
  function toDemo(u) {
    var x; try { x = new URL(u, D.baseURI); } catch (e) { return u; }
    var h = x.href, path = null;
    if (h.indexOf(APP) === 0) path = h.slice(APP.length);
    else if (x.origin === location.origin && x.pathname.indexOf('/office/') === 0 && x.pathname.indexOf('/office/ad/') !== 0) path = h.slice((location.origin + '/office/').length);
    if (path == null) return u;
    var p = path.split('#')[0], hash = path.indexOf('#') >= 0 ? path.slice(path.indexOf('#')) : '';
    var q = p.split('?')[1] || '', f = p.split('?')[0] || 'index.html';
    if (/\/$/.test(f) || f === '') f += 'index.html';
    return DEMO + '?p=' + encodeURIComponent(f) + (q ? '&' + q : '') + hash;
  }
  var oOpen = W.open;
  W.open = function (u, n, f) { if (u) u = toDemo(String(u)); return oOpen.call(W, u, n, f); };

  // ---------- 4) 가림 ----------
  var CSS =
    '#bbDemoToast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(20px);opacity:0;transition:.25s;z-index:2147483647;' +
      'background:#111;color:#fff;font:600 13px/1.4 -apple-system,"Apple SD Gothic Neo",sans-serif;padding:10px 16px;border-radius:999px;pointer-events:none;white-space:nowrap}' +
    '#bbDemoToast.on{opacity:1;transform:translateX(-50%)}' +
    '.__dm{filter:blur(4px)!important;user-select:none!important;display:inline-block}' +
    '.__dmb{filter:blur(5px)!important;user-select:none!important}' +
    // 고객 대화 · 상담 내용은 통째로 흐림
    '.kko-msg,.kko-l2,.kko-chat-draft,.kko-chat-note,.kko-find-msg,.kko-ord,.kko-av img{filter:blur(5px)!important;user-select:none!important}' +
    // 내부 경고 · 알림 · 권한 표시 · 이름 바꾸기 (체험판엔 필요 없음)
    '#erpAlert,#notifAsk,#toolNew,#bbChkBtn,#bbChkPanel,#bbChkPops,#bbChkShade,#kkoUrgent,#notifCall,#stockBlank,.bc-pop,#sysHealthPill,' +
      '#diaryMeBadgeNotif,.role-badge,.dsm-overlay,[data-demo-hide]{display:none!important}' +
    // 입력은 보이지만 못 고침
    '[contenteditable]:not([contenteditable=false]){-webkit-user-modify:read-only!important}';
  function addCss() {
    if (D.getElementById('__bbdemo_css')) return;
    var s = D.createElement('style'); s.id = '__bbdemo_css'; s.textContent = CSS;
    (D.head || D.documentElement).appendChild(s);
  }
  if (D.documentElement) addCss();

  var MONEY_KW = /매출|금액|결제|광고비|지출|예산|비용|객단가|단가|원가|판매가|정가|할인가|공급가|최저가|가격|마진|수익|손익|이익|정산|수수료|입금|출금|환불액|ROAS|CPC|CPM|CPA|CTR|매입|₩|￦|￥|¥|\$/;
  var NUM = /[0-9０-９](?:[0-9０-９.,]*[0-9０-９])?/g;
  var PHONE = /0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}/g;
  var EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
  var NAME_FULL = {}, NAME_TWO = {};
  [38322704, 163396928, 556676506, 771245730, 930311348, 1404798638, 1718988739, 2051448303, 2502851971, 2731330715, 2846784711, 2932827844, 3053791947, 3202615252, 3320479163, 3393610083, 3907185467, 3984733876, 4142265084].forEach(function (h) { NAME_FULL[h] = 1; });
  [109703262, 549848342, 991833777, 992007041, 1368099052, 1692232037, 1758146414, 1769111220, 2099660941, 2261768281, 2493496741, 2569402905, 3151668484, 3475404157, 3717763285, 3973270265, 3990509537, 4121289177].forEach(function (h) { NAME_TWO[h] = 1; });
  function fnv(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h; }

  // 숫자 둘레(카드 · 칸)에 돈 낱말이 있나 — 큰 덩어리는 글을 다 읽지 않게 자식 수로 먼저 거름
  var ctxCache = new WeakMap();
  var COL_MONEY = /매출|금액|결제|광고비|지출|예산|비용|객단가|단가|원가|판매가|정가|할인가|공급가|최저가|가격|마진|수익|손익|이익|정산|수수료|CPC|CPM|CPA|ROAS|\(원\)|\(\$\)|₩|￥/;
  // 표 칸이면 그 열 머리글로 판단 (광고 시트처럼 큰 표)
  function colMoney(el) {
    var td = el.closest && el.closest('td,th'); if (!td) return null;
    var tr = td.parentElement, table = td.closest('table'); if (!tr || !table) return null;
    var idx = 0; for (var c = tr.firstElementChild; c && c !== td; c = c.nextElementSibling) idx += c.colSpan || 1;
    var rows = table.tHead ? table.tHead.rows : [];
    if (!rows.length) { var r0 = table.rows[0]; if (r0 && r0 !== tr && r0.querySelector('th')) rows = [r0]; }
    for (var i = rows.length - 1; i >= 0; i--) {
      var k = 0; for (var h = rows[i].firstElementChild; h; h = h.nextElementSibling) {
        var span = h.colSpan || 1;
        if (idx >= k && idx < k + span) { var tx = h.textContent || ''; if (COL_MONEY.test(tx)) return true; if (i === rows.length - 1 && /수|률|율|날짜|요일|개|건/.test(tx)) return false; break; }
        k += span;
      }
    }
    return null;
  }
  function ctxMoney(el) {
    if (ctxCache.has(el)) return ctxCache.get(el);
    var res = false;
    var col = colMoney(el); if (col !== null) { ctxCache.set(el, col); return col; }
    var svg = el.closest && el.closest('svg');
    if (svg) { var parent = svg.parentElement; var stx = (parent && parent.textContent.length < 800 ? parent.textContent : svg.textContent) || ''; res = MONEY_KW.test(stx) && !/노출수|클릭수|전환수/.test(stx); ctxCache.set(el, res); return res; }
    for (var i = 0, e = el; e && i < 4; i++, e = e.parentElement) {
      if (e === D.body || e.childElementCount > 14) break;
      var t = e.getAttribute && (e.getAttribute('title') || ''); if (t && MONEY_KW.test(t)) { res = true; break; }
      var tx = e.textContent || '';
      if (tx.length > 220) break;
      if (MONEY_KW.test(tx)) { res = true; break; }
    }
    ctxCache.set(el, res);
    return res;
  }
  setInterval(function () { ctxCache = new WeakMap(); }, 3000);
  // 한 글자 덩어리 안에서 가릴 범위들 [시작, 끝, 대체글]
  function sib(el, dir, n) {
    // 숫자 옆 칸(70 · '만' 처럼 따로 그린 단위)의 글자
    var x = n ? (dir > 0 ? n.nextSibling : n.previousSibling) : null;
    if (!x && el) x = dir > 0 ? el.nextSibling : el.previousSibling;
    var t = x ? (x.textContent || '') : '';
    return dir > 0 ? t.replace(/^\s+/, '').slice(0, 3) : t.replace(/\s+$/, '').slice(-2);
  }
  function spans(s, el, n0) {
    var out = [], m, ctx = null;
    NUM.lastIndex = 0;
    while ((m = NUM.exec(s))) {
      var a = m.index, b = a + m[0].length, raw = m[0];
      var before = s.slice(Math.max(0, a - 2), a), after = s.slice(b, b + 3);
      if (!after.trim() && b === s.length) after = sib(el, 1, n0);
      if (!before.trim() && a === 0) before = sib(el, -1, n0);
      var digits = raw.replace(/[^0-9０-９]/g, '').length;
      var money = /[₩￦￥¥$]\s*$/.test(before) || /^\s*(원|만|억|천|万|元|千)/.test(after);
      if (!money && digits >= 3) { if (ctx === null) ctx = ctxMoney(el); money = ctx && !/^\s*(개|건|명|일|주|시|분|초|월|년|회|번|줄|장|%|호|cm|mm|g\b)/.test(after); }
      if (!money && /^\s*%/.test(after)) { var cm = colMoney(el); money = cm === true || (cm === null && /ROAS|마진|수익률|이익률/.test(((el.parentElement || el).textContent || '').slice(0, 300))); }
      if (money && /^20\d\d$/.test(raw) && /^[-./년]/.test(s.slice(b, b + 1))) money = false;   // 날짜의 해
      if (money) out.push([a, b, '0,000']);
    }
    PHONE.lastIndex = 0; while ((m = PHONE.exec(s))) out.push([m.index, m.index + m[0].length, '010-0000-0000']);
    EMAIL.lastIndex = 0; while ((m = EMAIL.exec(s))) out.push([m.index, m.index + m[0].length, 'mail@brand.com']);
    var H = /[가-힣]+/g;
    while ((m = H.exec(s))) {
      var w = m[0], st = m.index;
      for (var i = 0; i + 3 <= w.length; i++) if (NAME_FULL[fnv(w.substr(i, 3))]) { out.push([st + i, st + i + 3, '홍길동']); i += 2; }
      var core = w.replace(/(님|씨|이가|이는|이도|에게)$/, '');
      if (core.length === 2 && NAME_TWO[fnv(core)]) out.push([st, st + 2, '길동']);
    }
    if (!out.length) return out;
    out.sort(function (x, y) { return x[0] - y[0]; });
    var merged = [out[0]];
    for (var j = 1; j < out.length; j++) { var l = merged[merged.length - 1]; if (out[j][0] < l[1]) { if (out[j][1] > l[1]) l[1] = out[j][1]; } else merged.push(out[j]); }
    return merged;
  }
  var SVGNS = 'http://www.w3.org/2000/svg';
  function maskText(n) {
    var p = n.parentElement;
    if (!p || p.closest('script,style,noscript,.__dm,[data-dm]')) return;
    var s = n.nodeValue; if (!s || !/[0-9０-９@가-힣]/.test(s)) return;
    var sp = spans(s, p, n); if (!sp.length) return;
    if (p.namespaceURI === SVGNS || /^(OPTION|TEXTAREA|TITLE)$/.test(p.tagName)) {
      var r = '', last = 0; sp.forEach(function (x) { r += s.slice(last, x[0]) + x[2]; last = x[1]; }); r += s.slice(last);
      if (r !== s) n.nodeValue = r;          // 같은 값을 다시 쓰면 또 바뀜 알림이 와서 끝없이 돈다
      if (!p.classList.contains('__dmb')) p.classList.add('__dmb'); return;
    }
    var fr = D.createDocumentFragment(), lst = 0;
    sp.forEach(function (x) {
      if (x[0] > lst) fr.appendChild(D.createTextNode(s.slice(lst, x[0])));
      var e = D.createElement('span'); e.className = '__dm'; e.setAttribute('data-dm', '1'); e.textContent = x[2]; fr.appendChild(e); lst = x[1];
    });
    if (lst < s.length) fr.appendChild(D.createTextNode(s.slice(lst)));
    p.replaceChild(fr, n);
  }
  function maskField(el) {
    if (el.type === 'hidden' || el.type === 'password') return;
    var v = el.value;
    if (v && spans(v, el).length) el.classList.add('__dmb');
    var ph = el.getAttribute('placeholder'); if (ph && spans(ph, el).length) el.classList.add('__dmb');
  }
  var CANVAS_OK = /\/(studio|feed|sns|topping|badge)\//.test(location.pathname + D.baseURI);
  function maskTree(root) {
    if (!root) return;
    if (root.nodeType === 3) { maskText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.closest && root.closest('script,style,noscript,[data-dm]')) return;
    var w = D.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [];
    while (w.nextNode()) list.push(w.currentNode);
    list.forEach(maskText);
    var q = root.querySelectorAll ? root.querySelectorAll('input,textarea,select,canvas,[contenteditable]') : [];
    for (var i = 0; i < q.length; i++) prepEl(q[i]);
    if (root.matches && root.matches('input,textarea,select,canvas,[contenteditable]')) prepEl(root);
    hideCards(root);
  }
  function prepEl(el) {
    var t = el.tagName;
    if (t === 'CANVAS') { if (!CANVAS_OK) el.classList.add('__dmb'); return; }
    if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') { lockField(el); maskField(el); return; }
    if (el.isContentEditable) el.setAttribute('contenteditable', 'false');
  }
  // 찾기 · 거르기 칸은 그대로 쓰게, 나머지 입력칸은 잠금
  function isFind(el) {
    var t = (el.type || '').toLowerCase();
    if (t === 'search') return true;
    var hint = [el.placeholder, el.id, el.name, el.className, el.getAttribute('aria-label')].join(' ');
    return /검색|찾기|search|find|filter|필터|q\b/i.test(hint);
  }
  function lockField(el) {
    if (el.__dmLock) return; el.__dmLock = 1;
    var t = (el.type || '').toLowerCase();
    if (el.tagName === 'SELECT' || t === 'checkbox' || t === 'radio' || t === 'button' || t === 'submit' || t === 'range' || t === 'color' || t === 'date' || t === 'month' || t === 'week') return;   // 고르기 · 기간 · 탭은 화면 보기용이라 둠 (저장은 서버에서 막힘)
    if (t === 'file') { el.disabled = true; return; }
    if (!isFind(el)) el.readOnly = true;
  }
  // 대표 · 관리자 · 개인정보 화면 카드는 아예 숨김
  var HIDE_TITLES = /^(업무용 비밀번호 모음|대표 전용 금고|대표 캘린더|마일리지 항공권|직원 할인 스토어|고정비용 캘린더|모델 지원자|연말정산.*)$/;
  function hideCards(root) {
    var ts = root.querySelectorAll ? root.querySelectorAll('.sub-module-title') : [];
    for (var i = 0; i < ts.length; i++) {
      if (HIDE_TITLES.test((ts[i].textContent || '').trim())) {
        var c = ts[i].closest('a,button,[onclick],.sub-module') || ts[i].parentElement; if (c) c.setAttribute('data-demo-hide', '1');
      }
    }
  }
  var BLOCK_HASH = /^#(mileage|store|models|vault|fixed|fixedcost|yearend|strategy)\b/;
  function guardHash() { if (TOP && BLOCK_HASH.test(location.hash)) { history.replaceState(null, '', location.pathname + location.search); toast('체험판에서는 열 수 없는 화면이에요'); } }
  W.addEventListener('hashchange', guardHash);

  // 입력 · 붙여넣기 · 끌어놓기 · 지우기 키는 찾기 칸 말고 막음 (저장은 어차피 서버에서 막힘)
  function editable(t) { return t && (t.isContentEditable || ((t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') && !isFind(t))); }
  ['beforeinput', 'paste', 'drop', 'cut'].forEach(function (ev) {
    D.addEventListener(ev, function (e) { if (editable(e.target) || ev === 'drop') { e.preventDefault(); e.stopImmediatePropagation(); toast(); } }, true);
  });
  D.addEventListener('keydown', function (e) {
    var t = e.target;
    if (!editable(t) && t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    // 표(엑셀식) 위에서 바로 치기 · 지우기 · 붙여넣기 · 되돌리기
    var k = e.key, mod = e.metaKey || e.ctrlKey;
    var typing = (!mod && k && k.length === 1) || k === 'Delete' || k === 'Backspace' || k === 'Enter' && editable(t) || (mod && /^[vxzy]$/i.test(k));
    if (typing && (editable(t) || (t && t.closest && t.closest('table,.og-grid,[class*="grid"]')))) { e.preventDefault(); e.stopImmediatePropagation(); toast(); }
  }, true);
  D.addEventListener('dblclick', function (e) { var t = e.target; if (t && t.closest && t.closest('td,th,[class*="cell"]')) { e.stopImmediatePropagation(); } }, true);
  // 앱 주소로 가는 링크는 체험판 주소로
  D.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href'); if (!h || h.charAt(0) === '#' || /^(javascript|mailto|tel):/i.test(h)) return;
    var nu = toDemo(a.href); if (nu !== a.href) { e.preventDefault(); if (a.target === '_blank') W.open(nu, '_blank'); else location.href = nu; }
  }, true);

  // 다시 그려져도 그리기 전에 다시 가림
  var pending = [], sched = false;
  function flush() {
    sched = false; var l = pending; pending = [];
    for (var i = 0; i < l.length; i++) { var n = l[i]; if (n.isConnected) maskTree(n); }
  }
  var mo = new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i];
      if (m.type === 'characterData') pending.push(m.target);
      else if (m.type === 'attributes') { var el = m.target; if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') maskField(el); else if (el.isContentEditable) el.setAttribute('contenteditable', 'false'); }
      else for (var j = 0; j < m.addedNodes.length; j++) pending.push(m.addedNodes[j]);
    }
    if (!sched) { sched = true; Promise.resolve().then(flush); }
  });
  function start() {
    addCss();
    maskTree(D.body);
    mo.observe(D.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['value', 'contenteditable', 'placeholder'] });
    setInterval(function () { var f = D.querySelectorAll('input,textarea'); for (var i = 0; i < f.length; i++) { lockField(f[i]); maskField(f[i]); } }, 1500);   // 코드로 넣은 값
    guardHash();
    if (TOP) timerBar();
  }
  // 문서가 쓰이는 동안 생기는 글도 잡도록 처음부터 지켜봄
  if (D.documentElement) mo.observe(D.documentElement, { childList: true, subtree: true, characterData: true });
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', start); else start();

  // ---------- 5) 남은 시간 · 24시간 뒤 닫기 ----------
  function expEnd() {
    try { oDel.call(ls, PFX + '__pin'); oDel.call(ls, PFX + '__exp'); } catch (e) { }
    location.replace(DEMO + '?expired=1');
  }
  function timerBar() {
    var exp = +new Date(oGet.call(ls, PFX + '__exp') || 0), pin = oGet.call(ls, PFX + '__pin');
    if (!exp || !pin || exp <= Date.now()) return expEnd();
    var st = D.createElement('style');
    st.textContent =
      '#bbDemoBar{position:fixed;top:0;left:0;right:0;height:34px;z-index:2147483646;display:flex;align-items:center;justify-content:center;gap:10px;' +
        'background:#111;color:#fff;font:600 13px/1 -apple-system,"Apple SD Gothic Neo",sans-serif;letter-spacing:-.01em;padding:0 16px;box-sizing:border-box}' +
      '#bbDemoBar b{font-variant-numeric:tabular-nums;font-size:14px;color:#fff}' +
      '#bbDemoBar .tag{background:#fff;color:#111;border-radius:999px;padding:4px 9px;font-size:11px}' +
      '#bbDemoBar .note{color:#9a9a9f;font-weight:500}' +
      '#bbDemoBar.hurry b{color:#ff453a}' +
      'html{scroll-padding-top:34px}body{margin-top:34px!important}' +
      '@media (max-width:640px){#bbDemoBar .note{display:none}}';
    D.head.appendChild(st);
    var bar = D.createElement('div'); bar.id = 'bbDemoBar';
    bar.innerHTML = '<span class="tag">체험판</span><span>남은 시간</span><b id="bbDemoLeft">--:--:--</b><span class="note">· 보기 전용 · 금액은 가려져 있어요</span>';
    D.body.appendChild(bar);
    var left = D.getElementById('bbDemoLeft');
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function tick() {
      var ms = exp - Date.now();
      if (ms <= 0) return expEnd();
      var s = Math.floor(ms / 1000);
      left.textContent = pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60);
      bar.className = ms < 3600e3 ? 'hurry' : '';
    }
    tick(); setInterval(tick, 1000);
    // 서버 쪽 기한도 다시 확인 (기한을 줄이거나 끊으면 켜 둔 화면도 닫힘)
    function recheck() {
      oFetch.call(W, SB + '/rest/v1/rpc/office_demo_check', {
        method: 'POST', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'content-type': 'application/json' },
        body: JSON.stringify({ p_pin: pin })
      }).then(function (r) { return r.ok ? r.json() : undefined; }).then(function (v) {
        if (v === undefined) return;          // 인터넷 끊김 등은 그냥 둠
        if (!v) return expEnd();
        exp = +new Date(v); try { oSet.call(ls, PFX + '__exp', v); } catch (e) { }
      }).catch(function () { });
    }
    recheck(); setInterval(recheck, 60e3);
    D.addEventListener('visibilitychange', function () { if (!D.hidden) recheck(); });
  }
})();
