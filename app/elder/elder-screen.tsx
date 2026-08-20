"use client";

import { useEffect, useState, useTransition } from "react";
import {
  elderConfirmVisit,
  lookupElderScreen,
} from "@/lib/actions/elder-screen";
import { raiseElderSos } from "@/lib/actions/sos";
import { t, type Lang } from "@/lib/i18n";
import { BrandLogo, NepaliPatternDivider } from "@/components/brand";

type ScreenData = Awaited<ReturnType<typeof lookupElderScreen>>;

const SUPPORT_PHONE = "+977-1-5551000";

export function ElderScreen() {
  const [lang, setLang] = useState<Lang>("ne");
  const [code, setCode] = useState("");
  const [entered, setEntered] = useState(false);
  const [data, setData] = useState<ScreenData>(null);
  const [error, setError] = useState(false);
  const [sosState, setSosState] = useState<"idle" | "confirm" | "sent">("idle");
  const [visitConfirmed, setVisitConfirmed] = useState(false);
  const [pending, startTransition] = useTransition();

  function load(accessCode: string) {
    startTransition(async () => {
      setCode(accessCode);
      const result = await lookupElderScreen(accessCode);
      if (result) {
        setData(result);
        setLang(result.preferredLanguage);
        setEntered(true);
        setError(false);
        localStorage.setItem("sahara_elder_code", accessCode.trim().toUpperCase());
      } else {
        setError(true);
      }
    });
  }

  // Remember the code on the device so the elder never types it twice.
  useEffect(() => {
    const saved = localStorage.getItem("sahara_elder_code");
    if (saved) load(saved);
    // Run once on mount only.
  }, []);

  // Optional browser voice prompt.
  function speak(text: string) {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === "ne" ? "ne-NP" : "en-US";
      utterance.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch {
      // Voice not supported — buttons still work.
    }
  }

  // Big touch targets (≥ 48px) with bilingual labels, per the design reference.
  const actionCard =
    "w-full min-h-20 rounded-[22px] px-6 py-5 text-left flex items-center gap-4 " +
    "border transition-transform active:scale-[0.98] shadow-[0_1px_3px_rgba(35,59,58,0.08)]";

  // ---------- Access code entry ----------
  if (!entered) {
    return (
      <Shell lang={lang} setLang={setLang}>
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="flex justify-center"><BrandLogo size={72} /></div>
          <h1 className="text-3xl font-extrabold text-stone-800">
            {lang === "ne" ? "नमस्ते!" : "Namaste!"}
          </h1>
          <p className="text-xl text-stone-600" lang={lang}>
            {lang === "ne"
              ? "तपाईंको परिवारले दिएको कोड लेख्नुहोस्।"
              : "Enter the code your family gave you."}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              load(code);
            }}
            className="space-y-4"
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="SAHARA1"
              aria-label={lang === "ne" ? "पहुँच कोड" : "Access code"}
              className="w-full rounded-[22px] border-2 border-stone-300 bg-white px-6 py-5 text-center text-3xl font-mono tracking-widest uppercase"
              autoCapitalize="characters"
              autoComplete="off"
            />
            {error && (
              <p role="alert" className="text-rose-700 text-lg font-semibold" lang={lang}>
                {lang === "ne" ? "कोड मिलेन। फेरि प्रयास गर्नुहोस्।" : "Code not found. Please try again."}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-primary-600 text-white px-6 py-5 text-2xl font-bold hover:bg-primary-700 transition-colors shadow-sm"
            >
              {pending ? "…" : lang === "ne" ? "खोल्नुहोस्" : "Open"}
            </button>
          </form>
        </div>
      </Shell>
    );
  }

  // ---------- Main elder screen ----------
  const next = data?.nextVisit ?? null;
  const visitDate = next ? new Date(next.date) : null;
  const dateText = visitDate
    ? visitDate.toLocaleDateString(lang === "ne" ? "ne-NP" : "en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";

  const speakText = next
    ? lang === "ne"
      ? `तपाईंको अर्को भेट ${dateText} मा छ। ${next.companionName ? `${next.companionName} आउनुहुनेछ।` : ""}`
      : `Your next visit is on ${dateText} at ${next.time}. ${next.companionName ? `${next.companionName} will come.` : ""}`
    : lang === "ne"
      ? "अहिले कुनै भेट तय छैन।"
      : "No visit is scheduled yet.";

  return (
    <Shell lang={lang} setLang={setLang}>
      <div className="max-w-lg mx-auto space-y-5">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-800">
            {lang === "ne" ? "नमस्ते" : "Namaste"}, {data?.elderName} 🙏
          </h1>
          <NepaliPatternDivider className="mt-3" />
        </div>

        {/* 1 · I need help — call साहारा support */}
        <a
          href={`tel:${SUPPORT_PHONE}`}
          className={`${actionCard} bg-primary-600 border-primary-700 text-white hover:bg-primary-700`}
        >
          <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/15 text-3xl">
            🤝
          </span>
          <span>
            <span lang="ne" className="block text-2xl font-bold">{lang === "ne" ? "सहयोग चाहियो" : "I need help"}</span>
            <span className="block text-lg opacity-85">{lang === "ne" ? "I need help" : "सहयोग चाहियो"}</span>
          </span>
        </a>

        {/* 2 · Call my family */}
        {data?.familyPhone && (
          <a
            href={`tel:${data.familyPhone}`}
            className={`${actionCard} bg-white border-line hover:bg-cream-dark`}
          >
            <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-3xl">
              📞
            </span>
            <span>
              <span lang="ne" className="block text-2xl font-bold text-stone-800">
                {lang === "ne" ? "परिवारसँग कुरा गर्ने" : "Call my family"}
              </span>
              <span className="block text-lg text-stone-500">
                {lang === "ne" ? "Call my family" : "परिवारसँग कुरा गर्ने"}
              </span>
            </span>
          </a>
        )}

        {/* 3 · Today's / next visit */}
        <section
          aria-labelledby="next-visit-heading"
          className="rounded-[22px] bg-mist-100 border border-mist-100 p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="next-visit-heading" className="flex items-center gap-3 text-xl font-bold text-sky-800">
              <span aria-hidden className="flex size-12 items-center justify-center rounded-full bg-white text-2xl">🗓️</span>
              <span lang="ne">{lang === "ne" ? "आजको भेट" : "Today's visit"}</span>
            </h2>
            <button
              type="button"
              onClick={() => speak(speakText)}
              aria-label={lang === "ne" ? "सुन्नुहोस्" : "Listen"}
              className="text-2xl rounded-full bg-white size-12 hover:bg-cream-dark shadow-sm"
            >
              🔊
            </button>
          </div>
          {next ? (
            <div className="mt-4 text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-primary-700">{dateText}</p>
              <p className="text-2xl text-stone-700">{next.time}</p>
              <ul className="mt-3 text-xl text-stone-600 space-y-1" lang={lang}>
                {(lang === "ne" ? next.servicesNe : next.services).map((service) => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
              {next.companionName && (
                <div className="mt-4 inline-flex items-center gap-3 rounded-full bg-white pl-1.5 pr-5 py-1.5">
                  <span
                    aria-hidden
                    className="flex size-12 items-center justify-center rounded-full bg-coral-100 text-coral-700 text-xl font-bold"
                  >
                    {next.companionName.split(/\s+/).slice(0, 2).map((p) => p[0]).join("")}
                  </span>
                  <span className="text-left">
                    <span className="block text-sm text-stone-500" lang={lang}>{t("companion", lang)}</span>
                    <span className="block text-lg font-bold text-stone-800">{next.companionName}</span>
                  </span>
                </div>
              )}
              {next.inProgress && (
                <p className="mt-3 text-lg font-bold text-primary-700" lang={lang}>
                  {lang === "ne" ? "भेट चलिरहेको छ" : "Visit is happening now"}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-xl text-stone-600 text-center" lang={lang}>
              {lang === "ne"
                ? "अहिले कुनै भेट तय छैन। परिवारले जहिले पनि मिलाइदिन सक्नुहुन्छ।"
                : "No visit is planned yet. Your family can arrange one any time."}
            </p>
          )}
        </section>

        {/* Visit confirmation */}
        {data?.recentCompleted && !visitConfirmed && (
          <section className="rounded-[22px] bg-leaf-50 border border-leaf-100 p-6 text-center">
            <p className="text-xl text-stone-700 mb-4" lang={lang}>
              {lang === "ne"
                ? `${data.recentCompleted.companionName ?? "साथी"} भेट्न आउनुभयो?`
                : `Did ${data.recentCompleted.companionName ?? "the companion"} visit you?`}
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const ok = await elderConfirmVisit(code, data.recentCompleted!.bookingId);
                  if (ok) setVisitConfirmed(true);
                })
              }
              className="w-full min-h-16 rounded-full bg-leaf-600 text-white px-6 py-4 text-xl sm:text-2xl font-bold hover:bg-leaf-700 transition-colors shadow-sm"
              lang={lang}
            >
              ✓ {t("confirmVisit", lang)}
            </button>
          </section>
        )}
        {visitConfirmed && (
          <p role="status" className="text-center text-xl font-bold text-leaf-700" lang={lang}>
            ✓ {t("visitDone", lang)} — {lang === "ne" ? "धन्यवाद!" : "Thank you!"}
          </p>
        )}

        {/* 4 · Emergency help */}
        {sosState === "idle" && (
          <button
            type="button"
            onClick={() => setSosState("confirm")}
            className={`${actionCard} bg-coral-50 border-coral-200 hover:bg-coral-100`}
          >
            <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white text-xl font-extrabold">
              SOS
            </span>
            <span>
              <span lang="ne" className="block text-2xl font-bold text-rose-800">
                {lang === "ne" ? "आकस्मिक सहायता" : "Emergency help"}
              </span>
              <span className="block text-lg text-rose-700/80" lang={lang}>
                {t("sosHelp", lang)}
              </span>
            </span>
          </button>
        )}
        {sosState === "confirm" && (
          <div className="rounded-[22px] border-2 border-rose-300 bg-rose-50 p-6 text-center space-y-4">
            <p className="text-2xl font-bold text-rose-900" lang={lang}>
              {lang === "ne" ? "साँच्चै सहयोग चाहिन्छ?" : "Do you really need help?"}
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const formData = new FormData();
                  formData.set("accessCode", code);
                  const result = await raiseElderSos(undefined, formData);
                  if (!result?.error) {
                    setSosState("sent");
                    speak(t("sosSent", lang));
                  }
                })
              }
              className="w-full min-h-16 rounded-full bg-rose-600 text-white px-6 py-5 text-2xl font-bold hover:bg-rose-700 transition-colors shadow-sm"
              lang={lang}
            >
              {pending ? "…" : lang === "ne" ? "हो, सहयोग पठाउनुहोस्" : "Yes, send help"}
            </button>
            <button
              type="button"
              onClick={() => setSosState("idle")}
              className="w-full min-h-14 rounded-full border-2 border-stone-300 bg-white px-6 py-4 text-xl font-bold text-stone-700"
              lang={lang}
            >
              {lang === "ne" ? "होइन, ठीक छ" : "No, I'm okay"}
            </button>
          </div>
        )}
        {sosState === "sent" && (
          <div role="alert" className="rounded-[22px] bg-rose-600 text-white p-6 text-center">
            <p className="text-2xl font-bold" lang={lang}>✓ {t("sosSent", lang)}</p>
          </div>
        )}

        <p className="text-center text-stone-500 text-base px-4" lang={lang}>
          {t("emergencyDisclaimer", lang)}
        </p>
      </div>
    </Shell>
  );
}

function Shell({
  lang,
  setLang,
  children,
}: {
  lang: Lang;
  setLang: (lang: Lang) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream py-8 px-4">
      <div className="max-w-lg mx-auto flex justify-between items-center mb-8">
        <p className="flex items-center gap-2 text-2xl font-bold text-primary-700">
          <BrandLogo size={34} />
          <span lang="ne">साहारा</span>
        </p>
        <div
          className="flex rounded-full border-2 border-stone-300 overflow-hidden bg-white"
          role="group"
          aria-label="Language"
        >
          <button
            type="button"
            onClick={() => setLang("ne")}
            aria-pressed={lang === "ne"}
            className={`px-4 py-2.5 min-h-12 text-lg font-bold ${lang === "ne" ? "bg-primary-600 text-white" : "text-stone-600"}`}
          >
            नेपाली
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            aria-pressed={lang === "en"}
            className={`px-4 py-2.5 min-h-12 text-lg font-bold ${lang === "en" ? "bg-primary-600 text-white" : "text-stone-600"}`}
          >
            English
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
