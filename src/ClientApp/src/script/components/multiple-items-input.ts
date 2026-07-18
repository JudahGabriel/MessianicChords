import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { guid } from "../common/utils";
import { createRef, ref } from "lit/directives/ref.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";

@customElement("multiple-items-input")
export class MultipleItemsInput extends LitElement {
    @state() id = guid();
    @property({ type: Array }) items: string[] = [];
    @property() placeholder = "";
    @property({ attribute: "aria-label" }) ariaLabel = "";
    @property({ attribute: "help" }) help = "";
    @property() value = "";
    @property({ attribute: "add-label" }) addLabel = "+";
    @property({ attribute: "add-tooltip" }) addTooltip = "Add another";
    @property({ attribute: "item-tooltip" }) itemTooltip = "Remove this item";
    @property({ attribute: "input-id" }) inputId = `input-${this.id}`;
    @property() invalid: string | null | undefined = undefined;
    @property() type: "text" | "url" | undefined = undefined;
    inputRef = createRef<HTMLInputElement>();

    static get styles() {
        return css`
            .input-row {
                display: flex;
                gap: var(--wa-space-xs);
                align-items: flex-end;
            }

            .input-row wa-input {
                flex: 1;
            }

            .item-list {
                list-style: none;
                padding: 0;
                margin-top: var(--wa-space-s);
            }

            .item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--wa-space-s) var(--wa-space-m);
                border: 1px solid var(--wa-color-neutral-80);
                border-radius: var(--wa-border-radius-m);
                margin-bottom: var(--wa-space-xs);
            }

            .text-break {
                word-break: break-all;
            }

            .help-text {
                font-size: var(--wa-font-size-s);
                color: var(--wa-color-neutral-50);
                margin-top: var(--wa-space-xs);
            }

            .invalid-text {
                color: var(--wa-color-danger-50);
                font-size: var(--wa-font-size-s);
                margin-top: var(--wa-space-xs);
            }
        `;
    }

    render(): TemplateResult {
        return html`
            <div class="input-row">
                <wa-input
                    id="${this.inputId}"
                    value="${this.value}"
                    placeholder="${this.items.length === 0 ? this.placeholder : ""}"
                    aria-label="${this.ariaLabel}"
                    ?data-user-invalid="${this.invalid === "true"}"
                    @input="${(e: Event) => this.value = (e.target as HTMLInputElement).value}"
                    @change="${this.inputChanged}"
                    @keydown="${this.handleKeyDown}"
                    ${ref(this.inputRef)}>
                </wa-input>
                <wa-button id="add-item-btn-${this.id}" @click="${this.addButtonClicked}" title="${this.addTooltip}">
                    ${this.addLabel}
                </wa-button>
            </div>
            ${this.invalid === "true" ? html`<div class="invalid-text"><slot name="invalid-feedback"></slot></div>` : ""}
            ${this.renderItems()}
            ${this.renderHelpText()}
        `;
    }

    addButtonClicked() {
        this.addItem();
        if (this.inputRef.value) {
            this.inputRef.value.focus();
        }
    }

    addItem() {
        let trimmedValue = this.value.trim();
        if (trimmedValue && !this.items.includes(trimmedValue) && trimmedValue !== ",") {

            // Are we a URL type? Ensure it starts with http:// or https://.
            if (this.type === "url") {
                const trimmedValueLower = trimmedValue.toLowerCase();
                if (!trimmedValueLower.startsWith("https://") && !trimmedValueLower.startsWith("http://")) {
                    trimmedValue = "https://" + trimmedValue;
                }
            }

            this.mutateItems(() => this.items.push(trimmedValue));
        }

        this.clearInput();
    }

    removeItem(item: string): void {
        const removedItemIndex = this.items.indexOf(item);
        if (removedItemIndex !== -1) {
            this.mutateItems(() => this.items.splice(removedItemIndex, 1));
        }
    }

    renderItems(): TemplateResult {
        if (!this.items || this.items.length === 0) {
            return html``;
        }

        return html`
            <ul class="item-list">
                ${repeat(this.items, l => l, l => this.renderItem(l))}
            </ul>
        `;
    }

    renderHelpText(): TemplateResult {
        if (!this.help || this.items.length > 0) {
            return html``;
        }

        return html`
            <div id="help-text-${this.id}" class="help-text">${this.help}</div>
        `;
    }

    renderItem(item: string): TemplateResult {
        const isLink = item && item.startsWith("https://");
        const text = isLink ? item.replace("https://", "") : item;
        const textContent = html`<span class="text-break">${text}</span>`;
        const content = isLink ?
            html`<a href="${item}" target="_blank">${textContent}</a>` :
            textContent;
        return html`
            <li class="item">
                ${content}
                <wa-button appearance="plain" aria-label="Remove" @click="${() => this.removeItem(item)}" title="${this.itemTooltip}"><wa-icon name="x-lg"></wa-icon></wa-button>
            </li>
        `;
    }

    handleKeyDown(e: KeyboardEvent): void {
        const isAddKey = e.key === "," || e.code === "Enter";
        if (isAddKey) {
            this.addItem();
            e.preventDefault();
        }
    }

    clearInput(): void {
        this.value = "";
        const inputElement = this.inputRef.value as HTMLInputElement;
        if (inputElement) {
            inputElement.value = "";
        }
    }

    inputChanged(): void {
        this.addItem();
    }

    mutateItems(mutator: () => void) {
        mutator();
        this.requestUpdate();
    }
}
