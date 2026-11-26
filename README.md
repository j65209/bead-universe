# bead-universe

주식회사 비드유니버스 회사 소개 사이트. https://beaduniverse.kr

- 단일 `index.html` + `img/`. 빌드 없음. `main` 에 push 하면 GitHub Pages 로 바로 게시된다.
- 도메인과 DNS 는 가비아에서 관리한다. `CNAME` 파일을 지우면 도메인 연결이 끊긴다.
- `office/` 는 오피스앱 입구다 (https://beaduniverse.kr/office/). 앱 본체는 `beaduniverse` 레포의 Pages 에 있고 `office/loader.js` 가 최신 HTML 을 받아 이 주소에 띄운다. 복사본이 아니므로 앱 수정은 `beaduniverse` 레포에서 한다.

※ 이름이 비슷한 `beaduniverse` 레포는 사내 오피스 대시보드다.
※ 도메인을 사용자 사이트 레포 `j65209.github.io` 에 걸면 안 된다 — 오피스·풋살 등 모든 프로젝트 사이트 주소가 함께 바뀐다.

## beaduniverse.kr 하위 주소 (2026-11-24)

사장님 "패스파인더 빼고 나머지는 다 비드유니버스 하위주소로 · 기존 직원들이랑 자동업무 안 끊기게".
**저장소 · 원래 주소(`j65209.github.io/…`)는 그대로** 두고 이 레포에 입구만 더했다. 입구는 `office/loader.js` 가 본체의 최신 HTML 을 받아 띄우므로(복사본 없음) 본체를 고치면 여기도 바로 바뀐다. 맥미니 · GitHub Actions · Vercel 은 건드리지 않음.

**링크 미리보기 (2026-11-26)**: 카카오톡 · 문자에 주소를 보내면 심볼이 뜨도록 모든 입구 `<title>` 바로 아래에 og 태그가 있다 (`og:image` = `/og-symbol.png` 800×800 정사각 심볼, 공홈 첫 화면만 `og.jpg`). 새 입구를 복사해 만들 때 `og:title` · `og:description` · `og:url` 도 그 화면 것으로 바꾼다. 카카오는 한 번 읽은 미리보기를 오래 기억하므로, 바꾼 뒤엔 카카오 개발자 "공유 디버거"에서 그 주소 캐시를 지운다.

| 주소 | 무엇 | 본체 |
|---|---|---|
| `beaduniverse.kr` | 회사 소개 (공홈) | 이 레포 `index.html` |
| `/office/` | 오피스앱 | `j65209/beaduniverse` |
| `/office/erp/` · `/office/mdsheet/` · `/office/voc/` · `/office/seeding/` · `/office/feed/` · `/office/adlib/` · `/office/review/` · `/office/store/` · `/office/meeting/` · `/office/weekly/` · `/office/studio/` · `/office/mailer/` · `/office/models/` · `/office/mileage/` · `/office/trip/` · `/office/sns/` | 오피스 화면 하나씩 (ERP전산팀 · MD팀 시트 · VOC · 시딩 마스터 · 피드 시뮬레이터 · 주얼리 광고 라이브러리 · 1점 리뷰 관리 · 직원 할인 스토어 · 마케팅 회의록 · 주간 회의록 · 광고 스튜디오 · 메일 발송 · 모델 지원자 · 마일리지 · 여행 자료 · 꿀꿀집) | `j65209/beaduniverse` 의 같은 폴더 |
| `/office/ad/` · `/office/agents.html` · `/office/meta-ads/report.html` | 오피스 소개 · 에이전트 오피스 · 광고 리포트 | 이 레포 · `j65209/beaduniverse` |
| `/insta/` | 릴스 메이커 | `j65209/brightbeed-insta` (`data-app`) |
| `/coferry/` | 코페리 디자인센터 | `j65209/coferry` (`data-app`) |
| `/brightbeed/` | 브라이트비드 공구 → **brightbeed.kr 로 넘겨 줌** (고객용 브랜드 주소가 본 주소) | `j65209/brightbeed-catalog` |
| `/miles/` | 마일리지 항공권 **친구 전용 보기** (PIN 없음, 링크 `#k=` 글자를 서버 함수 `mile-share` 가 확인 · 끊기 = Supabase `mile_share_links.active` false) | 이 레포 `miles/index.html` — 본체를 고치면 `node scripts/build-miles.mjs <mileage/index.html>` 다시 |
| `/stock/` | 재고 시스템 → **brightbeed-stock.vercel.app 으로 넘겨 줌** (Next.js 앱이라 입구로 못 띄움) | `j65209/brightbeed-stock` |

- 새 화면 입구 = `office/<폴더>/index.html` 복사 후 `<title>` · `data-page` 만 바꿈. 오피스 밖 사이트는 `data-app="https://j65209.github.io/<레포>/"` 추가.
- 브라우저 저장값(잠금 · 작업 중인 내용)은 주소(출처)마다 따로다. `beaduniverse.kr` 아래끼리는 같이 쓰고, 원래 주소에서 쓰던 저장값은 그쪽에 남는다 — 새 주소에선 접속 코드를 한 번 넣는다.
- MD팀 시트는 오피스(같은 주소)에서 MD팀을 한 번 열어 열쇠를 받아야 혼자 열린다 (원래 주소와 같음). 마일리지 · 여행 자료 · 꿀꿀집은 관리자만.
- 패스파인더 FC(풋살, 개인)는 넣지 않음.
