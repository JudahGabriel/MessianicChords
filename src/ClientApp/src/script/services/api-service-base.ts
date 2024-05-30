export class ApiServiceBase {
    // @ts-ignore
    protected readonly apiUrl = import.meta.env.VITE_API_URL;

    protected async getJson<T>(url: string, args?: Object): Promise<T> {
        const response = await this.getResponse(url, args);
        const json = await response.json() as T;
        return json;
    }

    protected async getString(url: string, args?: Object): Promise<string> {
        const response = await this.getResponse(url, args);
        return await response.text();
    }

    protected async post<T>(url: string, args?: Object): Promise<T> {
        const absoluteUrl = this.apiUrl + url;
        const postResult = await fetch(absoluteUrl, {
            method: "POST",
            body: args ? JSON.stringify(args) : undefined
        });

        if (!postResult.ok) {
            console.error("HTTP POST failed", absoluteUrl, postResult);
            throw new Error("HTTP POST resulted in non-successful status code " + postResult.status);
        }

        const json = await postResult.json();
        return json;
    }

    protected async postFormData(url: string, formData: FormData): Promise<void> {
        const absoluteUrl = this.apiUrl + url;
        const postResult = await fetch(absoluteUrl, {
            method: "POST",
            body: formData
        });

        if (!postResult.ok) {
            console.error("HTTP POST failed", absoluteUrl, postResult);
            throw new Error("HTTP POST resulted in non-successful status code " + postResult.status);
        }
    }

    protected async getResponse(url: string, args?: Object): Promise<Response> {
        let absoluteUrl = this.apiUrl + url;
        if (args) {
            absoluteUrl += "?";
            const queryParams = Object.entries(args)
                .map(e => `${e[0]}=${encodeURIComponent(e[1])}`);
            absoluteUrl += queryParams.join("&");
        }

        const result = await fetch(absoluteUrl);
        if (!result.ok) {
            console.error("HTTP GET failed", absoluteUrl, result);
            throw new Error("HTTP GET resulted in non-successful status code " + result.status);
        }

        return result;
    }

    /**
     * Makes an HTTP HEAD request to the given URL with the specified timeout.
     * @param url The URL to make the HEAD request to.
     * @param timeout The timeout in milliseconds.
     * @returns A promise that resolves to the response if successful. If the response is a non-OK result, the promise will be rejected.
     */
    protected async head(url: string, timeout: number): Promise<Response> {
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), timeout);
        let absoluteUrl = this.apiUrl + url;
        const response = await fetch(absoluteUrl, { 
            method: "HEAD", 
            signal: abortController.signal 
        });
        if (!response.ok) {
            console.error("HTTP HEAD failed", this.apiUrl, response);
            throw new Error("HTTP HEAD resulted in non-successful status code " + response.status);
        }

        clearTimeout(timeoutId);
        return response;
    }
}