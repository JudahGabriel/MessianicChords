import { html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { sharedStyles } from "../common/shared.styles";
import { homeJumbotronStyles } from "./home-jumbotron.styles";

@customElement("home-jumbotron")
export class HomeJumbotron extends LitElement {
    static styles = [sharedStyles, homeJumbotronStyles];

    @state() locationPath = "/";

    private readonly onAppRouteChanged = (e: Event) => this.routeChanged(e as CustomEvent);

    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener("app-route-changed", this.onAppRouteChanged);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener("app-route-changed", this.onAppRouteChanged);
    }

    routeChanged(e: CustomEvent) {
        this.locationPath = e.detail?.context?.url?.pathname || "";
    }

    get isOnHomePage(): boolean {
        return this.locationPath === "/" || this.locationPath === "";
    }

    render() {
        return html`
      <header class="d-flex justify-content-center flex-wrap d-print-none">
        <a href="/">
          <img src="/assets/images/128x128.png" alt="Messianic Chords logo" />
        </a>
        <div>
          <h1 class="mb-0">
            <a href="/">Messianic Chords</a>
          </h1>
          <!-- This is hidden on xs screen -->
          ${this.renderLargeSubheader()}
        </div>
      </header>
    `;
    }

    renderLargeSubheader(): TemplateResult {
        return html`
      <h2 class="large-subheader d-none">
        <span>Chord charts and lyrics for Messiah's music</span>
      </h2>
    `;
    }
}
