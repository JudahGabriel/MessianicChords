import { html, TemplateResult } from "lit";

export interface RouteContext {
    params: Record<string, string>;
    url: URL;
}

export const appTitle = "Messianic Chords, guitar chord charts and lyrics for Messianic music";

interface RouteDefinition {
    path: string;
    title: string | ((context: RouteContext) => string);
    load?: () => Promise<unknown>;
    render?: (context: RouteContext) => TemplateResult;
    redirect?: (context: RouteContext) => string;
}

/**
 * Converts a path pattern like "/chordsheets/:id/edit" into a regex
 * and extracts parameter names.
 */
function compilePath(path: string): { regex: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];
    const regexStr = path
        .replace(/:([^/]+)/g, (_match, paramName) => {
            paramNames.push(paramName);
            return "([^/]+)";
        });
    return { regex: new RegExp(`^${regexStr}$`), paramNames };
}

function matchRoute(pathname: string, routes: RouteDefinition[]): { route: RouteDefinition; context: RouteContext } | null {
    const url = new URL(pathname, location.origin);
    for (const route of routes) {
        const { regex, paramNames } = compilePath(route.path);
        const match = url.pathname.match(regex);
        if (match) {
            const params: Record<string, string> = {};
            paramNames.forEach((name, i) => {
                params[name] = match[i + 1];
            });
            return { route, context: { params, url } };
        }
    }
    return null;
}

const routes: RouteDefinition[] = [
    {
        path: "/",
        title: appTitle,
        load: () => import("../script/pages/app-home"),
        render: () => html`<app-home></app-home>`
    },
    {
        path: "/chordsheets/new",
        title: "Contribute a chord chart - " + appTitle,
        load: () => import("../script/pages/chord-edit"),
        render: () => html`<chord-edit></chord-edit>`
    },
    {
        path: "/chordsheets/new/success",
        title: "Chord chart submission successful - " + appTitle,
        load: () => import("../script/pages/chord-edit-successful"),
        render: () => html`<chord-edit-successful></chord-edit-successful>`
    },
    {
        path: "/chordsheets/:id/edit/success",
        title: "Edit Submitted",
        load: () => import("../script/pages/chord-edit-successful"),
        render: (context: RouteContext) => html`<chord-edit-successful chord-id="${context.params.id || ""}"></chord-edit-successful>`
    },
    {
        path: "/chordsheets/:id/edit",
        title: "Edit a chord chart - " + appTitle,
        load: () => import("../script/pages/chord-edit"),
        render: (context: RouteContext) => html`<chord-edit chord-id="${context.params.id || ""}"></chord-edit>`
    },
    {
        // ChordSheet legacy upper-case variant
        path: "/ChordSheets/:id/edit",
        title: "Edit a chord chart - " + appTitle,
        redirect: (context: RouteContext) => `/chordsheets/${context.params.id || ""}/edit`
    },
    {
        path: "/ChordSheets/:id",
        title: "Chord chart details - " + appTitle,
        redirect: (context: RouteContext) => `/chordsheets/${context.params.id || ""}`
    },
    {
        path: "/chordsheets/:id",
        title: "Chord chart details - " + appTitle,
        load: () => import("../script/pages/chord-details"),
        render: (context: RouteContext) => html`<chord-details chord-id="${context.params.id || ""}"></chord-details>`
    },
    {
        path: "/browse/newest",
        title: "Newest chord charts - " + appTitle,
        load: () => import("../script/pages/browse-newest"),
        render: () => html`<browse-newest></browse-newest>`
    },
    {
        path: "/browse/songs",
        title: "Chord charts by song name - " + appTitle,
        load: () => import("../script/pages/browse-songs"),
        render: () => html`<browse-songs></browse-songs>`
    },
    {
        path: "/browse/tags",
        title: "Chord charts by song tag - " + appTitle,
        load: () => import("../script/pages/browse-tags"),
        render: () => html`<browse-tags></browse-tags>`
    },
    {
        path: "/browse/artists",
        title: "Chord charts by artist - " + appTitle,
        load: () => import("../script/pages/browse-artists"),
        render: () => html`<browse-artists></browse-artists>`
    },
    {
        path: "/browse/random",
        title: "Random chord charts - " + appTitle,
        load: () => import("../script/pages/browse-random"),
        render: () => html`<browse-random></browse-random>`
    },
    {
        path: "/browse/offline",
        title: "Offline chord charts - " + appTitle,
        load: () => import("../script/pages/browse-offline"),
        render: () => html`<browse-offline></browse-offline>`
    },
    {
        path: "/artist/:name",
        title: (context: RouteContext) => `Chord charts by ${decodeURIComponent(context.params.name || "") || "artist"} - ${appTitle}`,
        load: () => import("../script/pages/artist-songs"),
        render: (context: RouteContext) => html`<artist-songs artist-name="${context.params.name || ""}"></artist-songs>`
    },
    {
        path: "/my/starred",
        title: "My starred chord charts - " + appTitle,
        load: () => import("../script/pages/my-starred-page"),
        render: () => html`<my-starred-page></my-starred-page>`
    },
    {
        path: "/profile",
        title: "My profile - " + appTitle,
        load: () => import("../script/pages/profile-page"),
        render: () => html`<profile-page></profile-page>`
    },
    {
        path: "/account",
        title: "Sign in or register - " + appTitle,
        load: () => import("../script/pages/account-page"),
        render: () => html`<account-page></account-page>`
    },
    {
        path: "/confirmemail",
        title: "Confirm your email - " + appTitle,
        load: () => import("../script/pages/confirm-email-page"),
        render: () => html`<confirm-email-page></confirm-email-page>`
    },
    {
        path: "/contact",
        title: "Contact",
        load: () => import("../script/pages/contact-page"),
        render: () => html`<contact-page></contact-page>`
    },
    {
        path: "/about",
        title: "About - " + appTitle,
        load: () => import("../script/pages/about"),
        render: () => html`<about-page></about-page>`
    },
    {
        path: "/admin/submissions",
        title: "Admin - Pending Submissions - " + appTitle,
        load: () => import("../script/pages/admin-submissions"),
        render: () => html`<admin-submissions></admin-submissions>`
    }
];

function shouldNotIntercept(event: NavigateEvent): boolean {
    return (
        !event.canIntercept ||
        event.hashChange ||
        event.downloadRequest !== null ||
        event.formData !== null
    );
}

type RouteChangedCallback = (rendered: TemplateResult, context: RouteContext) => void;

class AppRouter {
    private callback: RouteChangedCallback | null = null;
    private abortController: AbortController | null = null;

    install(callback: RouteChangedCallback): void {
        this.callback = callback;
        this.abortController = new AbortController();
        const { signal } = this.abortController;

        navigation.addEventListener("navigate", (event: NavigateEvent) => {
            if (shouldNotIntercept(event)) return;

            const url = new URL(event.destination.url);
            const result = matchRoute(url.pathname, routes);
            if (!result) {
                // Fallback: navigate to home
                if (url.pathname !== "/") {
                    event.intercept({
                        handler: async () => {
                            navigation.navigate("/", { history: "replace" });
                        }
                    });
                }
                return;
            }

            const { route, context } = result;

            // Handle redirects
            if (route.redirect) {
                const target = route.redirect(context);
                event.intercept({
                    handler: async () => {
                        navigation.navigate(target, { history: "replace" });
                    }
                });
                return;
            }

            event.intercept({
                handler: async () => {
                    if (route.load) {
                        await route.load();
                    }

                    const title = typeof route.title === "function"
                        ? route.title(context)
                        : route.title;
                    document.title = title;

                    if (route.render && this.callback) {
                        const rendered = route.render(context);
                        this.callback(rendered, context);
                    }
                }
            });
        }, { signal });

        // Handle the initial page load
        this.handleCurrentUrl();
    }

    uninstall(): void {
        this.abortController?.abort();
        this.abortController = null;
        this.callback = null;
    }

    /** Resolve the current URL on first load. */
    private async handleCurrentUrl(): Promise<void> {
        const url = new URL(location.href);
        const result = matchRoute(url.pathname, routes);
        if (!result) {
            navigation.navigate("/", { history: "replace" });
            return;
        }

        const { route, context } = result;

        if (route.redirect) {
            const target = route.redirect(context);
            navigation.navigate(target, { history: "replace" });
            return;
        }

        if (route.load) {
            await route.load();
        }

        const title = typeof route.title === "function"
            ? route.title(context)
            : route.title;
        document.title = title;

        if (route.render && this.callback) {
            const rendered = route.render(context);
            this.callback(rendered, context);
        }
    }
}

export const appRouter = new AppRouter();
