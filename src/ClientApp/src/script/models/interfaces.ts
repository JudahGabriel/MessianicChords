export interface ChordSheet {
    song: string;
    hebrewSongName: string | null;
    artist: string;
    chords: string | null;
    key: string | null;
    address: string;
    thumbnailUrl: string | null;
    downloadUrl: string | null;
    googleDocId: string;
    googleDocResourceKey: string;
    id: string;
    plainTextContents: string | null;
    lastUpdated: string;
    created: string;
    extension: string | null;
    hasFetchedPlainTextContents: boolean;
    publishUri: string | null;
    chavahSongId: string | null;
    pagesCount: number;
    hasFetchedThumbnail: boolean;
    screenshots: string[];
    links: string[];
    authors: string[];
    copyright: string | null;
    isSheetMusic: boolean;
    capo: number;
    about: string | null;
    year: number | null;
    scripture: string | null;
    ccliNumber: number | null;
    tags: string[];
}

export interface PagedResult<T> {
    skip: number;
    take: number;
    results: T[];
    totalCount: number;
}