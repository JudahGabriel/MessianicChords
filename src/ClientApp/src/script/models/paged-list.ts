import { PagedResult } from "./interfaces";

type GetPagedResultsFunc<T> = (skip: number, take: number) => Promise<PagedResult<T>>;

export class PagedList<T> {
    totalCount: number | null = null;
    skip = 0;
    take = 25;
    hasMoreItems: boolean | null = null;
    readonly items: T[] = [];
    private currentFetch: Promise<PagedResult<T>> | null = null;
    private readonly changedEvent = new EventTarget();

    constructor(
        private readonly nextChunkFetcher: GetPagedResultsFunc<T>) {
    }

    /**
     * Gets whether the list is currently fetching the next chunk of items.
     */
    get isLoading(): boolean {
        return !!this.currentFetch;
    }

    /**
     * Adds a listener for the given event.
     * @param eventName
     * @param handler
     */
    addEventListener(eventName: "changed", handler: () => void) {
        if (eventName === "changed") {
            this.changedEvent.addEventListener(eventName, handler);
        }
    }

    /**
     * Removes a listener for the given event.
     * @param eventName 
     * @param handler 
     */
    removeEventListener(eventName: "changed", handler: () => void) {
        if (eventName === "changed") {
            this.changedEvent.removeEventListener(eventName, handler);
        }
    }

    /**
     * Fetches the next chunk of items.
     * @returns 
     */
    async fetch(): Promise<PagedResult<T>> {
        // If we're already loading the next chunk, return that.
        if (this.currentFetch) {
            return this.currentFetch;
        }

        const thisFetch = this.nextChunkFetcher(this.skip, this.take);
        this.currentFetch = thisFetch;
        this.notifyChanged(); // notify that we're loading

        try {
            const chunk = await this.currentFetch;
            
            // Make sure we weren't reset during our wait.
            if (thisFetch !== this.currentFetch) {
                return Promise.reject("PagedList was reset; skipping results.");
            }

            this.items.push(...chunk.results);
            this.skip += chunk.results.length;
            this.hasMoreItems = this.items.length < chunk.totalCount;
            return chunk;
        } finally {
            this.currentFetch = null;
            this.notifyChanged();
        }
    }

    /**
     * Resets the list to its initial state: no items loaded, skip reset to zero, etc.
     */
    reset(): void {
        this.currentFetch = null;
        this.hasMoreItems = null;
        this.skip = 0;
        this.items.length = 0;
        this.notifyChanged();
    }

    private notifyChanged() {
        this.changedEvent.dispatchEvent(new Event("changed"));
    }
}