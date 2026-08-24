import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";

import { buildConfig, createContactServer } from "../server/contact-server.mjs";

const listen = (server) =>
  new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve(server.address());
    });
  });

const close = (server) =>
  new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

test("contact endpoint validates requests and sends only fixed Postmark messages", async (context) => {
  const postmarkRequests = [];
  const mockPostmark = createServer((request, response) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      postmarkRequests.push({
        token: request.headers["x-postmark-server-token"],
        body: JSON.parse(Buffer.concat(chunks).toString("utf8"))
      });
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ ErrorCode: 0, Message: "OK", MessageID: "test-message-id" }));
    });
  });
  const postmarkAddress = await listen(mockPostmark);

  const config = buildConfig({
    POSTMARK_SERVER_TOKEN: "POSTMARK_API_TEST",
    CONTACT_FROM: "intern@netzldatasolutions.at",
    CONTACT_TO: "kontakt@netzldatasolutions.at",
    CONTACT_ALLOWED_ORIGINS: "https://staging.netzldatasolutions.at",
    CONTACT_RATE_LIMIT_MAX: "50"
  });
  config.postmarkApiUrl = `http://127.0.0.1:${postmarkAddress.port}/email`;
  config.minFillTimeMs = 1;

  const contactServer = createContactServer(config);
  const contactAddress = await listen(contactServer);
  const contactUrl = `http://127.0.0.1:${contactAddress.port}/api/contact`;

  context.after(async () => {
    await close(contactServer);
    await close(mockPostmark);
  });

  const submit = (body, origin = "https://staging.netzldatasolutions.at") =>
    fetch(contactUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
        "X-Forwarded-For": "203.0.113.42"
      },
      body: JSON.stringify(body)
    });

  const validSubmission = {
    name: "<Daniel Netzl>",
    company: "Netzl Data Solutions",
    email: "daniel@example.at",
    message: "Bitte melden Sie sich wegen unseres Testprojekts.",
    website: "",
    privacyConsent: true,
    startedAt: Date.now() - 5000
  };

  await context.test("valid submission", async () => {
    const response = await submit(validSubmission);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(postmarkRequests.length, 1);

    const request = postmarkRequests[0];
    assert.equal(request.token, "POSTMARK_API_TEST");
    assert.equal(request.body.From, "Netzl Data Solutions <intern@netzldatasolutions.at>");
    assert.equal(request.body.To, "kontakt@netzldatasolutions.at");
    assert.equal(request.body.ReplyTo, "daniel@example.at");
    assert.equal(request.body.TrackOpens, false);
    assert.equal(request.body.TrackLinks, "None");
    assert.match(request.body.HtmlBody, /&lt;Daniel Netzl&gt;/u);
    assert.doesNotMatch(request.body.HtmlBody, /<Daniel Netzl>/u);
  });

  await context.test("honeypot is accepted silently without sending", async () => {
    const response = await submit({ ...validSubmission, website: "https://spam.example" });
    assert.equal(response.status, 200);
    assert.equal(postmarkRequests.length, 1);
  });

  await context.test("invalid origin is rejected", async () => {
    const response = await submit(validSubmission, "https://attacker.example");
    assert.equal(response.status, 403);
    assert.equal(postmarkRequests.length, 1);
  });

  await context.test("invalid input is rejected", async () => {
    const response = await submit({ ...validSubmission, email: "not-an-email" });
    assert.equal(response.status, 422);
    assert.equal(postmarkRequests.length, 1);
  });
});


test("funding chat endpoint allows configured site origins and keeps OpenAI server-side", async (context) => {
  const config = buildConfig({
    POSTMARK_SERVER_TOKEN: "POSTMARK_API_TEST",
    CONTACT_ALLOWED_ORIGINS: "https://staging.netzldatasolutions.at",
    FUNDING_CHAT_ALLOWED_ORIGINS: "https://staging.netzldatasolutions.at,https://www.netzldatasolutions.at",
    CONTACT_RATE_LIMIT_MAX: "50",
    FUNDING_CHAT_RATE_LIMIT_MAX: "50"
  });

  const contactServer = createContactServer(config);
  const contactAddress = await listen(contactServer);
  const fundingUrl = `http://127.0.0.1:${contactAddress.port}/api/funding-chat/message`;

  context.after(async () => {
    await close(contactServer);
  });

  const submit = (body, origin = "https://staging.netzldatasolutions.at") =>
    fetch(fundingUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
        "X-Forwarded-For": "203.0.113.77"
      },
      body: JSON.stringify(body)
    });

  await context.test("rejects unknown origins", async () => {
    const response = await submit(
      { message: "Welche Förderungen passen für ein KI-Projekt?" },
      "https://example.at"
    );
    assert.equal(response.status, 403);
  });

  await context.test("accepts production origin", async () => {
    const response = await submit(
      { message: "Welche Förderungen passen für ein KI-Projekt?" },
      "https://www.netzldatasolutions.at"
    );
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.ok, true);
    assert.equal(payload.setupRequired, true);
  });

  await context.test("returns setup answer until OpenAI key is configured", async () => {
    const response = await submit({ message: "Welche Förderungen passen für ein KI-Projekt?" });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.ok, true);
    assert.equal(payload.setupRequired, true);
    assert.match(payload.answer, /OpenAI API-Key/u);
  });
});

test("funding chat endpoint calls OpenAI responses API with web search", async (context) => {
  const openAiRequests = [];
  const mockOpenAi = createServer((request, response) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      openAiRequests.push({
        authorization: request.headers.authorization,
        body: JSON.parse(Buffer.concat(chunks).toString("utf8"))
      });
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({
        status: "completed",
        output: [
          { type: "web_search_call", status: "completed" },
          {
            type: "message",
            status: "completed",
            role: "assistant",
            content: [
              {
                type: "output_text",
                text: "Für ein KI-Projekt sollten aws Digitalisierung und FFG KMU-Förderungen geprüft werden.",
                annotations: [
                  { title: "aws Digitalisierung", url: "https://www.aws.at/aws-digitalisierung/" }
                ]
              }
            ]
          }
        ]
      }));
    });
  });
  const openAiAddress = await listen(mockOpenAi);

  const config = buildConfig({
    POSTMARK_SERVER_TOKEN: "POSTMARK_API_TEST",
    FUNDING_CHAT_ALLOWED_ORIGINS: "https://staging.netzldatasolutions.at",
    OPENAI_API_KEY: "OPENAI_TEST_KEY",
    OPENAI_RESPONSES_URL: `http://127.0.0.1:${openAiAddress.port}/v1/responses`,
    FUNDING_CHAT_RATE_LIMIT_MAX: "50",
    FUNDING_CHAT_GUIDE_URLS: "https://downloads.example.test/aws-leitfaden.pdf"
  });

  const contactServer = createContactServer(config);
  const contactAddress = await listen(contactServer);
  const fundingUrl = `http://127.0.0.1:${contactAddress.port}/api/funding-chat/message`;

  context.after(async () => {
    await close(contactServer);
    await close(mockOpenAi);
  });

  const submitFunding = (body) => fetch(fundingUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://staging.netzldatasolutions.at",
      "X-Forwarded-For": "203.0.113.88"
    },
    body: JSON.stringify(body)
  });

  const incompleteResponse = await submitFunding({
    message: "Wir planen ein KI-Projekt in Niederösterreich."
  });
  assert.equal(incompleteResponse.status, 200);
  const incompletePayload = await incompleteResponse.json();
  assert.equal(incompletePayload.ok, true);
  assert.equal(incompletePayload.needsMoreInfo, true);
  assert.match(incompletePayload.follow_up_questions.join(" "), /Unternehmen/u);
  assert.equal(openAiRequests.length, 0);

  const associationFollowUpResponse = await submitFunding({
    message: "Es ist ein Verein mit rund 30 Mitgliedern. Ich schätze mal 10000 volumen, aber das kommt auf das Angebot an. Es wurde noch nicht begonnen.",
    history: [
      {
        role: "user",
        content: [
          "Bundesland: Niederösterreich",
          "Branche: Winzerverein",
          "Vorhaben/Ziel: digitale Plattform für Events, Shops, Tickets und Zahlungsabwicklung"
        ].join("\n")
      }
    ]
  });

  assert.equal(associationFollowUpResponse.status, 200);
  const associationFollowUpPayload = await associationFollowUpResponse.json();
  assert.equal(associationFollowUpPayload.ok, true);
  assert.equal(associationFollowUpPayload.needsMoreInfo, undefined);
  assert.equal(openAiRequests.length, 1);

  const response = await submitFunding({
    message: [
      "Bundesland: Niederösterreich",
      "Größe: KMU, 14 MA",
      "Branche: Handel",
      "Vorhaben/Ziel: KI-Automatisierung für Kundenservice und schnellere Antworten",
      "Budget: ca. 35.000 Euro",
      "Start: noch nicht begonnen, geplant in zwei Monaten",
      "Bitte auch https://www.ffg.at/sites/default/files/test-leitfaden.pdf berücksichtigen."
    ].join("\n"),
    history: [{ role: "user", content: "Wir prüfen Förderungen für ein Service-Projekt." }]
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.confidence, "mittel");
  assert.match(payload.answer, /aws Digitalisierung/);
  assert.deepEqual(payload.matches, []);
  assert.equal(openAiRequests.length, 2);
  assert.equal(openAiRequests[1].authorization, "Bearer OPENAI_TEST_KEY");
  assert.equal(openAiRequests[1].body.tools[0].type, "web_search");
  assert.equal(openAiRequests[1].body.tools[0].search_context_size, "medium");
  assert.equal(openAiRequests[1].body.reasoning.effort, "low");
  assert.match(openAiRequests[1].body.input[0].content[0].text, /Kurzzusammenfassung/u);
  assert.match(openAiRequests[1].body.input[1].content[0].text, /Was Netzl Data Solutions für Sie tun kann/u);
  const requestFiles = openAiRequests[1].body.input[1].content.filter((item) => item.type === "input_file");
  assert.deepEqual(requestFiles.map((item) => item.file_url), [
    "https://downloads.example.test/aws-leitfaden.pdf",
    "https://www.ffg.at/sites/default/files/test-leitfaden.pdf"
  ]);
  assert.ok(openAiRequests[1].body.tools[0].filters.allowed_domains.includes("aws.at"));
});
