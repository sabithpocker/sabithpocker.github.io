class SideBar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.shadowRoot.innerHTML = `
        <style>
          .sidebar {
            position: fixed;
            z-index: 998;
            left: -250px;
            width: 250px;
            height: 100%;
            background-color: rgb(255 255 255 / 58%);
            overflow-x: hidden;
            transition: 0.3s;
            display: flex;
            flex-direction: column;
            padding-top: 60px;
          }
          .sidebar.open {
            left: 0;
          }
          .kebab-menu {
            position: fixed;
            z-index: 999;
            top: 20px;
            left: 20px;
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            justify-content: space-around;
            height: 24px;
          }
          .kebab-menu span {
            display: block;
            width: 25px;
            height: 3px;
            background: #595959;
            border: 1px solid #000;
          }
          .sidebar__list {
            list-style-type: none;
            padding: 0;
          }
          .sidebar__list-item {
            padding: 10px 15px;
          }
          .sidebar__link {
            text-decoration: none;
            color: black;
            display: block;
            transition: 0.3s;
          }
          .sidebar__link:hover {
            color: #333;
          }
          .sidebar__title {
            font-weight: 600;
            color: #000;
            padding: 10px 15px;
            background: #305f6a29;
          }
          .level-2 {
            padding-left: 30px;
          }
        </style>
        <button class="kebab-menu" id="kebab-menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div class="sidebar" id="sidebar">
          <ul class="sidebar__list" id="sidebar-list">
            <li class="sidebar__list-item">
              <a class="sidebar__link" href="/">Home</a>
            </li>
            <li class="sidebar__list-item">
              <a class="sidebar__link" href="about.html">About Me</a>
            </li>
            <li class="sidebar__title">Components</li>
            <li class="sidebar__list-item level-2">
              <a class="sidebar__link" href="spirograph.html">Spirograph</a>
            </li>
            <li class="sidebar__list-item level-2">
              <a class="sidebar__link" href="sierpinski-fractal.html">Sierpinski Fractal</a>
            </li>
            <li class="sidebar__list-item level-2">
              <a class="sidebar__link" href="mandelbrot.html">Mandelbrot Set</a>
            </li>
            <li class="sidebar__list-item level-2">
              <a class="sidebar__link" href="koch-code.html">Koch Code</a>
            </li>
            <li class="sidebar__list-item level-2">
              <a class="sidebar__link" href="generic-shader.html">Generic Shader</a>
            </li>
            <li class="sidebar__list-item level-2">
              <a class="sidebar__link" href="audio-visualizer.html">Audio Visualizer</a>
            </li>
          </ul>
        </div>
      `;

        this.kebabMenu = this.shadowRoot.getElementById('kebab-menu');
        this.sidebar = this.shadowRoot.getElementById('sidebar');

        this.kebabMenu.addEventListener('click', () => {
            this.sidebar.classList.toggle('open');
        });
    }
}

customElements.define('side-bar', SideBar);
