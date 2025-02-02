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
                height: 100dvh;
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
        this.analyser.fftSize = 2048;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.isPlaying = false;

        this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    }

    /**
     * Called when the element is added to the document.
     */
    connectedCallback() {
        const audioSrc = this.getAttribute('audio-src');
        const attributionText = this.getAttribute('attribution-text');
        const customFragmentShader = this.getAttribute('fragment-shader');

        if (audioSrc) {
            this.loadAudio(audioSrc);
        }
        if (attributionText) {
            this.attributionText.textContent = attributionText;
        }

        this.initAudioControl();
        this.initWebGL(customFragmentShader);
        this.resizeObserver.observe(this.canvas);
        this.resizeCanvas(); // Ensure the canvas is resized initially
    }

    /**
     * Load audio data from the given source URL.
     * @param {string} src - The URL of the audio source.
     */
    async loadAudio(src) {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    }

    /**
     * Resize canvas depending on devicePixelRatio.
     * @param {HTMLCanvasElement} canvas - The canvas to be resized.
     */
    resize(canvas) {
        const cssToRealPixels = window.devicePixelRatio || 1;

        // Lookup the size the browser is displaying the canvas in CSS pixels
        // and compute a size needed to make our drawing buffer match it in
        // device pixels.
        const displayWidth = Math.floor(canvas.clientWidth * cssToRealPixels);
        const displayHeight = Math.floor(canvas.clientHeight * cssToRealPixels);

        // Check if the canvas is not the same size.
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            // Make the canvas the same size
            canvas.width = displayWidth;
            canvas.height = displayHeight;
        }
    }

    /**
     * Ensure the canvas is resized correctly.
     */
    resizeCanvas() {
        this.resize(this.canvas);
    }

    /**
     * Initialize the WebGL context and set up shaders and buffers.
     * @param {string} customFragmentShader - The custom fragment shader source, if provided.
     */
    initWebGL(customFragmentShader) {
        const gl = this.canvas.getContext('webgl2');
        if (!gl) {
            console.error('WebGL2 not supported');
            return;
        }

        const vertexShaderSource = `#version 300 es
            in vec4 a_position;
            out vec2 v_texCoord;
            void main() {
                gl_Position = a_position;
                v_texCoord = a_position.xy * 0.5 + 0.5;
            }
        `;

        const defaultFragmentShaderSource = `#version 300 es
            precision mediump float;
            in vec2 v_texCoord;
            uniform sampler2D u_texture;
            uniform vec2 u_resolution;
            out vec4 outColor;

            void main() {
                float value = texture(u_texture, vec2(v_texCoord.x, 0.5)).r;
                float y = (value - 0.5) * u_resolution.y + (u_resolution.y / 2.0);
                if (abs(gl_FragCoord.y - y) < 1.0) {
                    outColor = vec4(0.0, 1.0, 0.0, 1.0);
                } else {
                    outColor = vec4(0.0, 0.0, 0.0, 1.0);
                }
            }
        `;

        const fragmentShaderSource = customFragmentShader || defaultFragmentShaderSource;

        const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        const program = this.createProgram(gl, vertexShader, fragmentShader);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const positions = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1,
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        this.gl = gl;
        this.program = program;
        this.positionBuffer = positionBuffer;
        this.vao = vao;
        this.texture = texture;
        this.resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    }

    /**
     * Create and compile a shader.
     * @param {WebGL2RenderingContext} gl - The WebGL context.
     * @param {number} type - The type of shader, VERTEX_SHADER or FRAGMENT_SHADER.
     * @param {string} source - The GLSL source code for the shader.
     * @returns {WebGLShader} The compiled shader.
     */
    createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation failed:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    /**
     * Create a WebGL program from vertex and fragment shaders.
     * @param {WebGL2RenderingContext} gl - The WebGL context.
     * @param {WebGLShader} vertexShader - The vertex shader.
     * @param {WebGLShader} fragmentShader - The fragment shader.
     * @returns {WebGLProgram} The linked WebGL program.
     */
    createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program linking failed:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }

    /**
     * Render the waveform using WebGL.
     */
    renderWaveform() {
        this.analyser.getByteTimeDomainData(this.dataArray);

        const gl = this.gl;
        const program = this.program;

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, this.dataArray.length, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, this.dataArray);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);

        gl.uniform2f(this.resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

        gl.bindVertexArray(this.vao);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        if (this.isPlaying) {
            requestAnimationFrame(() => this.renderWaveform());
        }
    }

    /**
     * Initialize the audio control button.
     */
    initAudioControl() {
        this.audioControl.addEventListener('click', () => {
            if (this.isPlaying) {
                this.stopAudio();
            } else {
                this.playAudio();
            }
        });
    }

    /**
     * Start playing the audio and rendering the waveform.
     */
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

    /**
     * Stop playing the audio and rendering the waveform.
     */
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
