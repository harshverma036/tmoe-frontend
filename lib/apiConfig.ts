import axios from "axios";
import Cookies from "js-cookie";

import appConfig from "./appConfig";
import { clearAuthSession } from "./clear-auth-session";

/**
 * Axios instance for all backend calls. `baseURL` comes from `NEXT_PUBLIC_API_URL`.
 *
 * Auth: when the user has a token stored in the cookie named by
 * `appConfig.cookies.userTokenKey`, each request includes
 * `Authorization: Bearer <token>`. If the cookie is missing, no header is set
 * (treated as logged out).
 */
const apiConfig = axios.create({
    baseURL: appConfig.apiHost,
});

apiConfig.interceptors.request.use((config) => {
    // js-cookie reads `document.cookie`; skip on the server where cookies are not available here.
    if (typeof document === "undefined") {
        return config;
    }

    const token = Cookies.get(appConfig.cookies.userTokenKey);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

let isHandlingExpiredSession = false;

apiConfig.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            typeof document !== "undefined" &&
            error.response?.status === 401 &&
            Cookies.get(appConfig.cookies.userTokenKey) &&
            !isHandlingExpiredSession
        ) {
            isHandlingExpiredSession = true;
            clearAuthSession();

            const onSignIn = window.location.pathname.startsWith("/sign-in");
            if (!onSignIn) {
                window.location.replace("/sign-in");
            }
        }

        return Promise.reject(error);
    },
);

export default apiConfig;
