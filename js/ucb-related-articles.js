const relatedArticlesBlock = document.querySelector(".ucb-related-articles-block");

// Related Shown? 
const relatedShown = relatedArticlesBlock.getAttribute('data-relatedshown') != "Off" ? true : false;

// If related articles is toggled on create section, else hide it
if(relatedShown){
    // Tag array
    const dataTags = relatedArticlesBlock.getAttribute('data-tags');
    const myData = dataTags.split("  ").filter((tag)=> tag !== " " ? tag : "" );

    // Cat array
    const dataCats = relatedArticlesBlock.getAttribute('data-cats');
    const myCats = dataCats.split("  ").filter((cat)=> cat !== " " ? cat : "" );

    // Using tags and categories, construct an API call
    // Fetch
    // Return 3 articles that match
    // Render to page

} else {
    relatedArticlesBlock.style.display = "none";
}
