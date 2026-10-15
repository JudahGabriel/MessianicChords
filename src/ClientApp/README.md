# MessianicChords

Messianic Chords is the place you go on the web for guitar chords, lyrics, and sheet music for Messianic Jewish music.

The site is built with [Lit](https://lit.dev) and ASP.NET Core. The front-end is a Progressive Web App (PWA) that [works offline](https://debuggerdotbreak.judahgabriel.com/2022/07/01/offline-pwas-my-adventure-beyond-the-basics/).

The front-end is based on [pwa-starter template](https://github.com/pwa-builder/pwa-starter).

## Arrangement field regression checks

With `npm run dev` running, open the local site and run this in the browser console:

```js
await import("/tests/chord-arrangement.browser.ts").then(m => m.runTests())
```

This checks tempo and timing signature inputs, submission payloads, Arrangement display,
admin review details, and cleared or unset values without modifying live chord sheets.
Server-side copying and form-binding checks run from the repository root:

```sh
dotnet test tests/MessianicChords.Tests/MessianicChords.Tests.csproj --filter FullyQualifiedName~ChordSheetTests
```
