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
        height: calc(100% - 60px);
        background-color: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(10px);
        overflow-x: hidden;
        transition: 0.3s ease-in-out;
        display: flex;
        flex-direction: column;
        padding-top: 60px;
        box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
        justify-content: space-between;
      }
      .sidebar.open {
        left: 0;
      }
      .kebab-menu {
        position: fixed;
        z-index: 99999;
        top: 20px;
        left: 20px;
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        height: 24px;
        padding: 0;
        outline: none;
      }
      .kebab-menu span {
        display: block;
        width: 25px;
        height: 3px;
        background: #595959;
        border-radius: 2px;
        transition: 0.3s ease-in-out;
      }
      .kebab-menu.open span:nth-child(1) {
        transform: rotate(45deg) translate(6px, 4px);
      }
      .kebab-menu.open span:nth-child(2) {
        opacity: 0;
      }
      .kebab-menu.open span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -5px);
      }
      .sidebar__list {
        list-style-type: none;
        padding: 0;
        margin: 0;
        flex-grow: 1;
      }
      .sidebar__list-item {
        padding: 10px 15px;
        transition: background-color 0.3s ease-in-out;
      }
      .sidebar__list-item:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
      .sidebar__link {
        text-decoration: none;
        color: #333;
        display: block;
        transition: color 0.3s ease-in-out;
        font-size: 16px;
        font-weight: 500;
      }
      .sidebar__link:hover {
        color: #000;
      }
      .sidebar__title {
        font-weight: 600;
        color: #000;
        padding: 15px 15px 10px;
        background: rgba(48, 95, 106, 0.1);
        margin-top: 10px;
        font-size: 18px;
      }
      .level-2 {
        padding-left: 30px;
        font-size: 14px;
      }
      .sidebar__list-item.level-2:hover {
        background-color: rgba(0, 0, 0, 0.03);
      }
      .git {
        text-align: center;
        display: block;
        padding: 10px;
        margin: 15px;
        border: 1px solid #ccc;
        border-radius: 8px;
        text-decoration: none;
        color: #333;
        font-weight: 500;
        background-color: rgba(255, 255, 255, 0.8);
        transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
      }
      .git:hover {
        background-color: #f8f8f8;
        color: #000;
      }
      .git img {
        vertical-align: middle;
        margin-left: 5px;
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
        <li class="sidebar__list-item level-2">
          <a class="sidebar__link" href="alhambra.html">Al Hambra Pattern</a>
        </li>
      </ul>
      <a href="https://github.com/sabithpocker/sabithpocker.github.io" class="git" target="_blank">
        Github link <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub Repo" width="20">
      </a>
    </div>
  `;

    this.kebabMenu = this.shadowRoot.getElementById('kebab-menu');
    this.sidebar = this.shadowRoot.getElementById('sidebar');

    // Toggle sidebar and kebab menu
    this.kebabMenu.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event from bubbling to the document
      this.sidebar.classList.toggle('open');
      this.kebabMenu.classList.toggle('open');
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
      if (this.sidebar.classList.contains('open') && !e.composedPath().includes(this.sidebar)) {
        this.sidebar.classList.remove('open');
        this.kebabMenu.classList.remove('open');
      }
    });
  }
}

customElements.define('side-bar', SideBar);