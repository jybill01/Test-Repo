/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_USER_SERVICE_URL: string
    readonly VITE_SCHEDULE_SERVICE_URL: string
    readonly VITE_INTELLIGENCE_SERVICE_URL: string
    readonly VITE_INSIGHT_SERVICE_URL: string
    readonly VITE_GEMINI_API_KEY: string
    readonly DEV: boolean
    readonly PROD: boolean
    readonly MODE: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
