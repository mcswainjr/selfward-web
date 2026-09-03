import {
    saveBoostRecordingScript,
} from "./actions";

type Props = {
    boostId: string;
    status: string;
    finalScript: string | null;
    recordingScript: string | null;
    contentId: string | null;
};

export default function BoostRecordingScript({
    boostId,
    status,
    finalScript,
    recordingScript,
    contentId,
}: Props) {
    if (
        status !== "human_approved" ||
        contentId ||
        !finalScript?.trim()
    ) {
        return null;
    }

    const hasSavedRecordingScript =
        Boolean(recordingScript?.trim());

    /*
      Important:
      final_script is only the visual starting value when
      recording_script has not been saved yet.

      Nothing is written to the database until the human
      explicitly submits this form.
    */
    const startingScript =
        recordingScript?.trim()
            ? recordingScript
            : finalScript;

    return (
        <section className="mt-8 rounded-[28px] border border-orange-400/20 bg-orange-400/[0.06] p-6 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFB59A]">
                        Media Production
                    </p>

                    <h2 className="mt-2 text-xl font-black text-white">
                        Recording Script
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/50">
                        Prepare the exact narration copy that
                        will be used for recording. You may make
                        performance-oriented adjustments such as
                        punctuation, pauses, contractions,
                        pronunciation cues, or spoken-flow
                        formatting.
                    </p>

                    <p className="mt-3 max-w-3xl text-xs font-bold leading-5 text-white/35">
                        The approved creative script remains
                        unchanged. Saving here creates a separate
                        production copy only.
                    </p>
                </div>

                {hasSavedRecordingScript ? (
                    <div className="shrink-0 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300">
                        ✓ Recording copy saved
                    </div>
                ) : (
                    <div className="shrink-0 rounded-full border border-amber-300/20 bg-amber-300/[0.07] px-4 py-2 text-sm font-black text-amber-200">
                        Not saved yet
                    </div>
                )}
            </div>

            {!hasSavedRecordingScript && (
                <div className="mt-6 rounded-[18px] border border-white/[0.07] bg-black/10 p-4">
                    <p className="text-sm font-bold text-white/60">
                        Starting from the approved final script
                    </p>

                    <p className="mt-1 text-xs font-semibold leading-5 text-white/35">
                        This is only a starting value in the
                        editor. The database recording script
                        remains empty until you explicitly save.
                    </p>
                </div>
            )}

            <form
                action={saveBoostRecordingScript}
                className="mt-6"
            >
                <input
                    type="hidden"
                    name="boost_id"
                    value={boostId}
                />

                <label
                    htmlFor={`recording-script-${boostId}`}
                    className="text-xs font-black uppercase tracking-[0.16em] text-white/40"
                >
                    Human-final narration copy
                </label>

                <textarea
                    id={`recording-script-${boostId}`}
                    name="recording_script"
                    defaultValue={startingScript}
                    rows={18}
                    required
                    className="mt-3 min-h-[420px] w-full resize-y rounded-[22px] border border-white/10 bg-[#0F1A2E] px-5 py-4 text-[15px] font-semibold leading-8 text-white/80 outline-none transition placeholder:text-white/20 focus:border-[#FFB59A]/50"
                />

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-2xl text-xs font-bold leading-5 text-white/30">
                        Saving this does not create audio,
                        create playable content, publish, or
                        release the Boost.
                    </p>

                    <button
                        type="submit"
                        className="shrink-0 rounded-full bg-[#F97316] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#fb8a3c]"
                    >
                        {hasSavedRecordingScript
                            ? "Save Recording Script Changes"
                            : "Save Recording Script"}
                    </button>
                </div>
            </form>
        </section>
    );
}
