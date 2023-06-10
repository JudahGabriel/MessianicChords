import { LitElement, css, unsafeCSS, CSSResultGroup } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SizeMax } from './constants';
// @ts-ignore
import bootstrap from "bootstrap/dist/css/bootstrap.min.css";
// @ts-ignore
import reboot from "bootstrap/dist/css/bootstrap-reboot.min.css";
// @ts-ignore
import bootstrapUtils from "bootstrap/dist/css/bootstrap-utilities.min.css";

/**
 * Lit element that imports Bootstrap CSS.
 */
@customElement('bootstrap-base')
export class BootstrapBase extends LitElement {
    static get styles(): CSSResultGroup {

        const globalStyles = css`
            :host {
                --title-font: 'Homemade Apple', cursive;
                --subtitle-font: 'Lora', serif;
                --theme-color: #0b0974;
                --highlight-orange: #febf04;
                --highlight-background: linear-gradient(rgb(255, 214, 94) 0%, #febf04 100%);
                --highlight-border-radius: 60px 30px 35px 15px / 25px 38px 66px 53px;
                --highlight-box-shadow: rgb(255 214 94 / 90%) 2px 2px 10px;
            }

            a {
                transition: 0.4s linear color;
            }

            a:hover {
                color: brown;
            }

            .highlight {
                display: inline-block;
                font-family: var(--title-font);
                color: var(--theme-color);
                border-radius: var(--highlight-border-radius);
                background: var(--highlight-background);
                box-shadow: var(--highlight-box-shadow);
                transform: rotateZ(-1deg);
            }

            input::placeholder,
            textarea::placeholder {
                color: rgba(33, 37, 41, 0.4) !important;
            }

            @media(max-width: ${SizeMax.Xs}px) {
                .highlight {
                    display: block;
                    text-align: center;
                }
            }
        `;



        return [
            unsafeCSS(bootstrap),
            globalStyles
        ]
    }
}