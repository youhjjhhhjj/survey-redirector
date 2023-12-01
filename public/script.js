const loginField = jQuery('#login-field');
const registerField = jQuery('#register-field');
const productPopup = jQuery('#product-popup');
const productImage = jQuery('#product-image');
const productName = jQuery('#product-name');
const productDescription = jQuery('#product-description');
const productPrice = jQuery('#product-price');
const accountPopup = jQuery('#account-popup');
const loginBody = jQuery('#login');
const registerBody = jQuery('#register');
const loginMessage = jQuery('#login-message');
const registerMessage = jQuery('#register-message');
const pointsCounter = jQuery('#points');
const infoPopup = jQuery('#info-popup');
const whatBody = jQuery('#what');
const howBody = jQuery('#how');
const grid = jQuery('#grid');

const url = new URL(window.location);
var uid = url.searchParams.get('uid');
console.log(uid);
var pid = null;

var pollfishConfig = {
  api_key: "194e119c-3d7d-496f-8c27-9dba816c5c62",
  user_id: uid,
  request_uuid: uid,
  closeAndNoShowCallback: () => Pollfish.showIndicator(),
  surveyCompletedCallback: surveyCompletedCallback,
  userNotEligibleCallback: () => Pollfish.restart(pollfishConfig),
  debug: true
  // ...,
};

function setUser(user) {
    console.log(user);
    if (user != null) {
        jQuery('#header-buttons').remove();
        jQuery('#credits-display').css({display: 'inline-block'});
        jQuery('#login-header').text('Logged in as ' + user.username);
        pointsCounter.text(user.balance);
		jQuery.getScript('https://storage.googleapis.com/pollfish_production/sdk/webplugin/pollfish.min.js', () => {
			console.log('Loaded Pollfish');
		});
    }
    else {
        url.searchParams.delete('uid');
        location.href = url;
    }
}

function login(user) {
    if (user != null) {
        loginMessage.text('You have successfully logged in.');
        setTimeout(() => {
            url.searchParams.set('uid', user.uid);
            location.href = url;
        }, 1500);	
    }
    else {
        loginMessage.text('Incorrect uid, please try again.');
    }
}

function lookupUid(uid, func) {
    fetch(url.origin + '/lookup?uid=' + uid)
        .then(response => {
            if (response.status == 200) return response.json();
            return null;
        })
        .then(user => {
            func(user);
        });
}

function surveyCompletedCallback() {
	console.log('Survey completed');
	alert('Survey completed, points should update in a few seconds.');
	Pollfish.restart(pollfishConfig);
	setTimeout(() => {
		lookupUid(uid, (user) => pointsCounter.text(user.balance));
	}, 3000);	
}

function hidePopups() {
	productPopup.css({display: 'none'});
	accountPopup.css({display: 'none'});
	infoPopup.css({display: 'none'});
}


fetch(url.origin + '/data.json').then(response => {return response.json();}).then(products => {
    products.forEach(product => {
        let productDiv = jQuery(`<div class="preview"> <h2>${product.name}</h2> <img src=${product.image}> <div class="price-tag">${product.price}</div></div>`);
        productDiv.bind('click', () => {
            pid = product.id;
            productImage.attr('src', product.image);
            productName.text(product.name);
            productDescription.text(product.description);
            productPrice.text(`Get (${product.price})`);
			hidePopups();
            productPopup.css({display: 'block'});
        });
        grid.append(productDiv);
    });
});

if (uid !== null) {
    lookupUid(uid, setUser);
}

jQuery('.close-button').each((i, button) => {
	button.addEventListener('click', () => {
        button.parentNode.style.display = 'none';
    });
});

jQuery('#login-button').on('click', () => {
	hidePopups();
    registerBody.css({display: 'none'});
    loginBody.css({display: 'block'});
    accountPopup.css({display: 'block'});
});

jQuery('#register-button').on('click', () => {
	hidePopups();
    loginBody.css({display: 'none'});
    registerBody.css({display: 'block'});
    accountPopup.css({display: 'block'});
});

jQuery('#login-submit').on('click', () => {
    loginMessage.html('&ZeroWidthSpace;');
	let loginFieldValue = loginField.val();
    if (!/[0-9a-f]{4}-[0-9a-f]{12}/.test(loginFieldValue)) {
        loginMessage.text('Invalid uid.');
        return;
    }
    lookupUid(loginFieldValue, login);
});

jQuery('#register-submit').on('click', (e) => {
	let registerFieldValue = registerField.val();
    if (registerFieldValue < 2 || registerFieldValue > 32) {
        registerMessage.text('Username must be between 2 and 32 characters.');
        return;
    }
	jQuery(e.target).off();
    fetch(`${url.origin}/generate?username=${registerFieldValue}`)
        .then(response => {
            if (response.status == 200) return response.text();
            registerMessage.text('Something went wrong, please try again later.');
            return null;
        })
        .then(newUid => {
            if (newUid === null) return;
            registerMessage.text('Your uid is ' + newUid + '. Do not lose this.');
            loginField.val(newUid);
        });
});

jQuery('#what-button').on('click', () => {
	hidePopups();
    howBody.css({display: 'none'});
    whatBody.css({display: 'block'});
    infoPopup.css({display: 'block'});
});

jQuery('#how-button').on('click', () => {
	hidePopups();
    whatBody.css({display: 'none'});
    howBody.css({display: 'block'});
    infoPopup.css({display: 'block'});
});

productPrice.on('click', () => {
    if (!uid) {
        alert('You must be logged in for this.');
        return;
    }
    fetch(`${url.origin}/transact?uid=${uid}&pid=${pid}`)
        .then(response => {
            if (response.status == 200) return response.text();
            else if (response.status == 422) {
                alert('You do not have enough points for this.');
                return null;
            }
            console.log(response.status, response.body);
            alert('Something went wrong, contact staff for assistance.');
            return null;
        })
        .then(productUrl => {
            if (productUrl === null) return;
			lookupUid(uid, (user) => pointsCounter.text(user.balance));
            console.log(productUrl);
            window.open(productUrl, '_blank');
        });
});
