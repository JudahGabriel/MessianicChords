export interface ChordSheet {
    song: string;
    hebrewSongName: string | null;
    artist: string;
    key: string | null;
    address: string;
    thumbnailUrl: string | null;
    downloadUrl: string | null;
    googleDocId: string;
    googleDocResourceKey: string;
    etag: string | null;
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
}