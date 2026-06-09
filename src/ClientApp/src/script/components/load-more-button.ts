import { html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { PagedList } from "../models/paged-list";
import { sharedStyles } from "../common/shared.styles";

@customElement("load-more-button")
export class LoadMoreButton extends LitElement {
    @property({ type: Object }) list: PagedList<unknown> | null = null;

    static styles = [sharedStyles];

    connectedCallback() {
        super.connectedCallback();
        if (this.list) {
            this.list.addEventListener("changed", () => this.requestUpdate());
        }
    }

    render(): TemplateResult {
        if (!this.list || !this.list.hasMoreItems) {
            return html``;
        }

        if (this.list.isLoading) {
            return this.renderLoading();
        }

        return html`
            <sl-button type="button" @click="${this.getNextChunk}">
                Load more...
            </sl-button>
        `;
    }

    renderLoading(): TemplateResult {
        return html`
            <sl-button type="button" disabled>
                <span class="spinner-border" role="status">
                    <span class="visually-hidden"></span>
                </span>
                <span>Loading...</span>
            </sl-button>
        `;
    }

    getNextChunk() {
        if (this.list) {
            this.list.fetch();
        }
    }
}