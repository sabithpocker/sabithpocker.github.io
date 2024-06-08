
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
            position: absolute;
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
            background: #000;
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
            <!--<li class="sidebar__list-item">
              <a class="sidebar__link" href="portfolio.html">Portfolio</a>
            </li>
            <li class="sidebar__list-item">
              <a class="sidebar__link" href="spirograph.html">Spirograph</a>
            </li>
            <li class="sidebar__list-item">
              <a class="sidebar__link" href="sierpinski.html">Sierpinski Fractal</a>
            </li>
            <li class="sidebar__list-item">
              <a class="sidebar__link" href="mandelbrot.html">Mandelbrot Set</a>
            </li>
            <li class="sidebar__list-item">
              <a class="sidebar__link" href="kochcode.html">Koch Code</a>
            </li>-->
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
