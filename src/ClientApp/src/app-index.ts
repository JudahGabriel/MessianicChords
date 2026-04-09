import { LitElement, TemplateResult, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { Router } from "@vaadin/router";
import { sharedStyles } from "./script/common/shared.styles";
import { bootstrapUtilities } from "./script/common/bootstrap-utilities.styles";
import { indexStyles } from "./app-index.styles";
import "./script/components/home-jumbotron";
import "./script/components/footer";
import "./script/components/app-header";
import { bootstrapGridStyles } from "./script/common/bootstrap-grid.styles";

@customElement("app-index")
export class AppIndex extends LitElement {
    static styles = [sharedStyles, bootstrapUtilities, bootstrapGridStyles, indexStyles];

    @state() isHomePage = window.location.pathname === "/";

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener("vaadin-router-location-changed", this.onRouteChanged);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener("vaadin-router-location-changed", this.onRouteChanged);
    }

    private onRouteChanged = (e: Event) => {
        const path = (e as CustomEvent).detail?.location?.pathname || "";
        this.isHomePage = path === "/" || path === "";
    };

    firstUpdated() {
        // For more info on using the @vaadin/router check here https://vaadin.com/router
        const router = new Router(this.shadowRoot?.querySelector("#routerOutlet"));
        
        router.setRoutes([
            // temporarily cast to any because of a Type bug with the router
            {
                path: "",
                animate: true,
                children: [
                    { path: "/", component: "app-home", action: async () => await import("./script/pages/app-home") },
                ],
            },
            { path: "/chordsheets/new", component: "chord-edit", action: async () => await import("./script/pages/chord-edit") } as any,
            { path: "/chordsheets/new/success", component: "chord-edit-successful", action: async () => await import("./script/pages/chord-edit-successful") as any },
            { path: "/chordsheets/:id/edit/success", component: "chord-edit-successful", action: async () => await import("./script/pages/chord-edit-successful") } as any,
            { path: "/chordsheets/:id/edit", component: "chord-edit", action: async () => await import("./script/pages/chord-edit") } as any,
            { path: "/chordsheets/:id", component: "chord-details", action: async () => await import("./script/pages/chord-details") } as any,
            { path: "/browse/newest", component: "browse-newest", action: async () => await import("./script/pages/browse-newest") } as any,
            { path: "/browse/songs", component: "browse-songs", action: async () => await import("./script/pages/browse-songs") } as any,
            { path: "/browse/artists", component: "browse-artists", action: async () => await import("./script/pages/browse-artists") } as any,
            { path: "/browse/random", component: "browse-random", action: async () => await import("./script/pages/browse-random") } as any,
            { path: "/artist/:name", component: "artist-songs", action: async () => await import("./script/pages/artist-songs") } as any,
            { path: "/about", component: "app-about", action: async () => await import("./script/pages/app-about") } as any
        ]);
    }

    render(): TemplateResult {
        return html`
            <div>
                <app-header></app-header>
                ${this.renderHomeJumbotron()}
                <main>
                    <div id="routerOutlet"></div>
                </main>

                <app-footer></app-footer>
            </div>
        `;
    }

    renderHomeJumbotron(): TemplateResult {
        if (!this.isHomePage) {
            return html``;
        }

        return html`<home-jumbotron></home-jumbotron>`;
    }
}
