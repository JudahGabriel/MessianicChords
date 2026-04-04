import { Router, RouterLocation } from "@vaadin/router";
import { html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { bytesToText, emptyChordSheet } from "../common/utils";
import { ChordSheet } from "../models/interfaces";
import { ChordService } from "../services/chord-service";
import "../components/multiple-items-input.js";

import "@shoelace-style/shoelace/dist/components/input/input.js";
import "@shoelace-style/shoelace/dist/components/textarea/textarea.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/checkbox/checkbox.js";
import "@shoelace-style/shoelace/dist/components/alert/alert.js";
import "@shoelace-style/shoelace/dist/components/skeleton/skeleton.js";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";
import "@shoelace-style/shoelace/dist/components/icon-button/icon-button.js";
import "@shoelace-style/shoelace/dist/components/spinner/spinner.js";
import { chordEditStyles } from "./chord-edti.styles";

@customElement("chord-edit")
export class ChordEdit extends LitElement {
    static styles = [chordEditStyles];

    @state() isNewChordSheet = false;
    @state() chord: ChordSheet | null = null;
    @state() error: string | null = null;
    @state() attachments: Array<File> = [];
    @state() submitError: string | null = null;
    @state() invalidFieldName: "name" | "artist-authors" | "chords" | "attachments" | "" = "";
    @state() isSubmitting = false;

    location: RouterLocation | null = null; // injected by the router
    chordService = new ChordService();

    static readonly maxAttachmentSizeInBytes = 10000000;

    constructor() {
        super();

        // When any input event fires, reset the validation field.
        this.addEventListener("sl-input", () => this.invalidFieldName = "");
        this.addEventListener("input", () => this.invalidFieldName = "");
    }

    firstUpdated() {
        const id = this.location?.params["id"];
        if (id) {
            this.chordService.getById(`chordsheets/${id}`)
                .then(chordSheet => this.chordSheetLoaded(chordSheet))
                .catch(error => this.chordSheetLoadFailed(error));
        } else {
            this.isNewChordSheet = true;
            this.chord = emptyChordSheet();
        }
    }

    chordSheetLoaded(chordSheet: ChordSheet) {
        this.chord = chordSheet;
    }

    chordSheetLoadFailed(error: any) {
        this.error = error ? `${error}` : "Unable to load chord sheet";
    }

    render(): TemplateResult {
        return html`${this.renderLoadingOrDetails()}`;
    }

    renderLoadingOrDetails(): TemplateResult {
        if (this.error) {
            return this.renderError();
        }

        if (!this.chord) {
            return this.renderLoading();
        }

        return this.renderChordEditor(this.chord);
    }

    renderChordEditor(chord: ChordSheet): TemplateResult {
        return html`
            <form>
                <!-- Name and Hebrew name row -->
                <div class="form-row form-row-2">
                    <div class="form-group">
                        <sl-input
                            id="song-name-input"
                            label="Song name"
                            placeholder="Shema Yisrael"
                            help-text="Required. The name of the song."
                            value="${chord.song}"
                            ?data-user-invalid="${this.invalidFieldName === "name"}"
                            @sl-input="${(e: Event) => chord.song = (e.target as HTMLInputElement).value}">
                        </sl-input>
                        ${this.invalidFieldName === "name" ? html`<small style="color: var(--sl-color-danger-500)">Please type a song name.</small>` : ""}
                    </div>
                    <div class="form-group">
                        <sl-input
                            id="hebrew-song-name-input"
                            label="Hebrew song name"
                            lang="he"
                            placeholder="שמע ישראל"
                            help-text="Optional. The Hebrew name of the song. If specified, this should use Hebrew characters."
                            value="${chord.hebrewSongName || ""}"
                            @sl-input="${(e: Event) => chord.hebrewSongName = (e.target as HTMLInputElement).value}">
                        </sl-input>
                    </div>
                </div>

                <!-- Artist and author row -->
                <div class="form-row form-row-2">
                    <div class="form-group">
                        <sl-input
                            id="artist-input"
                            label="Artist"
                            placeholder="Lamb"
                            help-text="Optional. The artist who performed this arrangement of the song."
                            value="${chord.artist}"
                            ?data-user-invalid="${this.invalidFieldName === "artist-authors"}"
                            @sl-input="${(e: Event) => chord.artist = (e.target as HTMLInputElement).value}">
                        </sl-input>
                        ${this.invalidFieldName === "artist-authors" ? html`<small style="color: var(--sl-color-danger-500)">You must specify either an <strong>artist</strong> or an <strong>author</strong>. If neither is known, use <mark>Unknown</mark> as the author.</small>` : ""}
                    </div>
                    <div class="form-group">
                        <label>Authors</label>
                        <multiple-items-input
                            placeholder="Joel Chernoff"
                            help="Optional. The authors of the song. For unknown authors, use Unknown."
                            add-label="+"
                            add-tooltip="Add another author"
                            item-tooltip="Remove this author"
                            input-id="authors-input"
                            invalid="${this.invalidFieldName === "artist-authors"}"
                            .items="${chord.authors}">
                            <span slot="invalid-feedback">
                                You must specify either an <strong>artist</strong> or an <strong>author</strong>. If neither is known, use <mark>Unknown</mark> as the author.
                            </span>
                        </multiple-items-input>
                    </div>
                </div>

                <div class="form-group">
                    <sl-textarea
                        id="chord-chart-input"
                        label="Chord chart"
                        class="chord-chart-text"
                        placeholder="${"   Em             D\nSh'ma Yisrael, sh'ma Yisrael"}"
                        help-text="Optional. The chord chart for the song. If omitted, you can instead attach the chord chart file below."
                        resize="vertical"
                        rows="20"
                        value="${chord.chords || ""}"
                        ?data-user-invalid="${this.invalidFieldName === "chords"}"
                        @sl-input="${(e: Event) => chord.chords = (e.target as HTMLTextAreaElement).value}"
                        @paste="${this.chordsPasted}">
                    </sl-textarea>
                    ${this.invalidFieldName === "chords" ? html`<small style="color: var(--sl-color-danger-500)">You must add the chord chart here or attach the chord chart file below. Attached files must be &lt; 10MB.</small>` : ""}
                </div>

                <!-- Attachments and links -->
                <div class="form-row form-row-2">
                    <div class="form-group">
                        <label>
                            <sl-icon name="paperclip"></sl-icon>
                            Attachments
                        </label>
                        <input type="file" id="attachments-input" multiple @input="${this.addAttachments}" />
                        <div class="help-text">Optional. Attachments for the chord sheet. For example, a chord chart file (.pdf, .docx, .jpg, etc.), an audio recording of the song, piano sheet music, or other related files.</div>
                        <ul class="attachment-list">
                            ${repeat(this.attachments, a => this.attachments.indexOf(a), a => this.renderAttachment(a))}
                        </ul>
                    </div>
                    <div class="form-group">
                        <label>
                            <sl-icon name="link"></sl-icon>
                            Links
                        </label>
                        <multiple-items-input
                            placeholder="youtube.com/watch?v=EHnd21bzcaI"
                            aria-label="Links"
                            help="Optional. Links to YouTube videos, Chavah Messianic Radio songs, or other relevant resources for this song."
                            add-label="+"
                            add-tooltip="Add another link"
                            item-tooltip="Remove this link"
                            input-id="links-input"
                            type="url"
                            .items="${chord.links}"
                            @itemschanged="${this.linksChanged}">
                        </multiple-items-input>
                    </div>
                </div>

                <!-- Key, capo, and scripture row -->
                <div class="form-row form-row-3">
                    <div class="form-group">
                        <sl-input
                            id="key-input"
                            label="Key"
                            placeholder="Em"
                            help-text="Optional. The musical key in which this song is played."
                            value="${chord.key || ""}"
                            @sl-input="${(e: Event) => chord.key = (e.target as HTMLInputElement).value}">
                        </sl-input>
                    </div>
                    <div class="form-group">
                        <sl-input
                            id="capo-input"
                            label="Capo"
                            type="number"
                            placeholder="0"
                            min="0"
                            max="20"
                            help-text="Optional. The ideal guitar capo number used when playing this song."
                            value="${chord.capo || ""}"
                            @sl-input="${(e: Event) => chord.capo = parseInt((e.target as HTMLInputElement).value) || 0}">
                        </sl-input>
                    </div>
                    <div class="form-group">
                        <sl-input
                            id="scripture-input"
                            label="Scripture"
                            placeholder="Deuteronomy 6:4"
                            help-text="Optional. The segment of Scripture relevant to this song."
                            value="${chord.scripture || ""}"
                            @sl-input="${(e: Event) => chord.scripture = (e.target as HTMLInputElement).value}">
                        </sl-input>
                    </div>
                </div>

                <!-- Copyright, CCLI, Year row -->
                <div class="form-row form-row-3">
                    <div class="form-group">
                        <sl-input
                            id="copyright-input"
                            label="Copyright"
                            placeholder="Messianic Publishing Company"
                            help-text="Optional. The copyright of the song."
                            value="${chord.copyright || ""}"
                            @sl-input="${(e: Event) => chord.copyright = (e.target as HTMLInputElement).value}">
                        </sl-input>
                    </div>
                    <div class="form-group">
                        <sl-input
                            id="ccli-input"
                            label="CCLI"
                            type="number"
                            placeholder="7112570"
                            help-text="Optional. The Christian Copyright Licensing International (CCLI) number of the song."
                            value="${chord.ccliNumber || ""}"
                            @sl-input="${(e: Event) => chord.ccliNumber = parseInt((e.target as HTMLInputElement).value) || null}">
                        </sl-input>
                    </div>
                    <div class="form-group">
                        <sl-input
                            id="year-input"
                            label="Year"
                            type="number"
                            placeholder="1978"
                            help-text="Optional. The year the song was authored."
                            value="${chord.year || ""}"
                            @sl-input="${(e: Event) => chord.year = parseInt((e.target as HTMLInputElement).value) || null}">
                        </sl-input>
                    </div>
                </div>

                <div class="form-group">
                    <sl-checkbox
                        id="sheet-music-input"
                        @sl-change="${(e: Event) => chord.isSheetMusic = (e.target as HTMLInputElement).checked}">
                        Contains sheet music
                    </sl-checkbox>
                    <div class="help-text">If the attachments for this song contains musical notation files. <a href="/ChordSheets/4803" target="_blank">Example</a>.</div>
                </div>

                <div class="form-group">
                    <sl-textarea
                        id="about-input"
                        label="About"
                        rows="3"
                        placeholder="This song is based on..."
                        help-text="Optional. Additional information about the song, lyrics, or chord chart."
                        value="${chord.about || ""}"
                        @sl-input="${(e: Event) => chord.about = (e.target as HTMLTextAreaElement).value}">
                    </sl-textarea>
                </div>

                ${this.renderSubmitButton()}
                ${this.renderSubmitError()}
            </form>
        `;
    }

    renderLoading(): TemplateResult {
        return html`
            <div class="loading-skeleton">
                <sl-skeleton effect="pulse"></sl-skeleton>
                <sl-skeleton effect="pulse"></sl-skeleton>
            </div>
        `;
    }

    renderError(): TemplateResult {
        return html`
            <sl-alert variant="warning" open>
                <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
                Woops, we hit a problem loading this chord chart.
                <a href="${window.location.href}">Try again</a>
                <br><br>
                Additional error details: ${this.error}
            </sl-alert>
        `;
    }

    renderAttachment(attachment: File): TemplateResult {
        const name = attachment.name;
        const sizeTemplate = typeof attachment === "string" ? html`` : html`<small class="size-label">(${bytesToText(attachment.size)})</small>`;
        const isTooLarge = attachment.size > ChordEdit.maxAttachmentSizeInBytes;
        const isTooMany = this.attachments.indexOf(attachment) > 9;
        const errorClass = isTooLarge || isTooMany ? "attachment-item-error" : "";
        const errorMessage = isTooLarge ? html`<br><br><strong>Attachments must be < 10MB</strong>` :
            isTooMany ? html`<br><br><strong>Too many attachments. Max 10 attachments.</strong>` :
                html``;

        return html`
            <li class="attachment-item ${errorClass}">
                <span class="text-break">
                    ${name}
                    ${sizeTemplate}
                    ${errorMessage}
                </span>
                <sl-icon-button name="x-lg" label="Remove" @click="${() => this.removeAttachment(attachment)}"></sl-icon-button>
            </li>
        `;
    }

    renderSubmitButton(): TemplateResult {
        return html`
            <sl-button variant="primary" ?loading=${this.isSubmitting} ?disabled=${this.isSubmitting} @click="${this.submit}">
                Submit
            </sl-button>
        `;
    }

    renderSubmitError(): TemplateResult {
        if (!this.submitError) {
            return html``;
        }

        return html`
            <br>
            <sl-alert variant="danger" open>
                <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
                ${this.submitError}
            </sl-alert>
        `;
    }

    addAttachments(e: InputEvent) {
        const attachmentsInput = e.target as HTMLInputElement;
        if (attachmentsInput.files && attachmentsInput.files.length > 0) {
            this.attachments = this.attachments.concat(...Array.from(attachmentsInput.files));
        }
    }

    removeAttachment(attachment: File | string): void {
        this.attachments = this.attachments.filter(a => a !== attachment);
    }

    linksChanged(e: CustomEvent) {
        const links = e.detail.items as string[];
        if (Array.isArray(links) && this.chord) {
            this.chord.links = links;
        }
    }

    chordsPasted(e: ClipboardEvent) {
        // When pasting chords into an empty box, do our best to reformat the spaces to our monospaced font.
        // Basically, 2 spaces in normal font ~= 1 space in monospace font. It's not perfect, but better

        // Punt if we already have chords.
        if (!this.chord || this.chord.chords) {
            return;
        }

        const pastedText = e.clipboardData?.getData("text");
        if (pastedText) {
            const chordsElement = this.shadowRoot?.querySelector("#chord-chart-input") as any;
            if (chordsElement) {
                chordsElement.value = pastedText.replace(/ {2}/g, " ");
                e.preventDefault();
            }
        }
    }

    async submit(e: UIEvent) {
        e.preventDefault();
        if (this.isSubmitting) {
            return;
        }

        if (!this.chord) {
            this.submitError = "Chord is still loading, please wait a moment and try again.";
            return;
        }

        if (this.validateForm()) {
            this.isSubmitting = true;
            try {
                console.log("submitting chord sheet", this.chord);
                await this.chordService.submitChordEdit(this.chord!, this.attachments);
                this.navigateToSubmissionSuccessful();
            } catch (error: unknown) {
                console.log("Error submitting chord sheet", error);
                this.submitError = "We couldn't save your submission. Try again, or if the problem persists, please reach out to us: contact@messianicchords.com";
            } finally {
                this.isSubmitting = false;
            }
        }
    }

    navigateToSubmissionSuccessful() {
        if (!this.chord) {
            return;
        }

        if (this.isNewChordSheet) {
            Router.go("/ChordSheets/new/success");
        } else {
            Router.go(this.chord.id + "/edit/success");
        }
    }

    validateForm(): boolean {
        if (!this.chord) {
            this.submitError = "Chord is still loading, please wait a moment and try again.";
            return false;
        }

        // Validate song name.
        if (!this.chord.song || !this.chord.song.trim()) {
            this.invalidFieldName = "name";
            return false;
        }

        // Validate artist & author. Rule: we must have either an artist or one author.
        const hasEmptyArtist = !this.chord.artist || !this.chord.artist.trim();
        const hasNoAuthors = this.chord.authors.length === 0;
        if (hasEmptyArtist && hasNoAuthors) {
            this.invalidFieldName = "artist-authors";
            return false;
        }

        // Validate chord chart.
        // Rule: we must either have a chord chart, or have an attachment(the chord file), or have a link to a Google doc.
        // Rule: if we have attachments, each attachment must be under 10MB
        const hasChordChart = !!this.chord.chords && !!this.chord.chords.trim();
        const hasGDocLink = this.chord.links.some(l => l.includes("docs.google.com") || l.includes("drive.google.com"));
        if (!hasChordChart && !hasGDocLink) {
            this.invalidFieldName = "chords";
            return false;
        }

        // More chord chart validation: attached files must be < 10MB. Can't have more than 10 attachments.
        const areAttachedFilesUnder10MB = this.attachments.every(a => a.size <= ChordEdit.maxAttachmentSizeInBytes);
        if (this.attachments.length > 0 && !areAttachedFilesUnder10MB) {
            this.invalidFieldName = "chords";
            return false;
        }
        if (this.attachments.length > 10) {
            this.invalidFieldName = "chords";
            return false;
        }

        return true;
    }
}