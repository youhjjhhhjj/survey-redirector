const http = require('http');
const fs = require('fs');
const path = require('path');
const port = process.env.PORT || 3000;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
    '.ico' : 'image/x-icon'
};
const staticPaths = new Set(['/', '/style.css', '/script.js']);


function loadFile(filePath) {
    try {
        let content = fs.promises.readFile(filePath, 'utf8');
        return content;
    }
    catch(err) {
        console.error("Error on serving " + filePath);
        return null;
    }
}

http.createServer(async function (request, response) {
    let url = new URL("http://" + request.headers.host + request.url);
    let subPath = url.pathname;
    console.log('request: ' + subPath);

    if (staticPaths.has(subPath)) {
        if (subPath == '/') subPath = '/index.html';
        let content = await loadFile("public" + subPath);
        if (content === null) {
            response.writeHead(500);
            response.end('An unexpected error was encountered.\n');
        }
        else {
            let extname = String(path.extname(subPath)).toLowerCase();
            let contentType = mimeTypes[extname] || 'application/octet-stream';
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');            
        }
    }
    else {
        response.writeHead(404);
        response.end('Resource not found.\n');
    }
}).listen(port);
console.log(`Server running on ${port}`);