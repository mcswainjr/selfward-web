"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { createClient } from "../../../../lib/supabase/client";

import {
    createJourneyImageUploadTicket,
    finalizeJourneyImageUpload,
} from "./actions";

type JourneyImageAssetType = "cover" | "hero";

type Props = {
    journeyId: string;
    assetType: JourneyImageAssetType;
    currentUrl: string | null;
};

const IMAGE_RULES = {
    cover: {
        label: "Cover Image",
        width: 1600,
        height: 900,
        description: "1600 × 900",
    },
    hero: {
        label: "Hero Image",
        width: 1500,
        height: 500,
        description: "1500 × 500",
    },
} as const;

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

const MAX_FILE_SIZE = 15 * 1024 * 1024;

async function readImageDimensions(file: File) {
    return new Promise<{
        width: number;
        height: number;
    }>((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            const dimensions = {
                width: image.naturalWidth,
                height: image.naturalHeight,
            };

            URL.revokeObjectURL(objectUrl);
            resolve(dimensions);
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);

            reject(
                new Error(
                    "Unable to read the selected image."
                )
            );
        };

        image.src = objectUrl;
    });
}

export default function JourneyImageUploader({
    journeyId,
    assetType,
    currentUrl,
}: Props) {
    const router = useRouter();
    const rule = IMAGE_RULES[assetType];

    const [selectedFile, setSelectedFile] =
        useState<File | null>(null);

    const [previewUrl, setPreviewUrl] =
        useState<string | null>(null);

    const [dimensions, setDimensions] = useState<{
        width: number;
        height: number;
    } | null>(null);

    const [busy, setBusy] = useState(false);

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    const [successMessage, setSuccessMessage] =
        useState<string | null>(null);

    const selectedFileSize = useMemo(() => {
        if (!selectedFile) return null;

        return (
            selectedFile.size /
            (1024 * 1024)
        ).toFixed(2);
    }, [selectedFile]);

    useEffect(() => {
        if (!selectedFile) {
            setPreviewUrl(null);
            return;
        }

        const objectUrl =
            URL.createObjectURL(selectedFile);

        setPreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [selectedFile]);

    async function handleFileSelection(
        file: File | null
    ) {
        setSelectedFile(null);
        setDimensions(null);
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!file) {
            return;
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            setErrorMessage(
                "Choose a JPEG, PNG, or WebP image."
            );
            return;
        }

        if (
            file.size <= 0 ||
            file.size > MAX_FILE_SIZE
        ) {
            setErrorMessage(
                "Image must be larger than 0 bytes and no larger than 15 MB."
            );
            return;
        }

        try {
            const imageDimensions =
                await readImageDimensions(file);

            setDimensions(imageDimensions);

            if (
                imageDimensions.width !== rule.width ||
                imageDimensions.height !== rule.height
            ) {
                setErrorMessage(
                    `${rule.label} must be exactly ${rule.description}. ` +
                    `Selected image is ${imageDimensions.width} × ${imageDimensions.height}.`
                );

                return;
            }

            setSelectedFile(file);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to validate the selected image."
            );
        }
    }

    async function handleUpload() {
        if (!selectedFile || busy) {
            return;
        }

        const confirmed = window.confirm(
            `Upload and connect this ${rule.label.toLowerCase()} to the Journey?`
        );

        if (!confirmed) {
            return;
        }

        setBusy(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const ticket =
                await createJourneyImageUploadTicket({
                    journeyId,
                    assetType,
                    mimeType: selectedFile.type,
                    fileSize: selectedFile.size,
                });

            const supabase = createClient();

            const { error: uploadError } =
                await supabase.storage
                    .from(ticket.bucket)
                    .uploadToSignedUrl(
                        ticket.storageObjectName,
                        ticket.token,
                        selectedFile,
                        {
                            contentType:
                                selectedFile.type,
                            upsert: false,
                        }
                    );

            if (uploadError) {
                throw new Error(
                    uploadError.message ||
                    "Unable to upload the Journey image."
                );
            }

            await finalizeJourneyImageUpload({
                journeyId,
                assetType,
                mimeType: selectedFile.type,
                storageObjectName:
                    ticket.storageObjectName,
            });

            setSuccessMessage(
                `${rule.label} uploaded and connected.`
            );

            setSelectedFile(null);
            setDimensions(null);

            router.refresh();
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to upload and connect the Journey image."
            );
        } finally {
            setBusy(false);
        }
    }

    /*
      Once an asset is connected, v1 intentionally
      shows the finished asset instead of replacement controls.
    */
    if (currentUrl?.trim()) {
        return (
            <div className="rounded-[24px] border border-white/10 bg-black/10 p-5">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-black text-white">
                            {rule.label}
                        </p>

                        <p className="mt-1 text-xs font-bold text-white/40">
                            {rule.description}
                        </p>
                    </div>

                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">
                        ✓ Connected
                    </span>
                </div>

                <div
                    className={`mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20 ${assetType === "hero"
                            ? "aspect-[3/1]"
                            : "aspect-[16/9]"
                        }`}
                >
                    <img
                        src={currentUrl}
                        alt={`${rule.label} preview`}
                        className="h-full w-full object-cover"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-[24px] border border-white/10 bg-black/10 p-5">
            <div>
                <p className="text-sm font-black text-white">
                    {rule.label}
                </p>

                <p className="mt-1 text-xs font-bold text-white/40">
                    Required size: {rule.description}
                    {" · "}
                    JPEG, PNG, or WebP
                    {" · "}
                    Maximum 15 MB
                </p>
            </div>

            <div className="mt-4">
                <label className="inline-flex cursor-pointer rounded-full border border-white/10 bg-white/[0.07] px-4 py-2.5 text-sm font-black text-white transition hover:bg-white/[0.12]">
                    Choose Image

                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={busy}
                        className="hidden"
                        onChange={(event) => {
                            const file =
                                event.target.files?.[0] ??
                                null;

                            void handleFileSelection(file);

                            /*
                              Allows selecting the same file again
                              after correcting another issue.
                            */
                            event.currentTarget.value = "";
                        }}
                    />
                </label>
            </div>

            {previewUrl && selectedFile && (
                <div className="mt-5">
                    <div
                        className={`overflow-hidden rounded-2xl border border-white/10 bg-black/20 ${assetType === "hero"
                                ? "aspect-[3/1]"
                                : "aspect-[16/9]"
                            }`}
                    >
                        <img
                            src={previewUrl}
                            alt={`Selected ${rule.label.toLowerCase()} preview`}
                            className="h-full w-full object-cover"
                        />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-bold text-white/45">
                        <span>
                            {selectedFile.name}
                        </span>

                        {dimensions && (
                            <span>
                                {dimensions.width} ×{" "}
                                {dimensions.height}
                            </span>
                        )}

                        {selectedFileSize && (
                            <span>
                                {selectedFileSize} MB
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        disabled={busy}
                        onClick={handleUpload}
                        className="mt-4 inline-flex rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {busy
                            ? "Uploading…"
                            : "Upload & Connect"}
                    </button>
                </div>
            )}

            {errorMessage && (
                <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm font-bold text-red-100">
                    {errorMessage}
                </p>
            )}

            {successMessage && (
                <p className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm font-bold text-emerald-100">
                    {successMessage}
                </p>
            )}
        </div>
    );
}