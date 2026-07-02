<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bolão Copa 2026</title>
  <script>
    // GitHub Pages SPA redirect — converte URL em query string
    // Técnica: github.com/rafgraph/spa-github-pages
    var segmentCount = 1; // número de segmentos do repo (bolao-copa-2026 = 1)
    var l = window.location;
    l.replace(
      l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
      l.pathname.split('/').slice(0, 1 + segmentCount).join('/') + '/?/' +
      l.pathname.slice(1).split('/').slice(segmentCount).join('/').replace(/&/g, '~and~') +
      (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
      l.hash
    );
  </script>
</head>
<body></body>
</html>
