(function () {
  "use strict";

  const pyodideVersion = "0.29.3";
  const runtimeStatus = document.getElementById("runtime-status");
  const runtimeStatusText = document.getElementById("runtime-status-text");
  const fileInput = document.getElementById("csv-file");
  const selectedFileName = document.getElementById("selected-file-name");
  const convertButton = document.getElementById("convert-button");
  const downloadButton = document.getElementById("download-button");
  const padShortRowsCheckbox = document.getElementById("pad-short-rows");
  const messageBox = document.getElementById("message-box");
  const warningsBox = document.getElementById("warnings-box");
  const previewOutput = document.getElementById("preview-output");
  const summaryRows = document.getElementById("summary-rows");
  const summaryColumns = document.getElementById("summary-columns");
  const summaryWarnings = document.getElementById("summary-warnings");
  const summaryFormat = document.getElementById("summary-format");

  let pyodideReadyPromise;
  let downloadUrl;

  const conversionScript = `
import csv
import io
import json

text = source_text.lstrip("\\ufeff")
pad_short_rows = bool(pad_short_rows)
preview_limit = int(preview_limit)

reader = csv.reader(io.StringIO(text, newline=""), delimiter=",", quotechar='"')

try:
    header = next(reader)
except StopIteration as exc:
    raise ValueError("Die CSV-Datei ist leer.") from exc

header_len = len(header)
rows = []
padded_rows = []
line_numbers_with_issues = []

for line_number, row in enumerate(reader, start=2):
    row_len = len(row)
    if row_len == header_len:
        rows.append(row)
        continue

    if row_len < header_len and pad_short_rows:
        rows.append(row + [""] * (header_len - row_len))
        padded_rows.append({
            "line": line_number,
            "found": row_len,
            "expected": header_len
        })
        continue

    line_numbers_with_issues.append({
        "line": line_number,
        "found": row_len,
        "expected": header_len
    })

if line_numbers_with_issues:
    first = line_numbers_with_issues[0]
    raise ValueError(
        f"Zeile {first['line']} hat {first['found']} statt {first['expected']} Spalten. "
        "Bitte Quelldatei prüfen oder die Option zum Auffüllen fehlender Endspalten aktivieren."
    )

output_io = io.StringIO(newline="")
writer = csv.writer(
    output_io,
    delimiter=";",
    quotechar='"',
    lineterminator="\\r\\n",
    quoting=csv.QUOTE_MINIMAL
)
writer.writerow(header)
writer.writerows(rows)

converted = output_io.getvalue()
preview = "\\n".join(converted.splitlines()[:preview_limit])

json.dumps({
    "header_columns": header_len,
    "data_rows": len(rows),
    "padded_rows": padded_rows,
    "preview": preview,
    "converted_csv": converted
}, ensure_ascii=False)
`;

  function setRuntimeStatus(kind, text) {
    runtimeStatus.classList.remove("is-loading", "is-ready", "is-error");
    runtimeStatus.classList.add(kind);
    runtimeStatusText.textContent = text;

    const spinner = runtimeStatus.querySelector(".spinner-border");
    if (spinner) {
      spinner.classList.toggle("d-none", kind !== "is-loading");
    }
  }

  function setMessage(text, kind) {
    if (!text) {
      messageBox.className = "alert d-none mb-0";
      messageBox.textContent = "";
      return;
    }

    messageBox.className = `alert alert-${kind} mb-0`;
    messageBox.textContent = text;
  }

  function setWarnings(lines) {
    if (!lines.length) {
      warningsBox.className = "alert alert-warning d-none mb-0";
      warningsBox.textContent = "";
      summaryWarnings.textContent = "0";
      return;
    }

    const previewLines = lines.slice(0, 5).map((item) => `Zeile ${item.line}`);
    const suffix = lines.length > 5 ? ` und ${lines.length - 5} weitere` : "";

    warningsBox.className = "alert alert-warning mb-0";
    warningsBox.textContent =
      `Warnung: ${lines.length} Zeile(n) hatten zu wenige Spalten und wurden mit leeren Endwerten aufgefüllt (${previewLines.join(", ")}${suffix}).`;
    summaryWarnings.textContent = String(lines.length);
  }

  function resetDownloadLink() {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      downloadUrl = undefined;
    }

    downloadButton.removeAttribute("href");
    downloadButton.classList.add("d-none");
  }

  function buildOutputFileName(inputName) {
    if (!inputName) {
      return "konvertiert-semikolon.csv";
    }

    return inputName.replace(/\.csv$/i, "") + "-semicolon.csv";
  }

  function decodeFileBytes(bytes) {
    const decoders = [
      { encoding: "utf-8", label: "UTF-8" },
      { encoding: "windows-1252", label: "Windows-1252" },
      { encoding: "iso-8859-1", label: "ISO-8859-1" }
    ];

    for (const decoderInfo of decoders) {
      try {
        const decoder = new TextDecoder(decoderInfo.encoding, { fatal: true });
        return {
          text: decoder.decode(bytes),
          label: decoderInfo.label
        };
      } catch (error) {
        // Try the next encoding candidate.
      }
    }

    throw new Error("Die Dateikodierung konnte nicht erkannt werden.");
  }

  async function ensurePyodideReady() {
    if (!pyodideReadyPromise) {
      pyodideReadyPromise = loadPyodide({
        indexURL: `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`
      });
    }

    return pyodideReadyPromise;
  }

  async function convertSelectedFile() {
    const file = fileInput.files[0];
    if (!file) {
      setMessage("Bitte zuerst eine CSV-Datei auswählen.", "warning");
      return;
    }

    convertButton.disabled = true;
    convertButton.textContent = "Datei wird verarbeitet...";
    resetDownloadLink();
    setMessage("", "info");

    try {
      const pyodide = await ensurePyodideReady();
      const fileBytes = new Uint8Array(await file.arrayBuffer());
      const decodedFile = decodeFileBytes(fileBytes);
      const sourceText = decodedFile.text;

      pyodide.globals.set("source_text", sourceText);
      pyodide.globals.set("pad_short_rows", padShortRowsCheckbox.checked);
      pyodide.globals.set("preview_limit", 8);

      const resultJson = await pyodide.runPythonAsync(conversionScript);
      const result = JSON.parse(resultJson);

      const blob = new Blob([result.converted_csv], {
        type: "text/csv;charset=utf-8;"
      });

      downloadUrl = URL.createObjectURL(blob);
      downloadButton.href = downloadUrl;
      downloadButton.download = buildOutputFileName(file.name);
      downloadButton.classList.remove("d-none");

      summaryRows.textContent = String(result.data_rows);
      summaryColumns.textContent = String(result.header_columns);
      summaryFormat.textContent = `Semikolon-CSV · ${decodedFile.label}`;
      previewOutput.textContent = result.preview || "Die konvertierte Datei enthält keine darstellbaren Zeilen.";
      setWarnings(result.padded_rows || []);
      setMessage("Die Datei wurde erfolgreich umgewandelt.", "success");
    } catch (error) {
      const normalizedMessage = (error && error.message ? error.message : "")
        .replace(/^PythonError:\s*/u, "")
        .trim();
      summaryRows.textContent = "-";
      summaryColumns.textContent = "-";
      summaryFormat.textContent = "Semikolon-CSV";
      previewOutput.textContent = "Bei der Verarbeitung ist ein Fehler aufgetreten.";
      setWarnings([]);
      setMessage(normalizedMessage || "Die Datei konnte nicht umgewandelt werden.", "danger");
    } finally {
      convertButton.disabled = false;
      convertButton.textContent = "In Semikolon-CSV umwandeln";
    }
  }

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    selectedFileName.textContent = file ? file.name : "Noch keine Datei ausgewählt";
    setMessage("", "info");
    resetDownloadLink();
  });

  convertButton.addEventListener("click", convertSelectedFile);

  ensurePyodideReady()
    .then(() => {
      setRuntimeStatus("is-ready", "Bereit");
      convertButton.disabled = false;
    })
    .catch((error) => {
      setRuntimeStatus("is-error", "Konnte nicht geladen werden");
      setMessage(error.message || "Pyodide konnte nicht geladen werden.", "danger");
    });
})();
