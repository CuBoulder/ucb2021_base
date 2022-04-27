
var els = document.getElementsByClassName('ucb-video-reveal-controls');

for(var i = 0, x = els.length; i < x; i++) {
  els[i].onclick = function() {
      alert("Coming Soon!");

      // We have 3 sibling elements that we're dealing with.  One was clicked on
      // the text control element which needs to be hidden
      // we then have a sibling elements of the image (hide)
      // and the video (show)

      // get the parent element 
      let myParentEl = this.parentElement;

      if(myParentEl) {
        // find the text controls and hide them 
        myParentEl.querySelector('.ucb-video-reveal-controls').style.display = "none";

        // find the image and hide it 
        myParentEl.querySelector('.ucb-video-reveal-image').style.display = "none";

        // find the video and show it 
        let videoEl = myParentEl.querySelector('.ucb-video-reveal-video'); 
        videoEl.style.display = "block";

        // now we should be able to play the video for the user 


      }


      // hide the image 
      //imageEl = this.querySelector('img');
    //   imageEls = this.children;
    //   for(var j = 0; j < imageEls.length; j++) {
    //       console.log(imageEls[j].tagName);
    //       if(imageEls[j].tagName == "img") {
    //         alert("Found an Image!");
    //         imageEls[j].style.display = "none";
    //       }
    //   }

      // hide the text 
    //   textEl = this.querySelector('.ucb-vid-reveal-text');
    //   textEl.style.display = "none";

      // un-hide the video 

      // start playing the video 
  }
}
