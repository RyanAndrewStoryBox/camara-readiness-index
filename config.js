// CAMARA Readiness Index — Configuration
// The API token is injected at build time by Netlify. Do not hardcode it here.

const CONFIG = {
    AIRTABLE_BASE_ID: 'appI7XMikyIqc7OHT',
    AIRTABLE_API_TOKEN: 'NETLIFY_INJECT_TOKEN',

    TABLES: {
        PROVIDERS: 'tblCBMxk8YwQibTDm',
        PROVIDER_APIS: 'tblHW2XbldPeNmiyW',
        API_FAMILIES: 'tblsBL3XVbKYK0nrb'
    },

    CATEGORIES: [
        { key: 'S1', label: 'Documentation quality', weight: 0.20, field: 'S1 — Documentation quality' },
        { key: 'S2', label: 'Developer access', weight: 0.20, field: 'S2 — Developer access and onboarding' },
        { key: 'S3', label: 'API scope clarity', weight: 0.15, field: 'S3 — API scope clarity' },
        { key: 'S4', label: 'Commercial clarity', weight: 0.15, field: 'S4 — Commercial clarity' },
        { key: 'S5', label: 'Standards alignment', weight: 0.10, field: 'S5 — Standards alignment' },
        { key: 'S6', label: 'Production readiness', weight: 0.15, field: 'S6 — Production readiness signals' },
        { key: 'S7', label: 'Geographic clarity', weight: 0.05, field: 'S7 — Geographic and market clarity' }
    ],

    LABEL_COLOURS: {
        'High readiness': '#22c55e',
        'Moderate readiness': '#f59e0b',
        'Early-stage': '#f97316',
        'Minimal': '#ef4444',
        'Unclear': '#9ca3af'
    },

    TIER_LABELS: {
        'A': 'Global operator group',
        'B': 'Single-market operator',
        'C': 'API aggregator',
        'D': 'Exchange / federation'
    }
};
