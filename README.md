# bead-universe

주식회사 비드유니버스 회사 소개 사이트. https://beaduniverse.kr

- 단일 `index.html` + `img/`. 빌드 없음. `main` 에 push 하면 GitHub Pages 로 바로 게시된다.
- 도메인과 DNS 는 가비아에서 관리한다. `CNAME` 파일을 지우면 도메인 연결이 끊긴다.
- `office/` 는 오피스앱 입구다 (https://beaduniverse.kr/office/). 앱 본체는 `beaduniverse` 레포의 Pages 에 있고 `office/loader.js` 가 최신 HTML 을 받아 이 주소에 띄운다. 복사본이 아니므로 앱 수정은 `beaduniverse` 레포에서 한다.

※ 이름이 비슷한 `beaduniverse` 레포는 사내 오피스 대시보드다.
※ 도메인을 사용자 사이트 레포 `j65209.github.io` 에 걸면 안 된다 — 오피스·풋살 등 모든 프로젝트 사이트 주소가 함께 바뀐다.
