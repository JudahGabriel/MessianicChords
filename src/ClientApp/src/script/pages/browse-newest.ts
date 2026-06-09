import { html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import "../components/chord-collection";
import "../components/load-more-button";
import { ChordSheet } from "../models/interfaces";
import { PagedList } from "../models/paged-list";
import { ChordService } from "../services/chord-service";
import { sharedStyles } from "../common/shared.styles";

@customElement("browse-newest")
export class BrowseNewest extends LitElement {

    @property({ type: Object }) chords: PagedList<ChordSheet>;
    readonly chordService = new ChordService();

    static styles = [sharedStyles];

    constructor() {
        super();
        this.chords = new PagedList<ChordSheet>((skip, take) => this.chordService.getNew(skip, take));
        this.chords.take = 20;
        this.chords.addEventListener("changed", () => this.requestUpdate());
    }

    firstUpdated() {
        this.chords.fetch();
    }

    render(): TemplateResult {
        return html`
            <div class="container">
                <h2 class="highlight">Newest</h2>
                ${this.renderMainContent()}
            </div>
        `;
    }

    renderMainContent(): TemplateResult {
        if (!this.chords) {
            return html``;
        }

        return html`
            <chord-collection .chords="${this.chords}"></chord-collection>
            
            <div class="text-center mt-3">
                <load-more-button .list="${this.chords}"></load-more-button>
            </div>
        `;
    }
}