// Strange attractors: Clifford and Peter de Jong maps. Unlike the escape-time
// fractals elsewhere on this site (Mandelbrot, Phoenix, Burning Ship), these
// aren't rendered per-pixel independently - each point depends on the last,
// so the image is built by iterating one chaotic orbit millions of times and
// accumulating a density histogram of where it lands, then colorizing by
// (log) density. That's why this is a plain 2D canvas, not a WebGL shader.
//
// Both formulas take exactly four parameters (a, b, c, d) and are provably
// bounded (every term is a sum of sin/cos, whose range is [-1,1]), so the
// view window can be computed exactly from the parameters instead of needing
// a fit-to-data pass:
//   De Jong:  x' = sin(a*y) - cos(b*x),      y' = sin(c*x) - cos(d*y)       -> always in [-2,2]x[-2,2]
//   Clifford: x' = sin(a*y) + c*cos(a*x),    y' = sin(b*x) + d*cos(b*y)     -> in [-(1+|c|),1+|c|] x [-(1+|d|),1+|d|]
class MMAttractor extends HTMLElement {
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.canvas = document.createElement('canvas');
        this.shadowRoot.innerHTML = `<style>
            :host { display: block; width: 100%; height: 100%; background: #000; }
            canvas { width: 100%; height: 100%; display: block; }
        </style>`;
        this.shadowRoot.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        this.type = 'clifford';
        this.a = -1.4;
        this.b = 1.6;
        this.c = 1.0;
        this.d = 0.7;
        this.paletteIndex = 0;
        this.pointBudget = 4_000_000;
        this.pointsPerFrame = 60_000;

        this.resize();
        this.reset();
        this._loop();
        window.addEventListener('resize', () => { this.resize(); this.reset(); });
    }

    resize() {
        const cssToRealPixels = Math.min(window.devicePixelRatio || 1, 2);
        const displayWidth = Math.max(1, Math.floor(this.clientWidth * cssToRealPixels));
        const displayHeight = Math.max(1, Math.floor(this.clientHeight * cssToRealPixels));
        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
        }
    }

    // (Re)starts accumulation from scratch - required whenever type/a/b/c/d
    // change, since a density histogram for one parameter set is meaningless
    // for another. Call after changing any property.
    reset() {
        const w = this.canvas.width, h = this.canvas.height;
        this.histogram = new Float32Array(w * h);
        this.maxDensity = 1;
        this.totalIterations = 0;

        if (this.type === 'dejong') {
            this.xMin = -2; this.xMax = 2;
            this.yMin = -2; this.yMax = 2;
        } else {
            const cx = 1 + Math.abs(this.c) + 0.05;
            const cy = 1 + Math.abs(this.d) + 0.05;
            this.xMin = -cx; this.xMax = cx;
            this.yMin = -cy; this.yMax = cy;
        }

        this.x = 0.1;
        this.y = 0.1;
        // Warm up off-histogram so the orbit settles onto the attractor
        // before any point is recorded (standard practice - otherwise the
        // initial transient shows up as a stray streak).
        for (let i = 0; i < 50; i++) this._step();
    }

    _step() {
        const { x, y, a, b, c, d } = this;
        let nx, ny;
        if (this.type === 'dejong') {
            nx = Math.sin(a * y) - Math.cos(b * x);
            ny = Math.sin(c * x) - Math.cos(d * y);
        } else {
            nx = Math.sin(a * y) + c * Math.cos(a * x);
            ny = Math.sin(b * x) + d * Math.cos(b * y);
        }
        this.x = nx;
        this.y = ny;
    }

    // Not every (a,b,c,d) produces a chaotic attractor - plenty of random
    // picks converge to a fixed point or a short cycle instead, which would
    // render as a near-blank image. Runs a cheap, throwaway simulation (does
    // not touch the live histogram/state) and scores how much of the plane
    // the orbit actually covers, so the caller (attractors.js's Randomize
    // handler) can reject boring picks and try again before committing to
    // one.
    probeSpread(type, a, b, c, d) {
        let x = 0.1, y = 0.1;
        const step = () => {
            let nx, ny;
            if (type === 'dejong') {
                nx = Math.sin(a * y) - Math.cos(b * x);
                ny = Math.sin(c * x) - Math.cos(d * y);
            } else {
                nx = Math.sin(a * y) + c * Math.cos(a * x);
                ny = Math.sin(b * x) + d * Math.cos(b * y);
            }
            x = nx; y = ny;
        };
        for (let i = 0; i < 60; i++) step();

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        const seen = new Set();
        for (let i = 0; i < 2000; i++) {
            step();
            if (!isFinite(x) || !isFinite(y)) return 0;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            seen.add(((x * 50) | 0) + ',' + ((y * 50) | 0));
        }
        return ((maxX - minX) + (maxY - minY)) * seen.size;
    }

    _accumulate(count) {
        const w = this.canvas.width, h = this.canvas.height;
        const xScale = (w - 1) / (this.xMax - this.xMin);
        const yScale = (h - 1) / (this.yMax - this.yMin);
        let maxDensity = this.maxDensity;
        for (let i = 0; i < count; i++) {
            this._step();
            const px = (this.x - this.xMin) * xScale;
            const py = (this.y - this.yMin) * yScale;
            if (px < 0 || px >= w || py < 0 || py >= h) continue;
            const idx = (py | 0) * w + (px | 0);
            const v = this.histogram[idx] + 1;
            this.histogram[idx] = v;
            if (v > maxDensity) maxDensity = v;
        }
        this.maxDensity = maxDensity;
        this.totalIterations += count;
    }

    _paint() {
        const w = this.canvas.width, h = this.canvas.height;
        const imageData = this.ctx.createImageData(w, h);
        const data = imageData.data;
        const logMax = Math.log(1 + this.maxDensity);
        const palette = this._paletteFn();
        for (let i = 0; i < this.histogram.length; i++) {
            const v = this.histogram[i];
            if (v === 0) continue;
            const t = Math.log(1 + v) / logMax;
            const [r, g, bch] = palette(t);
            const o = i * 4;
            data[o] = r; data[o + 1] = g; data[o + 2] = bch; data[o + 3] = 255;
        }
        this.ctx.putImageData(imageData, 0, 0);
    }

    _paletteFn() {
        // t in [0,1] (log-scaled density) -> [r,g,b] 0-255.
        const idx = this.paletteIndex;
        if (idx === 0) { // Mono - classic single-hue glow
            return (t) => { const v = Math.pow(t, 0.45) * 255; return [v * 0.75, v * 0.9, v]; };
        } else if (idx === 1) { // Ember
            return (t) => {
                const v = Math.pow(t, 0.45);
                return [255 * v, 140 * v * v, 30 * v * v * v];
            };
        } else if (idx === 2) { // Neon
            return (t) => {
                const v = Math.pow(t, 0.4);
                return [255 * Math.pow(v, 1.6), 255 * v, 255 * Math.pow(v, 0.6)];
            };
        }
        // Aurora
        return (t) => {
            const v = Math.pow(t, 0.45);
            return [80 * v, 255 * Math.pow(v, 0.7), 180 * v + 60 * v * v];
        };
    }

    _loop() {
        let lastPaint = 0;
        const PAINT_INTERVAL_MS = 66; // ~15fps repaint - accumulation still runs every rAF tick
        const tick = (now) => {
            if (this.totalIterations < this.pointBudget) {
                this._accumulate(this.pointsPerFrame);
            }
            if (now - lastPaint > PAINT_INTERVAL_MS) {
                lastPaint = now;
                this._paint();
            }
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }
}

customElements.define('mm-attractor', MMAttractor);
