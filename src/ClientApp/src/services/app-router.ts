import { html } from "lit";
import { Router } from "@thepassle/app-tools/router.js";
import { lazy } from "@thepassle/app-tools/router/plugins/lazy.js";
import { redirect } from "@thepassle/app-tools/router/plugins/redirect.js";

export interface RouteContext {
    params?: Record<string, string>;
    url?: URL;
}

export const appRouter = new Router({
    fallback: "/",
    plugins: [],
    routes: [
        {
            path: "/",
            title: "Home",
            plugins: [lazy(() => import("../script/pages/app-home"))],
            render: () => html`<app-home></app-home>`
        },
        {
            path: "/chordsheets/new",
            title: "Add Chord Sheet",
            plugins: [lazy(() => import("../script/pages/chord-edit"))],
            render: () => html`<chord-edit></chord-edit>`
        },
        {
            path: "/chordsheets/new/success",
            title: "Submission Successful",
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
            title: "Edit Chord Sheet",
            plugins: [lazy(() => import("../script/pages/chord-edit"))],
            render: (context: RouteContext) => html`<chord-edit chord-id="${context.params?.id || ""}"></chord-edit>`
        },
        {
            path: "/ChordSheets/:id/edit", // ChordSheet legacy upper-case variant
            title: "Edit Chord Sheet",
            plugins: [redirect((context: RouteContext) => `/chordsheets/${context.params?.id || ""}/edit`)]
        },
        {
            path: "/ChordSheets/:id",
            title: "Chord Details",
            plugins: [redirect((context: RouteContext) => `/chordsheets/${context.params?.id || ""}`)]
        },
        {
            path: "/chordsheets/:id",
            title: "Chord Details",
            plugins: [lazy(() => import("../script/pages/chord-details"))],
            render: (context: RouteContext) => html`<chord-details chord-id="${context.params?.id || ""}"></chord-details>`
        },
        {
            path: "/browse/newest",
            title: "Newest",
            plugins: [lazy(() => import("../script/pages/browse-newest"))],
            render: () => html`<browse-newest></browse-newest>`
        },
        {
            path: "/browse/songs",
            title: "Browse Songs",
            plugins: [lazy(() => import("../script/pages/browse-songs"))],
            render: () => html`<browse-songs></browse-songs>`
        },
        {
            path: "/browse/tags",
            title: "Browse Tags",
            plugins: [lazy(() => import("../script/pages/browse-tags"))],
            render: () => html`<browse-tags></browse-tags>`
        },
        {
            path: "/browse/artists",
            title: "Browse Artists",
            plugins: [lazy(() => import("../script/pages/browse-artists"))],
            render: () => html`<browse-artists></browse-artists>`
        },
        {
            path: "/browse/random",
            title: "Random",
            plugins: [lazy(() => import("../script/pages/browse-random"))],
            render: () => html`<browse-random></browse-random>`
        },
        {
            path: "/browse/offline",
            title: "Offline",
            plugins: [lazy(() => import("../script/pages/browse-offline"))],
            render: () => html`<browse-offline></browse-offline>`
        },
        {
            path: "/artist/:name",
            title: "Artist",
            plugins: [lazy(() => import("../script/pages/artist-songs"))],
            render: (context: RouteContext) => html`<artist-songs .location=${context}></artist-songs>`
        },
        {
            path: "/my/starred",
            title: "My Starred",
            plugins: [lazy(() => import("../script/pages/my-starred-page"))],
            render: () => html`<my-starred-page></my-starred-page>`
        },
        {
            path: "/profile",
            title: "Profile",
            plugins: [lazy(() => import("../script/pages/profile-page"))],
            render: () => html`<profile-page></profile-page>`
        },
        {
            path: "/account",
            title: "Account",
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
            title: "About",
            plugins: [lazy(() => import("../script/pages/app-about"))],
            render: () => html`<app-about></app-about>`
        }
    ]
});
