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
