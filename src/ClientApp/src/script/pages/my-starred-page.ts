import { html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { ChordSheet } from "../models/interfaces";
import { accountService } from "../services/account-service";
import { ChordService } from "../services/chord-service";
import { myStarredPageStyles } from "./my-starred-page.styles";

import "../components/chord-card";

@customElement("my-starred-page")
export class MyStarredPage extends LitElement {
    static styles = [myStarredPageStyles];

    @state() chords: ChordSheet[] = [];
    @state() isLoading = true;
    @state() error: string | null = null;
    @state() requiresSignIn = false;

    private readonly chordService = new ChordService();

    connectedCallback(): void {
        super.connectedCallback();
        this.load();
    }

    render(): TemplateResult {
        return html`
            <section class="page">
                <h1>Starred Chord Charts</h1>
                ${this.renderContent()}
            </section>
        `;
    }

    private renderContent(): TemplateResult {
        if (this.isLoading) {
            return html`<p>Loading starred chord charts...</p>`;
        }

        if (this.requiresSignIn) {
            return html`<p class="empty"><a href="/account">Sign in</a> to view your starred chord charts.</p>`;
        }

        if (this.error) {
            return html`<p class="empty">${this.error}</p>`;
        }

        if (this.chords.length === 0) {
            return html`<p class="empty">You haven't starred any chord charts yet.</p>`;
        }

        return html`
            <div class="cards">
                ${this.chords.map(chord => html`<chord-card .chord="${chord}"></chord-card>`) }
            </div>
        `;
    }

    private async load(): Promise<void> {
        this.isLoading = true;
        this.error = null;
        this.requiresSignIn = false;

        try {
            const user = await accountService.getUser();
            if (!user) {
                this.requiresSignIn = true;
                this.chords = [];
                return;
            }

            this.chords = await this.chordService.getMyStarred();
        } catch (error) {
            this.error = error instanceof Error ? error.message : "Unable to load starred chord charts.";
        } finally {
            this.isLoading = false;
        }
    }
}
