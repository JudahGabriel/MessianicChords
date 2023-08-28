import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { footerStyles } from "./footer.styles";
import { sharedStyles } from "../common/shared.styles";
import { bootstrapUtilities } from "../common/bootstrap-utilities.styles";

@customElement("app-footer")
export class AppFooter extends LitElement {
    static styles = [sharedStyles, bootstrapUtilities, footerStyles];

    render() {
        return html`
            <footer class="d-flex justify-content-center w-100 gap-5 p-2 d-print-none">
                <a href="/">Home</a>
                <a href="/about">About us, legal</a>
                <a target="_blank" href="https://blog.judahgabriel.com/2012/01/introducing-messianicchordscom.html">What is this site?</a>
                <a target="_blank" href="https://blog.judahgabriel.com">Author's blog</a>
                <a target="_blank" href="https://messianicradio.com">Chavah Messianic Radio</a>
            </footer>
        `;
    }
}