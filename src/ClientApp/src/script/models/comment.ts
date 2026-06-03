export interface Comment {
    id: string;
    userId: string;
    userDisplayName: string;
    userProfilePictureUrl?: string | null;
    content: string;
    created: string;
}

export interface CommentThread {
    chordSheetId: string;
    comments: Comment[];
}
