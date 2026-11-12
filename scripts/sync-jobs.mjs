// 잡코리아 채용공고 → 공홈 「채용」 섹션 (하루 한 번, .github/workflows/sync-jobs.yml)
//
// 우리 회사 잡코리아 기업 페이지의 '진행중인 채용정보'만 읽어서 index.html 의
// <!-- JOBS:START --> ~ <!-- JOBS:END --> 사이를 다시 쓴다. 지원은 잡코리아 공고 페이지에서.
// 잡코리아 robots.txt 상 /Recruit/Co_Read/ 는 일반 수집기에 열려 있다. 우리 회사 페이지 하나만, 하루 한 번.
//
// 안전장치: 페이지를 못 받거나 목록 틀(AgiList)이 없으면(화면 구조가 바뀐 경우) 아무것도 바꾸지 않고
// 실패로 끝낸다 → 공홈엔 마지막으로 읽은 공고가 그대로 남고, Actions 에 빨간 표시가 생긴다.
//
// 실행: node scripts/sync-jobs.mjs  (Node 18+, 의존성 없음)

import { readFileSync, writeFileSync } from 'node:fs';

const COMPANY_ID = '48224747';
const LIST_URL = `https://www.jobkorea.co.kr/Recruit/Co_Read/Recruit/C/${COMPANY_ID}`;
const COMPANY_URL = `https://www.jobkorea.co.kr/Recruit/Co_Read/C/${COMPANY_ID}`;
const FILE = new URL('../index.html', import.meta.url);

const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const text = (s) => decode(String(s || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function fetchList() {
  const res = await fetch(LIST_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; beaduniverse-careers-sync/1.0; +https://beaduniverse.kr)',
      'Accept-Language': 'ko-KR,ko;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`잡코리아 응답 ${res.status}`);
  return res.text();
}

export function parseJobs(html) {
  const flat = html.replace(/\s+/g, ' ');
  if (!/class="list clear AgiList"/.test(flat)) throw new Error('채용 목록 틀(AgiList)을 못 찾음 — 잡코리아 화면 구조가 바뀌었을 수 있음');
  const parts = flat.split(/<div class="AgiCntnts list-item[^"]*"/).slice(1);
  const jobs = [];
  for (const p of parts) {
    const id = (p.match(/data-gno="(\d+)"/) || [])[1];
    if (!id || jobs.some((j) => j.id === id)) continue;
    const title = text((p.match(/<dt class="tit">(.*?)<\/dt>/) || [])[1]?.replace(/<em[^>]*>.*?<\/em>/g, ''));
    const trm = [...((p.match(/<dd class="trm">(.*?)<\/dd>/) || [])[1] || '').matchAll(/<span[^>]*>(.*?)<\/span>/g)].map((m) => text(m[1]));
    const deadline = text((p.match(/<span class="day[^"]*">(.*?)<\/span>/) || [])[1]);
    const duties = text((p.match(/<dd class="sub[^"]*">(.*?)<\/dd>/) || [])[1]).replace(/\s*,\s*/g, ' · ').replace(/ 외 (\d+)$/, ' 외 $1개');
    if (!title) continue;
    const [career = '', location = '', edu = ''] = trm;
    jobs.push({
      id, title, career, location, edu: edu === '무관' ? '학력 무관' : edu, deadline, duties,
      url: `https://www.jobkorea.co.kr/Recruit/GI_Read/${id}`,
    });
  }
  return jobs;
}

export function renderJobs(jobs) {
  if (!jobs.length) {
    return `<p class="jobs-empty">지금은 진행 중인 채용이 없어요. 새 공고는 <a href="${COMPANY_URL}" target="_blank" rel="noopener">잡코리아 기업 페이지</a>에 먼저 올라옵니다.</p>`;
  }
  const items = jobs.map((j) => {
    const meta = [j.career, j.location, j.edu].filter(Boolean).map((m) => `<span>${esc(m)}</span>`).join('');
    return `      <li class="job rise"><a href="${esc(j.url)}" target="_blank" rel="noopener">
        <div class="job-main"><h3>${esc(j.title)}</h3><p class="job-meta">${meta}</p>${j.duties ? `<p class="job-duty">${esc(j.duties)}</p>` : ''}</div>
        <div class="job-side"><span class="job-due">${esc(j.deadline || '상시채용')}</span><span class="job-go">지원하기<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 16 16 8M9 8h7v7"/></svg></span></div>
      </a></li>`;
  }).join('\n');
  return `<ul class="jobs">\n${items}\n    </ul>`;
}

async function main() {
  const html = await fetchList();
  const jobs = parseJobs(html);
  const src = readFileSync(FILE, 'utf8');
  const re = /(<!-- JOBS:START -->)[\s\S]*?(<!-- JOBS:END -->)/;
  if (!re.test(src)) throw new Error('index.html 에 JOBS:START / JOBS:END 표시가 없음');
  const count = jobs.length;
  let out = src.replace(re, `$1\n    ${renderJobs(jobs)}\n    $2`);
  out = out.replace(/(<span class="jobs-count">)[^<]*(<\/span>)/, `$1${count ? `${count}개 공고 진행 중` : '진행 중인 공고 없음'}$2`);
  if (out === src) { console.log(`변경 없음 (${count}개)`); return; }
  writeFileSync(FILE, out);
  console.log(`갱신: ${count}개 — ${jobs.map((j) => j.title).join(' / ')}`);
}

main().catch((e) => { console.error('실패:', e.message); process.exit(1); });
