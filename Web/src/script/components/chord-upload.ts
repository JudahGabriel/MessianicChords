import { css, html, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators';
import { BootstrapBase } from '../common/bootstrap-base';
import { FileUploadService } from '../services/file-upload-service';

@customElement('chord-upload')
export class ChordUpload extends BootstrapBase {

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
    }

    @state() status: "default" | "uploading" | "success" | "error" = "default";
    readonly uploadService = new FileUploadService();

    render(): TemplateResult {
        if (this.status === "default") {
            return html`
                <span>Got chords to share?</span>
                <button class="btn btn-light ml-2" @click="${this.uploadButtonClicked}">
                    Upload
                </button>
                <input type="file" id="hidden-upload-input" class="d-none" accept=".doc, .docx, .gdoc, .pdf, .gif, .png, .tif" multiple
                    @change="${this.uploadFiles}" />
            `;
        }

        if (this.status === "uploading") {
            return html`
                <div class="alert alert-info" role="alert">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    Uploading, please wait...
                </div>
            `;
        }

        if (this.status === "error") {
            return html`
                <div class="alert alert-danger" role="alert">
                    Oops, we hit an error during upload. Please try again later.
                </div>
            `;
        }

        if (this.status === "success") {
            return html`
                <div class="alert alert-success" role="alert">
                    ✔ Chord sheets uploaded. We'll review them and get them on the site soon.
                </div>
            `;
        }

        return html``;
    }

    uploadButtonClicked() {
        const uploadInput = this.shadowRoot?.querySelector("#hidden-upload-input") as HTMLInputElement;
        console.log("zanz", uploadInput);
        if (uploadInput) {
            uploadInput.click();
        }
    }

    async uploadFiles(e: Event) {
        const fileInput = e.target as HTMLInputElement;
        if (!fileInput?.files) {
            return;
        }

        this.status = "uploading";
        try {
            await this.uploadService.upload(fileInput.files);
            this.status = "success";
        } catch (error) {
            console.error("Unable to upload chord sheets due to error", error);
            this.status = "error";
        }
    }
}