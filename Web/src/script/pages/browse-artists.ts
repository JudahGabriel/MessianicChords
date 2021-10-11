import { css } from 'lit';
import { customElement } from 'lit/decorators';
import '../components/chord-card';
import '../components/chord-card-loading';
import '../components/load-more-button';
import { ChordSheet } from '../models/interfaces';
import { BootstrapBase } from '../common/bootstrap-base';
import { BrowseSongs } from './browse-songs';
import { PagedResult } from '../models/paged-result';

// This component is the same as browse songs, only the grouping is by artist, rather than by first letter of song name.
// So, let's just inherit from BrowseSongs.
@customElement('browse-artists')
export class BrowseArtists extends BrowseSongs {

    static get styles() {
        const localStyles = css`
        `;

        return [
            BootstrapBase.styles,
            localStyles
        ];
    }

    constructor() {
        super();
    }

    protected async fetchNextChunk(skip: number, take: number): Promise<PagedResult<ChordSheet>> {
        const chunk = await this.chordService.getByArtistName(null, skip, take);

        // Sort them into our artist group.
        chunk.results.forEach(c => this.addToArtistGroup(c));

        return chunk;
    }

    addToArtistGroup(chord: ChordSheet) {
        const artist = chord.artist;
        if (artist) {
            const chordsGroup = this.chordGrouping[artist];
            if (chordsGroup) {
                chordsGroup.push(chord);
            } else {
                this.chordGrouping[artist] = [chord];
            }
        }
    }
}