// Run with Playwright MCP browser_run_code_unsafe (filename) while npm run dev is running.
// API fixtures keep these browser regressions independent of the local ASP.NET server.
async (page) => {
    const failures = [];
    const check = (condition, message) => {
        if (!condition) failures.push(message);
    };
    const chord = {
        id: "chordsheets/search-print-test",
        song: "Search print fixture",
        artist: "Test artist",
        authors: [],
        chords: "Am\nTest lyrics",
        key: "Am",
        screenshots: [],
        links: [],
        tags: [],
        capo: 0,
        pagesCount: 1,
        created: "2026-01-01T00:00:00Z",
        lastUpdated: "2026-01-01T00:00:00Z"
    };
    const apiRoute = "http://localhost:5050/**";
    await page.route(apiRoute, async route => {
        const pathname = route.request().url().replace("http://localhost:5050", "").split("?")[0];
        let json;
        switch (pathname) {
            case "/ping":
                await route.fulfill({ status: 200 });
                return;
            case "/api/account/getCurrentUser":
                json = null;
                break;
            case "/chords/getNew":
            case "/chords/searchPaged":
                json = { results: [chord], skip: 0, take: 3, totalCount: 1 };
                break;
            case "/chords/get":
                json = chord;
                break;
            case "/chords/getComments":
                json = { comments: [] };
                break;
            default:
                throw new Error(`Unexpected API request: ${pathname}`);
        }
        await route.fulfill({ json });
    });

    try {
        await page.goto("http://localhost:7777/");
        await page.locator("app-home .new-chords chord-card").waitFor();
        const input = page.locator("app-home #search-box input");
        await input.fill("test");
        await page.waitForFunction(() => location.search === "?search=test");
        await page.locator("chord-collection chord-card").waitFor();
        check(await input.evaluate(el => el.matches(":focus")), "Search results must not steal input focus");
        check(await page.title() === "'test' search on Messianic Chords", "Search must retain its query-specific title");

        await input.focus();
        await input.press("End");
        await input.pressSequentially(" more");
        await page.waitForFunction(() => location.search === "?search=test%20more");
        await page.locator("chord-collection chord-card").waitFor();
        check(await input.evaluate(el => el.matches(":focus")), "Refining a search must retain input focus");

        await input.fill("");
        await page.waitForFunction(() => location.search === "");
        await page.locator("app-home .new-chords chord-card").waitFor();
        check(await input.evaluate(el => el.matches(":focus")), "Clearing search must retain input focus");

        await page.evaluate(async () => {
            history.replaceState({}, "", "?source=regression");
            await navigation.transition?.finished;
        });
        check(await input.evaluate(el => el.matches(":focus")), "Same-page replaceState must retain input focus");
        await page.emulateMedia({ media: "print" });
        check(!await page.locator("home-jumbotron header").isVisible(), "Shared print utility must hide the home banner");
        await page.emulateMedia({ media: "screen" });

        await page.locator("app-home .new-chords .card-link").click();
        await page.locator("chord-details .btn-toolbar").waitFor();
        check(await page.locator("chord-details .plain-text-preview").isVisible(), "Navigating to a chart must still render its contents");
        check(await page.locator("chord-details .btn-toolbar").isVisible(), "Toolbar must remain visible on screen");
        await page.emulateMedia({ media: "print" });
        check(!await page.locator("chord-details .btn-toolbar").isVisible(), "Toolbar must be hidden when printing");
        check(!await page.locator("chord-details .sidebar").isVisible(), "Sidebar must remain hidden when printing");
        check(await page.locator("chord-details .plain-text-preview").isVisible(), "Chart contents must remain printable");
        check(await page.locator("chord-details .song-name").isVisible(), "Text chart title must remain printable");

        await page.emulateMedia({ media: "screen" });
        await page.goBack();
        await page.locator("app-home #search-box input").waitFor();
        check(await page.locator("app-home #search-box input").isVisible(), "Back navigation must still render the home page");
    } finally {
        await page.emulateMedia({ media: "screen" });
        await page.goto("about:blank");
        await page.unroute(apiRoute);
    }

    if (failures.length) throw new Error(failures.join("\n"));
    return "Search focus, query titles, chart navigation, print visibility, and back navigation passed.";
}
