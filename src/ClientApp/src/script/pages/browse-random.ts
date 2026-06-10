import { html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../components/chord-card";
import "../components/chord-card-loading";
import { ChordSheet, PagedResult } from "../models/interfaces";
import { ChordService } from "../services/chord-service";
import { browseRandomStyles } from "./browse-random.styles";
import { sharedStyles } from "../common/shared.styles";
import "@awesome.me/webawesome/dist/components/button/button.js";
import { PagedList } from "../models/paged-list";
import "../components/chord-collection.js";


@customElement("browse-random")
export class BrowseRandom extends LitElement {
    @state() chords = new PagedList<ChordSheet>((skip, take) => this.fetchRandomChords(skip, take));
    @state() isLoading = false;
    readonly chordService = new ChordService();
    readonly chordsPerRoll = 7;

    private static asDiceIcon(element: Element | null): HTMLElement & { name: string } | null {
        return element as (HTMLElement & { name: string }) | null;
    }

    static styles = [sharedStyles, browseRandomStyles];

    connectedCallback(): void {
        super.connectedCallback();

        this.chords.fetch();
        this.chords.addEventListener("changed", () => this.isLoading = this.chords.isLoading);

        // Fetch the dice-1...dice-6 icons from the icon set, so that they're cached and will show immediately when we roll the dice for the first time.
        const iconNames = ["dice-1", "dice-2", "dice-3", "dice-4", "dice-5", "dice-6"];
        iconNames.forEach(name => fetch(`/assets/icons/${name}.svg`));
    }

    async fetchRandomChords(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        this.rollDice();

        const chords = await this.chordService.getByRandom(this.chordsPerRoll);
        return {
            results: chords,
            totalCount: this.chordsPerRoll,
            skip: skip,
            take: take,
        };
    }

    rollDice() {
        const diceBlock1 = BrowseRandom.asDiceIcon(this.shadowRoot?.querySelector(".dice-block-1") ?? null);
        const diceBlock2 = BrowseRandom.asDiceIcon(this.shadowRoot?.querySelector(".dice-block-2") ?? null);

        // Set each dice block to a random number between 1 and 6, but make sure the total of the two dice is always 7 (just for fun :-)).
        const diceBlock1Number = Math.floor(Math.random() * 6) + 1;

        // Set the first dice to that number, and the second dice to 7 - that number (so that the total is always 7 :-)).
        const diceBlock2Number = 7 - diceBlock1Number;

        const audio = new Audio("/assets/audio/dice.mp3");
        if (diceBlock1) {
            diceBlock1.style.transform = `rotateZ(${Math.floor(Math.random() * 360 * (Math.random() < .5 ? -1 : 1))}deg)`;
            diceBlock1.name = `dice-${diceBlock1Number}`;
        }
        if (diceBlock2) {
            diceBlock2.style.transform = `rotateZ(${Math.floor(Math.random() * 360) * (Math.random() < .5 ? -1 : 1)}deg)`;
            diceBlock2.name = `dice-${diceBlock2Number}`;
        }

        audio.playbackRate = 0.8 + Math.random();
        audio.play();
    }

    render(): TemplateResult {
        return html`
            <div class="container">
                <div class="random-header">
                    <h3 class="highlight">Random</h3>
                    <wa-button variant="neutral" ?disabled="${this.isLoading}" class="btn btn-light" @click="${this.resetAndFetchChords}">
                        <div slot="start">
                            <wa-icon class="dice-block-1" name="dice-1"></wa-icon>
                            <wa-icon class="dice-block-2" name="dice-6"></wa-icon>
                        </div>
                        Roll again
                    </wa-button>
                </div>
                ${this.renderMainContent()}
            </div>
        `;
    }

    renderMainContent(): TemplateResult {
        return html`
            <chord-collection .chords="${this.chords}"></chord-collection>
        `;
    }

    resetAndFetchChords(): void {
        this.chords.reset();
        this.chords.fetch();
    }
}

