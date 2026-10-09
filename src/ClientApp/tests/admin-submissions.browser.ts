import { emptyChordSheet } from "../src/script/common/utils";
import { ChordSubmission } from "../src/script/models/chord-submission";
import { AdminSubmissions } from "../src/script/pages/admin-submissions";
import { accountService } from "../src/script/services/account-service";
import { adminService } from "../src/script/services/admin-service";

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

// Run via Vite in a browser: await import("/tests/admin-submissions.browser.ts").then(m => m.runTests()).
export async function runTests(): Promise<string[]> {
    const originalUser = accountService.currentUser;
    const originalGetUser = accountService.getUser;
    const originalGetPending = adminService.getPendingSubmissions;
    const originalFetch = window.fetch;
    const page = new AdminSubmissions();
    const requests: Array<{ submissionId: string; chords?: string }> = [];
    let failApproval = false;
    let finishApproval: (() => void) | undefined;
    const submission: ChordSubmission = {
        ...emptyChordSheet(),
        id: "ChordSubmissions/test",
        artist: "Test artist",
        song: "Test song",
        submittedBy: "editor@example.test",
        chords: "Am  D\nLyrics",
        editedChordSheetId: "ChordSheets/test",
        savedAttachments: []
    };
    const original = { ...emptyChordSheet(), id: "ChordSheets/test", chords: "C  G\nLyrics" };
    const results: string[] = [];
    const settle = async () => {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
        await page.updateComplete;
    };
    const editor = () => {
        const input = page.shadowRoot?.querySelector("textarea.chords-preview");
        assert(input instanceof HTMLTextAreaElement, "Submitted chords must be editable");
        return input;
    };
    const edit = async (value: string) => {
        editor().value = value;
        editor().dispatchEvent(new Event("input", { bubbles: true }));
        await settle();
    };
    const approve = () => {
        const button = page.shadowRoot?.querySelector(".submission-actions wa-button");
        assert(button, "Approve button must be present");
        button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    };

    try {
        accountService.getUser = async () => ({
            isAdmin: true, starredChartIds: [], starredChordCharts: {},
            editedChordCharts: {}, newChordCharts: {}
        });
        adminService.getPendingSubmissions = async () => [{ submission, original }];
        window.fetch = async (_input, init) => {
            requests.push(JSON.parse(String(init?.body)));
            await new Promise<void>(resolve => { finishApproval = resolve; });
            if (failApproval) throw new Error("Simulated approval failure");
            return new Response(JSON.stringify({ message: "Approved" }), {
                headers: { "Content-Type": "application/json" }
            });
        };
        document.body.append(page);
        await settle();
        await settle();
        assert(editor().value === submission.chords, "Editor must start with submitted chords");
        assert(page.shadowRoot?.textContent?.includes("Submitted by editor@example.test"), "Submitter username must be shown");
        assert(page.shadowRoot?.querySelector(".chords-old")?.textContent === original.chords, "Original chords must remain read-only");
        results.push("Editable submitted chords, original preview, and username");

        await edit(original.chords!);
        assert(editor().value === original.chords, "Editor must remain when draft matches original");
        await edit("");
        failApproval = true;
        approve();
        await settle();
        assert(editor().disabled, "Editor must be disabled during approval");
        assert(requests[0].chords === "", "An empty draft must be sent as an explicit override");
        finishApproval?.();
        await settle();
        await settle();
        assert(editor().value === "" && !editor().disabled, "Failed approval must preserve the editable draft");
        assert(page.shadowRoot?.textContent?.includes("Failed to process submission"), "Approval errors must be displayed");
        results.push("Empty override, processing lock, and failure recovery");

        failApproval = false;
        await edit("Dm  G\nCorrected lyrics");
        approve();
        await settle();
        assert(requests[1].chords === "Dm  G\nCorrected lyrics", "Approval must send the latest draft");
        finishApproval?.();
        await settle();
        await settle();
        assert(page.pendingSubmissions.length === 0, "Successful approval must remove the submission");
        assert(page.editedChords.size === 0, "Successful approval must clear its draft");
        results.push("Successful approval sends tweaks and removes the card");

        page.pendingSubmissions = [{ submission: { ...submission, id: "ChordSubmissions/legacy", submittedBy: null }, original }];
        await settle();
        assert(page.shadowRoot?.textContent?.includes("Submitted by Unknown"), "Legacy submissions must have explicit unknown attribution");
        approve();
        await settle();
        assert(!("chords" in requests[2]), "Untouched submissions must omit the chords override");
        finishApproval?.();
        await settle();
        await settle();
        results.push("Legacy attribution and untouched approval compatibility");

        page.pendingSubmissions = [
            { submission: { ...submission, id: "ChordSubmissions/new", editedChordSheetId: null }, original: null },
            { submission: { ...submission, id: "ChordSubmissions/other" }, original }
        ];
        await settle();
        await edit("Em\nNew chart correction");
        const editors = page.shadowRoot?.querySelectorAll<HTMLTextAreaElement>("textarea.chords-preview");
        assert(editors?.length === 2 && editors[1].value === submission.chords, "Each card must have an independent draft");
        const rejectButton = page.shadowRoot?.querySelectorAll(".submission-actions wa-button")[1];
        assert(rejectButton, "Reject button must be present");
        rejectButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await settle();
        assert(requests[3].submissionId === "ChordSubmissions/new" && !("chords" in requests[3]), "Rejection must not send draft changes");
        finishApproval?.();
        await settle();
        assert(page.pendingSubmissions.length === 1 && page.editedChords.size === 0, "Rejection must remove only its own card and draft");
        results.push("New chart editing, independent drafts, and rejection compatibility");
        return results;
    } finally {
        page.remove();
        accountService.currentUser = originalUser;
        accountService.getUser = originalGetUser;
        adminService.getPendingSubmissions = originalGetPending;
        window.fetch = originalFetch;
    }
}
