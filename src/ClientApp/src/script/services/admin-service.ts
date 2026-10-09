import { PendingChordSubmission } from "../models/chord-submission";
import { ApiServiceBase } from "./api-service-base";

class AdminService extends ApiServiceBase {
    getPendingSubmissions(): Promise<PendingChordSubmission[]> {
        return this.getJson<PendingChordSubmission[]>("/api/chordsubmissions/pending");
    }

    approveSubmission(submissionId: string, chords?: string): Promise<{ message: string }> {
        return this.post<{ message: string }>("/api/chordsubmissions/approve", { submissionId, approved: true, chords });
    }

    rejectSubmission(submissionId: string): Promise<{ message: string }> {
        return this.post<{ message: string }>("/api/chordsubmissions/reject", { submissionId, approved: false });
    }
}

export const adminService = new AdminService();
