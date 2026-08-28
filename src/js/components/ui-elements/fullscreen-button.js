class FullscreenButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
        <style>
          @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');

          .fullscreen-control {
            position: fixed;
            top: 10px;
            right: 10px;
            cursor: pointer;
            font-size: 20px;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: white;
            background: rgba(20, 20, 24, 0.16);
            backdrop-filter: blur(2px) saturate(165%);
            -webkit-backdrop-filter: blur(2px) saturate(165%);
            border: 1px solid rgba(255, 255, 255, 0.28);
            border-radius: 50%;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.3);
            transition: background 0.2s ease;
          }
          .fullscreen-control:hover {
            background: rgba(20, 20, 24, 0.3);
          }
            @media (max-width: 768px) {
                :host {
                    display: none
                }
            }
        </style>
        <i id="fullscreen-control" class="fas fa-expand fullscreen-control"></i>
      `;

        this.initFullscreenControl();
    }

    initFullscreenControl() {
        const fullscreenControl = this.shadowRoot.getElementById('fullscreen-control');
        let isFullscreen = false;

        fullscreenControl.addEventListener('click', () => {
            if (!isFullscreen) {
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen();
                } else if (document.documentElement.mozRequestFullScreen) { /* Firefox */
                    document.documentElement.mozRequestFullScreen();
                } else if (document.documentElement.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
                    document.documentElement.webkitRequestFullscreen();
                } else if (document.documentElement.msRequestFullscreen) { /* IE/Edge */
                    document.documentElement.msRequestFullscreen();
                }
                fullscreenControl.classList.add('fa-compress');
                fullscreenControl.classList.remove('fa-expand');
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.mozCancelFullScreen) { /* Firefox */
                    document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) { /* IE/Edge */
                    document.msExitFullscreen();
                }
                fullscreenControl.classList.add('fa-expand');
                fullscreenControl.classList.remove('fa-compress');
            }
            isFullscreen = !isFullscreen;
        });
    }
}

customElements.define('fullscreen-button', FullscreenButton);
