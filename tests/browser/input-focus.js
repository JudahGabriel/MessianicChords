// Run with Playwright MCP browser_run_code_unsafe (filename) while npm run dev is running.
// API fixtures keep this regression independent of the local ASP.NET server.
async (page) => {
    const failures = [];
    const apiRoute = "http://localhost:5050/**";
    await page.route(apiRoute, async route => {
        const pathname = route.request().url().replace("http://localhost:5050", "").split("?")[0];
        if (pathname === "/ping") {
            await route.fulfill({ status: 200 });
        } else if (pathname === "/api/account/getCurrentUser") {
            await route.fulfill({
                json: { id: "focus-test", firstName: "Test", lastName: "User", roles: [], starredChords: [] }
            });
        } else {
            throw new Error(`Unexpected API request: ${pathname}`);
        }
    });

    try {
        for (const colorScheme of ["light", "dark"]) {
            await page.emulateMedia({ colorScheme });
            await page.goto("http://localhost:7777/chordsheets/new");
            await page.locator("#song-name-input input").waitFor();
            const controls = page.locator("chord-edit wa-input, chord-edit wa-textarea");
            const count = await controls.count();
            if (count < 14) throw new Error(`Expected all editor text controls, found ${count}`);

            for (const control of await controls.all()) {
                // Capture the synchronous focus event and each painted frame, not just the settled style.
                await control.evaluate(el => {
                    const field = el.shadowRoot.querySelector("input, textarea");
                    const base = el.shadowRoot.querySelector('[part~="base"]');
                    field.blur();
                    el.focusSamples = new Promise(resolve => {
                        field.addEventListener("focus", () => {
                            const samples = [];
                            const start = performance.now();
                            const sample = () => {
                                const style = getComputedStyle(base);
                                samples.push({
                                    color: style.outlineColor,
                                    style: style.outlineStyle,
                                    width: style.outlineWidth
                                });
                                if (performance.now() - start < 200) requestAnimationFrame(sample);
                                else resolve(samples);
                            };
                            sample();
                        }, { once: true });
                    });
                });
                await control.locator("input, textarea").click();
                const samples = await control.evaluate(el => el.focusSamples);
                const final = samples[samples.length - 1];
                const id = await control.getAttribute("id");
                if (final.style === "none" || parseFloat(final.width) <= 0) {
                    failures.push(`${colorScheme}: ${id} lost its visible focus ring`);
                }
                if (samples.some(sample => sample.color !== final.color)) {
                    failures.push(`${colorScheme}: ${id} flashes from ${samples[0].color} to ${final.color}`);
                }
                await control.locator("input, textarea").blur();
                const hiddenAfterBlur = await control.evaluate(el => {
                    const style = getComputedStyle(el.shadowRoot.querySelector('[part~="base"]'));
                    return style.outlineStyle === "none" || style.outlineColor === "rgba(0, 0, 0, 0)";
                });
                if (!hiddenAfterBlur) failures.push(`${colorScheme}: ${id} retains a ring after blur`);
            }

            const song = page.locator("#song-name-input input");
            await song.focus();
            await page.keyboard.press("Tab");
            const hebrew = page.locator("#hebrew-song-name-input input");
            if (!await hebrew.evaluate(el => el.matches(":focus"))) {
                failures.push(`${colorScheme}: Tab must still move focus to the next text field`);
            }
            const keyboardRing = await page.locator("#hebrew-song-name-input").evaluate(el =>
                getComputedStyle(el.shadowRoot.querySelector('[part~="base"]')).outlineStyle);
            if (keyboardRing === "none") failures.push(`${colorScheme}: keyboard focus ring is missing`);
        }
    } finally {
        await page.emulateMedia({ colorScheme: null });
        await page.goto("about:blank");
        await page.unroute(apiRoute);
    }

    if (failures.length) throw new Error(failures.join("\n"));
    return "Editor inputs, textareas, and nested inputs have stable focus colors in light and dark mode; blur and keyboard focus passed.";
}
