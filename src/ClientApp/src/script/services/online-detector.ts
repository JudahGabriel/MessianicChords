import { ApiServiceBase } from "./api-service-base";

/**
 * Detects whether the API is reachable, suggesting true offline status.
 * navigator.onLine doesn't work consistently across browsers and doesn't always return true status.
 * This will fire a online-status-changed event when the online status changes.
 */
export class OnlineDetector extends ApiServiceBase {

    #onlineStatus = true;
    private eventTarget = new EventTarget();

    constructor() {
        super();
        this.onlineStatus = navigator.onLine;
        window.addEventListener("online", () => this.onlineStatus = navigator.onLine);
        
        this.checkOnlineRepeatedly();
    }

    get onlineStatus(): boolean {
        return this.#onlineStatus;
    }

    set onlineStatus(val: boolean) {
        if (this.#onlineStatus !== val) {
            this.#onlineStatus = val;
            this.eventTarget.dispatchEvent(new CustomEvent("online-status-changed", { detail: val }));
        }
    }

    public addEventListener(type: "online-status-changed", listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
        this.eventTarget.addEventListener(type, listener, options);
    }

    private checkOnlineRepeatedly(): Promise<boolean> {
        return this.pingApiWithTimeout(5000)
            .then(onlineStatus => this.onlineStatus = onlineStatus)
            .finally(() => setTimeout(() => this.checkOnlineRepeatedly(), 5000));
    }

    private pingApiWithTimeout(timeoutMs: number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            super.head("/ping", timeoutMs)
                .then(() => resolve(true), () => resolve(false))
                .catch(error => reject(error));
        });
    }
}

export const onlineDetector = new OnlineDetector();