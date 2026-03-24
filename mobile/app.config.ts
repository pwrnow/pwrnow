import { ExpoConfig, ConfigContext } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";

const getUniqueIdentifier = () => {
    if (IS_DEV) {
        return "pl.pwrnow.app.dev";
    }
    return "pl.pwrnow.app";
};

const getAppName = () => {
    if (IS_DEV) {
        return "PWr Now (DEV)";
    }
    return "PWr Now";
};

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: getAppName(),
    slug: "pwrnow",
    version: "1.1.0",
    orientation: "portrait",
    icon: IS_DEV ? "./assets/DEV_color_dark.png" : "./assets/icon.png",
    userInterfaceStyle: "automatic",
    backgroundColor: "#000000",
    primaryColor: "#000000",
    splash: {
        image: "./assets/adaptive-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff",
    },
    ios: {
        backgroundColor: "#000000",
        supportsTablet: false,
        bundleIdentifier: getUniqueIdentifier(),
        associatedDomains: ["applinks:pwrnow.pl"],
        infoPlist: {
            ITSAppUsesNonExemptEncryption: false,
            CFBundleAllowMixedLocalizations: true,
            CFBundleLocalizations: ["pl", "en"],
            CFBundleDevelopmentRegion: "pl",
            NSCameraUsageDescription:
                "Aplikacja potrzebuje dostępu do kamery, aby skanować kody QR wydarzeń.",
            NSPhotoLibraryUsageDescription:
                "Aplikacja potrzebuje dostępu do biblioteki zdjęć, aby wybrać zdjęcie profilowe.",
        },
        icon: IS_DEV
            ? "./assets/DEV_color_dark.png"
            : {
                light: "./assets/icon-light.png",
                dark: "./assets/icon-dark.png",
            },
        splash: {
            backgroundColor: "#ffffff",
            dark: {
                backgroundColor: "#000000",
            },
        },
        usesAppleSignIn: true,
    },
    android: {
        package: getUniqueIdentifier(),
        icon: IS_DEV ? "./assets/DEV_color_dark.png" : "./assets/icon.png",
        adaptiveIcon: {
            foregroundImage: IS_DEV
                ? "./assets/DEV_color_dark.png"
                : "./assets/adaptive-icon.png",
            backgroundColor: "#ffffff",
        },
        googleServicesFile: "./google-services.json",
        permissions: [
            "android.permission.READ_CALENDAR",
            "android.permission.WRITE_CALENDAR",
            "android.permission.CAMERA",
        ],
        intentFilters: IS_DEV
            ? []
            : [
                {
                    action: "VIEW",
                    autoVerify: true,
                    data: [
                        {
                            scheme: "https",
                            host: "pwrnow.pl",
                            pathPrefix: "/wydarzenia",
                        },
                    ],
                    category: ["BROWSABLE", "DEFAULT"],
                },
            ],
    },
    plugins: [
        "expo-router",
        [
            "expo-font",
            {
                fonts: [
                    "./assets/fonts/Righteous-Regular.ttf",
                    "./assets/fonts/SpaceGrotesk-Light.ttf",
                    "./assets/fonts/SpaceGrotesk-Regular.ttf",
                    "./assets/fonts/SpaceGrotesk-Medium.ttf",
                    "./assets/fonts/SpaceGrotesk-SemiBold.ttf",
                    "./assets/fonts/SpaceGrotesk-Bold.ttf",
                ],
            },
        ],
        [
            "expo-calendar",
            {
                calendarPermission:
                    "Aplikacja potrzebuje dostępu do kalendarza, aby dodać wydarzenie.",
            },
        ],
        [
            "expo-notifications",
            {
                icon: "./assets/icon.png",
                color: "#ffffff",
                defaultChannel: "default",
            },
        ],
        [
            "expo-localization",
            {
                supportedLocales: {
                    ios: ["en", "pl"],
                    android: ["en", "pl"],
                },
            },
        ],
        [
            "expo-image-picker",
            {
                photosPermission:
                    "Aplikacja potrzebuje dostępu do biblioteki zdjęć, aby wybrać zdjęcie profilowe.",
            },
        ],
        "expo-secure-store",
        "expo-apple-authentication",
        "@sentry/react-native",
        "expo-web-browser",
    ],
    scheme: IS_DEV ? "pl.pwrnow.app.dev" : "pl.pwrnow.app",
    extra: {
        router: {
            origin: "https://pwrnow.pl",
        },
        eas: {
            projectId: "28be113a-2b1b-4840-8cdb-47c7faea0694",
        },
    },
    owner: "pwrnow",
    runtimeVersion: {
        policy: "appVersion",
    },
    updates: {
        url: "https://u.expo.dev/28be113a-2b1b-4840-8cdb-47c7faea0694",
    },
});
