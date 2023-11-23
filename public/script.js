const loginForm = document.getElementById('login-form');
const productPopup = document.getElementById('product-popup');
const productImage = document.getElementById('product-image');
const productName = document.getElementById('product-name');
const productDescription = document.getElementById('product-description');
const productPrice = document.getElementById('product-price');
const accountPopup = document.getElementById('account-popup');
const loginBody = document.getElementById('login');
const registerBody = document.getElementById('register');
const loginMessage = document.getElementById('login-message');
const registerMessage = document.getElementById('register-message');
const grid = jQuery('#grid');

const url = new URL(window.location);
var uid = url.searchParams.get('uid');
console.log(uid);


function setUser(user) {
	console.log(user);
	if (user != null) {
		document.getElementById('header-buttons').remove();
		document.getElementById('credits-display').style.display = 'inline-block';
		jQuery('#login-header').text('Logged in as ' + user.username);
		jQuery('#points').text(user.balance);
	}
	else {
		url.searchParams.delete('uid');
		location.href = url;
	}
}

function login(user) {
	if (user != null) {
		jQuery('body').css('cursor', 'progress');
		loginMessage.innerHTML = 'You have successfully logged in.';
		setTimeout(() => {
			url.searchParams.set('uid', user.uid);
			location.href = url;
		}, 1500);	
	}
	else {
		loginMessage.innerHTML = 'Incorrect uid, please try again.';
	}
}

function lookupUid(uid, func) {
	fetch(url.origin + '/lookup?uid=' + uid)
	.then(response => {
		if (response.status == 200) return response.json();
		return null;
	})
	.then(user => {
		func(user)
    });
}


fetch(url.origin + '/data.json').then(response => {return response.json()}).then(products => {
	products.forEach(product => {
		let productDiv = jQuery(`<div class="preview"> <h2>${product.name}</h2> <img src=${product.image}> <div class="price-tag">${product.price}</div></div>`);
		productDiv.bind('click', (e) => {
			productImage.src = product.image;
			productName.innerHTML = product.name;
			productDescription.innerHTML = product.description;
			productPrice.innerHTML = `Get (${product.price})`;
			productPopup.style.display = 'block';
		});
		grid.append(productDiv);
	});
});

if (uid !== null) {
	lookupUid(uid, setUser);
}

Array.from(document.getElementsByClassName('close-button')).forEach(button => {
	button.addEventListener('click', (e) => {
		button.parentNode.style.display = 'none';
	});
});

document.getElementById('login-button').addEventListener('click', (e) => {
	registerBody.style.display = 'none';
	loginBody.style.display = 'block';
    accountPopup.style.display = 'block';
});

document.getElementById('register-button').addEventListener('click', (e) => {
	loginBody.style.display = 'none';
	registerBody.style.display = 'block';
    accountPopup.style.display = 'block';
});

document.getElementById('login-submit').addEventListener('click', (e) => {
	loginMessage.innerHTML = '&ZeroWidthSpace;';
    lookupUid(loginForm.uid.value, login);
});

document.getElementById('register-submit').addEventListener('click', (e) => {
    fetch(url.origin + '/generate')
	.then(response => {
		if (response.status == 200) return response.text();
		registerMessage.innerHTML = 'Something went wrong, please try again later.';
		return null;
	})
	.then(uid => {
		registerMessage.innerHTML = 'Your uid is ' + uid + '. Do not lose this.';
		loginForm.uid.value = uid;
    });
});
