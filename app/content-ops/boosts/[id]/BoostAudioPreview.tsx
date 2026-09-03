"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createClient } from "../../../../lib/supabase/client";

import {
    createBoostAudioUploadTicket,
    discoverBoostUploadedAudio,
    finalizeBoostAudioUpload,
} from "./actions";

type Props = {
    boostId: string;
    status: string;
    recordingScript: string | null;
    contentId: string | null;
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

export default function BoostAudioPreview({
    boostId,
    status,
    recordingScript,
    contentId,
}: Props) {
    const router = useRouter();

    const [file, setFile] =
        useState<File | null>(null);

    const [previewUrl, setPreviewUrl] =
        useState<string | null>(null);

    const [
        durationSeconds,
        setDurationSeconds,
    ] = useState<number | null>(null);

    const [busy, setBusy] =
        useState(false);

    const [
        connecting,
        setConnecting,
    ] = useState(false);

    const [
        checkingStorage,
        setCheckingStorage,
    ] = useState(true);

    const [
        uploadedObjectName,
        setUploadedObjectName,
    ] = useState<string | null>(null);

    const [
        storedAudioUrl,
        setStoredAudioUrl,
    ] = useState<string | null>(null);

    const [
        statusMessage,
        setStatusMessage,
    ] = useState<string | null>(null);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState<string | null>(null);

    const audioProductionEligible =
        status === "human_approved" &&
        !contentId &&
        !!recordingScript?.trim();

    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }

        const objectUrl =
            URL.createObjectURL(file);

        setPreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [file]);

    useEffect(() => {
        if (!audioProductionEligible) {
            setCheckingStorage(false);
            return;
        }

        let cancelled = false;

        async function checkStorage() {
            try {
                const result =
                    await discoverBoostUploadedAudio({
                        boostId,
                    });

                if (
                    !cancelled &&
                    result.exists
                ) {
                    setUploadedObjectName(
                        result.storageObjectName
                    );

                    setStoredAudioUrl(
                        result.publicUrl
                    );

                    setStatusMessage(
                        "Finished MP3 found in production Storage. Verifying the stored audio before connection."
                    );
                }
            } catch (error) {
                console.error(
                    "Boost audio discovery error:",
                    error
                );

                if (!cancelled) {
                    setErrorMessage(
                        error instanceof Error
                            ? error.message
                            : "Unable to check Boost audio Storage."
                    );
                }
            } finally {
                if (!cancelled) {
                    setCheckingStorage(false);
                }
            }
        }

        checkStorage();

        return () => {
            cancelled = true;
        };
    }, [boostId, audioProductionEligible]);

    if (!audioProductionEligible) {
        return null;
    }

    function handleFileChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        setErrorMessage(null);
        setStatusMessage(null);
        setDurationSeconds(null);
        setUploadedObjectName(null);

        const selectedFile =
            event.currentTarget.files?.[0] ??
            null;

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
                "Choose the finished MP3 file for this Boost."
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
        event: React.SyntheticEvent<
            HTMLAudioElement
        >
    ) {
        const duration =
            event.currentTarget.duration;

        if (
            Number.isFinite(duration) &&
            duration > 0
        ) {
            const roundedDuration =
                Math.round(duration);

            setDurationSeconds(
                roundedDuration
            );

            if (
                uploadedObjectName &&
                storedAudioUrl
            ) {
                setStatusMessage(
                    "Finished MP3 verified in production Storage and ready to connect."
                );
            }
        }
    }

    async function handleUpload() {
        if (
            !file ||
            !durationSeconds ||
            busy ||
            uploadedObjectName
        ) {
            return;
        }

        setBusy(true);
        setErrorMessage(null);

        try {
            setStatusMessage(
                "Preparing secure upload…"
            );

            const ticket =
                await createBoostAudioUploadTicket({
                    boostId,
                    originalFileName:
                        file.name,
                    fileSize:
                        file.size,
                });

            setStatusMessage(
                "Uploading finished MP3 to Storage…"
            );

            const supabase =
                createClient();

            const {
                error: uploadError,
            } = await supabase.storage
                .from("audio")
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
                ticket.storageObjectName
            );

            setStatusMessage(
                "Finished MP3 uploaded to Storage. It is not connected to playable content yet."
            );
        } catch (error) {
            console.error(
                "Boost audio Storage upload error:",
                error
            );

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to upload the Boost audio."
            );

            setStatusMessage(null);
        } finally {
            setBusy(false);
        }
    }

    async function handleConnect() {
        if (
            !uploadedObjectName ||
            !durationSeconds ||
            connecting ||
            busy
        ) {
            return;
        }

        setConnecting(true);
        setErrorMessage(null);

        try {
            setStatusMessage(
                "Connecting finished audio to dormant playable content…"
            );

            await finalizeBoostAudioUpload({
                boostId,
                storageObjectName:
                    uploadedObjectName,
                durationSeconds,
            });

            setStatusMessage(
                "Finished audio connected. The Boost remains unreleased."
            );

            router.refresh();
        } catch (error) {
            console.error(
                "Boost audio connection error:",
                error
            );

            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to connect the Boost audio."
            );

            setStatusMessage(
                "The MP3 remains safely stored. The Boost was not released."
            );
        } finally {
            setConnecting(false);
        }
    }

    const canUpload =
        Boolean(file) &&
        Boolean(durationSeconds) &&
        !busy &&
        !connecting &&
        !checkingStorage &&
        !uploadedObjectName;

    const canConnect =
        Boolean(uploadedObjectName) &&
        Boolean(durationSeconds) &&
        !busy &&
        !connecting &&
        !checkingStorage;

    return (
        <section className="mt-8 rounded-[28px] border border-orange-400/20 bg-orange-400/[0.06] p-6 sm:p-7">
            <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFB59A]">
                    Media Production
                </p>

                <h2 className="mt-2 text-xl font-black text-white">
                    Finished Audio
                </h2>

                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/50">
                    Choose and review the
                    mastered MP3 before sending
                    it to production Storage.
                </p>
            </div>

            <div className="mt-6 rounded-[18px] border border-sky-400/20 bg-sky-400/[0.06] p-4">
                <p className="text-sm font-black text-sky-200">
                    Production connection
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-white/40">
                    Uploading only stores the
                    MP3. Connecting it creates
                    dormant playable content and
                    moves the Boost to recorded.
                    Neither action publishes or
                    releases the Boost.
                </p>
            </div>

            <div className="mt-6">
                <label
                    htmlFor={`boost-audio-${boostId}`}
                    className="text-xs font-black uppercase tracking-[0.16em] text-white/40"
                >
                    Mastered MP3
                </label>

                <input
                    id={`boost-audio-${boostId}`}
                    type="file"
                    accept=".mp3,audio/mpeg"
                    disabled={
                        busy ||
                        checkingStorage ||
                        Boolean(
                            uploadedObjectName
                        )
                    }
                    onChange={handleFileChange}
                    className="mt-3 block w-full text-sm font-bold text-white/60 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2.5 file:text-sm file:font-black file:text-white hover:file:bg-white/15 disabled:opacity-50"
                />
            </div>

            {errorMessage && (
                <div className="mt-5 rounded-[18px] border border-red-400/20 bg-red-400/[0.07] p-4">
                    <p className="text-sm font-bold text-red-200">
                        {errorMessage}
                    </p>
                </div>
            )}

            {file && (
                <div className="mt-6 rounded-[22px] border border-white/[0.07] bg-black/10 p-5">
                    <p className="break-all text-sm font-black text-white/75">
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
                            className="mt-5 w-full"
                        />
                    )}

                    <div className="mt-5">
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

            {!file &&
                uploadedObjectName &&
                storedAudioUrl && (
                    <div className="mt-6 rounded-[22px] border border-white/[0.07] bg-black/10 p-5">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-white/35">
                            Stored Production Audio
                        </p>

                        <p className="mt-2 break-all text-xs font-bold text-white/55">
                            {
                                uploadedObjectName
                            }
                        </p>

                        <audio
                            controls
                            preload="metadata"
                            src={storedAudioUrl}
                            onLoadedMetadata={
                                handleLoadedMetadata
                            }
                            className="mt-5 w-full"
                        />

                        <div className="mt-5">
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
                <div className="mt-5 rounded-[18px] border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
                    <p className="text-sm font-bold leading-6 text-emerald-200">
                        {statusMessage}
                    </p>

                    {uploadedObjectName && (
                        <>
                            <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-white/35">
                                Production Storage Object
                            </p>

                            <p className="mt-1 break-all text-xs font-bold text-white/55">
                                {
                                    uploadedObjectName
                                }
                            </p>
                        </>
                    )}
                </div>
            )}

            <button
                type="button"
                onClick={
                    uploadedObjectName
                        ? handleConnect
                        : handleUpload
                }
                disabled={
                    uploadedObjectName
                        ? !canConnect
                        : !canUpload
                }
                className="mt-6 rounded-full bg-[#FF6B1A] px-5 py-3 text-sm font-black text-white transition hover:bg-[#FF7E36] disabled:cursor-not-allowed disabled:opacity-40"
            >
                {checkingStorage
                    ? "Checking Storage…"
                    : connecting
                      ? "Connecting…"
                      : busy
                        ? "Uploading…"
                        : uploadedObjectName
                          ? durationSeconds
                              ? "Connect Finished Audio"
                              : "Loading Stored Audio…"
                          : "Upload Finished MP3 to Storage"}
            </button>

            <p className="mt-5 text-xs font-bold leading-5 text-white/30">
                Connect Finished Audio is the
                explicit transition to dormant
                playable content. It does not
                activate, publish, or release
                the Boost.
            </p>
        </section>
    );
}
