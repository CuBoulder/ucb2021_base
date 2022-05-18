async function getArticleParagraph(id){
    return await fetch(`/jsonapi/paragraph/article_content/${id}?include[paragraph--article_content]=field_article_image,field_article_text&include=field_article_image.field_media_image&fields[file--file]=uri,url`)
}

function renderArticleList(JSONURL,id='ucb-article-listing'){
    if(JSONURL) {
        let el = document.getElementById(id);

        fetch(JSONURL)
            .then(reponse => reponse.json())
            .then(data => {
                console.log("data obj",data)

                // if no articles of returned, give an error message
                if(data.data.length==0){
                    el.innerText = "Error: No articles were returned -- please check your filters for conflicts and try again";
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
                    let contentDate = document.createElement("p")
                    let contentHead = document.createElement("a")
                    let contentBody = document.createElement("p")
                    let contentLink = document.createElement("a")
                    
                    // **ADD DATA**
                    // this is my id of the article body paragraph type we need only if no thumbnail or summary provided
                    let bodyAndImageId = item.relationships.field_ucb_article_content.data[0].id
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

                    //add link, opens in new window, doesn't wrap
                    contentLink.href = item.attributes.path.alias
                    contentLink.target = "_blank"
                    contentLink.style.whiteSpace = "nowrap"
                    
                    //add styles
                    elDiv.className = "container mb-5 d-flex flex-row"
                    contentBody.style.display = "inline"
                    contentDiv.className = "container ml-3"
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
                    elDiv.appendChild(contentImg)
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
    if(el) {
        JSONURL = el.dataset.jsonapi;
    }

   renderArticleList(JSONURL,'ucb-article-listing');

})();