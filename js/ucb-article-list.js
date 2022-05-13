(function() {
    // get the url from the data-jsonapi variable 
    let el = document.getElementById('ucb-article-listing');
    let JSONURL = "NOTHING TO SEE HERE"; 
    if(el) {
        JSONURL = el.dataset.jsonapi;
    }

    if(JSONURL) {
        fetch(JSONURL)
            .then(reponse => reponse.json())
            .then(data => {
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
                    
                    // ADD DATA
                    // Image Data
                    let thumbId = item.relationships.field_ucb_article_thumbnail.data.id
                    //Use the idObj as a hashmap to add the corresponding image url
                    contentImg.src = urlObj[idObj[thumbId]]

                    //Date - make human readable
                    contentDate.innerText = new Date(item.attributes.created).toDateString().split(' ').slice(1).join(' ')
                    contentHead.innerText = item.attributes.title
                    contentBody.innerText = item.attributes.field_ucb_article_summary
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

})();