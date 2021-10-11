export class ApiServiceBase {
    protected readonly apiUrl = "https://api.messianicchords.com";
    //protected readonly apiUrl = "https://localhost:44365";

    protected async get<T>(url: string, args?: Object): Promise<T> {
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

        const json = await result.json<T>();
        return json;
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
}