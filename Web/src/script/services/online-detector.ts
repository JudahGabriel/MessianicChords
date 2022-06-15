import { ApiServiceBase } from "./api-service-base";

/**
 * Detects whether the API is reachable, suggesting true offline status.
 * navigator.onLine doesn't work consistently across browser and doesn't always return true status.
 */
export class OnlineDetector extends ApiServiceBase {
    constructor() {
        super();
    }

    /**
     * Detects whether we're online by pinging the API.
     * @returns A promise containing boolean online status.
     */
    public checkOnline(): Promise<boolean> {
        return this.pingApiWithTimeout(3000);
    }

    private pingApiWithTimeout(timeoutMs: number): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            setTimeout(() => resolve(false), timeoutMs);
            super.getResponse("/")
                .then(response => resolve(response.ok), () => resolve(false));
        });
    }
}