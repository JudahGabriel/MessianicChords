import { CommentThread } from "../models/comment";
import { ApiServiceBase } from "./api-service-base";

class CommentService extends ApiServiceBase {
    getComments(chordSheetId: string): Promise<CommentThread> {
        return this.getJson<CommentThread>("/chords/getComments", { chordSheetId });
    }

    addComment(chordSheetId: string, content: string): Promise<CommentThread> {
        return this.post<CommentThread>("/chords/addComment", { chordSheetId, content });
    }

    editComment(chordSheetId: string, commentId: string, content: string): Promise<CommentThread> {
        return this.post<CommentThread>("/chords/editComment", { chordSheetId, commentId, content });
    }
}

export const commentService = new CommentService();
