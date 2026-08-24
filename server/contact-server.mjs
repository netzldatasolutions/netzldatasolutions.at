import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://staging.netzldatasolutions.at",
  "https://netzldatasolutions.at",
  "https://www.netzldatasolutions.at"
];

const DEFAULT_FUNDING_CHAT_ALLOWED_ORIGINS = [
  "https://staging.netzldatasolutions.at",
  "https://netzldatasolutions.at",
  "https://www.netzldatasolutions.at"
];
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

const FUNDING_ALLOWED_DOMAINS = [
  "ams.at",
  "aws.at",
  "bmaw.gv.at",
  "bmluk.gv.at",
  "digitalaustria.gv.at",
  "efre.gv.at",
  "ffg.at",
  "klimafonds.gv.at",
  "kwf.at",
  "oesterreich.gv.at",
  "patentamt.at",
  "sfg.at",
  "standort-tirol.at",
  "transparenzportal.gv.at",
  "umweltfoerderung.at",
  "usp.gv.at",
  "wisto.at",
  "wirtschaftsagentur.at",
  "wirtschaftsagentur-burgenland.at",
  "wko.at"
];

const FUNDING_SOURCE_GUIDE = [
  "aws.at: Garantien, Kredite, Investitionen, Digitalisierung, Gründung und Wachstum",
  "ffg.at: Forschung, Entwicklung, Innovation, KMU- und Startup-Programme",
  "wko.at: Förderstellen, Fördernavigatoren und Wirtschaftskammer-Informationen",
  "usp.gv.at und transparenzportal.gv.at: offizielle Förder- und Antragssuche",
  "ams.at: Personal, Beschäftigung, Weiterbildung und Qualifizierung",
  "klimafonds.gv.at und umweltfoerderung.at: Klima, Energie, Umwelt und Mobilität",
  "patentamt.at: IP, Patente, Marken, Designs und Patent.Scheck",
  "efre.gv.at: EU-, EFRE-, JTF- und Landesförderstellen",
  "Landesstellen: Wien, Steiermark, Kärnten, Burgenland, Tirol und Vorarlberg"
];

const FUNDING_SYSTEM_PROMPT = [
  "Du bist der KI-Fördercheck von Netzl Data Solutions für österreichische Unternehmen.",
  "Arbeite aktuell, aber recherchiere erst, wenn Bundesland oder Betriebsstätte, Unternehmensgröße, Branche, Vorhaben und Ziel, Projektvolumen und Startstatus bekannt sind.",
  "Bevorzuge offizielle Quellen aus Österreich: aws, FFG, WKO, USP, Transparenzportal, AMS, Klima- und Energiefonds, Umweltförderung, Patentamt, EFRE, Ministerien und Landesförderstellen.",
  "Antworte auf Deutsch, formal mit Sie, knapp und konkret. Keine langen Einleitungen, keine allgemeinen Fördererklärungen, keine Verkaufsfloskeln.",
  "Nutze genau diese Struktur und Reihenfolge: ## Kurzzusammenfassung, ## Möglichkeiten, ## Einschränkungen, ## Was Netzl Data Solutions für Sie tun kann, ## Quellen.",
  "Kurzzusammenfassung: maximal zwei kurze Sätze.",
  "Möglichkeiten: maximal fünf Bulletpoints. Je Punkt nur Förderstelle oder Programm, wahrscheinliche Passung und wichtigste Prüfung.",
  "Einschränkungen: maximal vier Bulletpoints zu Voraussetzungen, Fristen, Projektstart, Budget, Beihilfenrecht oder Branchenrisiken.",
  "Was Netzl Data Solutions für Sie tun kann: genau vier Bulletpoints zu Fördercheck, relevanten Dokumenten, gemeinsamer Einreichung und Umsetzung.",
  "Quellen: maximal vier offizielle Quellen mit Link, ohne Zusatztext.",
  "Nenne Fristen, Förderhöhen und Voraussetzungen nur, wenn Quellen sie stützen. Wenn etwas unklar oder widersprüchlich ist, sag das deutlich.",
  "Gib keine verbindliche Förderzusage und keine Rechts-, Steuer- oder Beihilfenrechtsberatung."
].join("\n");

const asPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const asBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
};

const envList = (value, fallbackValues = []) =>
  String(value || fallbackValues.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const envSet = (value, fallbackValues) => new Set(envList(value, fallbackValues));

const isAllowedFundingHost = (hostname) => {
  const normalized = String(hostname || "").toLowerCase();
  return FUNDING_ALLOWED_DOMAINS.some(
    (domain) => normalized === domain || normalized.endsWith(`.${domain}`)
  );
};

const normalizeFundingPdfUrl = (value, allowAnyPublicHttps = false) => {
  try {
    const parsed = new URL(String(value || "").trim().replace(/[),.;:]+$/u, ""));
    if (parsed.protocol !== "https:") return "";
    if (!parsed.pathname.toLowerCase().endsWith(".pdf")) return "";
    if (!allowAnyPublicHttps && !isAllowedFundingHost(parsed.hostname)) return "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return "";
  }
};

const fundingPdfFilename = (url) => {
  try {
    const filename = decodeURIComponent(new URL(url).pathname.split("/").filter(Boolean).pop() || "leitfaden.pdf");
    return filename.toLowerCase().endsWith(".pdf") ? filename.slice(0, 120) : "leitfaden.pdf";
  } catch {
    return "leitfaden.pdf";
  }
};

export function buildConfig(environment = process.env) {
  const token = environment.POSTMARK_SERVER_TOKEN || environment.SERVER_TOKEN;

  if (!token) {
    throw new Error("POSTMARK_SERVER_TOKEN oder SERVER_TOKEN ist nicht gesetzt.");
  }

  return {
    token,
    from: environment.CONTACT_FROM || "intern@netzldatasolutions.at",
    to: environment.CONTACT_TO || "kontakt@netzldatasolutions.at",
    host: environment.CONTACT_HOST || "127.0.0.1",
    port: asPositiveInteger(environment.CONTACT_PORT, 8787),
    messageStream: environment.POSTMARK_MESSAGE_STREAM || "outbound",
    postmarkApiUrl: environment.POSTMARK_API_URL || "https://api.postmarkapp.com/email",
    allowedOrigins: envSet(environment.CONTACT_ALLOWED_ORIGINS, DEFAULT_ALLOWED_ORIGINS),
    fundingChatEnabled: asBoolean(environment.FUNDING_CHAT_ENABLED, true),
    fundingAllowedOrigins: envSet(
      environment.FUNDING_CHAT_ALLOWED_ORIGINS,
      DEFAULT_FUNDING_CHAT_ALLOWED_ORIGINS
    ),
    openaiApiKey: environment.FUNDING_OPENAI_API_KEY || environment.OPENAI_API_KEY || "",
    openaiFundingModel: environment.OPENAI_FUNDING_MODEL || "gpt-5.6-sol",
    openaiResponsesUrl: environment.OPENAI_RESPONSES_URL || OPENAI_RESPONSES_URL,
    fundingChatTimeoutMs: asPositiveInteger(environment.FUNDING_CHAT_TIMEOUT_MS, 90 * 1000),
    fundingChatRateLimitWindowMs: asPositiveInteger(
      environment.FUNDING_CHAT_RATE_LIMIT_WINDOW_MS,
      10 * 60 * 1000
    ),
    fundingChatRateLimitMax: asPositiveInteger(environment.FUNDING_CHAT_RATE_LIMIT_MAX, 12),
    fundingChatMaxBodyBytes: asPositiveInteger(environment.FUNDING_CHAT_MAX_BODY_BYTES, 24 * 1024),
    fundingGuideUrls: envList(environment.FUNDING_CHAT_GUIDE_URLS)
      .map((url) => normalizeFundingPdfUrl(url, true))
      .filter(Boolean),
    fundingChatMaxPdfUrls: asPositiveInteger(environment.FUNDING_CHAT_MAX_PDF_URLS, 3),
    maxBodyBytes: asPositiveInteger(environment.CONTACT_MAX_BODY_BYTES, 16 * 1024),
    minFillTimeMs: asPositiveInteger(environment.CONTACT_MIN_FILL_TIME_MS, 1800),
    maxFillTimeMs: asPositiveInteger(environment.CONTACT_MAX_FILL_TIME_MS, 2 * 60 * 60 * 1000),
    rateLimitWindowMs: asPositiveInteger(environment.CONTACT_RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000),
    rateLimitMax: asPositiveInteger(environment.CONTACT_RATE_LIMIT_MAX, 5),
    postmarkTimeoutMs: asPositiveInteger(environment.POSTMARK_TIMEOUT_MS, 10 * 1000)
  };
}

const normalizeSingleLine = (value, maxLength) =>
  String(value || "")
    .replace(/[\r\n\t]+/gu, " ")
    .replace(/\s{2,}/gu, " ")
    .trim()
    .slice(0, maxLength);

const normalizeMessage = (value, maxLength) =>
  String(value || "")
    .replace(/\r\n?/gu, "\n")
    .trim()
    .slice(0, maxLength);

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const isValidEmail = (value) =>
  value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value);

const sendJson = (response, statusCode, payload, extraHeaders = {}) => {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...extraHeaders
  });
  response.end(body);
};

const readJsonBody = (request, maxBodyBytes) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    let rejected = false;

    request.on("data", (chunk) => {
      if (rejected) return;
      totalBytes += chunk.length;

      if (totalBytes > maxBodyBytes) {
        rejected = true;
        const error = new Error("Anfrage ist zu groß.");
        error.statusCode = 413;
        reject(error);
        return;
      }

      chunks.push(chunk);
    });

    request.on("end", () => {
      if (rejected) return;

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        const error = new Error("Ungültige Anfrage.");
        error.statusCode = 400;
        reject(error);
      }
    });

    request.on("error", reject);
  });

const clientAddress = (request) => {
  const forwardedFor = String(request.headers["x-forwarded-for"] || "");
  return forwardedFor.split(",")[0].trim() || request.socket.remoteAddress || "unknown";
};

const validateSubmission = (body, config) => {
  const website = normalizeSingleLine(body.website || body._gotcha, 300);

  if (website) {
    return { isBot: true };
  }

  const name = normalizeSingleLine(body.name, 100);
  const company = normalizeSingleLine(body.company, 160);
  const email = normalizeSingleLine(body.email, 254);
  const message = normalizeMessage(body.message, 4000);
  const startedAt = Number(body.startedAt);
  const fillTime = Date.now() - startedAt;

  if (!Number.isFinite(startedAt) || fillTime < config.minFillTimeMs || fillTime > config.maxFillTimeMs) {
    return { error: "Bitte laden Sie das Formular neu und versuchen Sie es noch einmal." };
  }

  if (name.length < 2) {
    return { error: "Bitte geben Sie Ihren Namen ein." };
  }

  if (!isValidEmail(email)) {
    return { error: "Bitte geben Sie eine gültige E-Mail-Adresse ein." };
  }

  if (message.length < 10) {
    return { error: "Bitte beschreiben Sie Ihr Anliegen in ein paar Sätzen." };
  }

  if (body.privacyConsent !== true) {
    return { error: "Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu." };
  }

  return { name, company, email, message };
};

const buildPostmarkMessage = (submission, config) => {
  const companyText = submission.company || "Nicht angegeben";
  const textBody = [
    "Neue Anfrage über netzldatasolutions.at",
    "",
    `Name: ${submission.name}`,
    `Unternehmen: ${companyText}`,
    `E-Mail: ${submission.email}`,
    "",
    "Anliegen:",
    submission.message
  ].join("\n");

  const htmlBody = `
    <h2>Neue Anfrage über netzldatasolutions.at</h2>
    <p><strong>Name:</strong> ${escapeHtml(submission.name)}<br>
    <strong>Unternehmen:</strong> ${escapeHtml(companyText)}<br>
    <strong>E-Mail:</strong> ${escapeHtml(submission.email)}</p>
    <h3>Anliegen</h3>
    <p>${escapeHtml(submission.message).replaceAll("\n", "<br>")}</p>
  `;

  return {
    From: `Netzl Data Solutions <${config.from}>`,
    To: config.to,
    ReplyTo: submission.email,
    Subject: `Neue Website-Anfrage von ${submission.name}`,
    TextBody: textBody,
    HtmlBody: htmlBody,
    MessageStream: config.messageStream,
    Tag: "website-contact",
    TrackOpens: false,
    TrackLinks: "None"
  };
};

const sendWithPostmark = async (message, config) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.postmarkTimeoutMs);

  try {
    const response = await fetch(config.postmarkApiUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": config.token
      },
      body: JSON.stringify(message),
      signal: controller.signal
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.ErrorCode !== 0) {
      const error = new Error(result.Message || `Postmark antwortete mit HTTP ${response.status}.`);
      error.statusCode = 502;
      throw error;
    }

    return result;
  } finally {
    clearTimeout(timeout);
  }
};


const validateFundingChatRequest = (body) => {
  const message = normalizeMessage(body.message, 4000);
  if (message.length < 4) {
    return { error: "Bitte beschreiben Sie kurz Ihr Vorhaben." };
  }

  const history = Array.isArray(body.history)
    ? body.history.slice(-8).map((entry) => ({
        role: entry?.role === "assistant" ? "assistant" : "user",
        content: normalizeMessage(entry?.content, 1200)
      })).filter((entry) => entry.content.length >= 2)
    : [];

  return {
    message,
    history,
    visitorContext: {
      page: normalizeSingleLine(body.page, 260),
      timezone: normalizeSingleLine(body.timezone, 80)
    }
  };
};

const normalizeFundingFactText = (value) => String(value || "")
  .normalize("NFKC")
  .toLowerCase();

const hasFundingTerm = (text, terms) => terms.some((term) => text.includes(term));

const hasFundingLabeledValue = (text, labels) => labels.some((label) =>
  new RegExp(`${label}\\s*[:=-][ \\t]*[^\\n,;]{2,}`, "u").test(text)
);

const FUNDING_REQUIRED_FACTS = [
  {
    question: "In welchem Bundesland liegt Ihr Unternehmenssitz oder die Betriebsstätte?",
    test: (text) => hasFundingTerm(text, [
      "burgenland", "kärnten", "kaernten", "niederösterreich", "niederoesterreich", "nö", "noe",
      "oberösterreich", "oberoesterreich", "oö", "ooe", "salzburg", "steiermark", "tirol",
      "vorarlberg", "wien", "österreichweit", "oesterreichweit"
    ]) || hasFundingLabeledValue(text, ["bundesland", "betriebsstätte", "betriebsstaette", "standort", "sitz"])
  },
  {
    question: "Wie groß ist das Unternehmen, zum Beispiel EPU, KMU, Startup oder Mitarbeiterzahl?",
    test: (text) => /(?:^|[^a-zäöüß])(?:epu|kmu|startup|verein|vereinigung|kleinstunternehmen|kleinunternehmen|mittelunternehmen|großunternehmen|grossunternehmen)(?:[^a-zäöüß]|$)/u.test(text)
      || /\d+\s*(?:ma|mitarbeiter|mitarbeiterinnen|beschäftigte|beschaeftigte|fte)/u.test(text)
      || /\d+\s*(?:mitglieder|mitgliedern|vereinsmitglieder)/u.test(text)
      || /verein\s+mit\s+(?:rund|ca\.?|circa|etwa)?\s*\d+/u.test(text)
      || hasFundingLabeledValue(text, ["größe", "groesse", "unternehmensgröße", "unternehmensgroesse", "mitarbeiter", "team", "mitglieder"])
  },
  {
    question: "In welcher Branche arbeiten Sie?",
    test: (text) => hasFundingTerm(text, [
      "branche", "handel", "gastronomie", "tourismus", "hotel", "produktion", "industrie", "handwerk",
      "bau", "dienstleistung", "beratung", "agentur", "software", "edv", "gesundheit", "ordination",
      "kultur", "verein", "landwirtschaft", "logistik", "energie", "immobilien", "bäckerei", "baeckerei"
    ]) || hasFundingLabeledValue(text, ["branche", "geschäftsfeld", "geschaeftsfeld"])
  },
  {
    question: "Was soll konkret umgesetzt werden und welches Ziel hat das Projekt?",
    test: (text) => hasFundingTerm(text, [
      "digital", "ki", "automatis", "dashboard", "software", "daten",
      "crm", "erp", "shop", "website", "prozess", "investition", "maschine", "weiterbildung",
      "energie", "monitoring", "report"
    ]) || hasFundingLabeledValue(text, ["vorhaben", "ziel", "projekt"])
  },
  {
    question: "Wie hoch ist das geschätzte Projektvolumen oder Budget?",
    test: (text) => /(?:budget|projektvolumen|volumen|kostenrahmen|kosten|investition)\s*[:=-][ 	]*(?:ca\.?\s*)?(?:\d|offen|unklar|noch nicht bekannt)/u.test(text)
      || /(?:budget|projektvolumen|volumen|kostenrahmen|kosten|investition)\D{0,24}\d{3,}/u.test(text)
      || /\d{3,}\D{0,24}(?:budget|projektvolumen|volumen|kostenrahmen|kosten|investition)/u.test(text)
      || /\d{1,3}(?:[.\s]\d{3})*(?:,\d+)?\s*(?:€|eur|euro)/u.test(text)
      || /\d+\s*(?:k|tsd\.?|tausend)\s*(?:€|eur|euro)?/u.test(text)
  },
  {
    question: "Wann soll das Projekt starten und wurde bereits begonnen oder beauftragt?",
    test: (text) => /(?:start|beginn|projektstart|umsetzung|status)\s*[:=-][ \t]*[^,\n;]{3,}/u.test(text)
      || hasFundingTerm(text, [
        "noch nicht begonnen", "nicht begonnen", "bereits begonnen", "schon begonnen", "beauftragt",
        "angebot liegt vor", "geplant", "läuft", "laeuft", "quartal", "jänner", "jaenner", "februar",
        "märz", "maerz", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "dezember"
      ])
      || /(?:20\d{2}|q[1-4]|\d+\s*(?:wochen|monate|monat))/u.test(text)
  }
];

const findMissingFundingFacts = (submission) => {
  const userHistory = submission.history
    .filter((entry) => entry.role === "user")
    .map((entry) => entry.content);
  const text = normalizeFundingFactText([...userHistory, submission.message].join("\n"));
  return FUNDING_REQUIRED_FACTS.filter((fact) => !fact.test(text));
};

const fundingMissingInfoAnswer = (missingFacts) => ({
  ok: true,
  needsMoreInfo: true,
  answer:
    "Kurzzusammenfassung\nFür eine gezielte Förderrecherche fehlen noch ein paar Eckdaten. Bitte ergänzen Sie die Punkte unten, dann starte ich die Suche.",
  confidence: "niedrig",
  follow_up_questions: missingFacts.map((fact) => fact.question),
  recommended_actions: [],
  matches: [],
  sources: []
});

const extractFundingPdfUrls = (submission, config) => {
  const seen = new Set();
  const urls = [];
  const addUrl = (url, allowAnyPublicHttps = false) => {
    const normalized = normalizeFundingPdfUrl(url, allowAnyPublicHttps);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    urls.push(normalized);
  };

  for (const url of config.fundingGuideUrls) addUrl(url, true);

  const linkedText = [
    submission.message,
    ...submission.history.map((entry) => entry.content)
  ].join(" ");
  for (const match of linkedText.matchAll(/https:\/\/[^\s<>'"]+/gu)) addUrl(match[0]);

  return urls.slice(0, config.fundingChatMaxPdfUrls);
};

const buildFundingUserPrompt = (submission, pdfUrls = []) => [
  `Datum: ${new Date().toISOString().slice(0, 10)}`,
  "",
  "Erlaubte und bevorzugte Quellen:",
  FUNDING_SOURCE_GUIDE.map((source) => `- ${source}`).join("\n"),
  "",
  "Zusätzliche PDF-Leitfäden:",
  pdfUrls.length
    ? pdfUrls.map((url) => `- ${url}`).join("\n")
    : "Keine zusätzlichen PDF-Leitfäden übergeben.",
  "",
  "Bisheriger Chatverlauf:",
  submission.history.length
    ? submission.history.map((entry) => `${entry.role}: ${entry.content}`).join("\n")
    : "Noch kein Verlauf.",
  "",
  "Aktuelle Frage:",
  submission.message,
  "",
  "Die Mindestangaben sind vorhanden. Recherchiere jetzt gezielt mit aktuellen offiziellen Quellen.",
  "Antworte direkt als deutscher Website-Chattext mit der vorgegebenen kurzen Struktur.",
  "Wenn PDF-Leitfäden beigefügt sind, berücksichtige deren Inhalt sichtbar in der Bewertung und nenne den Leitfaden als Quelle, wenn du dich darauf beziehst."
].join("\n");

const extractOpenAiOutputText = (payload) => {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  for (const item of payload.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === "string" && content.text.trim()) return content.text;
    }
  }

  const error = new Error("OpenAI-Antwort enthält keinen sichtbaren Antworttext.");
  error.statusCode = 502;
  error.publicMessage = "Der Fördercheck hat gerade keine verwertbare Antwort von der KI erhalten. Bitte versuchen Sie es mit einer etwas konkreteren Frage erneut.";
  error.details = {
    openAiStatus: payload.status || "unknown",
    incompleteReason: payload.incomplete_details?.reason || null,
    outputTypes: Array.isArray(payload.output) ? payload.output.map((item) => item?.type || "unknown") : []
  };
  throw error;
};

const extractOpenAiSources = (payload) => {
  const seen = new Set();
  const sources = [];
  const addSource = (title, url) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    sources.push({ title: title || url, url });
  };

  for (const item of payload.output || []) {
    for (const source of item?.action?.sources || []) {
      addSource(source.title, source.url);
    }
    for (const content of item?.content || []) {
      for (const annotation of content?.annotations || []) {
        addSource(annotation.title, annotation.url);
      }
    }
  }

  return sources.slice(0, 8);
};

const setupFundingAnswer = () => ({
  ok: true,
  setupRequired: true,
  answer:
    "Der KI-Fördercheck ist vorbereitet. Sobald der OpenAI API-Key serverseitig hinterlegt ist, prüft er passende Förderungen mit aktueller Websuche und offiziellen Quellen.",
  confidence: "niedrig",
  follow_up_questions: [
    "In welchem Bundesland sitzt Ihr Unternehmen oder die Betriebsstätte?",
    "Geht es um Digitalisierung, KI, Personal, Weiterbildung, F&E, Umwelt oder Investition?",
    "Ist Ihr Unternehmen EPU, KMU, Startup oder ein größeres Unternehmen?"
  ],
  recommended_actions: [
    "OPENAI_API_KEY oder FUNDING_OPENAI_API_KEY in der Server-Umgebung setzen.",
    "Danach den Website-Service neu starten und eine Testfrage über staging oder www.netzldatasolutions.at senden."
  ],
  matches: [],
  sources: FUNDING_ALLOWED_DOMAINS.slice(0, 10).map((domain) => ({
    title: domain,
    url: `https://${domain}`
  }))
});

const openAiFundingRequest = async (payload, config) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.fundingChatTimeoutMs);

  try {
    const response = await fetch(config.openaiResponsesUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = result?.error?.message || `OpenAI antwortete mit HTTP ${response.status}.`;
      const error = new Error(message);
      error.statusCode = 502;
      throw error;
    }

    return result;
  } finally {
    clearTimeout(timeout);
  }
};

const fundingTools = () => [
  {
    type: "web_search",
    search_context_size: "medium",
    filters: { allowed_domains: FUNDING_ALLOWED_DOMAINS }
  }
];

const buildPlainFundingPayload = (submission, config, pdfUrls = []) => ({
  model: config.openaiFundingModel,
  input: [
    {
      role: "system",
      content: [{ type: "input_text", text: FUNDING_SYSTEM_PROMPT }]
    },
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: [
            buildFundingUserPrompt(submission, pdfUrls),
            "",
            "Bleib knapp. Keine Einleitung vor der Kurzzusammenfassung.",
            "Nutze exakt diese Überschriften: ## Kurzzusammenfassung, ## Möglichkeiten, ## Einschränkungen, ## Was Netzl Data Solutions für Sie tun kann, ## Quellen."
          ].join("\n")
        },
        ...pdfUrls.map((url) => ({
          type: "input_file",
          file_url: url,
          filename: fundingPdfFilename(url)
        }))
      ]
    }
  ],
  tools: fundingTools(),
  reasoning: { effort: "low" },
  max_output_tokens: 1800
});

const mergeFundingSources = (openAiSources, pdfUrls) => {
  const seen = new Set();
  const sources = [];
  const add = (title, url) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    sources.push({ title, url });
  };

  for (const source of openAiSources) add(source.title || source.url, source.url);
  for (const url of pdfUrls) add(`PDF-Leitfaden: ${fundingPdfFilename(url)}`, url);
  return sources.slice(0, 8);
};

const callOpenAiFundingChat = async (submission, config) => {
  if (!config.fundingChatEnabled || !config.openaiApiKey) return setupFundingAnswer();

  const missingFacts = findMissingFundingFacts(submission);
  if (missingFacts.length) return fundingMissingInfoAnswer(missingFacts);

  const pdfUrls = extractFundingPdfUrls(submission, config);
  const plainResult = await openAiFundingRequest(buildPlainFundingPayload(submission, config, pdfUrls), config);
  return {
    ok: true,
    answer: extractOpenAiOutputText(plainResult),
    confidence: "mittel",
    follow_up_questions: [],
    recommended_actions: [],
    matches: [],
    sources: mergeFundingSources(extractOpenAiSources(plainResult), pdfUrls)
  };
};

export function createContactServer(config = buildConfig()) {
  const rateLimits = new Map();
  const fundingRateLimits = new Map();
  const cleanupTimer = setInterval(() => {
    const oldestAllowed = Date.now() - config.rateLimitWindowMs;
    for (const [address, entry] of rateLimits) {
      if (entry.startedAt < oldestAllowed) rateLimits.delete(address);
    }

    const oldestFundingAllowed = Date.now() - config.fundingChatRateLimitWindowMs;
    for (const [address, entry] of fundingRateLimits) {
      if (entry.startedAt < oldestFundingAllowed) fundingRateLimits.delete(address);
    }
  }, Math.min(config.rateLimitWindowMs, config.fundingChatRateLimitWindowMs, 60 * 1000));
  cleanupTimer.unref();

  const server = createServer(async (request, response) => {
    const requestId = randomUUID().slice(0, 12);
    const url = new URL(request.url || "/", "http://127.0.0.1");

    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, { status: "ok" });
      return;
    }

    const contentType = String(request.headers["content-type"] || "").toLowerCase();

    if (request.method === "POST" && url.pathname === "/api/funding-chat/message") {
      if (!contentType.startsWith("application/json")) {
        sendJson(response, 415, { ok: false, message: "Ungültiges Anfrageformat." });
        return;
      }

      const origin = String(request.headers.origin || "");
      if (!config.fundingAllowedOrigins.has(origin)) {
        sendJson(response, 403, { ok: false, message: "Diese Anfrage ist nicht erlaubt." });
        return;
      }

      const address = clientAddress(request);
      const now = Date.now();
      const currentLimit = fundingRateLimits.get(address);
      const limit =
        !currentLimit || now - currentLimit.startedAt >= config.fundingChatRateLimitWindowMs
          ? { startedAt: now, count: 1 }
          : { ...currentLimit, count: currentLimit.count + 1 };
      fundingRateLimits.set(address, limit);

      if (limit.count > config.fundingChatRateLimitMax) {
        const retryAfter = Math.max(
          1,
          Math.ceil((config.fundingChatRateLimitWindowMs - (now - limit.startedAt)) / 1000)
        );
        sendJson(
          response,
          429,
          { ok: false, message: "Bitte warten Sie kurz, bevor Sie weiterfragen." },
          { "Retry-After": String(retryAfter) }
        );
        return;
      }

      try {
        const body = await readJsonBody(request, config.fundingChatMaxBodyBytes);
        const submission = validateFundingChatRequest(body);

        if (submission.error) {
          sendJson(response, 422, { ok: false, message: submission.error });
          return;
        }

        const answer = await callOpenAiFundingChat(submission, config);
        console.info(JSON.stringify({ event: "funding_chat_answered", requestId }));
        sendJson(response, 200, answer);
      } catch (error) {
        const statusCode = error.statusCode || (error.name === "AbortError" ? 504 : 502);
        console.error(
          JSON.stringify({
            event: "funding_chat_failed",
            requestId,
            statusCode,
            message: error.message,
            details: error.details || undefined
          })
        );
        sendJson(response, statusCode, {
          ok: false,
          message:
            statusCode < 500
              ? error.message
              : error.publicMessage || "Der Fördercheck konnte gerade nicht antworten. Bitte versuchen Sie es später noch einmal."
        });
      }
      return;
    }

    if (request.method !== "POST" || url.pathname !== "/api/contact") {
      sendJson(response, 404, { ok: false });
      return;
    }

    if (!contentType.startsWith("application/json")) {
      sendJson(response, 415, { ok: false, message: "Ungültiges Anfrageformat." });
      return;
    }

    const origin = String(request.headers.origin || "");
    if (!config.allowedOrigins.has(origin)) {
      sendJson(response, 403, { ok: false, message: "Diese Anfrage ist nicht erlaubt." });
      return;
    }

    const address = clientAddress(request);
    const now = Date.now();
    const currentLimit = rateLimits.get(address);
    const limit =
      !currentLimit || now - currentLimit.startedAt >= config.rateLimitWindowMs
        ? { startedAt: now, count: 1 }
        : { ...currentLimit, count: currentLimit.count + 1 };
    rateLimits.set(address, limit);

    if (limit.count > config.rateLimitMax) {
      const retryAfter = Math.max(1, Math.ceil((config.rateLimitWindowMs - (now - limit.startedAt)) / 1000));
      sendJson(
        response,
        429,
        { ok: false, message: "Bitte warten Sie kurz, bevor Sie eine weitere Anfrage senden." },
        { "Retry-After": String(retryAfter) }
      );
      return;
    }

    try {
      const body = await readJsonBody(request, config.maxBodyBytes);
      const submission = validateSubmission(body, config);

      if (submission.isBot) {
        sendJson(response, 200, { ok: true });
        return;
      }

      if (submission.error) {
        sendJson(response, 422, { ok: false, message: submission.error });
        return;
      }

      const postmarkResult = await sendWithPostmark(buildPostmarkMessage(submission, config), config);
      console.info(JSON.stringify({ event: "contact_sent", requestId, messageId: postmarkResult.MessageID }));
      sendJson(response, 200, { ok: true });
    } catch (error) {
      const statusCode = error.statusCode || (error.name === "AbortError" ? 504 : 502);
      console.error(JSON.stringify({ event: "contact_failed", requestId, statusCode, message: error.message }));
      sendJson(response, statusCode, {
        ok: false,
        message:
          statusCode < 500
            ? error.message
            : "Die Nachricht konnte gerade nicht versendet werden. Bitte versuchen Sie es später noch einmal."
      });
    }
  });

  server.on("close", () => clearInterval(cleanupTimer));
  return server;
}

export function startContactServer(environment = process.env) {
  const config = buildConfig(environment);
  const server = createContactServer(config);

  server.listen(config.port, config.host, () => {
    console.info(JSON.stringify({ event: "contact_server_started", host: config.host, port: config.port }));
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10 * 1000).unref();
  };

  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
  return server;
}

const isMainModule =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  try {
    startContactServer();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
