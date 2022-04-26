
var els = document.getElementsByClassName('ucb-video-text-div');

for(var i = 0, x = els.length; i < x; i++) {
  els[i].onclick = function() {
      alert("Coming Soon!");
  }
}
