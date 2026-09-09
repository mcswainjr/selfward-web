"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "../../../../lib/supabase/client";
import {
    createJourneyAudioUploadTicket,
    finalizeJourneyAudioUpload,
} from "./actions";

type JourneyAudioUploaderProps = {
    journeyId: string;
    stepId: string;
};

function formatDuration(seconds: number | null) {
    if (!seconds || seconds <= 0) {
        return "Loading duration…";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
}

export default function JourneyAudioUploader({
    journeyId,
    stepId,
}: JourneyAudioUploaderProps) {
    const router = useRouter();

    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] =
        useState<string | null>(null);
    const [durationSeconds, setDurationSeconds] =
        useState<number | null>(null);

    const [busy, setBusy] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [uploadedObjectName, setUploadedObjectName] =
        useState<string | null>(null);

    const [statusMessage, setStatusMessage] =
        useState<string | null>(null);
    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [file]);

    function handleFileChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        setErrorMessage(null);
        setStatusMessage(null);
        setDurationSeconds(null);

        const selectedFile =
            event.currentTarget.files?.[0] ?? null;

        if (!selectedFile) {
            setFile(null);
            return;
        }

        if (
            !selectedFile.name
                .toLowerCase()
                .endsWith(".mp3")
        ) {
            setFile(null);
            event.currentTarget.value = "";
            setErrorMessage(
                "Choose the finished MP3 file for this Journey day."
            );
            return;
        }

        if (
            selectedFile.size <= 0 ||
            selectedFile.size >
            50 * 1024 * 1024
        ) {
            setFile(null);
            event.currentTarget.value = "";
            setErrorMessage(
                "The MP3 must be larger than 0 bytes and no larger than 50 MB."
            );
            return;
        }

        setFile(selectedFile);
    }

    function handleLoadedMetadata(
        event: React.SyntheticEvent<HTMLAudioElement>
    ) {
        const duration =
            event.currentTarget.duration;

        if (
            Number.isFinite(duration) &&
            duration > 0
        ) {
            setDurationSeconds(
                Math.round(duration)
            );
        }
    }

    async function handleUpload() {
        if (
            !file ||
            !durationSeconds ||
            busy ||
            completed
        ) {
            return;
        }

        setBusy(true);
        setErrorMessage(null);

        let storageObjectName =
            uploadedObjectName;

        try {
            if (!storageObjectName) {
                setStatusMessage(
                    "Preparing secure upload…"
                );

                const ticket =
                    await createJourneyAudioUploadTicket({
                        journeyId,
                        stepId,
                        originalFileName: file.name,
                        fileSize: file.size,
                    });

                storageObjectName =
                    ticket.storageObjectName;

                setStatusMessage(
                    "Uploading finished MP3…"
                );

                const supabase =
                    createClient();

                const {
                    error: uploadError,
                } = await supabase.storage
                    .from("Journeys Audio")
                    .uploadToSignedUrl(
                        ticket.storageObjectName,
                        ticket.token,
                        file,
                        {
                            contentType:
                                "audio/mpeg",
                        }
                    );

                if (uploadError) {
                    throw new Error(
                        uploadError.message
                    );
                }

                setUploadedObjectName(
                    storageObjectName
                );
            }

            setStatusMessage(
                "Connecting audio to Journey…"
            );

            await finalizeJourneyAudioUpload({
                journeyId,
                stepId,
                storageObjectName,
                durationSeconds,
            });

            setCompleted(true);
            setStatusMessage(
                "Finished audio connected."
            );

            router.refresh();
        } catch (error) {
            console.error(
                "Journey audio upload error:",
                error
            );

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to upload the Journey audio."
            );

            if (storageObjectName) {
                setStatusMessage(
                    "The MP3 may already be uploaded. You can retry the connection without uploading it again."
                );
            } else {
                setStatusMessage(null);
            }
        } finally {
            setBusy(false);
        }
    }

    const canUpload =
        Boolean(file) &&
        Boolean(durationSeconds) &&
        !busy &&
        !completed;

    return (
        <section className="mt-5 rounded-[22px] border border-orange-400/20 bg-orange-400/[0.07] p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FFB59A]">
                Finished Audio
            </p>

            <p className="mt-2 text-sm font-bold leading-6 text-white/55">
                Choose the mastered MP3 for this
                Journey day. Content Ops will
                upload it and connect it
                automatically.
            </p>

            <div className="mt-5">
                <input
                    type="file"
                    accept=".mp3,audio/mpeg"
                    disabled={
                        busy ||
                        completed ||
                        Boolean(uploadedObjectName)
                    }
                    onChange={handleFileChange}
                    className="block w-full text-sm font-bold text-white/60 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2.5 file:text-sm file:font-black file:text-white hover:file:bg-white/15 disabled:opacity-50"
                />
            </div>

            {file && (
                <div className="mt-5 rounded-[18px] border border-white/[0.07] bg-black/10 p-4">
                    <p className="break-all text-sm font-bold text-white/70">
                        {file.name}
                    </p>

                    <p className="mt-1 text-xs font-bold text-white/35">
                        {(
                            file.size /
                            1024 /
                            1024
                        ).toFixed(2)}{" "}
                        MB
                    </p>

                    {previewUrl && (
                        <audio
                            controls
                            preload="metadata"
                            src={previewUrl}
                            onLoadedMetadata={
                                handleLoadedMetadata
                            }
                            className="mt-4 w-full"
                        />
                    )}

                    <div className="mt-4">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-white/35">
                            Detected Duration
                        </p>

                        <p className="mt-1 font-black text-white/80">
                            {formatDuration(
                                durationSeconds
                            )}
                        </p>
                    </div>
                </div>
            )}

            {statusMessage && (
                <p className="mt-4 text-sm font-bold leading-6 text-white/55">
                    {statusMessage}
                </p>
            )}

            {errorMessage && (
                <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm font-bold leading-6 text-red-100">
                    {errorMessage}
                </p>
            )}

            <button
                type="button"
                onClick={handleUpload}
                disabled={!canUpload}
                className="mt-5 rounded-full bg-[#F97316] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#fb8a3c] disabled:cursor-not-allowed disabled:opacity-40"
            >
                {busy
                    ? "Working…"
                    : completed
                        ? "Audio Connected"
                        : uploadedObjectName
                            ? "Retry Connection"
                            : "Upload & Connect Audio"}
            </button>

            <p className="mt-4 text-xs font-bold leading-5 text-white/30">
                This does not release the Journey.
            </p>
        </section>
    );
}