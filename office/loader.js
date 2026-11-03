/* 오피스앱 입구 (beaduniverse.kr/office/).
   앱 본체는 j65209/beaduniverse 의 GitHub Pages 에 있고, 여기서 그때그때 최신 HTML 을 받아 이 주소에 띄운다.
   복사본이 없어서 오피스앱을 push 하면 여기도 같이 바뀐다.

   - data/ · assets/ · meta-ads/ 같은 상대 경로는 <base> 로 본체를 본다. Pages 응답이 CORS * 라 fetch 도 된다.
   - <base> 때문에 '#diary' 같은 상대 주소가 본체 주소로 풀려 pushState 가 막히므로, 현재 주소 기준으로 되돌린다.
   - 대시보드 ↔ 에이전트 오피스 링크와 설치용 manifest 는 이 주소에 머물도록 바꾼다.
   - 이 주소에서 서버를 부르려면 프록시 config.env 의 BRIGHTBEED_ALLOWED_ORIGIN 에 이 주소가 있어야 한다. */
(function () {
  var APP = 'https://j65209.github.io/beaduniverse/';
  var here = location.origin + '/office/';
  var page = document.currentScript.getAttribute('data-page');

  var guard = '<script>' +
    "['pushState','replaceState'].forEach(function(m){" +
      'var orig=history[m];' +
      'history[m]=function(s,t,u){return orig.call(history,s,t,u==null?u:new URL(String(u),location.href).href)};' +
    '});' +
    "document.addEventListener('click',function(e){" +
      "var a=e.target.closest&&e.target.closest('a[href^=\"#\"]');" +
      'if(!a||e.defaultPrevented)return;' +
      'e.preventDefault();' +
      "if(a.getAttribute('href').length>1)location.hash=a.getAttribute('href');" +
    '});' +
    '<\/script>';

  function fail() {
    var msg = document.getElementById('msg');
    if (!msg) return;
    msg.innerHTML = '오피스앱을 불러오지 못했습니다.<br><a href="' + APP + (page === 'index.html' ? '' : page) + '">원래 주소로 열기</a>';
  }

  fetch(APP + page, { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    })
    .then(function (html) {
      html = html
        .replace(/<head>/i, function (m) {
          return m + '<base href="' + APP + '"><meta name="robots" content="noindex,nofollow">' + guard;
        })
        .replace('href="./agents.html"', 'href="' + here + 'agents.html"')
        .replace('<a href="./">', '<a href="' + here + '">')
        .replace('href="manifest.json"', 'href="' + here + 'manifest.json"');
      document.open();
      document.write(html);
      document.close();
    })
    .catch(fail);
})();
