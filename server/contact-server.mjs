import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://staging.netzldatasolutions.at",
  "https://netzldatasolutions.at",
  "https://www.netzldatasolutions.at"
];

const asPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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
    allowedOrigins: new Set(
      String(environment.CONTACT_ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(","))
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    ),
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

export function createContactServer(config = buildConfig()) {
  const rateLimits = new Map();
  const cleanupTimer = setInterval(() => {
    const oldestAllowed = Date.now() - config.rateLimitWindowMs;
    for (const [address, entry] of rateLimits) {
      if (entry.startedAt < oldestAllowed) rateLimits.delete(address);
    }
  }, Math.min(config.rateLimitWindowMs, 60 * 1000));
  cleanupTimer.unref();

  const server = createServer(async (request, response) => {
    const requestId = randomUUID().slice(0, 12);
    const url = new URL(request.url || "/", "http://127.0.0.1");

    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, { status: "ok" });
      return;
    }

    if (request.method !== "POST" || url.pathname !== "/api/contact") {
      sendJson(response, 404, { ok: false });
      return;
    }

    const contentType = String(request.headers["content-type"] || "").toLowerCase();
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
