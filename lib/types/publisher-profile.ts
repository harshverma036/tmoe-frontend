/**
 * Shared types for the publisher onboarding form and the complete-profile API.
 */

export type PublisherInventoryItem = {
    type: string;
    category: string;
    estimated_traffic?: number;
    monetisation_model?: string;
};

export type PublisherFormValues = {
    website_url?: string;
    publication_name: string;
    description: string;
    regions_covered: string[];
    content_categories: string[];
    monthly_sessions?: number;
    page_views?: number;
    content_inventory: PublisherInventoryItem[];
    bank_name: string;
    ifsc_code: string;
    account_no: string;
    holder_name: string;
};
