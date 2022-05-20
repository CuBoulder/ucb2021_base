async function getArticleParagraph(id){
    return await fetch(`/jsonapi/paragraph/article_content/${id}?include[paragraph--article_content]=field_article_image,field_article_text&include=field_article_image.field_media_image&fields[file--file]=uri,url`)
}

function intersect(a, b) {
    var setB = new Set(b);
    return [...new Set(a)].filter(x => setB.has(x));
}

function renderArticleList(JSONURL,id='ucb-article-listing',ExcludeCategories='',ExcludeTags=''){
    if(JSONURL) {
        let el = document.getElementById(id);

        el.innerHTML = `<i class="fas fa-spinner fa-pulse"></i> Loading please wait`

        fetch(JSONURL)
            .then(reponse => reponse.json())
            .then(data => {
                console.log("data obj",data)

                // if no articles of returned, give an error message and kick out 
                if(data.data.length==0){
                    el.innerText = "<h3>No articles were returned -- please check your filters for conflicts and try again</h3>";
                    return
                }

                // Below objects are needed to match images with their corresponding articles. There are two endpoints => data.data (article) and data.included (incl. media), both needed to associate a media library image with its respective article
                let urlObj = {};
                let idObj = {};
                // Remove any blanks from our articles before map
                if(data.included ) {
                    let filteredData = data.included.filter((url)=> {
                        return url.attributes.uri !== undefined
                    })

                    // creates the urlObj, key: data id, value: url
                    filteredData.map((pair)=> {
                        urlObj[pair.id] = pair.attributes.uri.url
                    })

                    // removes all other included data besides images in our included media
                    let idFilterData = data.included.filter((item)=> {
                        return item.type == "media--image"
                    })

                    // using the image-only data, creates the idObj =>  key: thumbnail id, value : data id
                    idFilterData.map((pair)=> {
                        idObj[pair.id] = pair.relationships.thumbnail.data.id
                    })
                }

                //iterate over each item in the array
                data.data.map((item)=> {
                    //create container for elements
                    let elDiv = document.createElement("div")
                    document.getElementById('block-ucb2021-base-content').appendChild(elDiv)
                    //create article content elements
                    let contentDiv = document.createElement("article")
                    let contentImg = document.createElement("img")
                    let imgLink = document.createElement("a")
                    let contentDate = document.createElement("p")
                    let contentHead = document.createElement("a")
                    let contentBody = document.createElement("p")
                    let contentLink = document.createElement("a")
                    
                    // **ADD DATA**
                    // this is my id of the article body paragraph type we need only if no thumbnail or summary provided
                    let bodyAndImageId = item.relationships.field_ucb_article_content.data[0].id
                    let myCategories = [];
                    let myTags = [];
                    
                    // loop through and grab all of the categories
                    if(item.relationships.field_ucb_article_categories) {
                        for(var i = 0; i < item.relationships.field_ucb_article_categories.data.length; i++ ) {
                          myCategories.push(parseInt(item.relationships.field_ucb_article_categories.data[i].meta.drupal_internal__target_id)); 
                        }
                    }

                    alert("My Categories are : "  + myCategories);

                    // loop through and grab all of the tags 
                    if(item.relationships.field_ucb_article_tags) {
                        for(var i = 0; i < item.relationships.field_ucb_article_tags.data.length; i++ ) {
                          myTags.push(item.relationships.field_ucb_article_tags.data[i].meta.drupal_internal__target_id); 
                        }
                    }

                    // if one of our categories matches one of the excluded categories... bail and continue with the next one
                    let checkCats = ExcludeCategories.split(',').filter(cat => parseInt(cat));
                    alert("Checking Categories for exclusion : " + checkCats);
                    // const CatMatch = myCategories.filter(value => checkCats.includes(value));
                    // let CatMatch = intersect(myCategories, checkCats);
                    let CatMatch = false;
                    console.log("I'm here!!!");
                    for(var i = 0; i < myCategories.length; i++) {
                        console.log("My Categories["+i+"] = :"+myCategories[i]+":");
                        if(checkCats.includes(myCategories[i])) {
                            console.log("Match found : " + myCategories[i]);
                            CatMatch = true;
                        }
                    }
                    for(var i = 0; i < checkCats.length; i++) {
                        console.log("Check Categories["+i+"] = :"+checkCats[i]+":");
                    }

                    // alert("Matching Categories are : " + CatMatch);


                    // if one of our tags matches one of the excluded tags... bail and continue with the next one

                    // if no article summary, use a simplified article body
                    if(!item.attributes.field_ucb_article_summary){
                        getArticleParagraph(bodyAndImageId)
                        .then(response => response.json())
                        .then(data=> {
                            console.log("2nd call",data)
                            // Remove any html tags within the article
                            let htmlStrip = data.data.attributes.field_article_text.processed.replace(/<\/?[^>]+(>|$)/g, "")
                            // Remove any line breaks if media is embedded in the body
                            let lineBreakStrip = htmlStrip.replace(/(\r\n|\n|\r)/gm, "");
                            // take only the first 100 words ~ 500 chars
                            let trimmedString = lineBreakStrip.substr(0,500)
                            // if in the middle of the string, take the whole word
                            trimmedString = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(" ")))
                            // set the contentBody of Article Summary card to the minified body instead
                            contentBody.innerText = `${trimmedString}...`
                        })
                    } else {
                        contentBody.innerText = item.attributes.field_ucb_article_summary
                    }

                    // if no thumbnail, show no image
                    if(!item.relationships.field_ucb_article_thumbnail.data){
                        contentImg.src = ""
                    } else {
                        //Use the idObj as a memo to add the corresponding image url
                        let thumbId = item.relationships.field_ucb_article_thumbnail.data.id
                        contentImg.src = urlObj[idObj[thumbId]]
                    }

                    //Date - make human readable
                    contentDate.innerText = new Date(item.attributes.created).toDateString().split(' ').slice(1).join(' ')
                    contentHead.innerHTML = `<h4>${item.attributes.title}</h4>`
                    contentHead.href = item.attributes.path.alias
                    contentHead.target = "_blank"
                    contentLink.innerHTML = ` READ MORE <i class="fal fa-chevron-double-right"></i>`

                    //add links, opens in new window, doesn't wrap
                    contentLink.href = item.attributes.path.alias
                    contentLink.target = "_blank"
                    contentLink.style.whiteSpace = "nowrap"
                    imgLink.href = item.attributes.path.alias
                    imgLink.classList = "my-0 my-md-2"
                    
                    //add styles
                    elDiv.className = "container mb-5 d-flex flex-md-row flex-column"
                    contentBody.style.display = "inline"
                    contentDiv.className = "mx-0 mx-md-3"
                    contentDate.style.fontSize = "0.75rem"
                    contentDate.style.lineHeight = "0.75rem"
                    contentDate.style.marginBottom = "10px" 
                    contentImg.style.minWidth = "100px"
                    contentImg.style.minHeight = "100px"
                    contentImg.style.maxWidth = "100px"
                    contentImg.style.maxHeight = "100px"
                    contentImg.style.objectFit = "cover"
                    contentLink.style.fontSize = "0.75rem"
                    contentLink.style.fontWeight = "bolder"
                    contentLink.style.display = "block"

                    //append image & article info div to parent div
                    elDiv.appendChild(imgLink)
                    imgLink.appendChild(contentImg)
                    elDiv.appendChild(contentDiv)
                    contentDiv.appendChild(contentHead)
                    contentDiv.appendChild(contentDate)
                    contentDiv.appendChild(contentBody)
                    contentDiv.appendChild(contentLink)
                })
            // remove loading text
            el.innerText = "";
            });
    }
}
// Init
(function() {
    // get the url from the data-jsonapi variable 
    let el = document.getElementById('ucb-article-listing');
    let JSONURL = "NOTHING TO SEE HERE"; 
    let CategoryExclude = ""; 
    let TagsExclude = ""; 
    if(el) {
        JSONURL = el.dataset.jsonapi;
        CategoryExclude = el.dataset.excats;
        TagsExclude = el.dataset.extags;

        alert("You want to exclude these tags : " + TagsExclude);
    }

   renderArticleList(JSONURL,'ucb-article-listing',CategoryExclude, TagsExclude);

})();