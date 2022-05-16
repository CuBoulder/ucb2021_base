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
                // Below objects are needed to match images with their corresponding articles. There are two endpoints => data.data (article) and data.included (incl. media)
                let urlObj = {};
                let idObj = {};

                // Remove any blanks from our articles before map
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

                //iterate over each item in the array
                data.data.map((item)=> {
                    //create container for elements
                    let elDiv = document.createElement("div")
                    document.getElementById('block-ucb2021-base-content').appendChild(elDiv)
                    //create article content elements
                    let contentDiv = document.createElement("article")
                    let contentImg = document.createElement("img")
                    let contentDate = document.createElement("p")
                    let contentHead = document.createElement("h4")
                    let contentBody = document.createElement("p")
                    let contentLink = document.createElement("a")
                    
                    // **ADD DATA**
                    // This section is for 
                    // this is my id of the article body paragraph type we need if no thumbnail or summary provided
                    let bodyAndImageId = item.relationships.field_ucb_article_content.data[0].id
                    // if no article summary, use a simplified article body
                    if(!item.attributes.field_ucb_article_summary){
                        getArticleParagraph(bodyAndImageId)
                        .then(response => response.json())
                        .then(data=> {
                            console.log("2nd call",data)
                            // Remove any html tags such as blockquote, bold, headers within the article
                            let htmlStrip = data.data.attributes.field_article_text.processed.replace(/<\/?[^>]+(>|$)/g, "")
                            // take only the first 100 words ~ 500 chars
                            let trimmedString = htmlStrip.substr(0,500)
                            // if in the middle of the string, take the whole word
                            trimmedString = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(" ")))
                            // set the contentBody of Article Summary card to the minified body instead
                            contentBody.innerText = trimmedString
                        })
                    } else {
                        contentBody.innerText = item.attributes.field_ucb_article_summary
                    }

                    // if no thumbnail, grab the article image
                    if(!item.relationships.field_ucb_article_thumbnail.data){
                        // TO DO -- add logic for grabbing the article image here
                        contentImg.src = ""
                    } else {
                        //Use the idObj as a memo to add the corresponding image url
                        let thumbId = item.relationships.field_ucb_article_thumbnail.data.id
                        contentImg.src = urlObj[idObj[thumbId]]
                    }

                    //Date - make human readable
                    contentDate.innerText = new Date(item.attributes.created).toDateString().split(' ').slice(1).join(' ')
                    contentHead.innerText = item.attributes.title
                    contentLink.innerHTML = ` Read More <i class="fal fa-chevron-double-right"></i>`

                    //add link, opens in new window
                    contentLink.href = item.attributes.path.alias
                    contentLink.target = "_blank"
                    
                    //add styles
                    elDiv.className = "container mb-5 d-flex flex-row"
                    contentBody.style.display = "inline"
                    contentDiv.className = "container ml-3"
                    contentDate.style.fontSize = "0.75rem"
                    contentDate.style.lineHeight = "0.75rem"
                    contentImg.style.minWidth = "250px"
                    contentImg.style.minHeight = "250px"
                    contentImg.style.maxWidth = "250px"
                    contentImg.style.maxHeight = "250px"
                    contentImg.style.objectFit = "cover"


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