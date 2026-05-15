(function () {
  "use strict";

  const textInput = document.getElementById("qr-text");
  const sizeSelect = document.getElementById("qr-size");
  const errorCorrectionSelect = document.getElementById("qr-error-correction");
  const marginInput = document.getElementById("qr-margin");
  const foregroundInput = document.getElementById("qr-foreground");
  const foregroundTextInput = document.getElementById("qr-foreground-text");
  const backgroundInput = document.getElementById("qr-background");
  const backgroundTextInput = document.getElementById("qr-background-text");
  const preview = document.getElementById("qr-preview");
  const message = document.getElementById("qr-message");
  const summary = document.getElementById("qr-summary");
  const filenameInput = document.getElementById("qr-filename");
  const downloadPngButton = document.getElementById("download-png");
  const downloadJpgButton = document.getElementById("download-jpg");
  const downloadSvgButton = document.getElementById("download-svg");
  const downloadPdfButton = document.getElementById("download-pdf");

  let currentQr;
  let currentSvg = "";
  let currentCanvas;
  let renderTimer;

  function setMessage(text, kind) {
    if (!text) {
      message.className = "alert alert-warning d-none mb-0";
      message.textContent = "";
      return;
    }

    message.className = `alert alert-${kind} mb-0`;
    message.textContent = text;
  }

  function setDownloadsEnabled(enabled) {
    [downloadPngButton, downloadJpgButton, downloadSvgButton, downloadPdfButton].forEach((button) => {
      button.disabled = !enabled;
    });
  }

  function normalizeHex(value, fallback) {
    const trimmed = String(value || "").trim();
    if (/^#[0-9a-f]{6}$/iu.test(trimmed)) {
      return trimmed.toLowerCase();
    }
    return fallback;
  }

  function syncColor(source, colorInput, textInput) {
    const fallback = colorInput.value || "#000000";
    const value = normalizeHex(source.value, fallback);
    colorInput.value = value;
    textInput.value = value;
    scheduleRender();
  }

  function createCanvas(qr, size, margin, darkColor, lightColor) {
    const moduleCount = qr.getModuleCount();
    const totalModules = moduleCount + margin * 2;
    const scale = Math.floor(size / totalModules);
    const canvasSize = totalModules * scale;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = canvasSize;
    canvas.height = canvasSize;
    ctx.fillStyle = lightColor;
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = darkColor;

    for (let row = 0; row < moduleCount; row += 1) {
      for (let col = 0; col < moduleCount; col += 1) {
        if (qr.isDark(row, col)) {
          ctx.fillRect((col + margin) * scale, (row + margin) * scale, scale, scale);
        }
      }
    }

    return canvas;
  }

  function createSvg(qr, size, margin, darkColor, lightColor) {
    const moduleCount = qr.getModuleCount();
    const totalModules = moduleCount + margin * 2;
    const parts = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${totalModules} ${totalModules}" shape-rendering="crispEdges">`,
      `<rect width="100%" height="100%" fill="${lightColor}"/>`
    ];

    for (let row = 0; row < moduleCount; row += 1) {
      for (let col = 0; col < moduleCount; col += 1) {
        if (qr.isDark(row, col)) {
          parts.push(`<rect x="${col + margin}" y="${row + margin}" width="1" height="1" fill="${darkColor}"/>`);
        }
      }
    }

    parts.push("</svg>");
    return parts.join("");
  }

  function renderQr() {
    const value = textInput.value.trim();
    const size = Number(sizeSelect.value);
    const margin = Number(marginInput.value);
    const foreground = normalizeHex(foregroundTextInput.value, "#1f2933");
    const background = normalizeHex(backgroundTextInput.value, "#ffffff");

    foregroundInput.value = foreground;
    foregroundTextInput.value = foreground;
    backgroundInput.value = background;
    backgroundTextInput.value = background;

    if (!value) {
      currentQr = undefined;
      currentSvg = "";
      currentCanvas = undefined;
      preview.innerHTML = '<span class="text-muted">Text oder URL eingeben</span>';
      summary.textContent = "Noch kein QR-Code erstellt";
      setDownloadsEnabled(false);
      setMessage("", "warning");
      return;
    }

    try {
      if (typeof qrcode !== "function") {
        throw new Error("Die QR-Code Bibliothek konnte nicht geladen werden.");
      }

      if (qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs["UTF-8"]) {
        qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
      }

      const qr = qrcode(0, errorCorrectionSelect.value);
      qr.addData(value);
      qr.make();

      currentQr = qr;
      currentCanvas = createCanvas(qr, size, margin, foreground, background);
      currentSvg = createSvg(qr, size, margin, foreground, background);
      preview.replaceChildren(currentCanvas);
      summary.textContent = `${qr.getModuleCount()} x ${qr.getModuleCount()} Module · ${size} px`;
      setDownloadsEnabled(true);
      setMessage("", "warning");
    } catch (error) {
      currentQr = undefined;
      currentSvg = "";
      currentCanvas = undefined;
      preview.innerHTML = '<span class="text-muted">Der QR-Code konnte nicht erstellt werden.</span>';
      summary.textContent = "Fehler";
      setDownloadsEnabled(false);
      setMessage(error.message || "Bitte Inhalt kürzen oder eine niedrigere Fehlerkorrektur wählen.", "danger");
    }
  }

  function scheduleRender() {
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(renderQr, 120);
  }

  function filename(extension) {
    const baseName = String(filenameInput.value || "")
      .trim()
      .replace(/\.[a-z0-9]{2,5}$/iu, "")
      .replace(/[<>:"/\\|?*\u0000-\u001f]+/gu, "-")
      .replace(/\s+/gu, "-")
      .replace(/-+/gu, "-")
      .replace(/^-|-$/gu, "");

    return `${baseName || "qr-code"}.${extension}`;
  }

  function downloadUrl(url, name) {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    downloadUrl(url, name);
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function downloadImage(type, extension) {
    if (!currentCanvas) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = currentCanvas.width;
    canvas.height = currentCanvas.height;
    ctx.fillStyle = backgroundInput.value;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentCanvas, 0, 0);
    downloadUrl(canvas.toDataURL(type, 0.95), filename(extension));
  }

  async function downloadPdf() {
    if (!currentCanvas) return;
    if (!window.jspdf) {
      setMessage("Die PDF-Bibliothek konnte nicht geladen werden.", "danger");
      return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imageSize = 140;
    const x = (pageWidth - imageSize) / 2;
    pdf.addImage(currentCanvas.toDataURL("image/png"), "PNG", x, 28, imageSize, imageSize);
    pdf.save(filename("pdf"));
  }

  [textInput, sizeSelect, errorCorrectionSelect, marginInput].forEach((input) => {
    input.addEventListener("input", scheduleRender);
    input.addEventListener("change", scheduleRender);
  });

  foregroundInput.addEventListener("input", () => syncColor(foregroundInput, foregroundInput, foregroundTextInput));
  foregroundTextInput.addEventListener("input", () => syncColor(foregroundTextInput, foregroundInput, foregroundTextInput));
  backgroundInput.addEventListener("input", () => syncColor(backgroundInput, backgroundInput, backgroundTextInput));
  backgroundTextInput.addEventListener("input", () => syncColor(backgroundTextInput, backgroundInput, backgroundTextInput));

  downloadPngButton.addEventListener("click", () => downloadImage("image/png", "png"));
  downloadJpgButton.addEventListener("click", () => downloadImage("image/jpeg", "jpg"));
  downloadSvgButton.addEventListener("click", () => {
    if (!currentSvg) return;
    downloadBlob(new Blob([currentSvg], { type: "image/svg+xml;charset=utf-8" }), filename("svg"));
  });
  downloadPdfButton.addEventListener("click", downloadPdf);

  renderQr();
})();
