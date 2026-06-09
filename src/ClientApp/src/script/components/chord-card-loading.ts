import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("chord-card-loading")
export class ChordCardLoading extends LitElement {

    static get styles(): CSSResultGroup {
        const localStyles = css`
            .card {
                width: 250px;
                margin: 10px 30px;
                padding: 10px;
            }
        `;

        return [
            localStyles
        ];
    }

    render(): TemplateResult {
        return html`
            <div class="card" aria-hidden="true">
                <div class="card-body">
                    <h5 class="card-title placeholder-glow">
                        <span class="placeholder col-6"></span>
                    </h5>
                    <p class="card-text placeholder-glow">
                        <span class="placeholder col-7"></span>
                        <span class="placeholder col-4"></span>
                        <span class="placeholder col-4"></span>
                        <span class="placeholder col-6"></span>
                        <span class="placeholder col-8"></span>
                    </p>
                </div>
            </div>
        `;
    }
}