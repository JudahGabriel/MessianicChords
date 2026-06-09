import { BehaviorSubject } from "rxjs";
import { ApiServiceBase } from "./api-service-base";

/**
 * Detects whether the API is reachable, suggesting true offline status.
 * navigator.onLine doesn't work consistently across browsers and doesn't always return true status.
 * Exposes onlineStatus$ as a BehaviorSubject<boolean | null> (null = not yet determined).
 */
export class OnlineDetector extends ApiServiceBase {

    /**
     * Gets the current online status. This will be null until the first check is completed.
     */
    readonly onlineStatus = new BehaviorSubject<boolean | null>(null);

    constructor() {
        super();
        this.setOnlineStatus(navigator.onLine);
        window.addEventListener("online", () => this.setOnlineStatus(navigator.onLine));
        
        this.runRecurringPing();
    }

    private setOnlineStatus(val: boolean): void {
        if (this.onlineStatus.value !== val) {
            this.onlineStatus.next(val);
        }
    }

    private runRecurringPing(): void {
        this.pingApiWithTimeout(5000)
            .then(onlineStatus => this.setOnlineStatus(onlineStatus))
            .finally(() => setTimeout(() => this.runRecurringPing(), 5000));
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