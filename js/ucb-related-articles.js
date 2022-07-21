const relatedArticlesBlock = document.querySelector(".ucb-related-articles-block");

// Related Shown? 
const relatedShown = relatedArticlesBlock.getAttribute('data-relatedshown') != "Off" ? true : false;

// If related articles is toggled on create section, run the fetch
if(relatedShown){
    // Iterate through the json data of the articles tags and categories, store the values
    let x=0
    let n=0
    // Tag array - iterate through and store taxonomy ID's for fetch
    const tagJSON = JSON.parse(relatedArticlesBlock.getAttribute('data-tagsjson'));
    const myTagIDs = []

    while(tagJSON[n]!=undefined){
        myTagIDs.push(tagJSON[n]["#cache"].tags[0])
        n++;
    }
    const myTags = myTagIDs.map((id)=> id.replace(/\D/g,'')) // remove blanks, get only the tag ID#s

    // console.log("my tags", myTags)

    // Cat array - iterate through and store taxonomy ID's for fetch
    const catsJSON = JSON.parse(relatedArticlesBlock.getAttribute('data-catsjson'));
    const myCatsID= [];
    while(catsJSON[x]!=undefined){
        myCatsID.push(catsJSON[x]["#cache"].tags[0])
        x++;
    }

    const myCats = myCatsID.map((id)=> id.replace(/\D/g,''))// remove blanks, get only the cat ID#s

    // Using tags and categories, construct an API call
    const rootURL = `/jsonapi/node/ucb_article?include[node--ucb_article]=uid,title,ucb_article_content,created,field_ucb_article_summary,field_ucb_article_categories,field_ucb_article_tags,field_ucb_article_thumbnail&include=field_ucb_article_thumbnail.field_media_image&fields[file--file]=uri,url%20&filter[published][group][conjunction]=AND&filter[publish-check][condition][path]=status&filter[publish-check][condition][value]=1&filter[publish-check][condition][memberOf]=published`;

    const tagQuery = buildTagFilter(myTags)
    const catQuery = buildCatFilter(myCats)

    // Constructs the tag portion of the API filter
    function buildTagFilter(array){
        let string = `&filter[cat-include][group][conjunction]=OR`

        /*  ?filter[a-label][condition][path]=field_first_name
            &filter[a-label][condition][operator]=%3D  <- encoded "=" symbol
            &filter[a-label][condition][value]=Janis */
        array.forEach(value => {
            let tagFilterString = `&filter[filter-tag${value}][condition][path]=field_ucb_article_tags.meta.drupal_internal__target_id&filter[filter-tag${value}][condition][value]=${value}&filter[filter-tag${value}][condition][memberOf]=tag-include`;
            string += tagFilterString
        });
        // console.log(string)
        return string
        // let tagFilterString = ``
    }
    // Constructs the category portion of the API filter
    function buildCatFilter(array){
        let string = `${rootURL}`
       /// WORKS!
        array.forEach(value=>{
            let catFilterString = `&filter[filter-cat${value}][condition][path]=field_ucb_article_categories.meta.drupal_internal__target_id&filter[filter-cat${value}][condition][value]=${value}&filter[filter-cat${value}][condition][memberOf]=cat-include`
            string += catFilterString

        });
        // console.log(string)
        return string
    }
    // console.log("my cats", myCats)

    const URL = `${catQuery}`

    // Fetch
    async function getArticles(URL){
        console.log(URL)
        fetch(URL)
            .then(response=>response.json())
            .then(data=> {
            console.log(data)
            // remove article rendering the block from related options

            let returnedArticles = data.data
            let articleArrayWithScores = []
            // Create an array of options to render with additional checks
            returnedArticles.map((article)=> {
                // create an object out of 
                let articleObj ={}
                articleObj.id = article.id
                articleObj.catMatches = article.relationships.field_ucb_article_categories.data.length // count the number of matches
                articleObj.article = article // contain the existing article
                articleArrayWithScores.push(articleObj) // add to running array of possible matches
                console.log('---------------------------------------------------------------------------')
                console.log(`I have ${article.relationships.field_ucb_article_categories.data.length} matching categories`, article.relationships.field_ucb_article_categories)
            })

            // Remove current article from those availabile in the block
            articleArrayWithScores.filter((article)=>{
                if(article.article.attributes.path.alias == window.location.pathname){
                    articleArrayWithScores.splice(articleArrayWithScores.indexOf(article),1)
                } else {
                    return article;
                }
            })
            articleArrayWithScores.sort((a, b) => a.catMatches - b.catMatches).reverse();


            // TO DO -- if less than 3, grab the most tags

            // if more than 3 articles, take the top 3
            if(articleArrayWithScores.length>3){
                articleArrayWithScores.length = 3
            } else {
                getArticlesWithTags()
            }






    // Render to page
    let relatedArticlesDiv = document.createElement('div')
    relatedArticlesDiv.classList = "row"
    relatedArticlesBlock.appendChild(relatedArticlesDiv)

    articleArrayWithScores.map((article)=>{
        console.log(article)
        let articleCard = document.createElement('div')
        articleCard.classList = "ucb-article-card col-sm-1 col-md-2 col-lg-4"
        let title = article.article.attributes.title;
        let link = article.article.attributes.path.alias;
        let image = "";
        let body = ""

        if( article.article.attributes.field_ucb_article_summary != null){
            body = article.article.attributes.field_ucb_article_summary;
        }

        let imageSrc = "https://images.unsplash.com/photo-1658241817660-b0c1ad84313d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2664&q=80"
        if(link && imageSrc) {
            image = `<a href="${link}"><img src="${imageSrc}" /></a>`;
        }
        let outputHTML = `
            <div id='img' class='ucb-article-card-img'>${image}</div>
            <div class='ucb-article-card-data'>
                <span class='ucb-article-card-title'><a href="${link}">${title}</a></span>
                <span id='body' class='ucb-related-article-card-body'>${body}</span>
            </div>
    `;

    articleCard.innerHTML = outputHTML
    relatedArticlesDiv.appendChild(articleCard)
        })           

    })
}
        
        getArticles(URL)
        //http://localhost:50370/jsonapi/node/ucb_article?include[node--ucb_article]=uid,title,ucb_article_content,created,field_ucb_article_summary,field_ucb_article_categories,field_ucb_article_tags,field_ucb_article_thumbnail&include=field_ucb_article_thumbnail.field_media_image&fields[file--file]=uri,url

        /* 
        include filter:

        &filter[published][group][conjunction]=AND&filter[publish-check][condition][path]=status&filter[publish-check][condition][value]=1&filter[publish-check][condition][memberOf]=published&filter[include-group][group][conjunction]=AND
        
        &filter[include-group][group][memberOf]=published&filter[cat-include][group][conjunction]=OR&filter[filter-cat7][condition][path]=field_ucb_article_categories.meta.drupal_internal__target_id&filter[filter-cat7][condition][value]=7&filter[filter-cat7][condition][memberOf]=cat-include
        
        &filter[filter-cat8][condition][path]=field_ucb_article_categories.meta.drupal_internal__target_id&filter[filter-cat8][condition][value]=8&filter[filter-cat8][condition][memberOf]=cat-include&filter[filter-cat9][condition][path]=field_ucb_article_categories.meta.drupal_internal__target_id&filter[filter-cat9][condition][value]=9&filter[filter-cat9][condition][memberOf]=cat-include&filter[cat-include][group][memberOf]=include-group&filter[tag-include][group][conjunction]=OR&filter[filter-tag4][condition][path]=field_ucb_article_tags.meta.drupal_internal__target_id&filter[filter-tag4][condition][value]=4&filter[filter-tag4][condition][memberOf]=tag-include&filter[filter-tag5][condition][path]=field_ucb_article_tags.meta.drupal_internal__target_id&filter[filter-tag5][condition][value]=5&filter[filter-tag5][condition][memberOf]=tag-include&filter[tag-include][group][memberOf]=include-group */

        // &page[limit]=10 -- page limiter



    

    // Reveal related block after creating cards
    relatedArticlesBlock.style.display = "block"

} else {
    relatedArticlesBlock.style.display = "none";
}
