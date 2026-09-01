// Phoenix fractal: a Julia-style escape-time set using the recurrence
//   z(n+1) = z(n)^2 + c + p * z(n-1)
// (Shigehiro Ushiki's "Phoenix" family) - the extra p*z(n-1) term gives the
// iteration a one-step memory that plain Mandelbrot/Julia sets don't have,
// which is what produces its characteristic tendrils, feathers, and
// flame-like sprays instead of the more familiar bulb-and-spiral look.
//
// z0 is the pixel's position in the complex plane (Julia-style: c/p are
// fixed "instrument" parameters, not derived from the pixel), z(-1) = 0.
class MMPhoenix extends HTMLElement {
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

        // Instrument parameters - all directly settable as properties by an
        // external toolbar script, then render() redraws.
        this.centerX = 0;
        this.centerY = 0;
        this.zoom = 1;
        this.cReal = 0.5667;
        this.cImag = 0;
        this.pReal = -0.5;
        this.pImag = 0;
        this.iterations = 150;
        this.escapeRadius = 4;
        this.paletteIndex = 0;
        this.symmetry = 1;
        this.time = 0;
        // At the classic c/p below, the two lobes sit stacked top-to-bottom
        // along the imaginary axis - rotating a quarter turn puts them
        // side-by-side instead, which reads as a body with two spread wings
        // rather than a plain double spiral.
        this.rotation = Math.PI / 2;

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
            uniform vec2 u_c;
            uniform vec2 u_p;
            uniform int u_iterations;
            uniform float u_escapeRadius;
            uniform int u_paletteIndex;
            uniform int u_symmetry;
            uniform float u_time;
            uniform float u_rotation;
            out vec4 outColor;

            vec2 cmul(vec2 a, vec2 b) {
                return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
            }

            vec3 palette(float t, int idx) {
                vec3 a = vec3(0.5), b = vec3(0.5), c = vec3(1.0), d = vec3(0.0);
                if (idx == 0) { c = vec3(1.0, 1.0, 1.0); d = vec3(0.00, 0.33, 0.67); }
                else if (idx == 1) { a = vec3(0.6, 0.35, 0.2); b = vec3(0.4, 0.3, 0.2); c = vec3(2.0, 1.0, 0.0); d = vec3(0.5, 0.2, 0.1); }
                else if (idx == 2) { a = vec3(0.2, 0.4, 0.5); b = vec3(0.3, 0.4, 0.5); c = vec3(1.0, 0.8, 1.0); d = vec3(0.3, 0.4, 0.6); }
                else { a = vec3(0.55, 0.4, 0.55); b = vec3(0.45, 0.35, 0.45); c = vec3(1.5, 1.2, 1.0); d = vec3(0.1, 0.25, 0.4); }
                return a + b * cos(6.28318 * (c * t + d));
            }

            void main() {
                vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / (u_resolution.y * 0.5 * u_zoom);

                // Rotate the sampling coordinate around the view center
                // before iterating - a purely cosmetic reorientation of the
                // same fractal (doesn't change c/p/iteration math at all),
                // used to turn a top-bottom lobe pair into a side-by-side
                // "wings" pose.
                float cr = cos(u_rotation), sr = sin(u_rotation);
                uv = vec2(uv.x * cr - uv.y * sr, uv.x * sr + uv.y * cr);
                uv += u_center;

                // Optional N-fold kaleidoscope symmetry on the sampling
                // coordinate - a creative (not physically "correct") knob
                // that folds the plane into repeating wedges before
                // iterating, turning the tendrils into a mandala.
                if (u_symmetry > 1) {
                    float ang = atan(uv.y, uv.x);
                    float rad = length(uv);
                    float sector = 6.28318530718 / float(u_symmetry);
                    ang = mod(ang, sector);
                    ang = abs(ang - sector * 0.5);
                    uv = vec2(cos(ang), sin(ang)) * rad;
                }

                vec2 z = uv;
                vec2 zPrev = vec2(0.0);
                float escape2 = u_escapeRadius * u_escapeRadius;

                int i;
                for (i = 0; i < u_iterations; i++) {
                    vec2 zNext = cmul(z, z) + u_c + cmul(u_p, zPrev);
                    zPrev = z;
                    z = zNext;
                    if (dot(z, z) > escape2) break;
                }

                if (i >= u_iterations) {
                    outColor = vec4(0.0, 0.0, 0.0, 1.0);
                } else {
                    float smoothed = float(i) - log2(max(log2(dot(z, z) + 1e-6), 1e-6)) + 4.0;
                    float t = fract(smoothed * 0.025 + u_time * 0.015);
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
            c: gl.getUniformLocation(this.program, 'u_c'),
            p: gl.getUniformLocation(this.program, 'u_p'),
            iterations: gl.getUniformLocation(this.program, 'u_iterations'),
            escapeRadius: gl.getUniformLocation(this.program, 'u_escapeRadius'),
            paletteIndex: gl.getUniformLocation(this.program, 'u_paletteIndex'),
            symmetry: gl.getUniformLocation(this.program, 'u_symmetry'),
            time: gl.getUniformLocation(this.program, 'u_time'),
            rotation: gl.getUniformLocation(this.program, 'u_rotation'),
        };

        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1,
        ]), gl.STATIC_DRAW);
    }

    // Mouse-drag to pan, wheel to zoom toward the cursor - an "instrument"
    // like this is much more fun to actually explore than to only tweak via
    // sliders.
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
            const scale = 2 / (rect.height * this.zoom);
            this.centerX -= (e.clientX - lastX) * scale;
            this.centerY += (e.clientY - lastY) * scale;
            lastX = e.clientX;
            lastY = e.clientY;
            this.render();
        });
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
            this.zoom = Math.max(0.05, Math.min(1e6, this.zoom * factor));
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

    // Public hook for the external toolbar/animation loop (mirrors
    // mm-kochcode.js's render()) - call after changing any parameter
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
        gl.uniform2f(this.uniforms.c, this.cReal, this.cImag);
        gl.uniform2f(this.uniforms.p, this.pReal, this.pImag);
        gl.uniform1i(this.uniforms.iterations, Math.round(this.iterations));
        gl.uniform1f(this.uniforms.escapeRadius, this.escapeRadius);
        gl.uniform1i(this.uniforms.paletteIndex, this.paletteIndex);
        gl.uniform1i(this.uniforms.symmetry, Math.max(1, Math.round(this.symmetry)));
        gl.uniform1f(this.uniforms.time, this.time);
        gl.uniform1f(this.uniforms.rotation, this.rotation);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}

customElements.define('mm-phoenix', MMPhoenix);
