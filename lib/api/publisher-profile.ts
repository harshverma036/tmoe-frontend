import apiConfig from "@/lib/apiConfig";

import type { PublisherFormValues } from "@/lib/types/publisher-profile";

/**
 * Payload shape for POST /api/users/complete-profile/publisher
 * (aligned with the backend contract).
 */
export type CompletePublisherProfileRequest = {
    website_url?: string;
    publication_name: string;
    description: string;
    regions_covered: string[];
    content_categories: string[];
    monthly_sessions: number;
    page_views: number;
    content_inventory: {
        type: string;
        category: string;
        estimated_traffic: number;
        monetisation_model?: string;
    }[];
    bank_name: string;
    ifsc_code: string;
    account_no: string;
    holder_name: string;
};

/** Relative path under `apiHost` for completing publisher onboarding. */
export const COMPLETE_PUBLISHER_PROFILE_PATH =
    "/api/users/complete-profile/publisher";

/**
 * Maps validated react-hook-form values to the JSON body the API expects.
 * Omits optional fields when they are empty so the payload stays minimal.
 */
export function mapPublisherFormToApiPayload(
    values: PublisherFormValues,
): CompletePublisherProfileRequest {
    const content_inventory = values.content_inventory.map((row) => {
        const item: CompletePublisherProfileRequest["content_inventory"][number] = {
            type: row.type,
            category: row.category.trim(),
            estimated_traffic: row.estimated_traffic as number,
        };
        const model = row.monetisation_model?.trim();
        if (model) {
            item.monetisation_model = model;
        }
        return item;
    });

    const payload: CompletePublisherProfileRequest = {
        publication_name: values.publication_name.trim(),
        description: values.description.trim(),
        regions_covered: values.regions_covered,
        content_categories: values.content_categories,
        monthly_sessions: values.monthly_sessions as number,
        page_views: values.page_views as number,
        content_inventory,
        bank_name: values.bank_name.trim(),
        ifsc_code: values.ifsc_code.trim(),
        account_no: values.account_no.trim(),
        holder_name: values.holder_name.trim(),
    };

    const website = values.website_url?.trim();
    if (website) {
        payload.website_url = website;
    }

    return payload;
}

/**
 * Submits publisher onboarding data. Auth is attached globally via `apiConfig`
 * when a session cookie is present.
 */
export async function completePublisherProfile(
    body: CompletePublisherProfileRequest,
): Promise<unknown> {
    const { data } = await apiConfig.post<unknown>(
        COMPLETE_PUBLISHER_PROFILE_PATH,
        body,
    );
    return data;
}
