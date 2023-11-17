const http = require('http');
const fs = require('fs');
const path = require('path');
const port = process.env.PORT || 3000;

http.createServer(function (request, response) {
    let url = new URL("http://" + request.headers.host + request.url);
    let filePath = url.pathname;
    console.log('request: ' + filePath);

    if (filePath == '/') {
        filePath = 'public/index.html';
    }
    else {
        filePath = 'public' + request.url;
    }

    let extname = String(path.extname(filePath)).toLowerCase();
    let mimeTypes = {
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

    let contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT') {
                response.writeHead(404);
                response.end('Resource not found.\n');

            }
            else {
                response.writeHead(500);
                response.end('An unexpected error was encountered.\n');
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });

}).listen(port);
console.log(`Server running on ${port}`);