class AudioVisualizer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const shadow = this.shadowRoot;
        shadow.innerHTML = `
        <style>
            @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');
            :host {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 100vw;
                height: 100vh;
                background-color: #000;
            }
            canvas {
                width: 100%;
                height: 100%;
            }
            .audio-control {
                position: absolute;
                bottom: 40px;
                left: 50%;
                transform: translateX(-50%);
                cursor: pointer;
                font-size: 42px;
                z-index: 9999;
                color: #fff;
            }
            .footer--attribute {
                text-align: center;
                padding: 5px 10px;
                position: fixed;
                width: 100%;
                bottom: 0;
                color: #fff;
                left: 0;
                z-index: 999;
                font-size: 0.75rem;
                background-color: transparent;
            }
        </style>
        <i id="audio-control" class="fas fa-play audio-control"></i>
        <canvas></canvas>
        <div class="footer--attribute">
          <p id="attribution-text"></p>
        </div>
      `;

        this.canvas = shadow.querySelector('canvas');
        this.audioControl = shadow.querySelector('#audio-control');
        this.attributionText = shadow.querySelector('#attribution-text');
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.dataArray = new Uint8Array(this.analyser.fftSize);
        this.isPlaying = false;

        this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    }

    connectedCallback() {
        const audioSrc = this.getAttribute('audio-src');
        const attributionText = this.getAttribute('attribution-text');

        if (audioSrc) {
            this.loadAudio(audioSrc);
        }
        if (attributionText) {
            this.attributionText.textContent = attributionText;
        }

        this.initAudioControl();
        this.resizeObserver.observe(this.canvas);
        this.resizeCanvas(); // Ensure the canvas is resized initially
    }

    async loadAudio(src) {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    }

    resizeCanvas() {
        this.resize(this.canvas);
    }

    resize(canvas) {
        const cssToRealPixels = window.devicePixelRatio || 1;
        const displayWidth = Math.floor(canvas.clientWidth * cssToRealPixels);
        const displayHeight = Math.floor(canvas.clientHeight * cssToRealPixels);

        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
        }
    }

    renderWaveform() {
        const canvasCtx = this.canvas.getContext('2d');
        this.analyser.getByteTimeDomainData(this.dataArray);

        canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 255, 0)';

        canvasCtx.beginPath();
        const sliceWidth = this.canvas.width / this.dataArray.length;
        let x = 0;

        for (let i = 0; i < this.dataArray.length; i++) {
            const v = this.dataArray[i] / 128.0;
            const y = v * this.canvas.height / 2;

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(this.canvas.width, this.canvas.height / 2);
        canvasCtx.stroke();

        if (this.isPlaying) {
            requestAnimationFrame(() => this.renderWaveform());
        }
    }

    initAudioControl() {
        this.audioControl.addEventListener('click', () => {
            if (this.isPlaying) {
                this.stopAudio();
            } else {
                this.playAudio();
            }
        });
    }

    playAudio() {
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = this.audioBuffer;
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        this.source.start(0);

        this.isPlaying = true;
        this.audioControl.classList.remove('fa-play');
        this.audioControl.classList.add('fa-pause');
        this.renderWaveform();
    }

    stopAudio() {
        if (this.source) {
            this.source.stop();
            this.source.disconnect();
        }

        this.isPlaying = false;
        this.audioControl.classList.remove('fa-pause');
        this.audioControl.classList.add('fa-play');
    }
}

customElements.define('mm-audio-visualizer', AudioVisualizer);
