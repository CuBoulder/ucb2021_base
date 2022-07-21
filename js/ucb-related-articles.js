const relatedArticlesBlock = document.querySelector(".ucb-related-articles-block");
let articleArrayWithScores = []


// Related Shown? 
const relatedShown = relatedArticlesBlock.getAttribute('data-relatedshown') != "Off" ? true : false;

// This function returns a total of matched categories or tags
function checkMatches(data, ids){
    let count = 0;
    let numberArr = ids.map(Number)
    data.forEach((article)=>{
        if(numberArr.includes(article.meta.drupal_internal__target_id)){
            count++
        }
    })
    return count
}
// This function takes in the tag endpoint and current array of related articles, returns the array of related articles once it has a count of 3. 
async function getArticlesWithTags(url, array, articleTags ,numLeft){
    // console.log("=================================")
    // console.log(url)
    console.log(array, articleTags)
    fetch(url)
    .then(response => response.json())
    .then(data=>{
        let relatedArticlesDiv = document.querySelector('.related-articles-section')

        // console.log("TAG DATA", data)
        let returnedArticles = data.data
        let existingIds = [];
        // create an array of existing ids
        array.map(article=>{
            existingIds.push(article.id)
        })

        // remove any articles already chosen and the current article
        let filterData = []
        returnedArticles.map((article)=>{
            console.log(article.id, existingIds.includes(article.id))
            if(existingIds.includes(article.id) || article.attributes.path.alias == window.location.pathname){
            return ''
            } else {
                let articleObj ={}
                articleObj.id = article.id
                articleObj.catMatches = checkMatches(article.relationships.field_ucb_article_tags.data, articleTags) // count the number of matches
                articleObj.article = article 
                filterData.push(articleObj)
            }
        })
        let urlObj = {};
        let idObj = {};

        if (data.included) {
            let filteredData = data.included.filter((url) => {
              return url.attributes.uri !== undefined;
            })
            // creates the urlObj, key: data id, value: url
            filteredData.map((pair) => {
              urlObj[pair.id] = pair.attributes.uri.url;
            })
  
            // removes all other included data besides images in our included media
            let idFilterData = data.included.filter((item) => {
              return item.type == "media--image";
            })
            // using the image-only data, creates the idObj =>  key: thumbnail id, value : data id
            idFilterData.map((pair) => {
              idObj[pair.id] = pair.relationships.thumbnail.data.id;
            })
          }

        // Rank based on matches (tags)
        filterData.sort((a, b) => a.catMatches - b.catMatches).reverse();
        filterData.length = numLeft // sets to fill in however many articles are left

        filterData.map((article)=>{
            console.log(article)
            let articleCard = document.createElement('div')
            articleCard.classList = "ucb-article-card col-sm-12 col-md-6 col-lg-4"
            let title = article.article.attributes.title;
            let link = article.article.attributes.path.alias;
                    // if no thumbnail, show no image
                    if (!article.article.relationships.field_ucb_article_thumbnail.data) {
                        image = "";
                      } else {
                        //Use the idObj as a memo to add the corresponding image url
                        let thumbId = article.article.relationships.field_ucb_article_thumbnail.data.id;
                        image = urlObj[idObj[thumbId]];
                      }
            let body = ""
            // if summary, use that
            if( article.article.attributes.field_ucb_article_summary != null){
                body = article.article.attributes.field_ucb_article_summary;
            }
    
            // if image, use it
            if (!article.article.relationships.field_ucb_article_thumbnail.data) {
                imageSrc = "";
              } else {
                //Use the idObj as a memo to add the corresponding image url
                let thumbId = article.article.relationships.field_ucb_article_thumbnail.data.id;
                imageSrc = urlObj[idObj[thumbId]];
              }
    
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
        let string = `${rootURL}`

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
            // console.log(data)

            // Below objects are needed to match images with their corresponding articles. There are two endpoints => data.data (article) and data.included (incl. media), both needed to associate a media library image with its respective article
        let urlObj = {};
        let idObj = {};
        // Remove any blanks from our articles before map
        if (data.included) {
          let filteredData = data.included.filter((url) => {
            return url.attributes.uri !== undefined;
          })
          // creates the urlObj, key: data id, value: url
          filteredData.map((pair) => {
            urlObj[pair.id] = pair.attributes.uri.url;
          })

          // removes all other included data besides images in our included media
          let idFilterData = data.included.filter((item) => {
            return item.type == "media--image";
          })
          // using the image-only data, creates the idObj =>  key: thumbnail id, value : data id
          idFilterData.map((pair) => {
            idObj[pair.id] = pair.relationships.thumbnail.data.id;
          })
        }
            let returnedArticles = data.data
            // Create an array of options to render with additional checks
            returnedArticles.map((article)=> {
                // create an object out of 
                let articleObj ={}
                articleObj.id = article.id
                articleObj.catMatches = checkMatches(article.relationships.field_ucb_article_categories.data, myCats) // count the number of matches
                articleObj.article = article // contain the existing article
                articleArrayWithScores.push(articleObj) // add to running array of possible matches
                // console.log('---------------------------------------------------------------------------')
                // console.log(`I have ${article.relationships.field_ucb_article_categories.data.length} matching categories`, article.relationships.field_ucb_article_categories)
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
            // Remove articles without matches from those availabile in the block
            articleArrayWithScores.filter((article)=>{
                if(article.catMatches === 0){
                    articleArrayWithScores.splice(articleArrayWithScores.indexOf(article),1)
                } else {
                    return article;
                }
            })


            // if more than 3 articles, take the top 3
            if(articleArrayWithScores.length>3){
                articleArrayWithScores.length = 3
            } else if(articleArrayWithScores.length<3){
                let howManyLeft = 3 - articleArrayWithScores.length
                // if less than 3, grab the most tags
              getArticlesWithTags(tagQuery,articleArrayWithScores, myTags, howManyLeft);
              
            }






    // Render to page
    let relatedArticlesDiv = document.createElement('div')
    relatedArticlesDiv.classList = "row related-articles-section"
    relatedArticlesBlock.appendChild(relatedArticlesDiv)

    articleArrayWithScores.map((article)=>{
        console.log(article)
        let articleCard = document.createElement('div')
        articleCard.classList = "ucb-article-card col-sm-12 col-md-6 col-lg-4"
        let title = article.article.attributes.title;
        let link = article.article.attributes.path.alias;
                // if no thumbnail, show no image
                if (!article.article.relationships.field_ucb_article_thumbnail.data) {
                    image = "";
                  } else {
                    //Use the idObj as a memo to add the corresponding image url
                    let thumbId = article.article.relationships.field_ucb_article_thumbnail.data.id;
                    image = urlObj[idObj[thumbId]];
                  }
        let body = ""
        // if summary, use that
        if( article.article.attributes.field_ucb_article_summary != null){
            body = article.article.attributes.field_ucb_article_summary;
        }

        // if image, use it
        if (!article.article.relationships.field_ucb_article_thumbnail.data) {
            imageSrc = "";
          } else {
            //Use the idObj as a memo to add the corresponding image url
            let thumbId = article.article.relationships.field_ucb_article_thumbnail.data.id;
            imageSrc = urlObj[idObj[thumbId]];
          }

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
