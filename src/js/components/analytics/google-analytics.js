class GoogleAnalytics extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        const script1 = document.createElement('script');
        script1.setAttribute('async', '');
        script1.setAttribute('src', 'https://www.googletagmanager.com/gtag/js?id=G-B0BEV3T4NK');
        const script2 = document.createElement('script');
        script2.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-B0BEV3T4NK');
        `;
        shadow.appendChild(script1);
        shadow.appendChild(script2);
    }
}

customElements.define('google-analytics', GoogleAnalytics);