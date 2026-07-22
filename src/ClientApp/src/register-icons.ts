import { registerIconLibrary } from "@awesome.me/webawesome/dist/webawesome.js";

// Override Web Awesome's default (Font Awesome) icon library with locally hosted
// Bootstrap Icons served from /assets/icons. The Bootstrap SVGs use
// fill="currentColor", so no mutator is required.
registerIconLibrary("default", {
    resolver: (name: string) => `/assets/icons/${name}.svg`,
});
