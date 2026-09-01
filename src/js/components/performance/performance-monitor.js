class PerformanceMonitor extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.shadowRoot.innerHTML = `
            <style>
                #container {
                    position: fixed;
                    bottom: 10px;
                    right: 10px;
                    background-color: rgba(20, 20, 24, 0.16);
                    backdrop-filter: blur(2px) saturate(165%);
                    -webkit-backdrop-filter: blur(2px) saturate(165%);
                    border: 1px solid rgba(255, 255, 255, 0.28);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.3);
                    color: rgba(255, 255, 255, 0.72);
                    text-shadow: 0 0 10px rgba(255, 255, 255, 0.3), 0 1px 2px rgba(0, 0, 0, 0.35);
                    padding: 12px 16px;
                    border-radius: 16px;
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    z-index: 1000;
                }
                @media (max-width: 768px) {
                    :host {
                        display: none
                    }
                }
            </style>
            <div id="container">
                <div>CPU Usage: <span id="cpuUsage">0%</span></div>
                <div>Memory Usage: <span id="memoryUsage">0 MB</span></div>
                <div>GPU Usage: <span id="gpuUsage">0%</span></div>
                <div>FPS: <span id="fps">0</span></div>
            </div>
        `;

        this.cpuUsageElement = this.shadowRoot.getElementById('cpuUsage');
        this.memoryUsageElement = this.shadowRoot.getElementById('memoryUsage');
        this.gpuUsageElement = this.shadowRoot.getElementById('gpuUsage');
        this.fpsElement = this.shadowRoot.getElementById('fps');

        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.fps = 0;

        this.updateMetrics();
        this.calculateFps();
    }

    connectedCallback() {
        this.updateMetrics();
        this.calculateFps();
    }

    // Placeholder function for getting CPU usage
    getCpuUsage() {
        return 0; // Replace with actual CPU usage retrieval logic
    }

    // Placeholder function for getting Memory usage
    getMemoryUsage() {
        return performance.memory.usedJSHeapSize / 1048576; // Convert from bytes to MB
    }

    // Placeholder function for getting GPU usage
    getGpuUsage() {
        return 0; // Replace with actual GPU usage retrieval logic
    }

    // Function to calculate FPS
    calculateFps() {
        const now = performance.now();
        const delta = now - this.lastFrameTime;
        this.frameCount++;
        if (delta >= 1000) {
            this.fps = (this.frameCount / delta) * 1000;
            this.frameCount = 0;
            this.lastFrameTime = now;
        }
        this.fpsElement.textContent = this.fps.toFixed(2);
        requestAnimationFrame(this.calculateFps.bind(this));
    }

    // Update performance metrics
    updateMetrics() {
        this.cpuUsageElement.textContent = this.getCpuUsage().toFixed(2) + '%';
        this.memoryUsageElement.textContent = this.getMemoryUsage().toFixed(2) + ' MB';
        this.gpuUsageElement.textContent = this.getGpuUsage().toFixed(2) + '%';
        setTimeout(this.updateMetrics.bind(this), 1000); // Update every second
    }
}

customElements.define('mm-performance-monitor', PerformanceMonitor);
