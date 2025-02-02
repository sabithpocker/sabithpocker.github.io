class SideBar extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.shadowRoot.innerHTML='\n        <style>\n          .sidebar {\n            position: fixed;\n            z-index: 998;\n            left: -250px;\n            width: 250px;\n            height: 100%;\n            background-color: rgba(255, 255, 255, 0.9);\n            backdrop-filter: blur(10px);\n            overflow-x: hidden;\n            transition: 0.3s ease-in-out;\n            display: flex;\n            flex-direction: column;\n            padding-top: 60px;\n            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);\n          }\n          .sidebar.open {\n            left: 0;\n          }\n          .kebab-menu {\n            position: fixed;\n            z-index: 99999; /* Increased z-index */\n            top: 20px;\n            left: 20px;\n            background: none;\n            border: none;\n            cursor: pointer;\n            display: flex;\n            flex-direction: column;\n            justify-content: space-around;\n            height: 24px;\n            padding: 0;\n            outline: none;\n          }\n          .kebab-menu span {\n            display: block;\n            width: 25px;\n            height: 3px;\n            background: #595959;\n            border-radius: 2px;\n            transition: 0.3s ease-in-out;\n          }\n          .kebab-menu.open span:nth-child(1) {\n            transform: rotate(45deg) translate(6px, 4px);\n          }\n          .kebab-menu.open span:nth-child(2) {\n            opacity: 0;\n          }\n          .kebab-menu.open span:nth-child(3) {\n            transform: rotate(-45deg) translate(7px, -5px);\n          }\n          .sidebar__list {\n            list-style-type: none;\n            padding: 0;\n            margin: 0;\n          }\n          .sidebar__list-item {\n            padding: 10px 15px;\n            transition: background-color 0.3s ease-in-out;\n          }\n          .sidebar__list-item:hover {\n            background-color: rgba(0, 0, 0, 0.05);\n          }\n          .sidebar__link {\n            text-decoration: none;\n            color: #333;\n            display: block;\n            transition: color 0.3s ease-in-out;\n            font-size: 16px;\n            font-weight: 500;\n          }\n          .sidebar__link:hover {\n            color: #000;\n          }\n          .sidebar__title {\n            font-weight: 600;\n            color: #000;\n            padding: 15px 15px 10px;\n            background: rgba(48, 95, 106, 0.1);\n            margin-top: 10px;\n            font-size: 18px;\n          }\n          .level-2 {\n            padding-left: 30px;\n            font-size: 14px;\n          }\n          .sidebar__list-item.level-2:hover {\n            background-color: rgba(0, 0, 0, 0.03);\n          }\n        </style>\n        <button class="kebab-menu" id="kebab-menu">\n          <span></span>\n          <span></span>\n          <span></span>\n        </button>\n        <div class="sidebar" id="sidebar">\n          <ul class="sidebar__list" id="sidebar-list">\n            <li class="sidebar__list-item">\n              <a class="sidebar__link" href="/">Home</a>\n            </li>\n            <li class="sidebar__list-item">\n              <a class="sidebar__link" href="about.html">About Me</a>\n            </li>\n            <li class="sidebar__title">Components</li>\n            <li class="sidebar__list-item level-2">\n              <a class="sidebar__link" href="spirograph.html">Spirograph</a>\n            </li>\n            <li class="sidebar__list-item level-2">\n              <a class="sidebar__link" href="sierpinski-fractal.html">Sierpinski Fractal</a>\n            </li>\n            <li class="sidebar__list-item level-2">\n              <a class="sidebar__link" href="mandelbrot.html">Mandelbrot Set</a>\n            </li>\n            <li class="sidebar__list-item level-2">\n              <a class="sidebar__link" href="koch-code.html">Koch Code</a>\n            </li>\n            <li class="sidebar__list-item level-2">\n              <a class="sidebar__link" href="generic-shader.html">Generic Shader</a>\n            </li>\n            <li class="sidebar__list-item level-2">\n              <a class="sidebar__link" href="audio-visualizer.html">Audio Visualizer</a>\n            </li>\n            <li class="sidebar__list-item level-2">\n              <a class="sidebar__link" href="alhambra.html">Al Hambra Pattern</a>\n            </li>\n          </ul>\n        </div>\n      ',this.kebabMenu=this.shadowRoot.getElementById("kebab-menu"),this.sidebar=this.shadowRoot.getElementById("sidebar"),this.kebabMenu.addEventListener("click",(n=>{n.stopPropagation(),this.sidebar.classList.toggle("open"),this.kebabMenu.classList.toggle("open")})),document.addEventListener("click",(n=>{this.sidebar.classList.contains("open")&&!n.composedPath().includes(this.sidebar)&&(this.sidebar.classList.remove("open"),this.kebabMenu.classList.remove("open"))}))}}customElements.define("side-bar",SideBar);