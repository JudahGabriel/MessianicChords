import { LitElement, TemplateResult, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { sharedStyles } from "./script/common/shared.styles";
import { indexStyles } from "./app-index.styles";
import { appRouter, RouteContext } from "./services/app-router";
import "./script/components/app-header";
import "./script/components/app-footer";

@customElement("app-index")
export class AppIndex extends LitElement {
    static styles = [sharedStyles, indexStyles];

    @state() route: unknown = html``;

    disconnectedCallback() {
        super.disconnectedCallback();
        appRouter.removeEventListener("route-changed", this.onRouteChanged);
        appRouter.uninstall();
    }

    private onRouteChanged = (e: Event) => {
        const context = (e as CustomEvent).detail?.context as RouteContext | undefined;
        this.route = appRouter.render() ?? html``;
        window.dispatchEvent(new CustomEvent("app-route-changed", { detail: { context } }));
    };

    firstUpdated() {
        appRouter.addEventListener("route-changed", this.onRouteChanged);
        this.route = appRouter.render();
    }

    render(): TemplateResult {
        return html`
            <div>
                <app-header></app-header>
                <main>
                    ${this.route}
                </main>

                <app-footer></app-footer>
            </div>
        `;
    }
}
