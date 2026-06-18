import { ChordSubmission } from "../models/chord-submission";
import { ApiServiceBase } from "./api-service-base";

class AdminService extends ApiServiceBase {
    getPendingSubmissions(): Promise<ChordSubmission[]> {
        return this.getJson<ChordSubmission[]>("/api/chordsubmissions/pending");
    }

    approveSubmission(submissionId: string): Promise<{ message: string }> {
        return this.post<{ message: string }>("/api/chordsubmissions/approve", { submissionId, approved: true });
    }

    rejectSubmission(submissionId: string): Promise<{ message: string }> {
        return this.post<{ message: string }>("/api/chordsubmissions/reject", { submissionId, approved: false });
    }
}

export const adminService = new AdminService();
