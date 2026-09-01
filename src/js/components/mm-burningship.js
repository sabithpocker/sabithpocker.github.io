// Burning Ship fractal: z(n+1) = (|Re(z)| + i|Im(z)|)^2 + c instead of the
// plain z^2 + c. Expanding the square shows the real part is unchanged
// (x^2 - y^2, same as Mandelbrot) - the entire difference is a single
// abs() on the cross term in the imaginary part (2*x*y becomes 2*|x*y|).
// That one absolute value is what turns the smooth Mandelbrot bulbs into
// jagged flame/mountain/coral silhouettes.
class MMBurningShip extends HTMLElement {
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.canvas = document.createElement('canvas');
        this.shadowRoot.innerHTML = `<style>
            :host { display: block; width: 100%; height: 100%; }
            canvas { width: 100%; height: 100%; display: block; }
        </style>`;
        this.shadowRoot.appendChild(this.canvas);

        this.gl = this.canvas.getContext('webgl2');
        if (!this.gl) {
            console.error('WebGL2 not supported');
            return;
        }

        // A whole-set framing by default - centered and scaled so the
        // characteristic "hull" silhouette is visible without any zoom
        // (verified in-browser: this framing shows the recognizable
        // boat-hull-with-rigging shape filling most of the viewport).
        this.centerX = -0.42;
        this.centerY = -0.38;
        this.zoom = 0.42;
        this.iterations = 100;
        this.escapeRadius = 4;
        this.paletteIndex = 0;
        this.descentSpeed = 1;
        this.descending = false;
        // A deep-zoom point along the hull's rigging where the fractal
        // keeps revealing new flame/coral-like detail - the "infinite
        // descent" target. Verified in-browser to stay richly detailed
        // (not drift into flat empty space) up to roughly 1000-1500x zoom;
        // beyond that, float32 precision in the shader itself (not this
        // coordinate) is the limiting factor for any straightforward
        // (non-perturbation-based) GPU deep zoom, so startDescent() caps
        // there rather than continuing toward an increasingly blank view.
        this.descentTargetX = -1.7832;
        this.descentTargetY = -0.02589;
        this.maxDescentZoom = 1200;

        this.initWebGL();
        this.resize();
        this.render();
        this.setupInteraction();
        window.addEventListener('resize', () => { this.resize(); this.render(); });
    }

    initWebGL() {
        const gl = this.gl;
        const vertexShaderSource = `#version 300 es
            in vec4 a_position;
            void main() {
                gl_Position = a_position;
            }
        `;

        const fragmentShaderSource = `#version 300 es
            precision highp float;
            uniform vec2 u_resolution;
            uniform vec2 u_center;
            uniform float u_zoom;
            uniform int u_iterations;
            uniform float u_escapeRadius;
            uniform int u_paletteIndex;
            out vec4 outColor;

            vec3 palette(float t, int idx) {
                vec3 a = vec3(0.5), b = vec3(0.5), c = vec3(1.0), d = vec3(0.0);
                if (idx == 0) { a = vec3(0.5, 0.25, 0.1); b = vec3(0.5, 0.35, 0.2); c = vec3(1.2, 1.0, 0.8); d = vec3(0.0, 0.1, 0.2); }
                else if (idx == 1) { a = vec3(0.15, 0.25, 0.35); b = vec3(0.25, 0.35, 0.4); c = vec3(1.0, 1.0, 1.2); d = vec3(0.4, 0.5, 0.6); }
                else if (idx == 2) { a = vec3(0.3, 0.35, 0.4); b = vec3(0.4, 0.35, 0.3); c = vec3(1.5, 1.2, 1.0); d = vec3(0.2, 0.4, 0.5); }
                else { a = vec3(0.2, 0.1, 0.25); b = vec3(0.35, 0.2, 0.3); c = vec3(1.8, 1.3, 0.6); d = vec3(0.3, 0.15, 0.05); }
                return a + b * cos(6.28318 * (c * t + d));
            }

            void main() {
                vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / (u_resolution.y * 0.5 * u_zoom);
                // The characteristic "ship" silhouette sits below the real
                // axis in the standard formula's coordinate space - flipping
                // the imaginary axis here is the conventional way to render
                // it upright instead of inverted.
                vec2 c = vec2(uv.x, -uv.y) + u_center;

                vec2 z = vec2(0.0);
                float escape2 = u_escapeRadius * u_escapeRadius;
                int i;
                for (i = 0; i < u_iterations; i++) {
                    vec2 zn = vec2(z.x * z.x - z.y * z.y, 2.0 * abs(z.x * z.y)) + c;
                    if (dot(zn, zn) > escape2) break;
                    z = zn;
                }

                if (i >= u_iterations) {
                    outColor = vec4(0.0, 0.0, 0.0, 1.0);
                } else {
                    float smoothed = float(i) - log2(max(log2(dot(z, z) + 1e-6), 1e-6)) + 4.0;
                    float t = fract(smoothed * 0.02);
                    outColor = vec4(palette(t, u_paletteIndex), 1.0);
                }
            }
        `;

        const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = this.createProgram(gl, vertexShader, fragmentShader);

        this.positionLocation = gl.getAttribLocation(this.program, 'a_position');
        this.uniforms = {
            resolution: gl.getUniformLocation(this.program, 'u_resolution'),
            center: gl.getUniformLocation(this.program, 'u_center'),
            zoom: gl.getUniformLocation(this.program, 'u_zoom'),
            iterations: gl.getUniformLocation(this.program, 'u_iterations'),
            escapeRadius: gl.getUniformLocation(this.program, 'u_escapeRadius'),
            paletteIndex: gl.getUniformLocation(this.program, 'u_paletteIndex'),
        };

        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1,
        ]), gl.STATIC_DRAW);
    }

    // Mouse-drag to pan, wheel to zoom toward the cursor - manual dragging
    // pauses the auto-descent so the two controls don't fight each other.
    setupInteraction() {
        let dragging = false;
        let lastX = 0, lastY = 0;

        this.canvas.addEventListener('mousedown', (e) => {
            dragging = true;
            this.stopDescent();
            lastX = e.clientX;
            lastY = e.clientY;
        });
        window.addEventListener('mouseup', () => { dragging = false; });
        window.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            const rect = this.canvas.getBoundingClientRect();
            const scale = 2 / (rect.height * this.zoom);
            this.centerX -= (e.clientX - lastX) * scale;
            this.centerY -= (e.clientY - lastY) * scale;
            lastX = e.clientX;
            lastY = e.clientY;
            this.render();
        });
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.stopDescent();
            const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
            this.zoom = Math.max(0.05, Math.min(1e8, this.zoom * factor));
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

    // Continuously zooms toward descentTargetX/Y, panning the center toward
    // it as it goes and growing the iteration count with depth so fine
    // structure keeps resolving instead of washing out to flat color - the
    // "Infinite Descent" the page is named for.
    startDescent() {
        if (this.descending) return;
        this.descending = true;
        const step = () => {
            if (!this.descending) return;
            const zoomStep = 1 + 0.01 * this.descentSpeed;
            this.zoom = Math.min(this.maxDescentZoom, this.zoom * zoomStep);
            const pull = Math.min(1, 0.02 * this.descentSpeed);
            this.centerX += (this.descentTargetX - this.centerX) * pull;
            this.centerY += (this.descentTargetY - this.centerY) * pull;
            this.iterations = Math.min(1000, Math.max(100, Math.round(80 + Math.log2(this.zoom) * 25)));
            this.render();
            this.descendRafId = requestAnimationFrame(step);
        };
        this.descendRafId = requestAnimationFrame(step);
    }

    stopDescent() {
        this.descending = false;
        if (this.descendRafId) cancelAnimationFrame(this.descendRafId);
    }

    resize() {
        const cssToRealPixels = window.devicePixelRatio || 1;
        const displayWidth = Math.floor(this.canvas.clientWidth * cssToRealPixels);
        const displayHeight = Math.floor(this.canvas.clientHeight * cssToRealPixels);
        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        }
    }

    // Public hook for the external toolbar - call after changing any
    // property to redraw.
    render() {
        const gl = this.gl;
        gl.useProgram(this.program);
        gl.enableVertexAttribArray(this.positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.uniform2f(this.uniforms.resolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.uniform2f(this.uniforms.center, this.centerX, this.centerY);
        gl.uniform1f(this.uniforms.zoom, this.zoom);
        gl.uniform1i(this.uniforms.iterations, Math.round(this.iterations));
        gl.uniform1f(this.uniforms.escapeRadius, this.escapeRadius);
        gl.uniform1i(this.uniforms.paletteIndex, this.paletteIndex);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}

customElements.define('mm-burningship', MMBurningShip);
