import { TemplateResult, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { BootstrapBase } from '../common/bootstrap-base';

@customElement('privacy-policy')
export class PrivacyPolicy extends BootstrapBase {
    static get styles() {
        const localStyles = css`
          :host {
            font-family: var(--subtitle-font);
          }
        `;
        return [
            BootstrapBase.styles,
            localStyles
        ];
    };

    render(): TemplateResult {
        return html`
            <div class="col-12 col-lg-6 offset-lg-3">
                <h1>Privacy Policy</h1>
                <p>
                    MessianicChords may collect your email address if you choose to provide it. Your email address will only be used to personalize the site for you, and will never be sold or shared with 3rd parties.
                </p>
                <p>
                    Don't want your account anymore? <a href="mailto:contact@messianicchords.com">Contact us</a> and we will remove your email and other related information.
                </p>
                <p>
                    Should this policy change in the future, we'll notify you through email.
                </p>
            </div>
        `;
    }
}