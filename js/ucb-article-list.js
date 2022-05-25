async function getArticleParagraph(id) {
  if(id) {
    const response = await fetch(
      `/jsonapi/paragraph/article_content/${id}?include[paragraph--article_content]=field_article_image,field_article_text&include=field_article_image.field_media_image&fields[file--file]=uri,url`
    );
    return response;
  } else {
      return "";
  }
}

function toggleMessage(id, display = "none") {
  if (id) {
    var toggle = document.getElementById(id);

    if (toggle) {
      if (display === "block") {
        toggle.style.display = "block";
      } else {
        toggle.style.display = "none";
      }
    }
  }
}

function renderArticleList( JSONURL, id = "ucb-article-listing", ExcludeCategories = "", ExcludeTags = "") {
  return new Promise(function(resolve, reject) {
  let excludeCatArray = ExcludeCategories.split(",").map(Number);
  let excludeTagArray = ExcludeTags.split(",").map(Number);
  // next URL if there is one, will be returned by this funtion
  let NEXTJSONURL = "";

  if (JSONURL) {
    //let el = document.getElementById(id);

    // show the loading spinner while we load the data
    toggleMessage("ucb-al-loading", "block");

    fetch(JSONURL)
      .then((reponse) => reponse.json())
      .then((data) => {
        // get the next URL and return that if there is one
        if(data.links.next) {
          let nextURL = data.links.next.href.split("/jsonapi/");
          NEXTJSONURL = nextURL[1];
        } else {
          NEXTJSONURL = "";
        }

        console.log("data obj", data);

        // if no articles of returned, stop the loading spinner and let the user know we received no data that matches their query
        if (!data.data.length) {
          toggleMessage("ucb-al-loading", "none");
          toggleMessage("ucb-al-no-results", "block");
          reject;
        }

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
        console.log("idObj", idObj);
        console.log("urlObj", urlObj);
        //iterate over each item in the array
        data.data.map((item) => {
          let thisArticleCats = [];
          let thisArticleTags = [];
          // // loop through and grab all of the categories
          if (item.relationships.field_ucb_article_categories) {
            for (let i = 0; i < item.relationships.field_ucb_article_categories.data.length; i++) {
              thisArticleCats.push(
                item.relationships.field_ucb_article_categories.data[i].meta
                  .drupal_internal__target_id
              )
            }
          }
          // console.log("this article cats",thisArticleCats)

          // // loop through and grab all of the tags
          if (item.relationships.field_ucb_article_tags) {
            for (var i = 0; i < item.relationships.field_ucb_article_tags.data.length; i++) {
              thisArticleTags.push(item.relationships.field_ucb_article_tags.data[i].meta.drupal_internal__target_id)
            }
          }
          // console.log('this article tags',thisArticleTags)

          // checks to see if the current article (item) contains a category or tag scheduled for exclusion
          let doesIncludeCat = thisArticleCats;
          let doesIncludeTag = thisArticleTags;

          // check to see if we need to filter on categories
          if (excludeCatArray.length && thisArticleCats.length) {
            doesIncludeCat = thisArticleCats.filter((element) =>
              excludeCatArray.includes(element)
            )
          }
          // check to see if we need to filter on tags
          if (excludeTagArray.length && thisArticleTags.length) {
            doesIncludeTag = thisArticleTags.filter((element) =>
              excludeTagArray.includes(element)
            )
          }

          // console.log(excludeCatArray, thisArticleCats,doesIncludeCat)
          // console.log(excludeTagArray,thisArticleTags,doesIncludeTag)

          // if the doesInclude check for tags or cats returns any number, don't proceed. Else, we want to build the page
          if (!doesIncludeCat.length == 0 || !doesIncludeTag.length == 0) {
            //console.log('was excluded', item)
          } else {
            // we need to render the Article Card view for this returned element

            // **ADD DATA**
            // this is my id of the article body paragraph type we need only if no thumbnail or summary provided
            let bodyAndImageId = item.relationships.field_ucb_article_content.data[0].id;
            let body = item.attributes.field_ucb_article_summary?item.attributes.field_ucb_article_summary : "";
            let imageSrc = "";

            // if no article summary, use a simplified article body
            if (!item.attributes.field_ucb_article_summary) {
              getArticleParagraph(bodyAndImageId)
                .then((response) => response.json())
                .then((data) => {
                  console.log("2nd call", data);
                  // Remove any html tags within the article
                  let htmlStrip = data.data.attributes.field_article_text.processed.replace(
                    /<\/?[^>]+(>|$)/g,
                    ""
                  )
                  // Remove any line breaks if media is embedded in the body
                  let lineBreakStrip = htmlStrip.replace(/(\r\n|\n|\r)/gm, "");
                  // take only the first 100 words ~ 500 chars
                  let trimmedString = lineBreakStrip.substr(0, 500);
                  // if in the middle of the string, take the whole word
                  trimmedString = trimmedString.substr(
                    0,
                    Math.min(
                      trimmedString.length,
                      trimmedString.lastIndexOf(" ")
                    )
                  )
                  // set the contentBody of Article Summary card to the minified body instead
                  body = `${trimmedString}...`;
                  document.getElementById(`body-${bodyAndImageId}`).innerHTML = body;
                })
            }

            // if no thumbnail, show no image
            if (!item.relationships.field_ucb_article_thumbnail.data) {
              imageSrc = "";
            } else {
              //Use the idObj as a memo to add the corresponding image url
              let thumbId = item.relationships.field_ucb_article_thumbnail.data.id;
              imageSrc = urlObj[idObj[thumbId]];
            }

            //Date - make human readable
            let date = new Date(item.attributes.created)
              .toDateString()
              .split(" ")
              .slice(1)
              .join(" ");
            let title = item.attributes.title;
            let link = item.attributes.path.alias;
            let image = "";
            if(link && imageSrc) {
                image = `<a href="${link}"><img src="${imageSrc}" /></a>`;
            }

            let outputHTML = `
                            <div class='ucb-article-card row'>
                                <div id='img-${bodyAndImageId}' class='col-sm-12 col-md-2 ucb-article-card-img'>${image}</div>
                                <div class='col-sm-12 col-md-10 ucb-article-card-data'>
                                    <span class='ucb-article-card-title'><a href="${link}">${title}</a></span>
                                    <span class='ucb-article-card-date'>${date}</span>
                                    <span id='body-${bodyAndImageId}' class='ucb-article-card-body'>${body}</span>
                                    <span class='ucb-article-card-more'>
                                        <a href="${link}">Read more <i class="fal fa-chevron-double-right"></i></a></span>
                                </div>
                            </div>
                        `;

            let dataOutput = document.getElementById("ucb-al-data");
            let thisArticle = document.createElement("article");
            thisArticle.innerHTML = outputHTML;

            dataOutput.append(thisArticle);
          }
        })

        // check if anything was returned, if nothing, prompt user to adjust filters, else remove loading text/error msg
        // if(el.children.length===1){
        //     el.innerHTML = "<h5>No articles currently match your selected included/excluded filters. Please adjust your filters and try again</h5>"
        // } else {
        // el.innerText = "";
        // }

        // done loading -- hide the loading spinner graphic
        toggleMessage("ucb-al-loading", "none");
        resolve(NEXTJSONURL);
      }).catch(function(error) {
        // catch any fetch errors and let the user know so they're not endlessly watching the spinner
        console.log("Fetch Error in URL : " + JSONURL);
        console.log("Fetch Error is : " + error);
        // turn off spinner
        toggleMessage("ucb-al-loading", "none");
        // turn on default error message
        toggleMessage("ucb-al-error", "block");

    });

  }
  });
}


// Init

(function () {
  // get the url from the data-jsonapi variable
  let el = document.getElementById("ucb-article-listing");
  let JSONURL = "NOTHING TO SEE HERE";
  let NEXTJSONURL = "";
  let CategoryExclude = "";
  let TagsExclude = "";
  let lastKnownScrollPosition = 0;
  let ticking = false;
  let loadingData = false;

  if (el) {
    JSONURL = el.dataset.jsonapi;
    CategoryExclude = el.dataset.excats;
    TagsExclude = el.dataset.extags;
  }

  renderArticleList( JSONURL, "ucb-article-listing", CategoryExclude, TagsExclude,).then((response) => {
    if(response) {
      NEXTJSONURL = "/jsonapi/" + response;
    }
  });

  document.addEventListener("scroll", function () {
    lastKnownScrollPosition = window.scrollY;

    if (!ticking && !loadingData) {
      window.requestAnimationFrame(function () {
        // check to see if we've scrolled through our content and need to attempt to load more
        if ( lastKnownScrollPosition + window.innerHeight >= document.documentElement.scrollHeight) {
          // grab the next link from our JSON data object and call the loader
          loadingData = true;
          // if we have another set of data to load, get the next batch.
          if(NEXTJSONURL) {
            renderArticleList( NEXTJSONURL, "ucb-article-listing", CategoryExclude, TagsExclude,).then((response) => {
              if(response) {
                NEXTJSONURL = "/jsonapi/" + response;
                loadingData = false;
              } else {
                NEXTJSONURL = "";
                toggleMessage("ucb-al-end-of-data", "block");
              }
            });
          }
        }
        ticking = false;
      })
      ticking = true;
    }
  })
})()
