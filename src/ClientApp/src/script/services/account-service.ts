import { RegisterModel, RegisterResults, SignInModel, SignInResult, SupportMessage, UserViewModel } from "../models/account";
import { BehaviorSubject } from "rxjs";
import { ApiServiceBase } from "./api-service-base";

class AccountService extends ApiServiceBase {
    currentUser: UserViewModel | null = null;
    signedInState = new BehaviorSubject<boolean>(false);

    async getUser(): Promise<UserViewModel | null> {
        if (this.currentUser) {
            return this.currentUser;
        }

        const user = await this.getJson<UserViewModel | null>("/api/account/getCurrentUser");
        this.currentUser = user;
        this.signedInState.next(!!user);
        return user;
    }

    signIn(model: SignInModel): Promise<SignInResult> {
        return this.post<SignInResult>("/api/account/signIn", model);
    }

    register(model: RegisterModel): Promise<RegisterResults> {
        return this.post<RegisterResults>("/api/account/register", model);
    }

    async signOut(): Promise<void> {
        await this.post("/api/account/signOut");
        this.currentUser = null;
        this.signedInState.next(false);
    }

    sendSupportMessage(message: SupportMessage): Promise<SupportMessage> {
        return this.post<SupportMessage>("/api/account/sendSupportMessage", message);
    }

    async saveProfile(user: UserViewModel, profilePictureFile?: File | null): Promise<UserViewModel> {
        const absoluteUrl = this.apiUrl + "/api/account/saveProfile";
        const formData = new FormData();
        formData.append("id", user.id || "");
        formData.append("firstName", user.firstName || "");
        formData.append("lastName", user.lastName || "");
        if (profilePictureFile) {
            formData.append("profilePictureFile", profilePictureFile, profilePictureFile.name);
        }

        const response = await fetch(absoluteUrl, {
            method: "POST",
            credentials: "include",
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP POST resulted in non-successful status code ${response.status}`);
        }

        const updatedUser = await response.json() as UserViewModel;

        this.currentUser = updatedUser;
        this.signedInState.next(true);
        return updatedUser;
    }

    async starChord(chordChartId: string): Promise<UserViewModel> {
        const updatedUser = await this.post<UserViewModel>("/api/account/star", { chordChartId });
        this.currentUser = updatedUser;
        this.signedInState.next(true);
        return updatedUser;
    }

    async unstarChord(chordChartId: string): Promise<UserViewModel> {
        const updatedUser = await this.post<UserViewModel>("/api/account/unstar", { chordChartId });
        this.currentUser = updatedUser;
        this.signedInState.next(true);
        return updatedUser;
    }
}

export const accountService = new AccountService();
