class GoogleAnalytics extends HTMLElement{constructor(){super();const t=this.attachShadow({mode:"open"}),e=document.createElement("script");e.setAttribute("async",""),e.setAttribute("src","https://www.googletagmanager.com/gtag/js?id=G-B0BEV3T4NK");const n=document.createElement("script");n.innerHTML="\n            window.dataLayer = window.dataLayer || [];\n            function gtag(){dataLayer.push(arguments);}\n            gtag('js', new Date());\n            gtag('config', 'G-B0BEV3T4NK');\n        ",t.appendChild(e),t.appendChild(n)}}customElements.define("google-analytics",GoogleAnalytics);