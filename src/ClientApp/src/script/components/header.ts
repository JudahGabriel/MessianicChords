import { html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { sharedStyles } from "../common/shared.styles";
import { headerStyles } from "./header.styles";
import { bootstrapUtilities } from "../common/bootstrap-utilities.styles";
import "@shoelace-style/shoelace/dist/components/alert/alert.js";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";

@customElement("app-header")
export class AppHeader extends LitElement {
    static styles = [sharedStyles, bootstrapUtilities, headerStyles];

  @state() locationPath = "/";
  @state() isOnline: boolean = navigator.onLine;
  @state() hideOfflineAlert = false;

  constructor() {
      super();
  }

  connectedCallback() {
      super.connectedCallback();
      window.addEventListener("vaadin-router-location-changed", e => this.routeChanged(e as CustomEvent));
      window.addEventListener("online", () => this.isOnline = navigator.onLine);
      this.listenForOfflineStatusChange();
  }

  disconnectedCallback() {
      super.disconnectedCallback();
      window.removeEventListener("vaadin-router-location-changed", e => this.routeChanged(e as CustomEvent));
  }

  async listenForOfflineStatusChange() {
      const module = await import("../services/online-detector");
      const detector = new module.OnlineDetector();
      detector.checkOnline().then(result => this.isOnline = result);
  }

  routeChanged(e: CustomEvent) {
      this.locationPath = e.detail?.location?.pathname || "";
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
        <!-- On XS screen, show the subtitle beneath the  -->
        ${this.renderPhoneSubheader()}
      </header>

      <div class="d-flex justify-content-center d-print-none">
        ${this.renderOfflineStatus()}
      </div>
    `;
  }

  renderLargeSubheader(): TemplateResult {
      return html`
      <h2 class="d-none d-sm-inline-block">
        <span>Chord charts and lyrics for Messiah's music</span>
      </h2>
    `;
  }

  renderPhoneSubheader(): TemplateResult {
      if (!this.isOnHomePage) {
          return html``;
      }

      return html`
      <h2 class="d-block d-sm-none w-100 text-center">
        <span>Chord charts for Messiah's music</span>
      </h2>
    `;
  }

  renderOfflineStatus(): TemplateResult {
      if (this.isOnline || this.hideOfflineAlert) {
          return html``;
      }

      return html`
        <sl-alert variant="primary" open closable class="alert-closable">
            <sl-icon slot="icon" name="info-circle"></sl-icon>
            <strong>You're offline.</strong> You can view chord charts you previously viewed while online.
        </sl-alert>
      `;
  }
}
