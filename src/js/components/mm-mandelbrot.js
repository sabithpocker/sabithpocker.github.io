class MandelbrotSet extends HTMLElement {
    static get observedAttributes() {
        return ['animate'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'animate') {
            if (newValue === 'true') {
                this.startZoom();
            } else {
                this.stopZoom();
            }
        }
    }

    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.zoomFactor = 1;
        this.zoomSpeed = 1.005; // Adjust zoom speed, closer to 1 means slower zoom
        this.centerX = -0.743643887037151;
        this.centerY = 0.131825904205330;

        this.canvas = document.createElement('canvas');
        this.shadowRoot.innerHTML = `<style>
            :host {
                display: block;
                width: 100vh;
                height: 100%;
            }
            canvas {
                width: 100%;
                height: 100%;
            }
        </style>`;
        this.shadowRoot.appendChild(this.canvas);

        this.gl = this.canvas.getContext('webgl2');
        if (!this.gl) {
            console.error('WebGL 2 not supported');
            return;
        }

        this.initWebGL();
        this.resize();
        this.render();
        window.addEventListener('resize', () => this.resize());

        if (this.getAttribute('animate') === 'true') {
            this.startZoom();
        }
    }

    initWebGL() {
        const vertexShaderSource = `#version 300 es
            in vec4 a_position;
            void main() {
                gl_Position = a_position;
            }
        `;

        const fragmentShaderSource = `#version 300 es
            precision highp float;
            uniform float u_zoomFactor;
            uniform vec2 u_center;
            uniform vec2 u_resolution;
            out vec4 outColor;

            vec3 getColor(int iterations, int maxIterations) {
                float t = float(iterations) / float(maxIterations);
                float r = 9.0 * (1.0 - t) * t * t * t;
                float g = 15.0 * (1.0 - t) * (1.0 - t) * t * t;
                float b = 8.5 * (1.0 - t) * (1.0 - t) * (1.0 - t) * t;
                return vec3(r, g, b);
            }

            void main() {
                vec2 c = (gl_FragCoord.xy - u_resolution / 2.0) * 4.0 / (u_resolution * u_zoomFactor) + u_center;
                vec2 z = vec2(0.0);
                int maxIterations = int(min(200.0, u_zoomFactor));; // Dynamically adjust iterations
                int i;
                for (i = 0; i < maxIterations; i++) {
                    vec2 z2 = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
                    if (dot(z2, z2) > 4.0) break;
                    z = z2;
                }
                outColor = vec4(getColor(i, maxIterations), 1.0);
            }
        `;

        const vertexShader = this.createShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = this.createProgram(this.gl, vertexShader, fragmentShader);

        this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.zoomFactorLocation = this.gl.getUniformLocation(this.program, 'u_zoomFactor');
        this.centerLocation = this.gl.getUniformLocation(this.program, 'u_center');
        this.resolutionLocation = this.gl.getUniformLocation(this.program, 'u_resolution');

        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        const positions = [
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1,
        ];
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
    }

    createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }

    startZoom() {
        if (!this.zooming) {
            this.zooming = true;
            const zoomAnimation = (timestamp) => {
                if (!this.zooming) return;
                this.zoomFactor *= this.zoomSpeed;
                this.render();
                requestAnimationFrame(zoomAnimation);
            };
            requestAnimationFrame(zoomAnimation);
        }
    }

    stopZoom() {
        this.zooming = false;
    }

    render() {
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.program);
        gl.enableVertexAttribArray(this.positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.uniform1f(this.zoomFactorLocation, this.zoomFactor);
        gl.uniform2f(this.centerLocation, this.centerX, this.centerY);
        gl.uniform2f(this.resolutionLocation, gl.drawingBufferWidth, gl.drawingBufferHeight);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    resize() {
        const cssToRealPixels = window.devicePixelRatio || 1;
        const displayWidth = Math.floor(this.canvas.clientWidth * cssToRealPixels);
        const displayHeight = Math.floor(this.canvas.clientHeight * cssToRealPixels);

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
            this.render(); // Render the fractal after resizing
        }
    }
}

customElements.define('mm-mandelbrot', MandelbrotSet);
