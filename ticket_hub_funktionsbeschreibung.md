# NDS Ticket-Hub - Funktionsbeschreibung für Kunden

Stand: 8. August 2026  
Produkt: NDS Ticket-Hub / Shop- und Ticketplattform  
Anbieter: Netzl Data Solutions

## 1. Kurzüberblick

Der NDS Ticket-Hub ist eine flexible Plattform für Veranstaltungen, Ticketverkauf, einfache Produkt-Shops, Eigenverkauf vor Ort, Einlasskontrolle, Marketing-Tracking, Kommunikation und Reporting.

Die Plattform richtet sich an Vereine, Veranstalter:innen, Kulturinitiativen, Gastronomie, Bars, Weingüter, Regionen und Organisationen, die ihre Veranstaltungen oder Aktionen selbst verwalten möchten, ohne für jedes Event eine externe Ticketplattform beauftragen zu müssen.

Der Grundgedanke ist einfach: Ein Kunde bekommt einen eigenen Admin-Zugang, kann dort Veranstalterdaten, Veranstaltungen, Produkte, Tickets, Texte, Bilder, Farben, Stripe-Zahlungsdaten, Newsletter-Optionen und Reports verwalten und daraus eigenständige öffentliche Shop-Seiten erzeugen. Besucher:innen können diese Seiten im Browser öffnen, Tickets oder Produkte auswählen, online bezahlen und erhalten automatisch eine passende Bestätigungsmail mit Ticket-PDF oder Bestellinformationen.

Der Ticket-Hub ist bewusst nicht nur ein einzelner Event-Shop. Er ist als wiederverwendbares System gedacht, mit dem viele unterschiedliche Kund:innen, Veranstalter:innen, Events und Shop-Typen betrieben werden können.

## 2. Was Kund:innen sich darunter vorstellen können

Aus Kundensicht ist der Ticket-Hub eine eigene kleine Ticket- und Shop-Zentrale.

Statt für jede Veranstaltung bei einem externen Anbieter neue Abläufe, neue Gebührenmodelle und fremde Shop-Layouts zu akzeptieren, bekommt der Kunde einen eigenen Verwaltungsbereich. Dort können Veranstaltungen und Shops selbst angelegt, bearbeitet, veröffentlicht, ausgewertet und nachbetreut werden.

Typische Beispiele:

- Eine Bar verkauft Tickets für acht Konzerte oder Tastings pro Jahr.
- Ein Weinbauverein verkauft Eintrittstickets für eine Verkostung mit buchbaren Workshops.
- Ein Verein verkauft Weinpakete oder Aktionsprodukte mit Versand.
- Eine Region bewirbt externe Veranstaltungen über eigene Landingpages, ohne selbst Tickets zu verkaufen.
- Ein Veranstalter möchte vor Ort Tickets an der Abendkassa verkaufen und zugleich Online-Zahlungen anbieten.
- Ein Team möchte nach einem Event sehen, wie viele Tickets verkauft wurden, welche Workshops gut funktioniert haben, welche Marketinglinks verkauft haben und wie viele Tickets beim Einlass gescannt wurden.

Der Ticket-Hub ersetzt damit für viele Anwendungsfälle klassische Ticketanbieter. Gleichzeitig bleibt das System näher an der eigenen Marke, weil Logo, Farben, Texte, Absenderadresse, Shop-Auftritt und Ticket-PDFs selbst gesteuert werden können.

## 3. Zielgruppen

Der Ticket-Hub eignet sich besonders für Organisationen, die regelmäßig Veranstaltungen oder Verkaufsaktionen durchführen und diese selbst steuern wollen.

Typische Zielgruppen:

- Bars und Clubs mit kleinen bis mittleren Events
- Kulturvereine
- Weinbauvereine und Weingüter
- Tourismus- und Regionsinitiativen
- Gemeinden und lokale Veranstalter:innen
- Workshop-Anbieter:innen
- Vereine mit wiederkehrenden Veranstaltungen
- Unternehmen mit Kundenevents
- Pop-up-Shops, Aktionsverkäufe und limitierte Produktaktionen

Besonders stark ist der Ticket-Hub dort, wo keine komplexe Sitzplatzbuchung nötig ist, sondern einfache Eintrittskarten, Produktpakete, Workshop-Buchungen, Einlasskontrolle und gutes Reporting im Vordergrund stehen.

## 4. Grundprinzip: Ein Hub, mehrere Veranstalter, viele Shops

Die Plattform ist so aufgebaut, dass mehrere Veranstalter verwaltet werden können.

Ein Veranstalter ist die organisatorische Einheit hinter einem oder mehreren Events oder Shops. Beispiele:

- Rubin Carnuntum Weingüter
- Eine Bar
- Ein Verein
- Ein einzelnes Weingut
- Eine Agentur mit mehreren Kund:innen

Jeder Veranstalter kann eigene Stammdaten, Branding, Kontaktinformationen, Mail-Absenderdaten, Stripe-Konfigurationen, Versandpartner und weitere Einstellungen haben.

Einem Admin-Benutzer können ein oder mehrere Veranstalter zugeordnet werden. Dadurch sieht der Benutzer im Admin-Bereich nur jene Daten, für die er berechtigt ist.

Die öffentlichen Seiten können über eine zentrale Hub-Domain laufen, zum Beispiel:

- `shop.carnuntum.com`
- `shop.carnuntum.com/<veranstalter>`
- `shop.carnuntum.com/<veranstalter>/<event>`

Bei Bedarf kann für Kund:innen auch eine eigene Domain oder Subdomain angebunden werden. Das erfordert technische Einrichtung durch Netzl Data Solutions, weil DNS, Server-Konfiguration, SSL-Zertifikat und Routing sauber eingerichtet werden müssen.

## 5. Rollen und Berechtigungen

Der Ticket-Hub unterscheidet zwischen verschiedenen Benutzerrollen.

### 5.1 Superadmin

Der Superadmin ist die zentrale Betreiberrolle. Diese Rolle liegt bei Netzl Data Solutions bzw. bei der Person, die das System technisch betreibt.

Der Superadmin kann:

- Benutzer anlegen und verwalten
- Veranstalter anlegen und verwalten
- Benutzer Veranstaltern zuweisen
- Rechte und Features für Benutzer steuern
- Stripe-Konfigurationen verwalten oder kontrollieren
- technische Domains setzen
- alle Events und Shops sehen
- Archivierung, Debugging und Systempflege durchführen
- sicherheitsrelevante Logs und Konfigurationen einsehen

Bestimmte Funktionen sollten bewusst beim Superadmin bleiben, etwa das Setzen einer kundenspezifischen Domain. Der Grund ist, dass eine Domain nicht nur ein Texteingabefeld ist. Damit sie wirklich funktioniert, müssen DNS-Einträge, Server-Routing, SSL-Zertifikate und eventuell Mail-/Webhook-Konfigurationen zusammenpassen.

### 5.2 Customer Admin

Ein Customer Admin ist die wichtigste Kundenrolle.

Diese Rolle kann für die eigenen Veranstalter:

- Veranstalterdaten pflegen
- Veranstaltungen und Shops erstellen
- bestehende Events bearbeiten
- Events duplizieren
- Tickets und Produkte anlegen
- Workshops konfigurieren
- Shop-Design, Texte, Bilder und Videos pflegen
- Stripe-Konfigurationen für den eigenen Veranstalter hinterlegen
- Versandpartner und Versandoptionen verwalten
- Marketing-Tracking einrichten
- Rabattcodes anlegen
- Bestellungen und Reports einsehen
- Vor-Ort-Verkäufe erfassen
- Scanner-Zugriff für Events verwalten
- Kund:innen oder Ticketkäufer:innen kontaktieren, soweit berechtigt

Customer Admins können derzeit keine neuen Benutzer anlegen. Das bleibt bewusst beim Superadmin, damit Zugriffe kontrolliert vergeben werden.

### 5.3 Customer User

Customer User sind als einfachere Benutzerrolle vorgesehen. Diese Rolle kann später für Mitarbeitende oder externe Helfer:innen genutzt werden.

Mögliche Anwendungsfälle:

- Eine Person darf nur Bestellungen ansehen.
- Eine Person darf nur scannen.
- Eine Person darf nur Reports ansehen.
- Eine Person darf Eigenverkauf erfassen.

Die Rolle ist vorbereitet, kann aber je nach Preismodell oder Kundenpaket eingeschränkt oder später freigeschaltet werden.

### 5.4 Scanner-Zugriff

Scanner-Zugriff ist bewusst nicht gleich Admin-Zugriff.

Für Einlasskontrolle können separate Scanner-Freigaben oder Scanner-Endpunkte erstellt werden. So können Personen mit dem Handy scannen, ohne Zugang zum gesamten Admin-Bereich zu haben.

Zusätzlich können Scans nach Standort, Name oder Adresse differenziert werden. Dadurch sieht man im Reporting, welcher Eingang, Standort oder welches Scanner-Team wie viele Tickets kontrolliert hat.

## 6. Veranstalterverwaltung

Jeder Veranstalter hat eigene Stammdaten und Defaults.

Typische Veranstalterdaten:

- Name des Veranstalters
- E-Mail-Adresse
- Support-E-Mail
- Telefon
- Website
- Adresse
- Land
- rechtliche Angaben
- Logo
- Standardfarben
- Standardschrift
- Standard-Mail-Absendername
- Standard-Mail-Absenderadresse
- Newsletter-Einstellungen
- Standard-Shop-Domain, falls vom Superadmin gesetzt

Diese Daten werden als Grundlage für neue Events verwendet. Wenn ein neues Event erstellt wird, übernimmt es sinnvolle Standardwerte vom Veranstalter. Dadurch muss man nicht jedes Mal Logo, Farben, Mailadresse oder Supportkontakt neu eintragen.

Wichtig: Wenn sich eine Veranstalter-Mailadresse ändert, sollen bestehende Events nicht dauerhaft mit einer alten, falschen Adresse weiterarbeiten. Der Ticket-Hub ist darauf ausgelegt, Veranstalter-Defaults zu verwenden, sofern ein Event diese Werte nicht bewusst überschreibt.

## 7. Stripe-Zahlungen

Der Ticket-Hub nutzt Stripe für Online-Zahlungen.

Jeder Veranstalter kann eigene Stripe-Konfigurationen haben. Optional kann auch ein einzelnes Event eine eigene Stripe-Konfiguration verwenden, falls das aus organisatorischen Gründen nötig ist.

Typische Stripe-Daten:

- Publishable Key
- Secret Key
- Webhook Secret
- Modus: Test/Sandbox oder Live
- interne Bezeichnung
- Aktiv/Inaktiv

### 7.1 Warum Stripe pro Veranstalter wichtig ist

Viele Kund:innen wollen, dass Umsätze direkt beim richtigen Veranstalter ankommen. Wenn mehrere Vereine, Bars oder Betriebe auf derselben technischen Plattform arbeiten, sollten Zahlungen sauber getrennt werden können.

Deshalb ist es sinnvoll, Stripe-Konfigurationen pro Veranstalter zu hinterlegen.

Beispiel:

- Bar A nutzt ihren eigenen Stripe-Account.
- Weinbauverein B nutzt seinen eigenen Stripe-Account.
- Ein einzelnes Sonderprojekt kann optional eine abweichende Stripe-Konfiguration verwenden.

### 7.2 Testmodus und Live-Modus

Stripe unterscheidet zwischen Testmodus und Live-Modus. Der Testmodus wird oft auch Sandbox genannt.

Im Testmodus können Zahlungen simuliert werden, ohne echtes Geld zu bewegen. Das ist ideal für Einrichtung, interne Tests und Schulungen.

Im Live-Modus werden echte Zahlungen verarbeitet. Vor dem Livegang muss sichergestellt werden, dass:

- der richtige Stripe-Account verbunden ist
- der Live-Modus aktiviert ist
- die Keys korrekt eingetragen sind
- Webhooks richtig konfiguriert sind
- die Absender-Mailadresse für Bestätigungen funktioniert
- ein Testkauf erfolgreich durchgeführt wurde

### 7.3 Stripe-Webhooks

Webhooks informieren den Ticket-Hub darüber, was bei Stripe passiert ist. Das ist wichtig, weil eine Bestellung nicht nur durch den Klick im Browser bestätigt werden sollte, sondern durch eine verlässliche Rückmeldung von Stripe.

Relevante Ereignisse sind insbesondere:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `charge.refunded`
- `refund.updated`

Diese Ereignisse ermöglichen es, Bestellungen korrekt als bezahlt, fehlgeschlagen, abgelaufen oder erstattet zu markieren.

## 8. Shop-Typen

Der Ticket-Hub unterstützt verschiedene Arten von Shops und Landingpages.

### 8.1 Einfaches Ticket-Event

Das ist der klassische und häufigste Anwendungsfall.

Ein einfaches Ticket-Event hat:

- Titel
- Kurzbeschreibung
- Datum
- Uhrzeit
- Bild oder Hero-Sujet
- Beschreibung
- Ort und Adresse
- Anreiseinformationen
- ein oder mehrere Tickets
- Online-Zahlung
- optional Einlassscanner
- automatische Ticketmail
- Ticket-PDF
- Reports

Beispiele:

- Konzert in einer Bar
- Lesung
- Verkostung
- Vortrag
- Theaterabend
- Vereinsveranstaltung

Der Besucher sieht eine klare Eventseite, wählt Tickets aus, bezahlt online und bekommt die Tickets per Mail.

### 8.2 Event mit Workshops

Dieser Shop-Typ ist für Veranstaltungen gedacht, bei denen neben dem Eintritt weitere Programmpunkte buchbar sind.

Beispiele:

- Weinverkostung mit Workshops
- Festival mit Zusatzprogramm
- Kulinarik-Event mit geführten Tastings
- Veranstaltung mit buchbaren Sessions

Der Begriff im System ist bewusst „Workshops“, weil er für Besucher:innen klarer ist als technische Begriffe wie Slots oder Zusatzangebote.

Ein Event mit Workshops kann enthalten:

- ein oder mehrere Eintrittstickets
- inkludierte Workshops
- kostenpflichtige Workshops
- hervorgehobene Workshops
- weitere Workshops zum Aufklappen
- Workshop-Kategorien
- Icons pro Kategorie
- Legende für Kategorien
- Detail-Popup pro Workshop
- automatische Warenkorb-Logik

Wenn jemand einen Workshop auswählt, kann das System fehlende Eintrittstickets automatisch ergänzen, sofern diese Logik für das Event aktiv ist. Dadurch bleibt der Kaufprozess für Besucher:innen einfach.

### 8.3 Produkt-Shop / Shop-Aktion

Ein Produkt-Shop ist für den Verkauf von Produkten gedacht, etwa Weinpakete, Aktionssets oder andere physische Produkte.

Ein Produkt-Shop kann enthalten:

- Produktübersicht
- mehrere Produkte
- Produktbilder
- Produktbeschreibung
- Preis
- Artikelnummer für Versandpartner
- Anzahl-Auswahl
- Warenkorb
- Online-Zahlung
- Versandoptionen
- Versandkosten
- automatische Bestellmail
- Versandpartner-CSV
- Reporting

Beispiel: Eine Weinregion verkauft limitierte Weinpakete mit Versand über einen Logistikpartner.

Bei Produkt-Shops werden keine Ticketfunktionen angezeigt, die nicht passen. Zum Beispiel braucht ein reiner Produktshop kein Ticketdesign und normalerweise keinen Scanner.

### 8.4 Externes Event / Landingpage ohne eigenen Shop

Manchmal soll eine Veranstaltung beworben werden, ohne dass der Ticket-Hub selbst Tickets verkauft.

Das kann sinnvoll sein, wenn:

- ein externer Ticketanbieter verwendet wird
- das Event kostenlos ist
- nur informiert werden soll
- die Anmeldung per E-Mail erfolgt
- ein Partner die Abwicklung übernimmt

In diesem Fall kann eine Landingpage erstellt werden. Wenn ein externer Link hinterlegt ist, erscheint ein Button zum externen Shop. Wenn kein Link hinterlegt ist, dient die Seite nur als Informationsseite.

## 9. Event-Erstellung im Admin-Bereich

Neue Events werden über einen geführten Ablauf erstellt.

Der Ablauf soll bewusst einfach bleiben und nicht alle Spezialfunktionen auf einmal zeigen.

Typischer Aufbau:

1. Grunddaten
2. Zeitplan
3. Location
4. Tickets oder Produkte
5. Medien
6. Texte
7. Stripe-Konfiguration
8. Betrieb und Zugriff

Die genaue Darstellung kann je nach Shop-Typ variieren. Ein Produkt-Shop zeigt andere Felder als ein Ticket-Event. Ein Event ohne Workshops zeigt keine Workshop-Konfiguration.

### 9.1 Speichern vs. Speichern und weiter

Im Admin-Bereich gibt es an wichtigen Stellen zwei unterschiedliche Aktionen:

- Speichern: Speichert die aktuelle Seite und bleibt dort.
- Speichern und weiter: Speichert und führt zum nächsten sinnvollen Schritt.

Das verhindert, dass man beim Bearbeiten versehentlich aus der aktuellen Ansicht gerissen wird.

### 9.2 Event duplizieren

Ein bestehendes Event kann dupliziert werden.

Das ist besonders praktisch für wiederkehrende Veranstaltungen:

- jährliche Events
- monatliche Tastings
- wiederkehrende Konzerte
- ähnliche Produktaktionen

Beim Duplizieren wird die neue Kopie automatisch als Entwurf erstellt und ist zuerst nicht sichtbar. Dadurch kann nichts versehentlich live gehen.

Die Kopie kann anschliessend bearbeitet werden:

- Datum ändern
- Texte aktualisieren
- Preise anpassen
- Bilder ersetzen
- Workshops überarbeiten
- Tickets oder Produkte prüfen
- Shop veröffentlichen

Durch diese Funktion werden klassische Event-Serien in vielen Fällen weniger wichtig. Statt komplexe Serienlogik zu pflegen, kann ein funktionierendes Event kopiert und angepasst werden.

## 10. Öffentliche Shop- und Eventseiten

Die öffentlichen Seiten sind für Besucher:innen optimiert.

Ziel ist:

- klare Struktur
- wenig Ablenkung
- gute mobile Darstellung
- schnelle Auswahl
- klare Warenkorb-Logik
- starke visuelle Wirkung durch Bild, Logo und Farben
- einfache Buchung

### 10.1 Eventseite

Eine typische Eventseite besteht aus:

- Header mit Logo und Warenkorb
- Datumskachel
- Eventtitel
- Kurzbeschreibung
- Hero-Bild
- Beschreibung
- Ticketbereich
- optional Workshopbereich
- optional Videoeinblick
- weitere Informationen
- Location mit Karte
- Adresse, Treffpunkt, Parkmöglichkeiten
- Anreiseinformationen
- optional Mitwirkende Betriebe
- optional Partner und Sponsoren
- Eventkalender mit weiteren Events
- Footer

### 10.2 Produkt-Shop-Seite

Eine Produkt-Shop-Seite hat ähnlichen visuellen Rahmen, aber anderes Wording.

Statt Tickets und Workshops stehen Produkte im Vordergrund.

Typische Inhalte:

- Shop-Titel
- Aktionsbeschreibung
- Produktkarussell
- Produktkarten mit Preis und Beschreibung
- Versandinformationen
- Warenkorb
- Checkout
- Bestellbestätigung

### 10.3 Hub-Homepage

Die Hub-Homepage ist die zentrale Einstiegsseite.

Sie kann zeigen:

- Hauptsujet bzw. hervorgehobenes Event
- nächste Events
- Eventkalender
- Vorstellung von Region, Verein oder Veranstalter
- Instagram-Bereich oder Bildgrid
- Link zu weiteren Informationen
- Buchungsübersicht

Für Carnuntum ist die Homepage so gedacht, dass Besucher:innen ein Gefühl für Region, Wein, Veranstaltungen und aktuelle Angebote bekommen.

## 11. Design und Branding

Jeder Veranstalter kann ein eigenes Erscheinungsbild haben.

Mögliche Branding-Elemente:

- Logo
- Primärfarbe
- Sekundärfarbe
- Akzentfarbe
- Textfarbe
- Hintergrundfarbe
- Schriftart
- Hero-Bilder
- Ticketbild
- Sponsorenlogos
- Workshop-Icons

Die Veranstalter-Defaults werden bei neuen Events übernommen. Ein einzelnes Event kann bei Bedarf davon abweichen.

### 11.1 Live-Vorschau

Im Admin-Bereich gibt es Vorschauen für Shop und Ticket-PDF. Ziel ist, Änderungen möglichst sofort sichtbar zu machen.

Das ist wichtig, weil nicht-technische Benutzer:innen nicht erst veröffentlichen oder speichern müssen sollten, um zu verstehen, wie eine Farbe, ein Logo oder ein Text später aussieht.

### 11.2 Bilder und Uploads

Bilder können für unterschiedliche Zwecke hochgeladen werden:

- Veranstalterlogo
- Benutzerlogo
- Event-Hero
- Produktbild
- Ticketbild
- Sponsorenlogo
- Workshop-Kategorie-Icon
- Instagram-/Homepage-Bilder

Bilder werden beim Upload optimiert, damit sie schneller laden und nicht unnötig Speicherplatz verbrauchen. Alte ersetzte Bilder sollen nach Möglichkeit aufgeräumt werden, damit der Server langfristig sauber bleibt.

### 11.3 Workshop-Kategorie-Icons

Für Workshop-Kategorien gibt es eine lokale Icon-Bibliothek. Die Icons werden nur einmal sichtbar angezeigt, sind aber über mehrere Suchbegriffe auffindbar.

Beispiel:

- Suche nach „outdoor“ kann Sonne, Natur, Baum oder Landschaft finden.
- Suche nach „wein“ kann Wein, Trauben oder Flasche finden.

Zusätzlich kann ein eigenes Icon hochgeladen werden. Dieses wird farblich an die Kategorie bzw. Veranstalterfarbe angepasst, sofern es sich als Icon/Silhouette eignet.

## 12. Ticket-Design und Ticket-PDF

Bei Ticket-Events erzeugt der Ticket-Hub automatisch Ticket-PDFs.

Das Ticket-PDF ist bewusst standardisiert. Dadurch bleibt es professionell, verlässlich und wartbar.

Typische Ticketinhalte:

- Eventtitel
- Ticketname
- Datum
- Uhrzeit
- Ort
- Käuferdaten
- Ticketnummer
- QR-Code, falls Scanner aktiv
- optional Workshopinformationen
- optional eigener Tickettext
- optional Ticketbild
- Veranstalterlogo
- Veranstaltername
- kleiner Footer mit Ticketing-Hinweis

Das Ticket ist als A4-Seite aufgebaut. Es soll einfach ausgedruckt, weitergeleitet oder am Smartphone vorgezeigt werden können.

Wenn kein QR-Code benötigt wird, etwa weil kein Scanner aktiv ist, kann der QR-Code ausgeblendet werden. Wenn kein Ticketbild hinterlegt ist, rücken die Texte entsprechend nach oben.

## 13. Warenkorb und Checkout

Der Warenkorb ist für Besucher:innen möglichst einfach gehalten.

### 13.1 Warenkorb bei Ticket-Events

Bei Ticket-Events enthält der Warenkorb:

- Ticketpositionen
- Mengensteuerung
- Workshoppositionen, wenn vorhanden
- Preise
- Summe
- Rabatt, falls vorhanden
- Weiter zur Kassa

Bei Events mit Workshops wird im Warenkorb klar unterschieden, was ein Ticket und was ein Workshop ist. Bei einfachen Ticket-Events oder Produkt-Shops wird diese Zusatzbezeichnung weggelassen, weil sie sonst nur unnötige Komplexität erzeugt.

### 13.2 Warenkorb bei Produkt-Shops

Bei Produkt-Shops enthält der Warenkorb:

- Produkte
- Mengen
- Warenwert
- Versandkosten
- Gesamtsumme
- Rabattcode
- Lieferland
- Checkout

Produkt-Shops und Ticket-Events sollen nicht unkontrolliert in einem gemeinsamen Warenkorb vermischt werden, weil dadurch mehrere Stripe-Konfigurationen, unterschiedliche Versandlogiken oder getrennte Mailprozesse entstehen könnten.

### 13.3 Stripe Checkout

Die eigentliche Zahlung erfolgt über Stripe Checkout. Dort können je nach Stripe-Konfiguration unterschiedliche Zahlungsmethoden angeboten werden.

Nach der Zahlung wird die Bestellung im Ticket-Hub aktualisiert und die Bestätigungsmail versendet.

Wenn eine Zahlung abgebrochen wird, landet die Person auf einer Abbruchseite. Von dort soll sie zur passenden Event- oder Shopseite zurückkehren können.

## 14. Rabattcodes und Aktionen

Pro Event oder Shop können Rabattcodes angelegt werden.

Mögliche Einstellungen:

- Code
- Beschreibung
- Prozent-Rabatt
- Fixbetrag
- Aktiv/Inaktiv
- Gültigkeitszeitraum
- Mindestbestellwert
- Einlöselimit
- maximale Rabatt-Höhe

Prozent und Fixbetrag sind getrennte Typen. Wenn Prozent gewählt ist, ist nur das Prozentfeld relevant. Wenn Fixbetrag gewählt ist, ist nur der Betrag relevant.

Rabattcodes werden im Checkout angewendet und auch im Reporting ausgewertet.

Typische Anwendungsfälle:

- Early-Bird-Aktion
- Partnercode
- Newsletter-Aktion
- Gutschein
- VIP-Code
- Presale-Code

## 15. Marketing und Tracking

Der Ticket-Hub enthält Marketing-Funktionen, damit Veranstalter besser verstehen, woher Käufe kommen.

### 15.1 GA4 und Meta Pixel

Veranstalter können Google Analytics 4 und Meta Pixel hinterlegen.

Damit können Besucherquellen, Kampagnen und Nutzerverhalten in externen Marketingtools analysiert werden.

### 15.2 Tracking-Links

Tracking-Links sind spezielle Links, die auf denselben Shop führen, aber eine Kampagnenkennung enthalten.

Beispiel:

- Link für Instagram
- Link für Newsletter
- Link für Flyer-QR-Code
- Link für Partnerbetrieb
- Link für bezahlte Anzeige

Ein Tracking-Link kann enthalten:

- Bezeichnung
- Code
- Quelle
- Medium
- Kampagne

Im Reporting sieht man dann, wie oft ein Link geklickt wurde, wie viele Bestellungen daraus entstanden sind und welcher Umsatz zugeordnet werden konnte.

### 15.3 QR-Codes für Werbemittel

Aus Tracking-Links können QR-Codes erzeugt oder für Werbemittel genutzt werden. Dadurch kann man zum Beispiel auf Flyern, Plakaten oder Tischaufstellern unterschiedliche QR-Codes verwenden und später sehen, welcher Kanal funktioniert hat.

## 16. Kommunikation und Newsletter

Der Ticket-Hub enthält eine Kommunikationsfunktion für E-Mails an Kund:innen.

Mögliche Empfängergruppen:

- alle erreichbaren Kontakte eines Benutzers
- Kontakte bestimmter Veranstalter
- Käufer:innen bestimmter Veranstaltungen
- Personen mit bestimmten Tickets
- Personen mit bestimmten Workshops
- Newsletter-Abonnent:innen

Vor dem Versand sollte immer eine Testmail gesendet werden.

### 16.1 Newsletter pro Veranstalter

Newsletter-Opt-in kann pro Veranstalter aktiviert werden. Im Checkout erscheint dann eine freiwillige Checkbox.

Die Newsletterliste kann pro Veranstalter exportiert werden. Dabei kann auch gespeichert werden, bei welchem Event sich eine Person angemeldet hat.

Das ist hilfreich für Tools wie Mailchimp, Brevo oder andere Newsletteranbieter. Eine vollautomatische API-Integration ist grundsätzlich möglich, erfordert aber je Anbieter eigene Einrichtung und Datenschutzprüfung.

### 16.2 Bearbeitbare Ticket-Mail

Ticket- und Bestellmails haben standardisierte Pflichtbestandteile, damit wichtige Informationen nicht versehentlich fehlen.

Typisch fix bzw. systemgeneriert:

- Bestellnummer
- gekaufte Tickets oder Produkte
- Ticketlinks oder PDF-Anhänge
- Zahlungsstatus
- Veranstaltungsdaten
- rechtlich/organisatorisch notwendige Informationen

Bearbeitbar sind sinnvollerweise:

- Betreff, vorausgefüllt mit Standardtext
- Einleitung
- Zusatzinformationen
- Hinweise zur Anreise
- Hinweise zum Ablauf
- Support-Text

So bleibt die Mail flexibel, ohne dass wichtige Variablen oder Links kaputtgehen.

## 17. Eigenverkauf und Vor-Ort-Kassa

Der Ticket-Hub unterstützt Vor-Ort-Verkäufe.

Das ist wichtig für:

- Abendkassa
- spontane Käufe vor Ort
- Gratistickets
- Barzahlung
- Kartenzahlung ausserhalb von Stripe
- Einladungen oder Presse/VIP-Tickets

Im Admin-Bereich kann eine Vor-Ort-Bestellung erstellt werden. Je nach Eventtyp werden nur passende Optionen angezeigt.

Bei einem einfachen Ticket-Event werden keine Workshop-Optionen geladen, wenn es keine Workshops gibt. Bei Produkt-Shops wird entsprechend produktorientiert gearbeitet.

Die Umsätze können im Reporting nach Kanal getrennt betrachtet werden, etwa Online-Verkauf vs. Eigenverkauf.

## 18. Einlass und Scanner

Für Ticket-Events kann der Scanner aktiviert werden.

Wenn der Scanner aktiv ist:

- Ticket-PDFs enthalten QR-Codes
- Scanner-Seiten können freigegeben werden
- QR-Codes können mit dem Handy-Browser gescannt werden
- Tickets werden als gültig, bereits verwendet oder ungültig erkannt
- Scans werden protokolliert
- Einlassdaten können ausgewertet werden

Wenn der Scanner deaktiviert ist:

- Scanner-spezifische Bereiche werden ausgeblendet
- QR-Code am Ticket kann automatisch deaktiviert werden
- Einlass-Tab kann trotzdem sichtbar bleiben, um Scanner später zu aktivieren oder Eventbetrieb zu steuern

### 18.1 Scan-Statistiken

Scans können nach Scanner, Standort, Name oder Adresse unterschieden werden. Dadurch kann ein Veranstalter sehen:

- welcher Eingang wie viele Tickets gescannt hat
- welcher Scannerzugang verwendet wurde
- wie viele Personen bereits eingecheckt sind
- ob es Auffälligkeiten bei Doppel-Scans gibt

## 19. Reporting und Business Insights

Das Reporting ist ein zentraler Bestandteil des Ticket-Hubs.

Ziel ist nicht nur, Tabellen zu zeigen, sondern schnell beantwortbare Fragen zu liefern:

- Wie viel Umsatz wurde erzielt?
- Wie viele Bestellungen gab es?
- Welche Tickets oder Produkte verkaufen sich am besten?
- Welche Workshops sind gefragt?
- Wo brechen Menschen im Funnel ab?
- Welche Marketinglinks bringen Umsatz?
- Wann wird gekauft?
- Woher kommen Kund:innen?
- Wie alt sind Kund:innen, wenn Geburtsdaten erhoben werden?
- Wie gut funktioniert der Einlass?

### 19.1 Typische Kennzahlen

- Umsatz brutto
- Anzahl Bestellungen
- verkaufte Tickets/Produkte
- verkaufte Workshops
- durchschnittlicher Bestellwert
- Rabattvolumen
- Conversion im Checkout-Funnel
- Warenkorbabbrüche
- Scan-Quote
- Newsletter-Opt-ins

### 19.2 Diagramme und Auswertungen

Mögliche Auswertungen:

- Umsatz über Zeit
- Bestellungen über Zeit
- Absatz nach Ticket oder Produkt
- Workshop-Ranking
- Funnel-Diagramm
- Käufe nach Uhrzeit
- Käufe nach Wochentag
- Marketingwirkung nach Tracking-Link
- Rabattcode-Performance
- Kundendaten nach Herkunft
- Altersverteilung
- Einlass-Scans nach Scanner/Standort

### 19.3 Exporte

Viele Tabellen können als CSV exportiert werden.

Beispiele:

- Bestellungen
- Ticket-/Produktpositionen
- Workshopübersicht
- Kundendaten
- Newsletterliste
- Versanddaten

Dateinamen sollen möglichst den Eventnamen enthalten, damit Exporte später eindeutig zuordenbar sind.

## 20. Bestellungen und Kundendaten

Im Admin-Bereich können Bestellungen eingesehen werden.

Typische Informationen:

- Bestellnummer
- Käufername
- E-Mail-Adresse
- Status
- Zahlungsstatus
- gekaufte Tickets/Produkte
- Workshops
- Rabattcode
- Tracking-Link
- Newsletter-Opt-in
- Erstelldatum
- Zahlungsdatum
- Gesamtbetrag

Eine Bestellung kann geöffnet werden, um Details zu sehen oder Tickets erneut zu senden.

Aggregierte Tabellen helfen, nicht jede Einzelposition manuell durchsehen zu müssen. Zum Beispiel:

- pro Ticket/Produkt: verkaufte Menge und Umsatz
- pro Workshop: gebuchte Menge, Status und Käufer:innen

## 21. Versand und Produkt-Shops

Für Produkt-Shops können Versandoptionen hinterlegt werden.

Mögliche Einstellungen:

- Versandpartner
- Kontakt-Mail des Versandpartners
- Versandländer
- Versandkosten pro Land
- Versandkostenmodell: einmal pro Bestellung oder pro Produkt
- Artikelnummer des Versandpartners pro Produkt
- Testmail mit Beispiel-CSV

### 21.1 Versandpartner

Ein Versandpartner kann für mehrere Shops wiederverwendet werden.

Das ist wichtig, weil Versandpartner oft eigene CSV-Formate erwarten. Wenn ein Partner wie Wine Logistik ein bestimmtes CSV-Profil benötigt, kann dieses Profil im System hinterlegt und für passende Shops genutzt werden.

Wenn ein neuer Versandpartner ein anderes Format braucht, kann ein neues Profil angelegt oder programmiert werden.

### 21.2 Testmail für Versandpartner

Vor Livegang kann eine Testmail an eine eingegebene Adresse gesendet werden. Diese soll so aussehen wie eine echte Versandmail, aber mit Beispieldaten.

Dadurch kann kontrolliert werden:

- ob der Mailtext passt
- ob die CSV korrekt aufgebaut ist
- ob Artikelnummern enthalten sind
- ob Länder und Versandpreise stimmen
- ob der Versandpartner die Datei verarbeiten kann

## 22. Videos, Medien und weitere Inhalte

Eventseiten können optional Videos enthalten.

Ein Video erscheint nur dann als eigene Section, wenn ein Video hinterlegt ist. Wenn kein Video vorhanden ist, bleibt der Bereich komplett ausgeblendet.

Best Practice für Videos:

- YouTube oder Vimeo einbetten, statt grosse Videodateien selbst zu hosten
- datenschutzfreundliche Embed-URLs nutzen, soweit möglich
- Video nicht zu gross darstellen
- mobil responsiv halten
- zusätzlich einen Link „Video auf YouTube ansehen“ anbieten

Eine sinnvolle Section-Bezeichnung ist zum Beispiel:

- Einblicke zum Event
- Einblicke zum Angebot
- Impressionen
- Vorgeschmack

## 23. Mitwirkende Betriebe und kundenspezifische Sections

Der Ticket-Hub kann kundenspezifische Inhaltsbereiche abbilden, ohne jedes Event als Sonderfall programmieren zu müssen.

Ein Beispiel ist die Section „Mitwirkende Betriebe“ für Veranstaltungen der Rubin Carnuntum Weingüter.

Pro Veranstalter können Betriebe gepflegt werden:

- Name
- Beschreibung
- Adresse
- Website
- Kontaktinformationen

Pro Event kann ausgewählt werden, welche Betriebe angezeigt werden. Wenn keine Betriebe ausgewählt sind, erscheint die Section nicht.

Die Überschrift kann pro Veranstalter angepasst werden, etwa:

- Mitwirkende Betriebe
- Winzer:innen vor Ort
- Partnerbetriebe
- Produzent:innen

Das Prinzip ist wichtig: Spezielle Anforderungen sollen möglichst als konfigurierbare Module umgesetzt werden, nicht als harte Sonderlogik pro Event.

## 24. Sponsoren und Partner

Pro Event können Sponsorenlogos und Links hinterlegt werden.

Wenn Sponsoren vorhanden sind, erscheint eine Section „Partner & Sponsoren“. Wenn keine Sponsoren hinterlegt sind, wird die Section ausgeblendet.

Sponsoren können enthalten:

- Name
- Logo
- Website-Link

Im Shop sollte der Name verlinkt sein, statt lange URLs sichtbar auszuschreiben. Das hält die Seite ruhiger und professioneller.

## 25. Ressourcen und Downloads

Für manche Events sind zusätzliche Downloads sinnvoll:

- Programm-PDF
- Folder
- Broschüre
- Quiz
- Lageplan
- Teilnahmebedingungen

Solche Ressourcen können hochgeladen und in Texten verlinkt werden. Dadurch muss nicht jede Sonderinformation direkt auf die Landingpage gequetscht werden.

Beispiel: Ein Programm kann als Button „Zum Programm“ verlinkt werden.

## 26. Archivierung und Lebenszyklus von Events

Events haben einen Lebenszyklus.

Typische Status:

- Entwurf
- aktiv/sichtbar
- pausiert
- archiviert

Archivierte Events sollen:

- aus der normalen Eventübersicht verschwinden
- offline bzw. nicht mehr sichtbar sein
- keine aktiven Scannerfunktionen mehr haben
- nur über Filter wieder auffindbar sein
- für historische Reports erhalten bleiben

Das ist wichtig, damit der Admin-Bereich nicht mit alten Events überladen wird.

## 27. Staging und Tests

Der Ticket-Hub kann in einer Staging-Umgebung getestet werden.

Für Carnuntum ist lokal bzw. per Tunnel vorgesehen:

- Live: `https://shop.carnuntum.com`
- Staging lokal: `http://127.0.0.1:5100`
- später Staging-Domain: `https://staging.shop.carnuntum.com`

Staging dient dazu, neue Funktionen und neue Shops zu testen, bevor sie live gehen.

Wichtig:

- Staging sollte keine echten Versandmails an externe Partner senden.
- Testmails sollten an definierte Testadressen gehen.
- Stripe sollte in Staging im Testmodus laufen.
- Staging-Daten können von Live-Daten abweichen.

## 28. Sicherheit und Datenschutz

Der Ticket-Hub verarbeitet personenbezogene Daten.

Dazu zählen zum Beispiel:

- Name
- E-Mail-Adresse
- Rechnungs-/Lieferdaten
- Bestellungen
- Ticketdaten
- Newsletter-Opt-in
- optional Geburtsdatum
- Zahlungsstatus

Wichtige Prinzipien:

- Zugriff nur für berechtigte Benutzer
- Benutzer sehen nur ihre zugewiesenen Veranstalter
- Scannerzugriff ohne Adminrechte
- Newsletter nur mit Opt-in
- Exporte nur für berechtigte Admins
- sensible Stripe Secret Keys nicht unnötig anzeigen
- Mail-Absender müssen bei Postmark/Versandanbieter freigegeben sein

### 28.1 Mindestalter und Geburtsdatum

Bei weinbezogenen Veranstaltungen kann eine Altersabfrage sinnvoll sein. Das Geburtsdatum kann im Checkout erhoben werden, um Mindestalter und spätere Altersauswertungen zu ermöglichen.

Ob und wie diese Abfrage rechtlich notwendig ist, sollte je Kunde und Veranstaltung geprüft werden.

## 29. Typischer Onboarding-Ablauf für neue Kund:innen

Ein möglicher Onboarding-Prozess:

### Schritt 1: Bedarf klären

Gemeinsam wird geklärt:

- Welche Art von Events gibt es?
- Wie viele Veranstaltungen pro Jahr?
- Werden Produkte verkauft?
- Wird Versand gebraucht?
- Wird Einlasskontrolle gebraucht?
- Wird Eigenverkauf vor Ort gebraucht?
- Welche Domain soll verwendet werden?
- Welche Zahlungsabwicklung ist gewünscht?
- Welche Personen brauchen Zugriff?

### Schritt 2: Veranstalter einrichten

Netzl Data Solutions oder der berechtigte Admin legt den Veranstalter an:

- Stammdaten
- Logo
- Farben
- Mail-Absender
- Supportkontakt
- rechtliche Angaben
- Newsletter-Einstellungen

### Schritt 3: Stripe vorbereiten

Der Kunde richtet Stripe ein oder stellt vorhandene Stripe-Daten bereit.

Zu klären:

- Testmodus/Sandbox
- Live-Modus
- Publishable Key
- Secret Key
- Webhook Secret
- erforderliche Webhook-Ereignisse

### Schritt 4: Benutzer anlegen

Der Superadmin legt Benutzer an und weist Veranstalter zu.

### Schritt 5: Erstes Event gemeinsam erstellen

Im ersten gemeinsamen Termin wird ein Event oder Shop erstellt:

- Eventtyp auswählen
- Datum und Ort setzen
- Tickets/Produkte anlegen
- Texte und Bilder einpflegen
- Design prüfen
- Testkauf durchführen
- Mail prüfen
- Scanner testen, falls relevant

### Schritt 6: Livegang

Vor dem Livegang wird geprüft:

- Shop sichtbar
- Zahlungsdaten live
- Mailversand korrekt
- AGB/Datenschutz/Impressum korrekt
- Tickets korrekt
- Rabattcodes korrekt
- Trackinglinks korrekt
- Versand korrekt, falls Produktshop

### Schritt 7: Laufender Betrieb

Nach dem Livegang kann der Kunde selbst:

- neue Events anlegen
- Events duplizieren
- Bestellungen einsehen
- Reports auswerten
- Newsletterlisten exportieren
- Kommunikation versenden
- Eigenverkauf erfassen
- Scannerzugriffe verwalten

## 30. Was der Ticket-Hub bewusst nicht ist

Der Ticket-Hub ist nicht als vollständiger Ersatz für jede denkbare Großplattform-Funktion gedacht.

Nicht im Fokus:

- komplexe Sitzplatzpläne mit Saalauswahl
- Wiederverkaufsmarkt
- externe Vertriebsnetzwerke wie grosse Ticketplattformen
- gedruckte Hardtickets über externe Vertriebsstellen
- hochkomplexe Multi-Venue-Festivalplanung mit tausenden parallelen Slots
- vollautomatische Buchhaltung für alle Sonderfälle

Der Fokus liegt auf:

- selbst verwaltbaren Events
- einfachen Ticketverkäufen
- Produktaktionen
- Workshops
- gutem Design
- einfacher Administration
- Einlasskontrolle
- Reporting
- direkter Zahlungsabwicklung
- kundennaher Anpassbarkeit

## 31. Vorteile gegenüber klassischen Ticketplattformen

### 31.1 Mehr Kontrolle

Der Kunde verwaltet Veranstaltungen selbst und ist nicht für jede Änderung von einem externen Ticketanbieter abhängig.

### 31.2 Eigene Marke

Shop, Mails, Tickets und Farben können an die eigene Marke angepasst werden.

### 31.3 Keine unnötige Komplexität

Nur relevante Funktionen werden angezeigt. Ein Produkt-Shop zeigt keine Scanner- und Ticketdesign-Funktionen. Ein einfaches Ticket-Event zeigt keine Workshop-Konfiguration, wenn keine Workshops existieren.

### 31.4 Besseres Reporting

Die Plattform ist auf operative Fragen ausgelegt:

- Was verkauft sich?
- Wann kaufen Menschen?
- Woher kommen sie?
- Welche Kampagnen funktionieren?
- Welche Workshops sind gefragt?
- Wie läuft der Einlass?

### 31.5 Skalierbarkeit

Ein Kunde kann mit einem Event starten und später mehrere Veranstalter, Shops, Produkte, Workshops oder externe Landingpages betreiben.

### 31.6 Direkte Zahlungsabwicklung

Mit eigenen Stripe-Konfigurationen können Umsätze direkt beim passenden Veranstalter landen.

## 32. Beispiel: Einfache Bar mit acht Events pro Jahr

Eine neu eröffnete Bar möchte acht Events pro Jahr veranstalten.

Sinnvolles Setup:

- ein Veranstalterprofil für die Bar
- Logo und Farben der Bar
- Stripe-Account der Bar
- Admin-Zugang für die Betreiber:innen
- Standard-Ticketmail
- Standard-Ticketdesign
- Eventvorlage für einfache Ticket-Events

Pro Event legt die Bar an:

- Titel
- Datum
- Uhrzeit
- Bild
- Beschreibung
- ein oder mehrere Tickets
- Preis
- Kontingent
- optional Rabattcode
- optional Trackinglink für Instagram

Besucher:innen kaufen Tickets online. Die Bar sieht Bestellungen, Umsatz und kann am Eventabend Tickets scannen oder Vor-Ort-Verkäufe erfassen.

## 33. Beispiel: Weinveranstaltung mit Workshops

Ein Weinbauverein veranstaltet ein Event mit Eintritt und mehreren Workshops.

Setup:

- Veranstalterprofil des Vereins
- Stripe-Konfiguration
- Eventseite mit Bild, Beschreibung, Location und Anreise
- Eintrittsticket
- Workshops mit Kategorien und Icons
- Mitwirkende Winzer:innen
- Sponsorenlogos
- Scanner für Einlass
- Reports nach Ticket, Workshop, Herkunft, Alter und Marketinglink

Besucher:innen kaufen zuerst Eintritt und können zusätzlich Workshops auswählen. Die Seite bleibt trotzdem übersichtlich, weil Workshops gruppiert und Details in Popups dargestellt werden.

## 34. Beispiel: Produktaktion mit Versand

Ein Verein verkauft Weinpakete.

Setup:

- Produkt-Shop
- Produkte mit Beschreibung und Preis
- Versandländer
- Versandkostenmodell
- Versandpartner
- Artikelnummern pro Produkt
- Stripe-Zahlung
- automatische Bestellmail
- Versandpartner-CSV

Nach erfolgreicher Zahlung wird eine Mail mit Bestelldetails versendet. Optional erhält der Versandpartner eine CSV-Datei im passenden Format.

## 35. Module im Überblick

### Admin

- Login
- Start-Guide
- Dashboard
- Events
- Veranstalter
- Benutzer
- Kommunikation
- Hilfe
- Backups, je nach Rolle

### Eventverwaltung

- Grunddaten
- Zeitplan
- Location
- Shop-Design
- Ticket-Design
- Tickets/Produkte
- Workshops
- Marketing
- Reports
- Bestellungen
- Eigenverkauf
- Einlass

### Public Shop

- Hub-Homepage
- Eventkalender
- Eventseite
- Produkt-Shop
- Warenkorb
- Checkout
- Success Page
- Cancellation Page
- Ticketseite
- Scannerseite

### Services

- Stripe-Zahlungen
- Postmark-Mailversand
- Ticket-PDF-Erstellung
- QR-Code-Erstellung
- CSV-Exporte
- Reporting
- Bildoptimierung
- Versandpartner-Integration

## 36. Betrieb und Wartung

Der Ticket-Hub benötigt laufenden technischen Betrieb.

Dazu gehören:

- Hosting
- Datenbankbetrieb
- Backups
- Updates
- Security-Patches
- Monitoring
- Fehlerbehebung
- SSL-Zertifikate
- Domainkonfiguration
- E-Mail-Zustellbarkeit
- Stripe-Webhook-Prüfung
- Staging-Umgebung
- Weiterentwicklung

Deshalb ist ein monatliches Betriebsmodell sinnvoll. Der Kunde zahlt nicht nur für Speicherplatz, sondern für eine laufend betreute Verkaufsplattform.

## 37. Mögliche Leistungsübersicht für Kund:innen

Ein Kundenangebot kann zum Beispiel folgende Leistungen enthalten.

### Einmaliges Setup

- Erstgespräch und Anforderungsanalyse
- Einrichtung des Veranstalters
- Branding-Grundsetup
- Stripe-Anbindung
- Mail-Absender-Konfiguration
- erste Eventvorlage
- erstes gemeinsames Event
- Testkauf
- kurze Einschulung

### Laufender Betrieb

- Hosting
- Wartung
- Backups
- technische Updates
- kleinere Supportanfragen
- Fehlerbehebung
- Systemmonitoring
- Staging/Testumgebung

### Optionale Zusatzleistungen

- individuelle Designanpassungen
- neue Versandpartner-CSV-Profile
- Newsletter-Integration per API
- besondere Reporting-Auswertungen
- kundenspezifische Sections
- Datenmigration aus Altsystemen
- Schulung weiterer Benutzer
- Vor-Ort-Begleitung bei Großveranstaltungen

## 38. Wichtige Abgrenzungen für Angebote

Damit Kund:innen klare Erwartungen haben, sollte man im Angebot definieren:

- Wie viele Admin-Benutzer enthalten sind
- Ob Customer User enthalten sind
- Welche Domain genutzt wird
- Ob eine eigene Domain eingerichtet wird
- Ob Stripe vom Kunden selbst eingerichtet wird
- Ob Mail-Absender beim Kunden liegt
- Welche Zahlungsgebühren Stripe separat verrechnet
- Ob Netzl Data Solutions Ticketgebühren verrechnet oder nicht
- Wie schnell Support erfolgt
- Welche individuellen Programmierungen inkludiert sind
- Welche Funktionen Standard sind und welche Erweiterungen sind

## 39. Zusammenfassung

Der NDS Ticket-Hub ist eine modulare Plattform für Ticketverkauf, Produktaktionen, Event-Landingpages, Workshops, Einlass, Kommunikation, Versand und Reporting.

Die Stärke liegt darin, dass Kund:innen wiederkehrende Veranstaltungen selbst verwalten können, ohne jedes Mal bei null zu beginnen. Gleichzeitig bleibt genug Flexibilität für individuelle Anforderungen wie Workshop-Kategorien, Mitwirkende Betriebe, Versandpartner oder kundenspezifisches Branding.

Für kleine und mittlere Veranstalter ist der Ticket-Hub damit eine professionelle Alternative zu klassischen Ticketplattformen: näher an der eigenen Marke, leichter selbst zu bedienen, mit direkter Zahlungsabwicklung und einem Admin-Bereich, der Schritt für Schritt auf echte Veranstaltungsarbeit ausgelegt ist.
