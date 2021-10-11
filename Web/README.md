# pwa-starter

<img loading="lazy" alt="an image of what the starter looks like" src="https://github.com/pwa-builder/pwa-starter/raw/main/assets/readme/intro.png"/>

Welcome to the [PWABuilder](https://www.pwabuilder.com/) pwa-starter! Looking to build a new [Progressive Web App](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) and not sure where to get started? This is what you are looking for! The pwa-starter includes everything you need to start building a production ready PWA and follows all best practices. You get:

- lazy-loaded routes using [@vaadin/router](https://vaadin.com/router).
- A 100 on [Lighthouse](https://developers.google.com/web/tools/lighthouse/), giving you a great starting point for performance and accessibility.
- Use [lit](https://lit.dev/) to build your PWA. lit gives you all of the developer experience of React with all the benefits of Web Components such as smaller bundles, simplicity and faster load times.
- Includes the [PWABuilder pwa-install component](https://github.com/pwa-builder/pwa-install#pwa-install) for an app store like PWA install experience.
- [Workbox](https://developers.google.com/web/tools/workbox/) for service workers along with the [PWABuilder pwa-update component](https://github.com/pwa-builder/pwa-update#pwa-update) to give your PWA a great offline experience.
- [FAST Components](https://www.fast.design/docs/components/getting-started/) for awesome, pre-built components using the Fluent Design Language.

**[Live Demo](https://pwa-starter-demo.glitch.me/)**

## Getting Started

### Supported Browsers
- Edge
- Chrome
- Firefox
- Safari

### Prequisites

You will need the following things properly installed on your computer.

* [Node.js](http://nodejs.org/) (with NPM)
* [NPM](https://www.npmjs.com/get-npm)

You should also be familiar with [TypeScript](https://www.typescriptlang.org/) which we use for this project. This helps give you more guidance as you code from [intellisense](https://code.visualstudio.com/docs/editor/intellisense) when using [VSCode](https://code.visualstudio.com/).

### Recommended Development setup

We recommend the following tools for your dev setup:

* Editor: [VSCode](https://code.visualstudio.com/)
* Terminal: [Windows Terminal](https://www.microsoft.com/en-us/p/windows-terminal-preview/9n0dx20hk701?activetab=pivot:overviewtab) or [hyper](https://hyper.is/)
* PWABuilder VSCode extension: [PWABuilder VSCode extension](https://marketplace.visualstudio.com/items?itemName=PWABuilder.pwabuilder-extension)
* lit-html VSCode extension: [lit-html VSCode extension](https://marketplace.visualstudio.com/items?itemName=bierner.lit-html)

### Development

Run `npm install` and then run `npm run dev`, the starter should open in your default browser. From here you can start developing, your changes will be rebuilt and reloaded in the browser as you develop.

### Building for Production

Run `npm run build`, the `dist/` folder will contain your built PWA. The production build will also generate a pre-caching service worker using [Workbox](https://developers.google.com/web/tools/workbox/modules/workbox-precaching).

## Deployment and Packaging

### Deployment

Once your PWA is ready to deploy we recommend [Azure static website hosting](https://docs.microsoft.com/en-us/learn/modules/publish-app-service-static-web-app-api/) for deploying your PWA.

### Packaging

Many app stores, including the Microsoft Store and the Google Play Store support PWAs. To package your PWA for deployment to these app stores head back to https://pwabuilder.com/, put in your URL and hit `Build My PWA`.

## Folder Structure

```
pwa-starter
│   README.md (docs)
│   rollup.config.js (bundler config https://rollupjs.org/)
|   tsconfig.json (TypeScript config https://www.typescriptlang.org/)
|   pwabuilder-sw.js (Service Worker https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
|   package.json (https://docs.npmjs.com/creating-a-package-json-file)
|   package-lock.json (https://docs.npmjs.com/files/package-lock.json)
|   manifest.json (web manifest https://developer.mozilla.org/en-US/docs/Web/Manifest)
|   index.prod.html (index.html file used for production builds)
|   index.html (index.html for dev builds)
|   *note*: The index.prod.html registers a service worker which caches assets, so index.html is used for dev builds
|   .gitignore (git config file https://git-scm.com/docs/gitignore)
│
└───src (most of your development will happen here)
│   │   global.css (used for global CSS styles and CSS variables)
│   │
│   └───script
│       │
│       |
|       └───components
|           |   header.ts (header component)
|       |
|       |
|       └───pages
|           |   app-index.ts (app-index component)
|           |   app-home.ts (app-home component)
|           |   app-about.ts (app-about component)

```
