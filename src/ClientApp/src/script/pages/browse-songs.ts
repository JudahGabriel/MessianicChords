import { html, LitElement, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import "../components/chord-collection";
import "../components/load-more-button";
import { ChordSheet } from "../models/interfaces";
import { PagedList } from "../models/paged-list";
import { ChordService } from "../services/chord-service";
import { sharedStyles } from "../common/shared.styles";
import "@awesome.me/webawesome/dist/components/details/details.js";
import { browseSongsStyles } from "./browse-songs.styles";

type SongGroup = {
    key: string;
    chordList: PagedList<ChordSheet> | null;
};

@customElement("browse-songs")
export class BrowseSongs extends LitElement {

    readonly songGroups: SongGroup[];
    protected readonly chordService = new ChordService();

    static styles = [browseSongsStyles, sharedStyles];

    constructor() {
        super();
        const letters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
        this.songGroups = ["0-9", ...letters].map(key => ({ key, chordList: null }));
    }

    render(): TemplateResult {
        return html`
            <div class="container songs-page">
                <div class="songs-header-row">
                    <h2 class="highlight songs-heading">Songs by name</h2>
                </div>
                ${this.renderBodyContent()}
            </div>
        `;
    }

    renderBodyContent(): TemplateResult {
        return html`
            ${this.renderAdditionalContainerContent()}
            ${this.renderChordsByGroup()}
        `;
    }

    renderAdditionalContainerContent(): TemplateResult {
        return html``;
    }

    renderChordsByGroup(): TemplateResult {
        return html`
            ${this.songGroups.map((g, i) => this.renderLetterGroup(g, i))}
        `;
    }

    renderLetterGroup(group: SongGroup, index: number): TemplateResult {
        const chordList = group.chordList;

        return html`
            <sl-details class="songs-group-details mb-3" @sl-show="${() => this.onGroupShow(index)}">
                <div slot="summary" class="songs-group-summary">${group.key}</div>
                <div class="songs-group-content">
                    ${chordList ? html`
                        <chord-collection .chords="${chordList}"></chord-collection>
                        <div class="text-center mt-3">
                            <load-more-button .list="${chordList}"></load-more-button>
                        </div>
                    ` : html`<p>Expand to load songs.</p>`}
                </div>
            </sl-details>
        `;
    }

    private onGroupShow(index: number): void {
        const group = this.songGroups[index];
        if (!group || group.chordList) {
            return;
        }

        const list = new PagedList<ChordSheet>((skip, take) => this.chordService.getBySongGroup(group.key, skip, take));
        list.take = 100;
        list.addEventListener("changed", () => this.requestUpdate());
        group.chordList = list;
        this.requestUpdate();
        list.fetch();
    }
}