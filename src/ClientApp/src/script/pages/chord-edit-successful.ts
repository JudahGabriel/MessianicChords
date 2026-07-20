import { css, html, LitElement, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { RouteLocation } from "../common/route-location";
import { sharedStyles } from "../common/shared.styles";
import { phonesOnly } from "../common/breakpoints";

@customElement("chord-edit-successful")
export class ChordEditSuccessful extends LitElement {
    location: RouteLocation | null = null; // injected by the router

    static styles = [sharedStyles, css`
        :host {
            display: block;
        }

        .page-shell {
            min-height: 72vh;
            display: grid;
            place-items: center;
            padding: 2rem 1rem;
        }

        .success-card {
            width: min(680px, 100%);
            border-radius: 18px;
            border: 1px solid var(--wa-color-brand-border-normal);
            background: linear-gradient(160deg, var(--app-surface) 0%, var(--wa-color-brand-fill-quiet) 100%);
            box-shadow: 0 18px 40px rgb(21 19 121 / 12%);
            padding: 2rem;
            text-align: center;

            ${phonesOnly()} {
                max-width: 95%;
            }
        }

        .badge {
            width: 3rem;
            height: 3rem;
            margin: 0 auto 1rem;
            border-radius: 999px;
            display: grid;
            place-items: center;
            font-size: 1.5rem;
            color: var(--wa-color-brand-on-quiet);
            background: var(--wa-color-brand-fill-quiet);
            border: 1px solid var(--wa-color-brand-border-normal);
            box-shadow: 0 4px 10px rgb(21 19 121 / 12%);
        }

        h1 {
            margin: 0 0 0.75rem;
            font-family: var(--title-font);
            font-size: 2rem;
            color: var(--theme-color);
            line-height: 1.25;
        }

        p {
            margin: 0 0 1.5rem;
            font-family: var(--subtitle-font);
            font-size: 1.1rem;
            color: var(--app-text-muted);
        }

        .cta-link {
            display: inline-block;
            font-family: var(--subtitle-font);
            font-weight: 700;
            text-decoration: none;
            color: #ffffff;
            background: linear-gradient(180deg, var(--wa-color-brand-30) 0%, var(--wa-color-brand-10) 100%);
            border-radius: 999px;
            padding: 0.75rem 1.35rem;
            box-shadow: 0 8px 16px rgb(21 19 121 / 24%);
            transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .cta-link:hover,
        .cta-link:focus-visible {
            color: #ffffff;
            transform: translateY(-1px);
            box-shadow: 0 10px 20px rgb(21 19 121 / 30%);
        }

        @media (max-width: 640px) {
            .success-card {
                padding: 1.5rem;
            }

            h1 {
                font-size: 1.6rem;
            }
        }
    `];

    render(): TemplateResult {
        return html`
            <div class="page-shell">
                <section class="success-card" aria-live="polite">
                    <div class="badge" aria-hidden="true">✓</div>
                    <h1>Submission successful</h1>
                    <p>Thank you. We will review your submission soon.</p>
                    ${this.renderReturnLink()}
                </section>
            </div>
        `;
    }

    renderReturnLink(): TemplateResult {
        const id = this.location?.params?.["id"];
        if (id) {
            return html`<a class="cta-link" href="/chordsheets/${id}">Return to chord sheet</a>`;
        }

        return html`<a class="cta-link" href="/">Return home</a>`;
    }
}
