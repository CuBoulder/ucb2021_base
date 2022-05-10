(function() {
    // get the url from the data-jsonapi variable 
    let el = document.getElementById('ucb-article-listing');
    let JSONURL = "NOTHING TO SEE HERE"; 
    if(el) {
        JSONURL = el.dataset.jsonapi;
    }

    // alert('coming soon! : ' + JSONURL);

    if(JSONURL) {
        fetch(JSONURL)
            .then(reponse => reponse.json())
            .then(data => console.log(data));
    }

})();