import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { footerStyles } from "./footer.styles";
import { sharedStyles } from "../common/shared.styles";

@customElement("app-footer")
export class AppFooter extends LitElement {
    static styles = [sharedStyles, footerStyles];

    render() {
        return html`
            <footer class="d-flex d-print-none">
                <a href="/">Home</a>
                <a href="/about">About</a>
                <a href="/contact">Contact us</a>
                <a target="_blank" href="https://blog.judahgabriel.com/2012/01/introducing-messianicchordscom.html">What is this site?</a>
                <a target="_blank" href="https://blog.judahgabriel.com">Author's blog</a>
                <a target="_blank" href="https://messianicradio.com">Chavah Messianic Radio</a>
            </footer>
        `;
    }
}