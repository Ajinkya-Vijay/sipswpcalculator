import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const port = process.env.PORT || 8080;
const distDir = resolve('dist');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

async function serveFile(filePath) {
  try {
    const fileStats = await stat(filePath);
    if (fileStats.isFile()) {
      const content = await readFile(filePath);
      return {
        statusCode: 200,
        contentType: mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
        body: content
      };
    }
  } catch {
    // Ignore file read errors and fall through to index fallback.
  }

  return null;
}

const server = createServer(async (req, res) => {
  try {
    const requestPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
    const safePath = requestPath.replace(/\/+/, '/');
    const filePath = join(distDir, safePath);

    let response = await serveFile(filePath);

    if (!response && safePath !== '/index.html') {
      response = await serveFile(join(distDir, 'index.html'));
    }

    if (!response) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(response.statusCode, {
      'Content-Type': response.contentType,
      'Cache-Control': 'no-cache'
    });
    res.end(response.body);
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal server error');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`App is running on http://0.0.0.0:${port}`);
});
