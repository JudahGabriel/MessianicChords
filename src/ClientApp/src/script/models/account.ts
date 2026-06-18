export const enum SignInStatus {
    Success = 0,
    LockedOut = 1,
    RequiresVerification = 2,
    Failure = 3,
    Pwned = 4
}

export interface UserViewModel {
    id?: string;
    userName?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    registrationDate?: string;
    profilePictureUrl?: string | null;
    isAdmin: boolean;
    starredChartIds: string[];
    starredChordCharts: Record<string, string>;
    editedChordCharts: Record<string, string>;
    newChordCharts: Record<string, string>;
}

export interface SignInModel {
    email: string;
    password: string;
    staySignedIn: boolean;
}

export interface SignInResult {
    status: SignInStatus;
    errorMessage?: string;
    user?: UserViewModel;
}

export interface RegisterModel {
    email: string;
    password: string;
    confirmPassword: string;
}

export interface RegisterResults {
    success: boolean;
    errorMessage?: string;
    isAlreadyRegistered: boolean;
    needsConfirmation: boolean;
    isPwned: boolean;
}

export interface SupportMessage {
    name?: string;
    email: string;
    message: string;
    date: string;
    userAgent: string;
}
