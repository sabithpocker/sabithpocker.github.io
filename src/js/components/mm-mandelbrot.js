// Mandelbrot set generalized to the Multibrot family: z(n+1) = z(n)^n + c
// instead of the fixed z^2 + c. Complex exponentiation is done in polar form
// (r^n, n*theta) rather than repeated multiplication, so n isn't limited to
// small positive integers - fractional and negative powers work too (the
// n=2 case, still the default, renders identically to the classic
// Mandelbrot). A tiny change to one exponent is enough to turn this single
// implementation into an entire family of visually unrelated-looking
// fractals.
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
        this.power = 2;
        this.iterations = 100;
        this.escapeRadius = 2;

        this.canvas = document.createElement('canvas');
        this.shadowRoot.innerHTML = `<style>
            :host {
                display: block;
                width: 100dvh;
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
        this.setupInteraction();
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
            uniform float u_power;
            uniform int u_iterations;
            uniform float u_escapeRadius;
            out vec4 outColor;

            // Complex z^n via polar form: r^n * (cos(n*theta), sin(n*theta)).
            // Works for fractional and negative n, unlike repeated
            // multiplication which only makes sense for positive integers.
            // z=0 raised to a negative power is mathematically infinite;
            // clamped to 0 here instead of producing NaN/Inf, which only
            // matters for the very first iteration (z starts at 0) - by the
            // second iteration z is c (generally nonzero) and proceeds
            // normally.
            vec2 cpow(vec2 z, float n) {
                float r = length(z);
                if (r < 1e-6) return vec2(0.0);
                float theta = atan(z.y, z.x);
                float rn = pow(r, n);
                return vec2(rn * cos(n * theta), rn * sin(n * theta));
            }

            vec3 getColor(int iterations, int maxIterations) {
                float t = float(iterations) / float(maxIterations);
                float r = 9.0 * (1.0 - t) * t * t * t;
                float g = 15.0 * (1.0 - t) * (1.0 - t) * t * t;
                float b = 8.5 * (1.0 - t) * (1.0 - t) * (1.0 - t) * t;
                return vec3(r, g, b);
            }

            void main() {
                vec2 c = (gl_FragCoord.xy - u_resolution / 2.0) * 4.0 / (u_resolution * (u_zoomFactor * 0.5)) + u_center;
                vec2 z = vec2(0.0);
                float escape2 = u_escapeRadius * u_escapeRadius;
                int i;
                for (i = 0; i < u_iterations; i++) {
                    vec2 zn = cpow(z, u_power) + c;
                    if (dot(zn, zn) > escape2) break;
                    z = zn;
                }
                outColor = vec4(getColor(i, u_iterations), 1.0);
            }
        `;

        const vertexShader = this.createShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = this.createProgram(this.gl, vertexShader, fragmentShader);

        this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.zoomFactorLocation = this.gl.getUniformLocation(this.program, 'u_zoomFactor');
        this.centerLocation = this.gl.getUniformLocation(this.program, 'u_center');
        this.resolutionLocation = this.gl.getUniformLocation(this.program, 'u_resolution');
        this.powerLocation = this.gl.getUniformLocation(this.program, 'u_power');
        this.iterationsLocation = this.gl.getUniformLocation(this.program, 'u_iterations');
        this.escapeRadiusLocation = this.gl.getUniformLocation(this.program, 'u_escapeRadius');

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

    // Mouse-drag to pan, wheel to zoom toward the cursor - lets visitors
    // explore a given power's shape directly instead of only via sliders.
    setupInteraction() {
        let dragging = false;
        let lastX = 0, lastY = 0;

        this.canvas.addEventListener('mousedown', (e) => {
            dragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
        });
        window.addEventListener('mouseup', () => { dragging = false; });
        window.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            const rect = this.canvas.getBoundingClientRect();
            const scale = 4 / (rect.height * this.zoomFactor * 0.5);
            this.centerX -= (e.clientX - lastX) * scale;
            this.centerY += (e.clientY - lastY) * scale;
            lastX = e.clientX;
            lastY = e.clientY;
            this.render();
        });
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
            this.zoomFactor = Math.max(0.05, Math.min(1e6, this.zoomFactor * factor));
            this.render();
        }, { passive: false });
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
                // Preserves the original dynamic iteration-count-follows-zoom
                // behavior for animate="true" consumers (e.g. all.html),
                // now computed here instead of in the shader so the shader
                // can take a plain iteration count uniform like the rest of
                // this component's "instrument" properties.
                this.iterations = Math.round(Math.min(200, Math.max(this.zoomFactor, 30)));
                this.render();
                requestAnimationFrame(zoomAnimation);
            };
            requestAnimationFrame(zoomAnimation);
        }
    }

    stopZoom() {
        this.zooming = false;
    }

    // Public hook for external animation loops/toolbars - call after
    // changing power/iterations/escapeRadius/centerX/centerY/zoomFactor as
    // properties to redraw.
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
        gl.uniform1f(this.powerLocation, this.power);
        gl.uniform1i(this.iterationsLocation, Math.round(this.iterations));
        gl.uniform1f(this.escapeRadiusLocation, this.escapeRadius);

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
