# m3u-iptv-parser

A simple M3U parser for Internet Protocol TeleVision - IPTV


## How to install ?
```bash
npm install m3u-iptv-parser
```

## How to use ?

```javascript
const M3UParser = require("m3u-iptv-parser");

const data = `
#EXTM3U
#EXTINF:-1 tvg-id="tf1.fr" tvg-name="TF1 HD",TF1 HD
http://example.com/stream
`;

const parser = new M3UParser();
parser.parse(data);
console.log(parser.getItems());
```
## Features
- Parses M3U headers.
- Supports tvg-id, tvg-name, tvg-logo, and more.
- Easy to use in modern projects (Next.js, Vite.js, TypeScript).

## How to test ? 
```bash
npm test
```

### MIT Licence
