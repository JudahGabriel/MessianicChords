import { LitElement, css, CSSResultGroup } from 'lit';
import { customElement } from 'lit/decorators.js';
import { bootstrapGridStyles } from "./bootstrap-grid.styles";

/**
 * Lit element that imports Bootstrap CSS.
 */
@customElement('bootstrap-base')
export class BootstrapBase extends LitElement {
    static get styles(): CSSResultGroup {

        const globalStyles = css`

        `;



        return [
            bootstrapGridStyles,
            globalStyles
        ]
    }
}