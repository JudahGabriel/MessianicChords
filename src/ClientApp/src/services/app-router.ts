import { html } from "lit";
import { Router } from "@thepassle/app-tools/router.js";
import { lazy } from "@thepassle/app-tools/router/plugins/lazy.js";
import { redirect } from "@thepassle/app-tools/router/plugins/redirect.js";

export interface RouteContext {
    params?: Record<string, string>;
    url?: URL;
}

export const appTitle = "Messianic Chords, guitar chord charts and lyrics for Messianic music";

export const appRouter = new Router({
    fallback: "/",
    plugins: [],
    routes: [
        {
            path: "/",
            title: appTitle,
            plugins: [lazy(() => import("../script/pages/app-home"))],
            render: () => html`<app-home></app-home>`
        },
        {
            path: "/chordsheets/new",
            title: "Contribute a chord chart - " + appTitle,
            plugins: [lazy(() => import("../script/pages/chord-edit"))],
            render: () => html`<chord-edit></chord-edit>`
        },
        {
            path: "/chordsheets/new/success",
            title: "Chord chart submission successful - " + appTitle,
            plugins: [lazy(() => import("../script/pages/chord-edit-successful"))],
            render: () => html`<chord-edit-successful></chord-edit-successful>`
        },
        {
            path: "/chordsheets/:id/edit/success",
            title: "Edit Submitted",
            plugins: [lazy(() => import("../script/pages/chord-edit-successful"))],
            render: (context: RouteContext) => html`<chord-edit-successful chord-id="${context.params?.id || ""}"></chord-edit-successful>`
        },
        {
            path: "/chordsheets/:id/edit",
            title: "Edit a chord chart - " + appTitle,
            plugins: [lazy(() => import("../script/pages/chord-edit"))],
            render: (context: RouteContext) => html`<chord-edit chord-id="${context.params?.id || ""}"></chord-edit>`
        },
        {
            path: "/ChordSheets/:id/edit", // ChordSheet legacy upper-case variant
            title: "Edit a chord chart - " + appTitle,
            plugins: [redirect((context: RouteContext) => `/chordsheets/${context.params?.id || ""}/edit`)]
        },
        {
            path: "/ChordSheets/:id",
            title: "Chord chart details - " + appTitle, // will be replaced with the real description once the chart is loaded in chord-details
            plugins: [redirect((context: RouteContext) => `/chordsheets/${context.params?.id || ""}`)]
        },
        {
            path: "/chordsheets/:id",
            title: "Chord chart details - " + appTitle, // will be replaced with the real description once the chart is loaded in chord-details
            plugins: [lazy(() => import("../script/pages/chord-details"))],
            render: (context: RouteContext) => html`<chord-details chord-id="${context.params?.id || ""}"></chord-details>`
        },
        {
            path: "/browse/newest",
            title: "Newest chord charts - " + appTitle,
            plugins: [lazy(() => import("../script/pages/browse-newest"))],
            render: () => html`<browse-newest></browse-newest>`
        },
        {
            path: "/browse/songs",
            title: "Chord charts by song name - " + appTitle,
            plugins: [lazy(() => import("../script/pages/browse-songs"))],
            render: () => html`<browse-songs></browse-songs>`
        },
        {
            path: "/browse/tags",
            title: "Chord charts by song tag - " + appTitle,
            plugins: [lazy(() => import("../script/pages/browse-tags"))],
            render: () => html`<browse-tags></browse-tags>`
        },
        {
            path: "/browse/artists",
            title: "Chord charts by artist - " + appTitle,
            plugins: [lazy(() => import("../script/pages/browse-artists"))],
            render: () => html`<browse-artists></browse-artists>`
        },
        {
            path: "/browse/random",
            title: "Random chord charts - " + appTitle,
            plugins: [lazy(() => import("../script/pages/browse-random"))],
            render: () => html`<browse-random></browse-random>`
        },
        {
            path: "/browse/offline",
            title: "Offline chord charts - " + appTitle,
            plugins: [lazy(() => import("../script/pages/browse-offline"))],
            render: () => html`<browse-offline></browse-offline>`
        },
        {
            path: "/artist/:name",
            title: context => `Chord charts by ${decodeURIComponent(context.params?.name || "") || "artist"} - ${appTitle}`,
            plugins: [lazy(() => import("../script/pages/artist-songs"))],
            render: (context: RouteContext) => html`<artist-songs artist-name="${context.params?.name || ""}"></artist-songs>`
        },
        {
            path: "/my/starred",
            title: "My starred chord charts - " + appTitle,
            plugins: [lazy(() => import("../script/pages/my-starred-page"))],
            render: () => html`<my-starred-page></my-starred-page>`
        },
        {
            path: "/profile",
            title: "My profile - " + appTitle,
            plugins: [lazy(() => import("../script/pages/profile-page"))],
            render: () => html`<profile-page></profile-page>`
        },
        {
            path: "/account",
            title: "Sign in or register - " + appTitle,
            plugins: [lazy(() => import("../script/pages/account-page"))],
            render: () => html`<account-page></account-page>`
        },
        {
            path: "/contact",
            title: "Contact",
            plugins: [lazy(() => import("../script/pages/contact-page"))],
            render: () => html`<contact-page></contact-page>`
        },
        {
            path: "/about",
            title: "About - " + appTitle,
            plugins: [lazy(() => import("../script/pages/about"))],
            render: () => html`<about-page></about-page>`
        },
        {
            path: "/admin/submissions",
            title: "Admin - Pending Submissions - " + appTitle,
            plugins: [lazy(() => import("../script/pages/admin-submissions"))],
            render: () => html`<admin-submissions></admin-submissions>`
        }
    ]
});
