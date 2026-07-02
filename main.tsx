<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bolão Mundial 2026</title>
    <script src="/bolao-brasil-2026/config.js"></script>
    <script>
      (function() {
        var redirect = window.location.search.slice(1);
        if (redirect.startsWith('/')) {
          window.history.replaceState(null, null,
            redirect.split('&').map(function(s, i) {
              return i === 0 ? s : s.replace('=', '?');
            }).join('&')
          );
        }
      })();
    </script>
    <script type="module" crossorigin src="/bolao-brasil-2026/assets/index-D2ojnmCQ.js"></script>
    <link rel="stylesheet" crossorigin href="/bolao-brasil-2026/assets/index-D-0HSDRI.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
