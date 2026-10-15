import { render } from "lit";
import { emptyChordSheet } from "../src/script/common/utils";
import { ChordEdit } from "../src/script/pages/chord-edit";
import { ChordDetails } from "../src/script/pages/chord-details";
import { AdminSubmissions } from "../src/script/pages/admin-submissions";
import { ChordBackendOnline } from "../src/script/services/chord-backend-online";
import { ChordSubmission } from "../src/script/models/chord-submission";
import { ChordSheet } from "../src/script/models/interfaces";

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

// Run via Vite: await import("/tests/chord-arrangement.browser.ts").then(m => m.runTests()).
export async function runTests(): Promise<string[]> {
    const container = document.createElement("div");
    const editor = new ChordEdit();
    const details = new ChordDetails();
    const admin = new AdminSubmissions();
    const originalFetch = window.fetch;
    const results: string[] = [];
    const chord: ChordSheet = {
        ...emptyChordSheet(), id: "ChordSheets/test", song: "Test song",
        artist: "Test artist", chords: "Am\nLyrics", beatsPerMinute: "60/90", timingSignature: "6/8"
    };
    const input = (id: string) => {
        const control = container.querySelector(`#${id}`);
        assert(control, `${id} must be present`);
        return control as HTMLElement & { value: string; type: string };
    };
    const change = (id: string, value: string) => {
        input(id).value = value;
        input(id).dispatchEvent(new Event("input", { bubbles: true }));
    };
    const arrangement = () => {
        render(details.renderChordDetails(chord), container);
        const card = Array.from(container.querySelectorAll("wa-card"))
            .find(card => card.querySelector('[slot="header"]')?.textContent?.includes("Arrangement"));
        assert(card, "Arrangement card must exist");
        return card.textContent ?? "";
    };

    document.body.append(container);
    try {
        render(editor.renderChordEditor(chord), container);
        await customElements.whenDefined("wa-input");
        const bpm = input("beats-per-minute-input");
        const timing = input("timing-signature-input");
        assert(bpm.getAttribute("label") === "Beats per minute" && bpm.getAttribute("placeholder") === "110bpm", "BPM label and placeholder must match");
        assert(timing.getAttribute("label") === "Timing signature" && timing.getAttribute("placeholder") === "4/4", "Timing label and placeholder must match");
        assert(bpm.type === "text" && timing.type === "text", "Both fields must accept free text");
        assert(bpm.value === "60/90" && timing.value === "6/8", "Existing values must load");
        change("beats-per-minute-input", "110");
        change("timing-signature-input", "4/4");
        assert(chord.beatsPerMinute === "110" && chord.timingSignature === "4/4", "Input events must update the chord");
        results.push("Editor labels, exact placeholders, loaded values, text editing");

        let submitted: FormData | undefined;
        window.fetch = async (_url, init) => {
            assert(init?.body instanceof FormData, "Submission must use form data");
            submitted = init.body;
            return new Response("{}", { headers: { "Content-Type": "application/json" } });
        };
        await new ChordBackendOnline().submitChordEdit(chord, []);
        assert(submitted?.get("beatsPerMinute") === "110" && submitted?.get("timingSignature") === "4/4", "Submission must include both values");
        const text = arrangement();
        assert(text.includes("Beats per minute:") && text.includes("110"), "Arrangement must show BPM");
        assert(text.includes("Timing signature:") && text.includes("4/4"), "Arrangement must show timing");
        results.push("Submission payload and Arrangement display");

        const submission: ChordSubmission = {
            ...chord, id: "ChordSubmissions/test", editedChordSheetId: chord.id, savedAttachments: []
        };
        admin.isAdmin = true;
        admin.isLoading = false;
        admin.pendingSubmissions = [{ submission, original: emptyChordSheet() }];
        render(admin.render(), container);
        assert(container.textContent?.includes("Beats per minute") && container.textContent.includes("Timing signature"), "Admin diff must expose both fields");
        admin.pendingSubmissions = [{ submission: { ...submission, editedChordSheetId: null }, original: null }];
        render(admin.render(), container);
        assert(container.textContent?.includes("Beats per minute") && container.textContent.includes("Timing signature"), "Admin new chart details must expose both fields");
        results.push("Admin new-submission details and edit diff");

        render(editor.renderChordEditor(chord), container);
        change("beats-per-minute-input", "");
        change("timing-signature-input", "");
        await new ChordBackendOnline().submitChordEdit(chord, []);
        assert(submitted?.get("beatsPerMinute") === "" && submitted?.get("timingSignature") === "", "Clearing must submit explicit empty strings");
        chord.beatsPerMinute = null;
        chord.timingSignature = null;
        render(editor.renderChordEditor(chord), container);
        assert(input("beats-per-minute-input").value === "" && input("timing-signature-input").value === "", "Unset fields must be blank");
        const blankText = arrangement();
        assert(!blankText.includes("undefined") && !blankText.includes("null"), "Unset detail fields must stay blank");
        results.push("Clearing and unset-value compatibility");
        return results;
    } finally {
        render(null, container);
        container.remove();
        window.fetch = originalFetch;
    }
}
