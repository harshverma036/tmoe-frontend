"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { yupResolver } from "@hookform/resolvers/yup";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Controller, SubmitHandler, useFieldArray, useForm, useWatch } from "react-hook-form";
import * as yup from "yup";

import {
    completePublisherProfile,
    mapPublisherFormToApiPayload,
} from "@/lib/api/publisher-profile";
import type { PublisherFormValues, PublisherInventoryItem } from "@/lib/types/publisher-profile";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const regions = ["India", "APAC", "North America", "Europe", "Middle East"];
const contentCategories = [
    "Tech",
    "Lifestyle",
    "Finance",
    "Health",
    "Beauty",
    "Travel",
    "Education",
    "Entertainment",
];
const inventoryTypes = ["Article", "Video", "Newsletter", "Banner", "Native Ad"];
const monetisationModels = ["CPM", "CPC", "CPA", "Fixed", "Affiliate"];

const inventorySchema: yup.ObjectSchema<PublisherInventoryItem> = yup.object({
    type: yup.string().trim().required("Type is required"),
    category: yup.string().trim().required("Category is required"),
    estimated_traffic: yup
        .number()
        .typeError("Estimated traffic must be a number")
        .integer("Estimated traffic must be an integer")
        .min(1, "Estimated traffic must be at least 1")
        .required("Estimated traffic is required"),
    monetisation_model: yup.string().trim().optional(),
});

const publisherSchema: yup.ObjectSchema<PublisherFormValues> = yup.object({
    website_url: yup.string().url("Enter a valid website URL").optional(),
    publication_name: yup.string().trim().required("Publication name is required"),
    description: yup.string().trim().required("Description is required"),
    regions_covered: yup
        .array()
        .of(yup.string().trim().required())
        .min(1, "Select at least one region")
        .required(),
    content_categories: yup
        .array()
        .of(yup.string().trim().required())
        .min(1, "Select at least one content category")
        .required(),
    monthly_sessions: yup
        .number()
        .typeError("Monthly sessions must be a number")
        .integer("Monthly sessions must be an integer")
        .min(1, "Monthly sessions must be at least 1")
        .required("Monthly sessions is required"),
    page_views: yup
        .number()
        .typeError("Page views must be a number")
        .integer("Page views must be an integer")
        .min(1, "Page views must be at least 1")
        .required("Page views is required"),
    content_inventory: yup
        .array()
        .of(inventorySchema)
        .min(1, "Add at least one content slot")
        .required(),
    bank_name: yup.string().trim().required("Bank name is required"),
    ifsc_code: yup.string().trim().required("IFSC code is required"),
    account_no: yup.string().trim().required("Account number is required"),
    holder_name: yup.string().trim().required("Account holder name is required"),
});

const defaultValues: PublisherFormValues = {
    website_url: undefined,
    publication_name: "",
    description: "",
    regions_covered: [],
    content_categories: [],
    monthly_sessions: undefined,
    page_views: undefined,
    content_inventory: [
        { type: "", category: "", estimated_traffic: undefined, monetisation_model: "" },
    ],
    bank_name: "",
    ifsc_code: "",
    account_no: "",
    holder_name: "",
};

const steps = [
    "Company details",
    "Content categories",
    "Traffic data",
    "Content inventory",
    "Bank details",
] as const;

const PublisherProfileForm = ({
    userId: _userId,
}: {
    /** Route param; reserved for future profile-scoped behaviour or analytics. */
    userId: string;
}) => {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);

    /**
     * Persists publisher onboarding via TanStack Query so the submit button can
     * reflect `isPending` and errors surface through `onError` / toast.
     */
    const { mutateAsync: submitPublisherProfile, isPending: isSubmittingProfile } =
        useMutation({
            mutationKey: ["users", "complete-profile", "publisher"],
            mutationFn: async (values: PublisherFormValues) => {
                const payload = mapPublisherFormToApiPayload(values);
                return completePublisherProfile(payload);
            },
            onSuccess: () => {
                toast.success("Publisher profile completed successfully");
                router.push("/");
            },
            onError: (error: AxiosError<{ message?: string }>) => {
                const message =
                    error.response?.data?.message ||
                    error.message ||
                    "Could not complete publisher profile";
                toast.error(message);
            },
        });

    const { register, control, getValues, handleSubmit, setValue, trigger, formState: { errors } } =
        useForm<PublisherFormValues>({
        defaultValues,
        resolver: yupResolver(publisherSchema),
        mode: "onTouched",
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "content_inventory",
    });

    const selectedRegions = useWatch({ control, name: "regions_covered" });
    const selectedCategories = useWatch({ control, name: "content_categories" });

    const stepFields = useMemo(
        () => [
            ["website_url", "publication_name", "description", "regions_covered"] as const,
            ["content_categories"] as const,
            ["monthly_sessions", "page_views"] as const,
            ["content_inventory"] as const,
            ["bank_name", "ifsc_code", "account_no", "holder_name"] as const,
        ],
        []
    );

    const toggleMultiValue = (
        key: "regions_covered" | "content_categories",
        value: string
    ) => {
        const current = getValues(key) || [];
        const next = current.includes(value)
            ? current.filter((item: string) => item !== value)
            : [...current, value];
        setValue(key, next, { shouldValidate: true, shouldTouch: true });
    };

    const goNext = async () => {
        const isStepValid = await trigger(stepFields[currentStep]);
        if (!isStepValid) return;
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    };

    const goPrevious = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };

    const onSubmit: SubmitHandler<PublisherFormValues> = async (data) => {
        await submitPublisherProfile(data);
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-8">
            <Card className="w-full max-w-3xl">
                <CardHeader>
                    <CardTitle>Complete publisher onboarding</CardTitle>
                    <CardDescription>
                        Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <CardContent className="space-y-6">
                        <div className="h-2 w-full rounded-full bg-muted">
                            <div
                                className="h-2 rounded-full bg-primary transition-all"
                                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                            />
                        </div>

                        {currentStep === 0 && (
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="website_url">Website URL (Optional)</Label>
                                    <Input
                                        id="website_url"
                                        placeholder="https://yourpublication.com"
                                        {...register("website_url")}
                                        errorMessage={errors.website_url?.message}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="publication_name">Publication name</Label>
                                    <Input
                                        id="publication_name"
                                        placeholder="The Media Outlet"
                                        {...register("publication_name")}
                                        errorMessage={errors.publication_name?.message}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Input
                                        id="description"
                                        placeholder="Describe your publication"
                                        {...register("description")}
                                        errorMessage={errors.description?.message}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Regions covered</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {regions.map((region) => {
                                            const selected = selectedRegions?.includes(region);
                                            return (
                                                <Button
                                                    key={region}
                                                    type="button"
                                                    variant={selected ? "default" : "outline"}
                                                    onClick={() => toggleMultiValue("regions_covered", region)}
                                                >
                                                    {region}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    {errors.regions_covered?.message && (
                                        <p className="text-sm text-red-500">{errors.regions_covered.message}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div className="grid gap-2">
                                <Label>Content categories</Label>
                                <div className="flex flex-wrap gap-2">
                                    {contentCategories.map((category) => {
                                        const selected = selectedCategories?.includes(category);
                                        return (
                                            <Button
                                                key={category}
                                                type="button"
                                                variant={selected ? "default" : "outline"}
                                                onClick={() => toggleMultiValue("content_categories", category)}
                                            >
                                                {category}
                                            </Button>
                                        );
                                    })}
                                </div>
                                {errors.content_categories?.message && (
                                    <p className="text-sm text-red-500">{errors.content_categories.message}</p>
                                )}
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="monthly_sessions">Monthly sessions</Label>
                                    <Input
                                        id="monthly_sessions"
                                        type="number"
                                        placeholder="50000"
                                        {...register("monthly_sessions", { valueAsNumber: true })}
                                        errorMessage={errors.monthly_sessions?.message}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="page_views">Page views</Label>
                                    <Input
                                        id="page_views"
                                        type="number"
                                        placeholder="120000"
                                        {...register("page_views", { valueAsNumber: true })}
                                        errorMessage={errors.page_views?.message}
                                    />
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="rounded-md border p-4 space-y-4">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label>Type</Label>
                                                <Controller
                                                    control={control}
                                                    name={`content_inventory.${index}.type`}
                                                    render={({ field: controlledField }) => (
                                                        <Select
                                                            value={controlledField.value || ""}
                                                            onValueChange={controlledField.onChange}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {inventoryTypes.map((type) => (
                                                                    <SelectItem key={type} value={type}>
                                                                        {type}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                                <p className="text-sm text-red-500">
                                                    {errors.content_inventory?.[index]?.type?.message}
                                                </p>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor={`content_inventory.${index}.category`}>Category</Label>
                                                <Input
                                                    id={`content_inventory.${index}.category`}
                                                    placeholder="Tech"
                                                    {...register(`content_inventory.${index}.category`)}
                                                    errorMessage={errors.content_inventory?.[index]?.category?.message}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor={`content_inventory.${index}.estimated_traffic`}>
                                                    Estimated traffic
                                                </Label>
                                                <Input
                                                    id={`content_inventory.${index}.estimated_traffic`}
                                                    type="number"
                                                    placeholder="25000"
                                                    {...register(`content_inventory.${index}.estimated_traffic`, {
                                                        valueAsNumber: true,
                                                    })}
                                                    errorMessage={
                                                        errors.content_inventory?.[index]?.estimated_traffic?.message
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Monetisation model (Optional)</Label>
                                                <Controller
                                                    control={control}
                                                    name={`content_inventory.${index}.monetisation_model`}
                                                    render={({ field: controlledField }) => (
                                                        <Select
                                                            value={controlledField.value || ""}
                                                            onValueChange={controlledField.onChange}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select model" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {monetisationModels.map((model) => (
                                                                    <SelectItem key={model} value={model}>
                                                                        {model}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                        {fields.length > 1 && (
                                            <Button type="button" variant="destructive" onClick={() => remove(index)}>
                                                Remove slot
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                {typeof errors.content_inventory?.message === "string" && (
                                    <p className="text-sm text-red-500">{errors.content_inventory.message}</p>
                                )}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        append({
                                            type: "",
                                            category: "",
                                            estimated_traffic: undefined,
                                            monetisation_model: "",
                                        })
                                    }
                                >
                                    Add content slot
                                </Button>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="bank_name">Bank name</Label>
                                    <Input
                                        id="bank_name"
                                        placeholder="State Bank of India"
                                        {...register("bank_name")}
                                        errorMessage={errors.bank_name?.message}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="ifsc_code">IFSC code</Label>
                                    <Input
                                        id="ifsc_code"
                                        placeholder="SBIN0001234"
                                        {...register("ifsc_code")}
                                        errorMessage={errors.ifsc_code?.message}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="account_no">Account number</Label>
                                    <Input
                                        id="account_no"
                                        placeholder="1234567890"
                                        {...register("account_no")}
                                        errorMessage={errors.account_no?.message}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="holder_name">Account holder name</Label>
                                    <Input
                                        id="holder_name"
                                        placeholder="John Doe"
                                        {...register("holder_name")}
                                        errorMessage={errors.holder_name?.message}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex items-center justify-between">
                        <Button type="button" variant="outline" onClick={goPrevious} disabled={currentStep === 0}>
                            Previous
                        </Button>
                        {currentStep < steps.length - 1 ? (
                            <Button type="button" onClick={goNext}>
                                Next
                            </Button>
                        ) : (
                            <Button type="submit" disabled={isSubmittingProfile}>
                                {isSubmittingProfile ? "Submitting..." : "Complete onboarding"}
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default PublisherProfileForm;