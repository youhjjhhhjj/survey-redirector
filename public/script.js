
const loginForm = document.getElementById('login-form');
const loginButton = document.getElementById('login-form-submit');
const grid = jQuery('#grid');

const url = new URL(window.location);
var uuid = url.searchParams.get('uuid');
console.log(uuid);

const databaseUuid = new Map();
databaseUuid.set('user', 400);

fetch('http://127.0.0.1:3000/data.json').then(data => {
    data.json().then(products => {
        products.forEach(product => {
            grid.append(`<div class="preview"> <h2>${product.name}</h2> <img src=${product.image}> <div class="price-tag">${product.price}</div></div>`);
        });
    });
});

if (databaseUuid.has(uuid)) {
    loginForm.remove();
    jQuery('#login-header').text('Logged in as ' + uuid);
    jQuery('#points-display').text(databaseUuid.get(uuid));
} else if (uuid !== null) {
    url.searchParams.delete('uuid');
    location.href = url;
}

loginButton.addEventListener('click', (e) => {
    e.preventDefault();
    uuid = loginForm.uuid.value;

    if (databaseUuid.has(uuid)) {
        alert('You have successfully logged in.');
        url.searchParams.set('uuid', uuid);
        location.href = url;
    } else {
        alert('Incorrect uuid, please try again.');
    }
});
