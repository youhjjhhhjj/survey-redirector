const http = require('http');
const fs = require('fs');
const path = require('path');
const {v5: uuidv5} = require('uuid');
const pg = require('pg');

const PORT = process.env.PORT || 3000;
const UUID = process.env.UUID || require('./secrets/uuid.json');
const DATABASE_URL = process.env.DATABASE_URL || require('./secrets/database-url.json');
const MIME_TYPES = {
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
    '.ico' : 'image/x-icon',
};

const staticPaths = new Set(['/', '/style.css', '/script.js']);

// CREATE TABLE Users ( id CHAR(17) PRIMARY KEY, username VARCHAR(63) NOT NULL, balance INTEGER NOT NULL DEFAULT 0 );
// CREATE TABLE Transactions ( id SERIAL PRIMARY KEY, transaction_time TIMESTAMP NOT NULL, amount INTEGER NOT NULL, user_id CHAR(17) NOT NULL REFERENCES Users, product_id SMALLINT );
const pgClient = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
pgClient.connect().then(() => console.log('Database connection established'));

class Product {
    constructor(id, name, description, price, image) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.image = image;
    }
}
const products = [
    new Product(1, 'Option 1', 'the description for option 1', 200, 'https://www.w3schools.com/w3images/nature.jpg'),
    new Product(2, 'Option 2', 'the description for option 2', 250, 'https://www.w3schools.com/w3images/nature.jpg'),
    new Product(3, 'Option 3', 'the description for option 3', 250, 'https://www.w3schools.com/w3images/nature.jpg'),
    new Product(4, 'Option 4', 'the description for option 4', 175, 'https://www.w3schools.com/w3images/nature.jpg'),
    new Product(5, 'Option 5', 'the description for option 5', 200, 'https://www.w3schools.com/w3images/nature.jpg'),
    new Product(6, 'Option 6', 'the description for option 6', 300, 'https://www.w3schools.com/w3images/nature.jpg'),
    new Product(7, 'Option 7', 'the description for option 7', 250, 'https://www.w3schools.com/w3images/nature.jpg'),
    new Product(8, 'Option 8', 'the description for option 8', 225, 'https://www.w3schools.com/w3images/nature.jpg'),
    new Product(9, 'Option 9', 'the description for option 9', 275, 'https://www.w3schools.com/w3images/nature.jpg'),
    new Product(10, 'Option 10', 'the description for option 10', 200, 'https://www.w3schools.com/w3images/nature.jpg'),
    new Product(11, 'Option 11', 'the description for option 11', 325, 'https://www.w3schools.com/w3images/nature.jpg'),
    new Product(12, 'Option 12', 'the description for option 12', 150, 'https://www.w3schools.com/w3images/nature.jpg'),
    new Product(13, 'Option 13', 'the description for option 13', 250, 'https://www.w3schools.com/w3images/nature.jpg'),
];
const productUrls = [
    'https://google.com',
    'https://google.com',
    'https://google.com',
    'https://google.com',
    'https://google.com',
    'https://google.com',
    'https://google.com',
    'https://google.com',
    'https://google.com',
    'https://google.com',
    'https://google.com',
    'https://google.com',
    'https://google.com',
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

http.createServer(async function (request, response) {
    let url = new URL('http://' + request.headers.host + request.url);
    let subPath = url.pathname;
    console.log(`(${new Date().toISOString()}) request: ${subPath}`);

    if (staticPaths.has(subPath)) {
        if (subPath == '/') subPath = '/index.html';
        let content = await loadFile('public' + subPath);
        if (content === null) {
            response.writeHead(500);
            response.end('An unexpected error was encountered.');
            return;
        }
        else {
            let extname = String(path.extname(subPath)).toLowerCase();
            let contentType = MIME_TYPES[extname] || 'application/octet-stream';
            response.writeHead(200, {'Content-Type': contentType});
            response.end(content, 'utf-8');        
            return;    
        }
    }
    else if (subPath == '/data.json') {
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify(products), 'utf-8');
        return;
    }
    else if (subPath == '/lookup') {
        let uid = url.searchParams.get('uid');
        pgClient.query('SELECT * FROM Users WHERE id = $1;', [uid]).then(data => {
            if (data.rowCount == 0) {
                response.writeHead(404);
                response.end('uid not found.');
                return;
            }
            let user = data.rows[0];
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.end(JSON.stringify({
                uid: user.id,
                username: user.username,
                balance: user.balance
            }), 'utf-8');
            return;
        }).catch(err => {
            console.error(err.stack);
            response.writeHead(500);
            response.end('An unexpected error was encountered.');
            return;
        });
    }
    else if (subPath == '/transact') {
        let uid = url.searchParams.get('uid');
        let pid = url.searchParams.get('pid');
        if (uid === undefined || uid === 'null' || !pid || isNaN(pid) || parseInt(pid) >= products.length) {
            response.writeHead(412);
            response.end('The user id or product id is not valid.');
            return;
        }
        let product = products[parseInt(pid) - 1];
        pgClient.query('SELECT balance FROM Users WHERE id = $1;', [uid]).then(data => {
            let balance = data.rows[0].balance;
            if (balance < product.price) {
                response.writeHead(422);
                response.end('Insufficient balance for this product.');
                return;
            }
            pgClient.query('INSERT INTO Transactions ( transaction_time, amount, user_id, product_id ) VALUES ( $1, $2, $3, $4 );', [new Date().toISOString(), -product.price, uid, pid]);
            pgClient.query('UPDATE Users SET balance = $1 WHERE id = $2;', [balance - product.price, uid]);
            response.writeHead(200, {'Content-Type': 'text/plain'});
            response.end(productUrls[parseInt(pid) - 1], 'utf-8');
        }).catch(err => {
            console.error(err.stack);
            response.writeHead(500);
            response.end('An unexpected error was encountered.');
            return;
        });
    }
    else if (subPath == '/generate') {
        let str = Date.now().toString();
        let username = url.searchParams.get('username');
        if (url.searchParams.get('uuid') === UUID) str = username;
        let uid = uuidv5(str, UUID).slice(19);
        pgClient.query('INSERT INTO Users ( id, username ) VALUES ( $1, $2 );', [uid, username]).catch(err => {
            console.error(err.stack);
            response.writeHead(500);
            response.end('An unexpected error was encountered.');
            return;
        });
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end(uid, 'utf-8');
        return;
    }
    else {
        response.writeHead(404);
        response.end('Resource not found.');
        return;
    }
}).listen(PORT);
console.log(`Server running on ${PORT}`);