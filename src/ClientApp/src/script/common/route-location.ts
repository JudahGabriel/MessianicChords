export interface RouteLocation {
    params?: Record<string, string>;
    url?: URL;
    search?: string;
    pathname?: string;
}
