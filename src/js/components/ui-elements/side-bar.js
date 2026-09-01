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
        background-color: rgba(20, 20, 24, 0.16);
        backdrop-filter: blur(2px) saturate(165%);
        -webkit-backdrop-filter: blur(2px) saturate(165%);
        border: 1px solid rgba(255, 255, 255, 0.28);
        border-right: none;
        border-radius: 0 24px 24px 0;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.3);
        overflow-x: hidden;
        transition: 0.3s ease-in-out;
        display: flex;
        flex-direction: column;
        padding-top: 60px;
        justify-content: space-between;
      }
      .sidebar.open {
        left: 0;
      }
      .kebab-menu {
        position: fixed;
        z-index: 99999;
        top: 10px;
        left: 10px;
        width: 48px;
        height: 48px;
        background: rgba(20, 20, 24, 0.16);
        backdrop-filter: blur(2px) saturate(165%);
        -webkit-backdrop-filter: blur(2px) saturate(165%);
        border: 1px solid rgba(255, 255, 255, 0.28);
        border-radius: 50%;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.3);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 5px;
        padding: 0;
        outline: none;
        transition: background 0.2s ease;
      }
      .kebab-menu:hover {
        background: rgba(20, 20, 24, 0.3);
      }
      .kebab-menu span {
        display: block;
        width: 20px;
        height: 2px;
        background: white;
        border-radius: 2px;
        transition: 0.3s ease-in-out;
      }
      .kebab-menu.open span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
      }
      .kebab-menu.open span:nth-child(2) {
        opacity: 0;
      }
      .kebab-menu.open span:nth-child(3) {
        transform: rotate(-45deg) translate(5px, -5px);
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
        background-color: rgba(255, 255, 255, 0.1);
      }
      .sidebar__link {
        text-decoration: none;
        color: rgba(255, 255, 255, 0.72);
        display: block;
        transition: color 0.3s ease-in-out;
        font-size: 16px;
        font-weight: 500;
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.3), 0 1px 2px rgba(0, 0, 0, 0.5);
      }
      .sidebar__link:hover {
        color: #fff;
      }
      .sidebar__title {
        font-weight: 600;
        color: #fff;
        padding: 15px 15px 10px;
        background: rgba(255, 255, 255, 0.08);
        margin-top: 10px;
        font-size: 18px;
        transition: background-color 0.3s ease-in-out;
      }
      .sidebar__title:hover {
        background: rgba(255, 255, 255, 0.16);
      }
      .sidebar__title .sidebar__link {
        color: inherit;
        font-size: inherit;
        font-weight: inherit;
      }
      .level-2 {
        padding-left: 30px;
        font-size: 14px;
      }
      .sidebar__list-item.level-2:hover {
        background-color: rgba(255, 255, 255, 0.06);
      }
      .git {
        text-align: center;
        display: block;
        padding: 10px;
        margin: 15px;
        border: 1px solid rgba(255, 255, 255, 0.28);
        border-radius: 12px;
        text-decoration: none;
        color: rgba(255, 255, 255, 0.85);
        font-weight: 500;
        background-color: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(2px) saturate(165%);
        -webkit-backdrop-filter: blur(2px) saturate(165%);
        transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
      }
      .git:hover {
        background-color: rgba(255, 255, 255, 0.16);
        color: #fff;
      }
      .git img {
        vertical-align: middle;
        margin-left: 5px;
        filter: invert(1);
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
        <li class="sidebar__title">
          <a class="sidebar__link" href="fractals.html">Fractals</a>
        </li>
        <li class="sidebar__list-item level-2">
          <a class="sidebar__link" href="mandelbrot.html">Mandelbrot / Multibrot</a>
        </li>
        <li class="sidebar__list-item level-2">
          <a class="sidebar__link" href="phoenix.html">Phoenix Fractal</a>
        </li>
        <li class="sidebar__list-item level-2">
          <a class="sidebar__link" href="burning-ship.html">Burning Ship</a>
        </li>

        <li class="sidebar__title">
          <a class="sidebar__link" href="recursive-geometry.html">Recursive Geometry</a>
        </li>
        <li class="sidebar__list-item level-2">
          <a class="sidebar__link" href="koch-code.html">Koch Code</a>
        </li>
        <li class="sidebar__list-item level-2">
          <a class="sidebar__link" href="koch-snowflake.html">Koch Snowflake</a>
        </li>
        <li class="sidebar__list-item level-2">
          <a class="sidebar__link" href="sierpinski-fractal.html">Sierpinski Fractal</a>
        </li>
        <li class="sidebar__list-item level-2">
          <a class="sidebar__link" href="spirograph.html">Spirograph</a>
        </li>

        <li class="sidebar__title">
          <a class="sidebar__link" href="chaos.html">Chaos &amp; Dynamical Systems</a>
        </li>
        <li class="sidebar__list-item level-2">
          <a class="sidebar__link" href="attractors.html">Strange Attractors</a>
        </li>

        <li class="sidebar__title">
          <a class="sidebar__link" href="topology.html">Topology</a>
        </li>
        <li class="sidebar__list-item level-2">
          <a class="sidebar__link" href="mobius.html">Mobius Strip</a>
        </li>

        <li class="sidebar__title">
          <a class="sidebar__link" href="patterns.html">Patterns &amp; Tessellation</a>
        </li>
        <li class="sidebar__list-item level-2">
          <a class="sidebar__link" href="alhambra.html">Al Hambra Pattern</a>
        </li>

        <li class="sidebar__title">
          <a class="sidebar__link" href="playground.html">Shader Playground</a>
        </li>
        <li class="sidebar__list-item level-2">
          <a class="sidebar__link" href="generic-shader.html">Generic Shader</a>
        </li>
        <li class="sidebar__list-item level-2">
          <a class="sidebar__link" href="audio-visualizer.html">Audio Visualizer</a>
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