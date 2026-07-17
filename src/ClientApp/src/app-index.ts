import { LitElement, TemplateResult, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import "./register-icons";
import { sharedStyles } from "./script/common/shared.styles";
import { indexStyles } from "./app-index.styles";
import { appRouter, RouteContext } from "./services/app-router";
import "./script/components/app-header";
import "./script/components/app-footer";

@customElement("app-index")
export class AppIndex extends LitElement {
    static styles = [sharedStyles, indexStyles];

    @state() route: unknown = html``;

    connectedCallback() {
        super.connectedCallback();
        appRouter.install((rendered: TemplateResult, context: RouteContext) => {
            this.route = rendered;
            window.dispatchEvent(new CustomEvent("app-route-changed", { detail: { context } }));
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        appRouter.uninstall();
    }

    render(): TemplateResult {
        return html`
            <div>
                <app-header></app-header>
                <main>
                    ${this.route}
                </main>

                
            </div>
        `;
    }
}
