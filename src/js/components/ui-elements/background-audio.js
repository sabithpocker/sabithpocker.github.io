class BackgroundAudio extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const audioSrc = this.getAttribute('audio-src');
        const attributionText = this.getAttribute('attribution-text');

        this.shadowRoot.innerHTML = `
        <style>
          @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');

          .audio-control {
            position: absolute;
            bottom: 40px;
            left: 50%;
            transform: translateX(-30%);
            cursor: pointer;
            font-size: 42px;
            z-index: 9999;
            color: #000;
          }
          .footer--attribute {
            text-align: center;
            padding: 5px 10px;
            position: fixed;
            width: 100%;
            bottom: 0;
            color: #000;
            left: 0;
            z-index: 999;
            font-size: 0.75rem;
            background-color: transparent;
          }
        </style>
        <audio id="background-audio" type="audio/mp3" src="${audioSrc}" loop></audio>
        <i id="audio-control" class="fas fa-volume-up audio-control"></i>
        <div class="footer--attribute">
          <p>${attributionText}</p>
        </div>
      `;

        this.initAudioControl();
    }

    initAudioControl() {
        const audio = this.shadowRoot.getElementById('background-audio');
        const audioControl = this.shadowRoot.getElementById('audio-control');
        let isMuted = true;

        audioControl.addEventListener('click', () => {
            if (isMuted) {
                audio.play();
                audioControl.classList.add('fa-volume-mute');
                audioControl.classList.remove('fa-volume-up');
            } else {
                audio.pause();
                audioControl.classList.add('fa-volume-up');
                audioControl.classList.remove('fa-volume-mute');
            }
            isMuted = !isMuted;
        });
    }
}

customElements.define('background-audio', BackgroundAudio);