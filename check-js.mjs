fetch('https://frontend-ten-drab-31.vercel.app/')
  .then(r => r.text())
  .then(html => {
    const match = html.match(/src="(\/assets\/index-.*\.js)"/);
    if(match) {
      console.log('Found JS:', match[1]);
      fetch('https://frontend-ten-drab-31.vercel.app' + match[1])
        .then(r => {
          console.log('JS Content-Type:', r.headers.get('content-type'));
          return r.text()
        })
        .then(js => console.log('JS length:', js.length, 'Starts with:', js.substring(0, 50)))
    } else {
      console.log('No JS found');
    }
  });
