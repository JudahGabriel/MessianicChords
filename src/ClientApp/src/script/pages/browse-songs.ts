import {  html, LitElement, TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { customElement } from "lit/decorators.js";
import "../components/chord-collection";
import "../components/chord-card-loading";
import "../components/load-more-button";
import { ChordSheet, PagedResult } from "../models/interfaces";
import { PagedList } from "../models/paged-list";
import { ChordService } from "../services/chord-service";
import { sharedStyles } from "../common/shared.styles";

type ChordsByLetter = { [letter: string]: ChordSheet[] };

@customElement("browse-songs")
export class BrowseSongs extends LitElement {

    readonly chordGrouping: ChordsByLetter = {};
    protected readonly chordService = new ChordService();
    readonly allChords: PagedList<ChordSheet>;

    static styles = [sharedStyles];

    constructor() {
        super();
        this.allChords = new PagedList<ChordSheet>((skip, take) => this.fetchNextChunk(skip, take));
        this.allChords.take = 100;
        this.allChords.addEventListener("changed", () => this.requestUpdate());
    }

    connectedCallback() {
        super.connectedCallback();
        this.allChords.fetch();
    }

    protected async fetchNextChunk(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const chunk = await this.chordService.getBySongName(skip, take);

        // Sort them into our letter group.
        chunk.results.forEach(c => this.addToLetterGroup(c));

        return chunk;
    }

    addToLetterGroup(chord: ChordSheet) {
        const firstLetter = chord.song[0];
        if (firstLetter) {
            const chordsGroup = this.chordGrouping[firstLetter];
            if (chordsGroup) {
                chordsGroup.push(chord);
            } else {
                this.chordGrouping[firstLetter] = [chord];
            }
        }
    }

    render(): TemplateResult {
        return html`
            <div class="container">
                ${this.renderMainContent()}
            </div>
        `;
    }

    renderMainContent(): TemplateResult {
        if (this.allChords.isLoading && this.allChords.items.length === 0) {
            return this.renderLoading();
        }

        return html`
            ${this.renderAdditionalContainerContent()}
            ${this.renderChordsByGroup()}
        `;
    }

    renderAdditionalContainerContent(): TemplateResult {
        return html``;
    }

    renderLoading(): TemplateResult {
        const items = [1, 2, 3];
        return html`
            <div class="d-flex flex-wrap justify-content-evenly">
                ${repeat(items, i => i, () => html`
                <chord-card-loading></chord-card-loading>
                `)}
            </div>
        `;
    }

    renderChordsByGroup(): TemplateResult {
        const letters = Object.keys(this.chordGrouping).sort();
        return html`
            ${letters.map(l => this.renderLetterGroup(l))}
            
            <div class="text-center mt-3">
                <load-more-button .list="${this.allChords}"></load-more-button>
            </div>
        `;
    }

    renderLetterGroup(letter: string): TemplateResult {
        const chords = this.chordGrouping[letter];
        if (!chords) {
            return html``;
        }

        const chordList = this.toPagedList(chords);

        return html`
            <h3 class="highlight">${letter}</h3>
            <div class="mb-5">
                <chord-collection .chords="${chordList}"></chord-collection>
            </div>
        `;
    }

    private toPagedList(chords: ChordSheet[]): PagedList<ChordSheet> {
        const pagedList = PagedList.empty<ChordSheet>();
        pagedList.items.push(...chords);
        pagedList.totalCount = chords.length;
        pagedList.hasMoreItems = false;
        return pagedList;
    }
}