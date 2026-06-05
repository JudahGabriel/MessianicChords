import { html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { ChordSheet } from "../models/interfaces";
import { tagService } from "../services/tag-service";
import { PagedList } from "../models/paged-list";
import { sharedStyles } from "../common/shared.styles";
import "../components/chord-collection";
import { browseTagsStyles } from "./browse-tags.styles";
import "@shoelace-style/shoelace/dist/components/details/details.js";
import "@shoelace-style/shoelace/dist/components/select/select.js";
import "@shoelace-style/shoelace/dist/components/option/option.js";

type TagGroup = {
    tag: string;
    chordList: PagedList<ChordSheet> | null;
};

@customElement("browse-tags")
export class BrowseTags extends LitElement {
    static styles = [ browseTagsStyles, sharedStyles];

    @state() private tagGroups: TagGroup[] = [];
    @state() private loading = true;
    @state() private error: string | null = null;
    @state() private highlightedTag: string | null = null;
    @state() private selectedTag = "";

    connectedCallback(): void {
        super.connectedCallback();
        this.loadAllTags().catch(error => {
            console.error("Failed loading tags", error);
            this.error = "Unable to load tags right now. Please try again.";
            this.loading = false;
        });
    }



    private async loadAllTags(): Promise<void> {
        const tags = await tagService.getAllTags();
        this.highlightedTag = this.getRequestedTagKey();

        this.tagGroups = tags.map(tag => ({
            tag,
            chordList: PagedList.empty<ChordSheet>()
        }));

        // If a specific tag was requested, only show that one
        if (this.highlightedTag) {
            this.tagGroups = this.tagGroups.filter(
                group => group.tag.toLocaleLowerCase() === this.highlightedTag
            );
        }

        this.loading = false;
        await this.updateComplete;
        this.autoExpandRequestedTag();
    }

    private autoExpandRequestedTag(): void {
        const requestedTagKey = this.getRequestedTagKey();
        if (!requestedTagKey || this.tagGroups.length === 0) {
            return;
        }

        // Auto-expand the requested tag
        const detailsElement = this.renderRoot.querySelector<HTMLElement>("sl-details") as HTMLElement & { open?: boolean };
        if (detailsElement) {
            detailsElement.open = true;
        }

        this.selectedTag = encodeURIComponent(requestedTagKey);
    }

    private onTagSelectChanged(e: Event): void {
        const selectedTagKey = ((e.target as HTMLInputElement).value || "").trim();
        this.selectedTag = selectedTagKey;

        if (!selectedTagKey) {
            return;
        }

        const detailsElement = this.renderRoot.querySelector<HTMLElement>(`sl-details[data-tag-key="${selectedTagKey}"]`) as HTMLElement & { open?: boolean };
        if (!detailsElement) {
            return;
        }

        detailsElement.open = true;
        detailsElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    private onTagDetailsShow(index: number): void {
        this.loadTagChords(index);
    }

    private async loadTagChords(index: number): Promise<void> {
        const group = this.tagGroups[index];
        group.chordList = this.getPagedListForTag(group.tag);
        this.tagGroups = [...this.tagGroups];
        group.chordList.fetch();
    }

    private getPagedListForTag(tag: string): PagedList<ChordSheet> {
        return new PagedList<ChordSheet>(async () => {
            const chordSheets = await tagService.getChordSheetsByTag(tag);
            return { skip: 0, take: chordSheets.length, results: chordSheets, totalCount: chordSheets.length };
        });
    }

    private getRequestedTagKey(): string | null {
        const query = new URLSearchParams(window.location.search);
        const requestedTag = query.get("tag");
        if (!requestedTag) {
            return null;
        }

        const cleaned = requestedTag.trim();
        if (!cleaned) {
            return null;
        }

        return cleaned.toLocaleLowerCase();
    }

    render(): TemplateResult {
        if (this.loading) {
            return html`
                <div class="container py-4">
                    <h2 class="highlight">Songs By Tag</h2>
                    <p>Loading tags...</p>
                </div>
            `;
        }

        if (this.error) {
            return html`
                <div class="container py-4">
                    <h2 class="highlight">Songs By Tag</h2>
                    <p class="text-danger">${this.error}</p>
                </div>
            `;
        }

        return html`
            <div class="container py-4">
                <div class="title-row mb-3">
                    <h2 class="highlight mb-0">Songs By Tag</h2>
                    <sl-select
                        class="tag-jump-select"
                        size="small"
                        placeholder="Jump to tag"
                        value="${this.selectedTag}"
                        @sl-change="${this.onTagSelectChanged}">
                        ${repeat(this.tagGroups, g => g.tag, g => html`<sl-option value="${encodeURIComponent(g.tag.toLocaleLowerCase())}">${g.tag}</sl-option>`)}
                    </sl-select>
                </div>
                ${this.tagGroups.length === 0 ? html`<p>No tags found.</p>` : html``}
                ${repeat(this.tagGroups, (g) => g.tag, (g, i) => this.renderTagGroup(g, i))}
            </div>
        `;
    }

    private renderTagGroup(group: TagGroup, index: number): TemplateResult {
        return html`
            <sl-details class="tag-details mb-3" data-tag-index="${index}" data-tag-key="${encodeURIComponent(group.tag.toLocaleLowerCase())}" ?open="${this.highlightedTag === group.tag.toLocaleLowerCase()}" @sl-show="${() => this.onTagDetailsShow(index)}">
                <div slot="summary" class="tag-summary-text">${group.tag}</div>
                <div class="tag-content">
                    <chord-collection .chords="${group.chordList}"></chord-collection>
                </div>
            </sl-details>
        `;
    }
}
