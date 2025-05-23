console.log("JS Loaded!");


let currentSong = new Audio();
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {

    // console.log("Fetching songs from folder:", folder);

    currFolder = folder
    let a = await fetch(`http://127.0.0.1:5500/${folder}/`)
    let response = await a.text();
    // console.log(response);

    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    // console.log(as)

    songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1])
        }

    }


    // Show all the songs in the playlist
    let songUL = document.querySelector(".songsList").getElementsByTagName("ul")[0]
    songUL.innerHTML = ""
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML +
            `<li><img class="invert" src="img/music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")}</div>
                    <div>Tejaswini</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="img/play.svg" alt="">
                </div></li>`;
    }

    // Attach an event listner to each song
    Array.from(document.querySelector(".songsList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            // console.log(e.querySelector(".info").firstElementChild.innerHTML)
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim())
        })
    })

    // set initial song in playbar
    if (songs.length > 0) {
        playMusic(songs[0], true); // true = pause
    }

    return songs

}

const playMusic = (track, pause = false) => {
    // let audio = new Audio("/songs/" + track);
    currentSong.src = `/${currFolder}/` + track;

    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg";
    } else {
        // Reset icon and don't play
        play.src = "img/play.svg";
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00/00:00";
}


async function displayAlbums() {
    let a = await fetch(`http://127.0.0.1:5500/songs/`);
    let responseText = await a.text();
    let div = document.createElement("div");
    div.innerHTML = responseText;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");

    for (const e of anchors) {
        if (e.href.match(/\/songs\/[^/]+\/?$/)) {
            let folder = e.href.split("/").filter(Boolean).pop();

            try {
                let metaResponse = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`);
                let metadata = await metaResponse.json();

                cardContainer.innerHTML += `
                    <div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 20V4L19 12L5 20Z" fill="#000" stroke="#141B34" stroke-width="1.5"
                                    stroke-linejoin="round" />
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover.jpeg" alt="not available">
                        <h4>${metadata.title}</h4>
                        <p>${metadata.description}</p>
                    </div>
                `;
            } catch (err) {
                console.error(`Failed to load metadata for ${folder}`, err);
            }
        }
    }

    // 🔄 Moved inside to ensure it's called after cards are created
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            const folder = e.dataset.folder;
            if (folder) {
                const newSongs = await getSongs(`songs/${folder}`);
                if (newSongs.length > 0) {
                    playMusic(newSongs[0]);
                }
            }
        });
    });
}




async function main() {
    // console.log("Inside main()");

    // Get list of all the songs
    await getSongs("songs/ncs");

    // Display all the albums on the page
    await displayAlbums();



    // Attach an event listner to play, next and prev
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play()
            play.src = "img/pause.svg"
        }
        else {
            currentSong.pause()
            play.src = "img/play.svg"

        }
    })

    // Auto-play next song when current ends
    currentSong.addEventListener("ended", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        }
    });


    // Listen for time update event
    currentSong.addEventListener("timeupdate", () => {
        // console.log(currentSong.currentTime, currentSong.duration)
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)}/${secondsToMinutesSeconds(currentSong.duration)}`
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%"

    })

    // Add an event listner to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100
        document.querySelector(".circle").style.left = percent + "%"
        currentSong.currentTime = ((currentSong.duration) * percent) / 100
    })

    // Add an event listner for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = '0'
    })

    // Add an event listener for close
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = '-120%';
    })

    // Add an event listner to prev
    previous.addEventListener("click", () => {
        // console.log("Previous clicked")
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
    })

    // Add an event listner to next
    next.addEventListener("click", () => {
        currentSong.pause()
        // console.log("Next clicked")
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1])
        }
    })

    // Add an event listner to volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        // console.log("Setting volume to ", e.target.value, "/100")
        currentSong.volume = parseInt(e.target.value) / 100
    })


    // Add event listner to mute the track
    // document.querySelector(".volume>img").addEventListener("click", e => {
    //     console.log(e.target)
    //     if (e.target.src.includes("img/volume.svg")) {
    //         e.target.src = e.target.src.replace("img/volume.svg", "img/mute.svg")
    //         currentSong.volume = 0
    //         document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
    //     }
    //     else {
    //         e.target.src = e.target.src.replace("img/mute.svg", "img/volume.svg")
    //         currentSong.volume = 0.1;
    //         document.querySelector(".range").getElementsByTagName("input")[0].value = 10;

    //     }
    // })

    // Volume slider change
    document.querySelector(".range input").addEventListener("input", (e) => {
        const volumeValue = parseInt(e.target.value);
        currentSong.volume = volumeValue / 100;

        const volumeIcon = document.querySelector(".volume>img");

        if (volumeValue === 0) {
            volumeIcon.src = volumeIcon.src.replace("img/volume.svg", "img/mute.svg");
        } else {
            if (volumeIcon.src.includes("img/mute.svg")) {
                volumeIcon.src = volumeIcon.src.replace("img/mute.svg", "img/volume.svg");
            }
        }
    });

    // Volume icon click (mute/unmute toggle)
    document.querySelector(".volume>img").addEventListener("click", (e) => {
        const volumeSlider = document.querySelector(".range input");

        if (e.target.src.includes("img/volume.svg")) {
            // Mute it
            e.target.src = e.target.src.replace("img/volume.svg", "img/mute.svg");
            currentSong.volume = 0;
            volumeSlider.value = 0;
        } else {
            // Unmute it (set to default 10%)
            e.target.src = e.target.src.replace("img/mute.svg", "img/volume.svg");
            currentSong.volume = 0.1;
            volumeSlider.value = 10;
        }
    });

    // Toggle play/pause on Spacebar press
    document.addEventListener("keydown", (e) => {
        // Prevent default behavior (e.g., page scrolling)
        if (e.code === "Space") {
            e.preventDefault();
            if (currentSong.paused) {
                currentSong.play();
                play.src = "img/pause.svg";
            } else {
                currentSong.pause();
                play.src = "img/play.svg";
            }
        }
    });




}

main()
