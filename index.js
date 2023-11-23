const http = require('http');
const fs = require('fs');
const path = require('path');
const {v5: uuidv5} = require('uuid');
const port = process.env.PORT || 3000;

const uuidNamespace = process.env.uuid || require('./secrets/uuid.json');

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

class Product {
    constructor(name, description, price, image) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.image = image;
    }
}
const Products = [
    new Product('Option 1', 'the description for option 1', 200, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
    new Product('Option 2', 'the description for option 2', 250, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
    new Product('Option 3', 'the description for option 3', 250, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
    new Product('Option 4', 'the description for option 4', 175, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
    new Product('Option 5', 'the description for option 5', 200, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
    new Product('Option 6', 'the description for option 6', 300, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
    new Product('Option 7', 'the description for option 7', 250, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
    new Product('Option 8', 'the description for option 8', 225, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
    new Product('Option 9', 'the description for option 9', 275, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
    new Product('Option 10', 'the description for option 10', 200, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
    new Product('Option 11', 'the description for option 11', 325, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
    new Product('Option 12', 'the description for option 12', 150, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
    new Product('Option 13', 'the description for option 13', 250, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
];


function loadFile(filePath) {
    try {
        let content = fs.promises.readFile(filePath, 'utf8');
        return content;
    }
    catch(err) {
        console.error('Error on serving ' + filePath);
        return null;
    }
}

function generateUid(str) {
    let uuid = uuidv5(str, uuidNamespace);
}

http.createServer(async function (request, response) {
    let url = new URL('http://' + request.headers.host + request.url);
    let subPath = url.pathname;
    console.log(`(${new Date().toLocaleString('en-GB')}) request: ${subPath}`);

    if (staticPaths.has(subPath)) {
        if (subPath == '/') subPath = '/index.html';
        let content = await loadFile('public' + subPath);
        if (content === null) {
            response.writeHead(500);
            response.end('An unexpected error was encountered.\n');
        }
        else {
            let extname = String(path.extname(subPath)).toLowerCase();
            let contentType = mimeTypes[extname] || 'application/octet-stream';
            response.writeHead(200, {'Content-Type': contentType});
            response.end(content, 'utf-8');            
        }
    }
    else if (subPath == '/data.json') {
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify(Products), 'utf-8');
    }
    else if (subPath == '/lookup') {
        let uid = url.searchParams.get('uid');
        // SELECT * FROM UserDatabase WHERE uid = 'uid'
        if (uid == 'user') {
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({
                uid: uid,
                username: 'username',
                balance: 400
            }), 'utf-8');
        }
        else {
            response.writeHead(204);
            response.end();
        }
    }
    else if (subPath == '/transact') {
        let uid = url.searchParams.get('uid');
        let productId = url.searchParams.get('pid');
        // TODO check if ids exist and respond 412 if not
        //let result = SELECT price, url FROM ProductDatabase WHERE product_id = 'productId'
        //let price, url = result[0]
        //let result = SELECT balance FROM UserDatabase WHERE uid = 'uid'
        //let balance = result[0]
        //if balance >= price {
        //    UPDATE UserDatabase SET balance = balance - price WHERE uid = 'uid'
        //    response.writeHead(200, {'Content-Type': 'text/plain'});
        //    response.end(url, 'utf-8');
        //}
        //else {
        //    response.writeHead(422)
        //    response.end();
        //}
    }
    else if (subPath == '/generate') {
        let str = url.searchParams.get('id') || Date.now().toString();
        let uid = uuidv5(str, uuidNamespace).slice(20);
        // INSERT INTO UserDatabase VALUES (uid, 0)
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end(uid, 'utf-8');
    }
    else {
        response.writeHead(404);
        response.end('Resource not found.\n');
    }
}).listen(port);
console.log(`Server running on ${port}`);