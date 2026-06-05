import { LitElement, TemplateResult, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { Router } from "@thepassle/app-tools/router.js";
import { lazy } from "@thepassle/app-tools/router/plugins/lazy.js";
import { sharedStyles } from "./script/common/shared.styles";
import { bootstrapUtilities } from "./script/common/bootstrap-utilities.styles";
import { indexStyles } from "./app-index.styles";
import "./script/components/home-jumbotron";
import "./script/components/footer";
import "./script/components/app-header";
import { bootstrapGridStyles } from "./script/common/bootstrap-grid.styles";

interface RouteContext {
    params?: Record<string, string>;
    url?: URL;
}

const normalizeChordSheetsCasePlugin = {
    name: "normalize-chordsheets-case",
    shouldNavigate: (context: RouteContext) => {
        const pathname = context?.url?.pathname || "";
        const normalizedPathname = pathname.replace(/^\/chordsheets(?=\/|$)/i, "/chordsheets");
        const normalizedUrl = `${normalizedPathname}${context?.url?.search || ""}${context?.url?.hash || ""}`;

        return {
            condition: () => normalizedPathname === pathname,
            redirect: normalizedUrl
        };
    }
};

@customElement("app-index")
export class AppIndex extends LitElement {
    static styles = [sharedStyles, bootstrapUtilities, bootstrapGridStyles, indexStyles];

    @state() route: unknown = html``;

    private router: Router | null = null;

    disconnectedCallback() {
        super.disconnectedCallback();
        this.router?.removeEventListener("route-changed", this.onRouteChanged);
        this.router?.uninstall();
        this.router = null;
    }

    private onRouteChanged = (e: Event) => {
        const context = (e as CustomEvent).detail?.context as RouteContext | undefined;
        this.route = this.router?.render() ?? html``;
        window.dispatchEvent(new CustomEvent("app-route-changed", { detail: { context } }));
    };

    firstUpdated() {
        this.router = new Router({
            fallback: "/",
            plugins: [normalizeChordSheetsCasePlugin],
            routes: [
                {
                    path: "/",
                    title: "Home",
                    plugins: [lazy(() => import("./script/pages/app-home"))],
                    render: () => html`<app-home></app-home>`
                },
                {
                    path: "/chordsheets/new",
                    title: "Add Chord Sheet",
                    plugins: [lazy(() => import("./script/pages/chord-edit"))],
                    render: () => html`<chord-edit></chord-edit>`
                },
                {
                    path: "/chordsheets/new/success",
                    title: "Submission Successful",
                    plugins: [lazy(() => import("./script/pages/chord-edit-successful"))],
                    render: () => html`<chord-edit-successful></chord-edit-successful>`
                },
                {
                    path: "/chordsheets/:id/edit/success",
                    title: "Edit Submitted",
                    plugins: [lazy(() => import("./script/pages/chord-edit-successful"))],
                    render: (context: RouteContext) => html`<chord-edit-successful .location=${context}></chord-edit-successful>`
                },
                {
                    path: "/chordsheets/:id/edit",
                    title: "Edit Chord Sheet",
                    plugins: [lazy(() => import("./script/pages/chord-edit"))],
                    render: (context: RouteContext) => html`<chord-edit .location=${context}></chord-edit>`
                },
                {
                    path: "/chordsheets/:id",
                    title: "Chord Details",
                    plugins: [lazy(() => import("./script/pages/chord-details"))],
                    render: (context: RouteContext) => html`<chord-details chord-id="${context.params?.id || ""}"></chord-details>`
                },
                {
                    path: "/browse/newest",
                    title: "Newest",
                    plugins: [lazy(() => import("./script/pages/browse-newest"))],
                    render: () => html`<browse-newest></browse-newest>`
                },
                {
                    path: "/browse/songs",
                    title: "Browse Songs",
                    plugins: [lazy(() => import("./script/pages/browse-songs"))],
                    render: () => html`<browse-songs></browse-songs>`
                },
                {
                    path: "/browse/tags",
                    title: "Browse Tags",
                    plugins: [lazy(() => import("./script/pages/browse-tags"))],
                    render: () => html`<browse-tags></browse-tags>`
                },
                {
                    path: "/browse/artists",
                    title: "Browse Artists",
                    plugins: [lazy(() => import("./script/pages/browse-artists"))],
                    render: () => html`<browse-artists></browse-artists>`
                },
                {
                    path: "/browse/random",
                    title: "Random",
                    plugins: [lazy(() => import("./script/pages/browse-random"))],
                    render: () => html`<browse-random></browse-random>`
                },
                {
                    path: "/artist/:name",
                    title: "Artist",
                    plugins: [lazy(() => import("./script/pages/artist-songs"))],
                    render: (context: RouteContext) => html`<artist-songs .location=${context}></artist-songs>`
                },
                {
                    path: "/my/starred",
                    title: "My Starred",
                    plugins: [lazy(() => import("./script/pages/my-starred-page"))],
                    render: () => html`<my-starred-page></my-starred-page>`
                },
                {
                    path: "/profile",
                    title: "Profile",
                    plugins: [lazy(() => import("./script/pages/profile-page"))],
                    render: () => html`<profile-page></profile-page>`
                },
                {
                    path: "/account",
                    title: "Account",
                    plugins: [lazy(() => import("./script/pages/account-page"))],
                    render: () => html`<account-page></account-page>`
                },
                {
                    path: "/contact",
                    title: "Contact",
                    plugins: [lazy(() => import("./script/pages/contact-page"))],
                    render: () => html`<contact-page></contact-page>`
                },
                {
                    path: "/about",
                    title: "About",
                    plugins: [lazy(() => import("./script/pages/app-about"))],
                    render: () => html`<app-about></app-about>`
                }
            ]
        });

        this.router.addEventListener("route-changed", this.onRouteChanged);
        this.route = this.router.render();
    }

    render(): TemplateResult {
        return html`
            <div>
                <app-header></app-header>
                <main>
                    ${this.route}
                </main>

                <app-footer></app-footer>
            </div>
        `;
    }
}
