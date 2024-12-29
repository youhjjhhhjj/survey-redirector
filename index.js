const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const {v5: uuidv5} = require('uuid');
const pg = require('pg');

const PORT = process.env.PORT || 6969;
const UUID = process.env.UUID || require('./secrets/uuid.json');
const DATABASE_URL = process.env.DATABASE_URL || require('./secrets/database-url.json');
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || require('./secrets/password-hash.json');
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
    '.ico': 'image/x-icon',
    '.zip': 'application/zip',
};
const staticPaths = new Set([
    '/',
    '/style.css',
    '/script.js',
    '/privacy-policy.html',
    '/admin',
    '/admin/script.js',
]);

class Download {
    constructor(id, name, children=[]) {
        this.id = id;
        this.name = name;
        this.children = children;
    }
}

// CREATE TABLE Users ( id CHAR(17) PRIMARY KEY, username VARCHAR(63) NOT NULL, balance INTEGER NOT NULL DEFAULT 0 );
// CREATE TABLE Transactions ( id SERIAL PRIMARY KEY, transaction_time TIMESTAMP NOT NULL, amount INTEGER NOT NULL, user_id CHAR(17) NOT NULL REFERENCES Users, product_id SMALLINT );
const pgClient = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
//pgClient.connect().then(() => console.log('Database connection established')).catch(() => console.log('Database connection failed'));

const registerTimeouts = new Set();
const transactionIds = new Set();

var products;
var productUrls;
setProducts();

var downloadNames;  // id to name
var downloads;  // name to object
setDownloads();

/**
 * 
 * @param {String} str the string to split
 * @param {String} sep the string to split on
 * @param {Boolean} includeSep whether to include the separator in the first returned value
 * @param {Boolean} ignoreEndSep whether to ignore the last separator if found at the end of the string
 * @returns the string split once at the last occurence of the separator
 */
function split(str, sep, includeSep=false, ignoreEndSep=true) {
    splitIndex = str.lastIndexOf(sep);
    if (ignoreEndSep && splitIndex + sep.length == str.length) splitIndex = str.slice(0, -sep.length).lastIndexOf(sep);
    if (splitIndex == -1) return [null, str];
    return [str.substring(0, splitIndex + includeSep * sep.length), str.substring(splitIndex + sep.length, str.length)];
}

async function setProducts() {
    products = [];
    productUrls = [];
    fs.promises.readFile('./secrets/products.json', 'utf-8').then(productData => {
        JSON.parse(productData).forEach((product, i) => {
            productUrls.push(product.url);
            product.id = i + 1;
            delete product.url;
            products.push(product);
        });
        console.log(`Loaded ${products.length} products`);
    });
}

async function setDownloads() {
    downloadNames = {};
    downloads = {};
    fs.promises.readFile('./downloads/downloads.tsv', 'utf-8').then(downloadData => {
        let loadedDownloads = 0;
        for (const download of downloadData.split(/\r?\n/)) {
            if (download !== '') {
                let [id, fileName] = split(download, '\t');
                if (fs.existsSync('downloads/' + fileName)) {
                    downloadNames[id] = fileName;
                    let downloadObject = new Download(id, fileName);
                    downloads[fileName] = downloadObject;
                    // add to parent
                    let parent = split(fileName, '/', true)[0];
                    if (parent !== null) {
                        downloads[parent].children.push(downloadObject);
                    }
                    loadedDownloads++;
                }
                else {
                    console.log(`Error loading ${id}: ${fileName}`);
                }
            }
        }
        console.log(`Loaded ${loadedDownloads} downloads`);
    });
}

function loadFile(filePath) {
    try {
        let content = fs.promises.readFile(filePath);
        return content;
    }
    catch(err) {
        console.error('Error on serving ' + filePath);
        return null;
    }
}

async function sendFile(response, filePath, fileExt, fileName = null) {
    let content = await loadFile(filePath);
    if (content === null) {
        response.writeHead(500);
        response.end('An unexpected error was encountered.');
        return;
    }
    else {
        let contentType = MIME_TYPES[fileExt] || 'application/octet-stream';
        let responseHeaders = {'Content-Type': contentType};
        if (fileName !== null) responseHeaders['Content-Disposition'] = `attachment;filename=${fileName}`;
        response.writeHead(200, responseHeaders);
        response.end(content, 'utf-8');
        return;
    }
}

function authenticateRequest(request, response) {
    if (request.headers.authorization && uuidv5(request.headers.authorization, UUID) == ADMIN_PASSWORD_HASH) return true;
    console.log('Authentication failure');
    response.writeHead(401);
    response.end();
    return false;
}

function downloadDFS(download, arr=[], root=true) {
    if (!root) arr.push(download);
    for (child of download.children) downloadDFS(child, arr, false);
    return arr;
}

function generateDownloadPage(download) {
    contents = "";
    for (const ancestor of downloadDFS(download)) {
        contents += `<a class="download-link" href="download?id=${ancestor.id}">${ancestor.name}</a><br>\n`
    };
    return `<!DOCTYPE html>
<html lang="en">

  <head>
    <title>Download</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Raleway">
    <link rel="stylesheet" href="../style.css">
    <link rel="icon" type="image/x-icon" href="https://cdn.discordapp.com/emojis/801499706625622046.webp?quality=lossless">
  </head>

  <body>
    <div id="grid" style="display: block; text-align: center;">
      <h1>Download Links for ${download.name}</h1><br>
      ${contents}
    </div>
  </body>

</html>`;
}

function validateMethod(method, request, response) {
    if (request.method != method) {
        response.writeHead(405);
        response.end();
        return false;
    }
    return true;
}

http.createServer(async function (request, response) {
    let url = new URL('http://' + request.headers.host + request.url);
    let subPath = url.pathname;
    console.log(`(${new Date().toISOString()}) request: ${request.url}`);

    if (staticPaths.has(subPath)) {
        if (!validateMethod('GET', request, response)) return;
        if (subPath == '/') subPath = '/index.html';
        else if (subPath == '/admin') subPath = '/admin/index.html';
        sendFile(response, 'public' + subPath, path.extname(subPath).toLowerCase());
        return;
    }
    else if (subPath == '/products.json') {
        if (!validateMethod('GET', request, response)) return;
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify(products), 'utf-8');
        return;
    }
    else if (subPath == '/downloads.json') {
        if (!validateMethod('GET', request, response)) return;
        if (!authenticateRequest(request, response)) return;
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify(downloadNames), 'utf-8');
        return;
    }
    else if (subPath == '/lookup') {
        if (!validateMethod('GET', request, response)) return;
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
        if (uid === undefined || uid === 'null' || !pid || isNaN(pid) || parseInt(pid) > products.length) {
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
        let ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress;
        if (registerTimeouts.has(ip)) {
            response.writeHead(429);
            response.end('Try again later.');
            return;
        }
        let username = url.searchParams.get('username');
        let str = username;
        if (url.searchParams.get('uuid') !== UUID) str = `${username} ${ip}`;
        console.log('Registration request as ' + str);
        registerTimeouts.add(ip);
        setTimeout(() => registerTimeouts.delete(ip), 1000 * 60 * 10);
        let uid = uuidv5(str, UUID).slice(19);
        pgClient.query('INSERT INTO Users ( id, username ) VALUES ( $1, $2 ) ON CONFLICT DO NOTHING;', [uid, username]).catch(err => {
            console.error(err.stack);
            response.writeHead(500);
            response.end('An unexpected error was encountered.');
            return;
        });
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end(uid, 'utf-8');
        return;
    }
    else if (subPath == '/survey') {
        let uid = url.searchParams.get('uid');
        let transactionId = url.searchParams.get('txid');
        let points = url.searchParams.get('val');
        let signature = url.searchParams.get('hash');
        console.log('Received callback: ', uid, transactionId, points, signature);
        if (transactionIds.has(transactionId)) {
            response.writeHead(409);
            response.end('This transaction was already received.');
            return;
        }
        transactionIds.add(transactionId);
        // TODO check signature
        pgClient.query('INSERT INTO Transactions ( transaction_time, amount, user_id ) VALUES ( $1, $2, $3 );', [new Date().toISOString(), points, uid]);
        pgClient.query('UPDATE Users SET balance = balance + $1 WHERE id = $2;', [points, uid]);
        response.writeHead(204);
        response.end();
    }
    else if (subPath == '/download') {
        if (!validateMethod('GET', request, response)) return;
        let id = url.searchParams.get('id');
        if (id in downloadNames) {
            let fileName = downloadNames[id];
            let download = downloads[fileName];
            if (download.children.length > 0) {
                response.writeHead(200, {'Content-Type': 'text/html'});
                response.end(generateDownloadPage(download));
                return;
            }
            sendFile(response, 'downloads/' + fileName, path.extname(fileName), split(fileName, '/')[1]);
            let ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress;
            fs.appendFile('downloads.log', `${new Date().toISOString()}\t${ip}\t${id}\t${fileName}\n`, () => console.log(`Served ${fileName}`));
            return;
        }
        else {
            // timeout on purpose
            // response.writeHead(404);
            // response.end('No file with this id.');
            return;
        }
    }
    // TODO add link
    else if (subPath == '/add-product') {  // TODO implement json body
        if (!validateMethod('POST', request, response)) return;
        if (!authenticateRequest(request, response)) return;
        let name = url.searchParams.get('name');
        let image = url.searchParams.get('image');
        let price = url.searchParams.get('price');
        let desc = url.searchParams.get('desc');
        fs.promises.readFile('./secrets/products.json', 'utf-8').then(productData => {
            let productsArray = JSON.parse(productData);
            let product = {
                'name': name,
                'description': desc,
                'price': price,
                'image': image,
            };
            productsArray.push(product);
            fs.promises.writeFile('./secrets/products.json', JSON.stringify(productsArray, null, '\t')).then(() => {
                product.id = products.length + 1;
                products.push(product);
            });
            console.log(`Added product ${name}`);
            response.writeHead(200);
            response.end(`${products.length + 2}`);
            return;
        }).catch(err => {
            console.error(err.stack);
            response.writeHead(500);
            response.end('An unexpected error was encountered.');
            return;
        });
    }
    else if (subPath == '/add-download') {  // TODO implement json body
        if (!validateMethod('POST', request, response)) return;
        if (!authenticateRequest(request, response)) return;
        let fileName = url.searchParams.get('filename');
        let fileUrl = url.searchParams.get('url');
        let fileUuid = uuidv5(fileUrl, UUID);

        // create folders
        let pathComponents = fileName.split('/');
        let relPath = '';
        let fullPath;
        for (let i = 0; i < pathComponents.length; i++) {
            relPath += pathComponents[i];
            fullPath = path.join(path.basename('./downloads'), relPath);
            if (i === pathComponents.length - 1) break;
            relPath += '/';
            if (!fs.existsSync(fullPath)) {
                fs.mkdir(fullPath, (e) => {
                    if (e) console.error(e.stack);
                });
                let dirUuid = uuidv5(relPath, UUID);
                fs.appendFile('./downloads/downloads.tsv', `\n${dirUuid}\t${relPath}`, (e) => {
                    if (e) console.error(e.stack);
                });
            }
        }

        // download file
        console.log(fullPath);
        let downloadFileStream = fs.createWriteStream(fullPath);
        https.get(fileUrl, (downloadFile) => {
            downloadFile.pipe(downloadFileStream);
            downloadFileStream.on('finish', () => {
                downloadFileStream.close();
                fs.appendFile('./downloads/downloads.tsv', `\n${fileUuid}\t${fileName}`, (e) => {
                    if (e) console.error(e.stack);
                    else {
                        setDownloads();
                        response.writeHead(200);
                        response.end(fileUuid);
                        return;
                    }
                });
            });
        }).on('error', function(err) {
            console.error(err.stack);
            response.writeHead(500);
            response.end('An unexpected error was encountered.');
            return;
        });
    }
    else if (subPath == '/refresh') {
        if (!validateMethod('POST', request, response)) return;
        if (!authenticateRequest(request, response)) return;

        Promise.all([setProducts(), setDownloads()]).then(() => response.writeHead(200)).catch(() => response.writeHead(500));
        response.end();
    }
}).listen(PORT);
console.log(`Server running on ${PORT}`);
