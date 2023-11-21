
const loginForm = document.getElementById('login-form');
const loginButton = document.getElementById('login-form-submit');
const grid = jQuery('#grid');

const url = new URL(window.location);
var uuid = url.searchParams.get('uuid');
console.log(uuid);


function setUser(user) {
	console.log(user);
	if (user != null) {
		loginForm.remove();
		jQuery('#login-header').text('Logged in as ' + user.username);
		jQuery('#points-display').text(user.balance);
	}
	else {
		url.searchParams.delete('uuid');
		location.href = url;
	}
}

function login(user) {
	if (user != null) {
		alert('You have successfully logged in.');
		url.searchParams.set('uuid', user.uuid);
		location.href = url;
	}
	else {
		alert('Incorrect uuid, please try again.');
	}
}

function lookupUuid(uuid, func) {
	fetch('http://127.0.0.1:3000/lookup?uuid=' + uuid)
	.then(response => {
		if (response.status == 200) return response.json();
		return null;
	})
	.then(user => {
		func(user)
    });
}


fetch('http://127.0.0.1:3000/data.json').then(response => {return response.json()}).then(products => {
	products.forEach(product => {
		grid.append(`<div class="preview"> <h2>${product.name}</h2> <img src=${product.image}> <div class="price-tag">${product.price}</div></div>`);
	});
});

if (uuid !== null) {
	lookupUuid(uuid, setUser);
}

loginButton.addEventListener('click', (e) => {
    e.preventDefault();

    lookupUuid(loginForm.uuid.value, login)
});
