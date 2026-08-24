# KI-Fördercheck

Der KI-Fördercheck ist für `https://staging.netzldatasolutions.at` und `https://www.netzldatasolutions.at` vorgesehen.

## Architektur

- `assets/js/staging.js` zeigt das Chat-Widget nur auf den freigegebenen Hosts `staging.netzldatasolutions.at`, `netzldatasolutions.at` und `www.netzldatasolutions.at`.
- Das Widget sendet JSON an `/api/funding-chat/message`.
- `server/contact-server.mjs` verarbeitet den Endpunkt serverseitig und ruft OpenAI über die Responses API mit Web Search auf.
- Der OpenAI API-Key wird nie an den Browser ausgeliefert.
- Der Chatverlauf wird nur lokal im Browser gespeichert und in gekürzter Form als Kontext mitgesendet.
- Es gibt keine Website-Datenbank und keinen Quellen-Refresh-Job. Die Aktualität kommt pro Anfrage über Web Search mit Quellen-Whitelist.

## Server-Umgebung

```bash
OPENAI_API_KEY=...
# alternativ, falls getrennt gewünscht:
FUNDING_OPENAI_API_KEY=...
FUNDING_CHAT_ENABLED=true
FUNDING_CHAT_ALLOWED_ORIGINS=https://staging.netzldatasolutions.at,https://netzldatasolutions.at,https://www.netzldatasolutions.at
OPENAI_FUNDING_MODEL=gpt-5.6-sol
FUNDING_CHAT_RATE_LIMIT_MAX=12
FUNDING_CHAT_TIMEOUT_MS=90000
FUNDING_CHAT_GUIDE_URLS=https://.../leitfaden.pdf
FUNDING_CHAT_MAX_PDF_URLS=3
```

## Aktivierung auf dem Server

Nach Codeänderungen den Node-Service neu starten. Nach Änderung der Staging-Nginx-Konfiguration zuerst testen und dann reloaden.

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl restart netzldatasolutions-contact.service
curl -s http://127.0.0.1:8787/health
```

## PDF-Leitfäden

Öffentliche HTTPS-PDFs können als Kontext an OpenAI übergeben werden. Dafür entweder `FUNDING_CHAT_GUIDE_URLS` als kommaseparierte Liste setzen oder in der Chatfrage einen direkten PDF-Link von einer erlaubten Förderquelle nennen. Frei genannte PDF-Links werden nur übernommen, wenn sie auf eine erlaubte Förderdomain zeigen; explizit konfigurierte Leitfäden dürfen von anderen öffentlichen HTTPS-URLs kommen. Es werden maximal `FUNDING_CHAT_MAX_PDF_URLS` PDFs pro Anfrage übergeben.

## Quellenleitplanken

Die Websuche ist auf relevante österreichische Förderquellen beschränkt, darunter aws, FFG, WKO, USP, Transparenzportal, AMS, Klima- und Energiefonds, Umweltförderung, Patentamt, EFRE, Ministerien und Landesförderstellen.

Der Bot darf keine verbindliche Förderzusage formulieren und muss Fristen, Förderhöhen und Voraussetzungen nur mit Quellenbasis nennen.
