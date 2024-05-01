class MandelbrotSet extends HTMLElement {
    connectedCallback() {
        this.render();
        window.addEventListener('resize', () => this.render()); // Redraw on window resize
    }

    render() {
        const canvas = document.createElement('canvas');
        canvas.id = 'mandelbrotCanvas';
        this.innerHTML = `<style>
        :host {
          display: grid;
        }
        canvas {
          width: 100%;
          min-height: 100%;
        }
        </style>`; // Clear previous canvas
        this.appendChild(canvas);

        this.resize(canvas); // Resize canvas initially
        const ctx = canvas.getContext('2d');


        const width = canvas.width;
        const height = canvas.height;

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        const maxIterations = 100;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cx = (x - width / 2) * 4 / width;
                const cy = (y - height / 2) * 4 / height;
                let zx = 0, zy = 0;
                let i = 0;
                for (; i < maxIterations; i++) {
                    const zxTemp = zx * zx - zy * zy + cx;
                    zy = 2 * zx * zy + cy;
                    zx = zxTemp;
                    if (zx * zx + zy * zy > 4) break; // Escape condition
                }

                const pixel = (y * width + x) * 4;
                const color = this.getColor(i, maxIterations);

                data[pixel] = color[0]; // Red channel
                data[pixel + 1] = color[1]; // Green channel
                data[pixel + 2] = color[2]; // Blue channel
                data[pixel + 3] = 255; // Alpha channel
            }
        }

        ctx.putImageData(imageData, 0, 0);
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

    getColor(i, maxIterations) {
        const t = i / maxIterations;
        const r = Math.floor(9 * (1 - t) * t * t * t * 255);
        const g = Math.floor(15 * (1 - t) * (1 - t) * t * t * 255);
        const b = Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255);

        return [r, g, b];
    }
}

customElements.define('mm-mandelbrot', MandelbrotSet);
