
const loginForm = document.getElementById('login-form');
const loginButton = document.getElementById('login-form-submit');
const grid = jQuery('#grid');

const url = new URL(window.location);
var uuid = url.searchParams.get('uuid');
console.log(uuid);

const databaseUuid = new Map();
databaseUuid.set('user', 400);

class Link {
	constructor(name, description, price, image, link) {
		this.name = name;
		this.description = description;
		this.price = price;
		this.image = image;
		this.link = link;
	}
}
const databaseLinks = [
	new Link('Option 1', 'the description for option 1', 200, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
	new Link('Option 2', 'the description for option 2', 250, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
	new Link('Option 3', 'the description for option 3', 250, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
	new Link('Option 4', 'the description for option 4', 175, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
	new Link('Option 5', 'the description for option 5', 200, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
	new Link('Option 6', 'the description for option 6', 300, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
	new Link('Option 7', 'the description for option 7', 250, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
	new Link('Option 8', 'the description for option 8', 225, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
	new Link('Option 9', 'the description for option 8', 225, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
	new Link('Option 10', 'the description for option 8', 225, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
	new Link('Option 11', 'the description for option 8', 225, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
	new Link('Option 12', 'the description for option 8', 225, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
	new Link('Option 13', 'the description for option 8', 999, 'https://www.w3schools.com/w3images/nature.jpg', 'google.com'),
];

databaseLinks.forEach(link => {
	grid.append(`<div class="preview"> <h2>${link.name}</h2> <img src=${link.image}> <div class="price-tag">${link.price}</div></div>`);
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
