import { ChordSheet } from "./interfaces";

export interface ChordSubmission extends ChordSheet {
    editedChordSheetId: string | null;
    savedAttachments: ChordSubmissionAttachment[];
}

export interface ChordSubmissionAttachment {
    cdnFileName: string;
    untrustedFileName: string;
    cdnUri: string;
}
