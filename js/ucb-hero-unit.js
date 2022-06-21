function appendVimeoPlayerScript() {
    const
        headElement = document.head || document.getElementsByTagName('head')[0],
        scriptElement = document.createElement('script');
    scriptElement.addEventListener('load', () => scriptElement.setAttribute('data-ucb-loaded', ''));
    scriptElement.id = 'ucb_vimeo_player_script';
    scriptElement.type = 'text/javascript';
    scriptElement.src = 'https://player.vimeo.com/api/player.js';
    headElement.appendChild(scriptElement);
    return scriptElement;
}

function enableVideoHero(videoURL, videoPlayerWrapperElementId) {    
    const scriptElement = document.getElementById('ucb_vimeo_player_script') || appendVimeoPlayerScript();
    if(scriptElement.hasAttribute('data-ucb-loaded'))
        createVideoHeroPlayer(videoURL, videoPlayerWrapperElementId);
    else scriptElement.addEventListener('load', () => createVideoHeroPlayer(videoURL, videoPlayerWrapperElementId));
}

function createVideoHeroPlayer(videoURL, videoPlayerWrapperElementId) {
    const
        videoPlayerWrapperElement = document.getElementById(videoPlayerWrapperElementId),
        videoWrapperElement = videoPlayerWrapperElement.parentElement,
        playPauseButton = videoWrapperElement.querySelector('.ucb-hero-unit-video-play-pause'),
        videoPlayer = new Vimeo.Player(videoPlayerWrapperElementId, {
            url: videoURL,
            background: true,
            muted: true
        });
    // The video will resize automatically to fit its container
    let videoWidth = -1, videoHeight = -1, videoPlaying = false;
    const enableVideoHeroAutoresize = function() {
        if(videoWidth > -1 && videoHeight > -1) {
            resizeVideoHero(videoPlayerWrapperElement, videoPlayer, videoWidth, videoHeight);
            window.addEventListener('resize', () => resizeVideoHero(videoPlayerWrapperElement, videoPlayer, videoWidth, videoHeight));    
        }
    }
    // Video width and height come back from the Vimeo player API as Promises
    // In case of error, it will default to 800x450 which is fine for 16:9 videos
    videoPlayer.getVideoWidth().then(
        (value) => { videoWidth = value; enableVideoHeroAutoresize(); },
        (error) => { videoWidth = 800; enableVideoHeroAutoresize(); });
    videoPlayer.getVideoHeight().then(
        (value) => { videoHeight = value; enableVideoHeroAutoresize(); },
        (error) => { videoHeight = 450; enableVideoHeroAutoresize(); });
    // API event calls to the Vimeo player can go here
    videoPlayer.on('loaded', function() {
        videoWrapperElement.removeAttribute('hidden');
    });
    videoPlayer.on('play', function() {
        videoPlaying = true;
        playPauseButton.innerHTML = '<i class="fa fa-pause"></i>';
    });
    videoPlayer.on('pause', function() {
        videoPlaying = false;
        playPauseButton.innerHTML = '<i class="fa fa-play"></i>';
    });
    playPauseButton.onclick = function() {
        if(videoPlaying)
            videoPlayer.pause()
        else videoPlayer.play();
    };
}

function resizeVideoHero(videoPlayerWrapperElement, videoPlayer, videoWidth, videoHeight) {
    const 
        heroElement = videoPlayerWrapperElement.parentElement.parentElement,
        heroWidth = heroElement.offsetWidth,
        heroHeight = heroElement.offsetHeight,
        videoPlayerElement = videoPlayer.element,
        dimensions = calculateAspectRatioFit(videoWidth, videoHeight, heroWidth, heroHeight);
    videoPlayerElement.width = dimensions.width;
    videoPlayerWrapperElement.style.width = heroWidth + 'px';
    videoPlayerElement.height = dimensions.height;
    videoPlayerWrapperElement.style.height = heroHeight + 'px';
    videoPlayerElement.style.marginTop = ((heroHeight - dimensions.height) / 2) + 'px';
    videoPlayerElement.style.marginLeft = ((heroWidth - dimensions.width) / 2) + 'px';
}

function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
    const ratio = Math.max(maxWidth / srcWidth, maxHeight / srcHeight);
    return { width: srcWidth * ratio, height: srcHeight * ratio };
}