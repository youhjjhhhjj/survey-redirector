const productsDiv = jQuery('#products-list');
const downloadsDiv = jQuery('#downloads-list');

const url = new URL(window.location);

const passwordHeader = {headers: {Authorization: prompt('Enter the admin password')}};

function fetchProducts() {
    productsDiv.empty();
    // fetch list of products
    fetch(url.origin + '/products.json').then(response => {
        if (response.status != 200) return alert('Something went wrong');
        response.json().then(products => {
            products.findLast(product => {
                let productDiv = jQuery(`<p>${product.id} ${product.name}</p>`);
                productsDiv.append(productDiv);
            });
        });
    });
}

function fetchDownloads() {
    downloadsDiv.empty();
    // fetch list of downloads
    fetch(url.origin + '/downloads.json', passwordHeader).then(response => {
        if (response.status == 401) return alert('Failed to authenticate');
        if (response.status != 200) return alert('Something went wrong');
        response.json().then(downloads => {
            for (const [id, filename] of Object.entries(downloads)) {
                let downloadDiv = jQuery(`<p>${id} <a href="${url.origin}/download?id=${id}">${filename}</a></p>`);
                downloadsDiv.append(downloadDiv);
            }
        });
    });
}

fetchProducts();
fetchDownloads();

jQuery('#products-form').submit(function(e) {
    e.preventDefault();
    fetch(`${url.origin}/add-product?${jQuery(this).serialize()}`, passwordHeader).then(response => {
        if (response.status == 401) return alert('Failed to authenticate');
        if (response.status != 200) return alert('Something went wrong');
        response.text().then(productId => {
            console.log(productId);
            alert(`Successfully added product with id ${productId}`);
            fetchProducts();
        });
    });
});

jQuery('#downloads-form').submit(function(e) {
    e.preventDefault();
    fetch(`${url.origin}/add-download?${jQuery(this).serialize()}`, passwordHeader).then(response => {
        if (response.status == 401) return alert('Failed to authenticate');
        if (response.status != 200) return alert('Something went wrong');
        response.text().then(uuid => {
            console.log(uuid);
            alert(`Successfully added download with id ${uuid}`);
            fetchDownloads();
        });
    });
});

jQuery('#refresh-local-button').click(function(e) {
    fetchProducts();
    fetchDownloads();
    alert('Refreshed local');
});

jQuery('#refresh-full-button').click(function(e) {
    fetch(`${url.origin}/refresh`, passwordHeader).then(response => {
        if (response.status == 401) return alert('Failed to authenticate');
        if (response.status != 200) return alert('Something went wrong');
        fetchProducts();
        fetchDownloads();
        alert('Refreshed server and local');
    });
});
