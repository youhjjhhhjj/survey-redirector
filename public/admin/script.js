const productsDiv = jQuery('#products');
const downloadsDiv = jQuery('#downloads');

const url = new URL(window.location);

// const password = prompt('Enter the admin password');

// fetch list of products
fetch(url.origin + '/products.json').then(response => {return response.json();}).then(products => {
    products.findLast(product => {
        let productDiv = jQuery(`<p>${product.id} ${product.name}</p>`);
        productsDiv.append(productDiv);
    });
});

// fetch list of downloads
fetch(url.origin + '/downloads.json').then(response => {return response.json();}).then(downloads => {
    for (const [id, filename] of Object.entries(downloads)) {
        let downloadDiv = jQuery(`<p>${id} <a href="${url.origin}/download?id=${id}">${filename}</a></p>`);
        downloadsDiv.append(downloadDiv);
    }
}); // TODO authenticate

jQuery('#products-form').submit(function(e) {
    e.preventDefault();
    console.log(jQuery(this).serialize());
    fetch(`${url.origin}/add-product?${jQuery(this).serialize()}`).then(response => {
        if (response.status != 200) return;
        response.text().then(productId => {
            console.log(productId);
        });
    });
});

jQuery('#downloads-form').submit(function(e) {
    e.preventDefault();
    console.log(jQuery(this).serialize());
    fetch(`${url.origin}/add-download?${jQuery(this).serialize()}`).then(response => {
        if (response.status != 200) return;
        response.text().then(uuid => {
            console.log(uuid);
        });
    });
});
