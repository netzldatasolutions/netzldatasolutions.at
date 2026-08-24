(function () {
  "use strict";

  const maxFileBytes = 40 * 1024 * 1024;
  const maxPixels = 60 * 1000 * 1000;
  const commonImageExtension = /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|tiff?|webp)$/iu;
  const numberFormatter = new Intl.NumberFormat("de-AT", {
    maximumFractionDigits: 1
  });

  const outputFormats = [
    { mime: "image/jpeg", label: "JPEG", extension: "jpg", lossy: true },
    { mime: "image/png", label: "PNG", extension: "png", lossy: false },
    { mime: "image/webp", label: "WebP", extension: "webp", lossy: true },
    { mime: "image/avif", label: "AVIF", extension: "avif", lossy: true },
    { mime: "image/svg+xml", label: "SVG", extension: "svg", lossy: false, svgOnly: true }
  ];

  const fileInput = document.getElementById("image-converter-file");
  const dropZone = document.getElementById("image-converter-drop-zone");
  const selectedFileName = document.getElementById("image-converter-selected-file");
  const formatRadios = Array.from(document.querySelectorAll('input[name="image-output-format"]'));
  const maxEdgeSelect = document.getElementById("image-converter-max-edge");
  const targetSizeInput = document.getElementById("image-converter-target-size");
  const targetSizeHelp = document.getElementById("image-converter-target-help");
  const filenameInput = document.getElementById("image-converter-filename");
  const qualityInput = document.getElementById("image-converter-quality");
  const qualityValue = document.getElementById("image-converter-quality-value");
  const backgroundSelect = document.getElementById("image-converter-background");
  const convertButton = document.getElementById("image-convert-button");
  const downloadButton = document.getElementById("image-converter-download");
  const messageBox = document.getElementById("image-converter-message");
  const originalPreview = document.getElementById("image-converter-original-preview");
  const originalPlaceholder = document.getElementById("image-converter-original-placeholder");
  const outputPreview = document.getElementById("image-converter-output-preview");
  const outputPlaceholder = document.getElementById("image-converter-output-placeholder");
  const summaryOriginal = document.getElementById("image-converter-summary-original");
  const summaryOutput = document.getElementById("image-converter-summary-output");
  const summaryFile = document.getElementById("image-converter-summary-file");
  const summaryDimensions = document.getElementById("image-converter-summary-dimensions");

  if (!fileInput || !dropZone) {
    return;
  }

  let sourceFile;
  let sourceImage;
  let sourceSvgText = "";
  let sourceObjectUrl;
  let outputObjectUrl;
  let outputExtension = "jpg";
  let backgroundWasForcedForJpeg = false;
  let conversionTimer;
  let conversionToken = 0;

  function setMessage(text, kind) {
    if (!text) {
      messageBox.className = "alert d-none";
      messageBox.textContent = "";
      return;
    }

    messageBox.className = `alert alert-${kind}`;
    messageBox.textContent = text;
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return "0 KB";
    }

    const units = ["B", "KB", "MB"];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }

    return `${numberFormatter.format(value)} ${units[unitIndex]}`;
  }

  function targetSizeBytes() {
    if (!targetSizeInput || targetSizeInput.disabled) {
      return undefined;
    }

    const rawValue = String(targetSizeInput.value || "").replace(",", ".").trim();

    if (!rawValue) {
      return undefined;
    }

    const kilobytes = Number(rawValue);

    if (!Number.isFinite(kilobytes) || kilobytes <= 0) {
      return NaN;
    }

    return Math.round(kilobytes * 1024);
  }

  function labelForMimeOrName(mimeType, name) {
    const lowerMime = String(mimeType || "").toLowerCase();
    const extension = String(name || "").split(".").pop().toLowerCase();

    if (lowerMime === "image/jpeg" || extension === "jpg" || extension === "jpeg") return "JPEG";
    if (lowerMime === "image/png" || extension === "png") return "PNG";
    if (lowerMime === "image/webp" || extension === "webp") return "WebP";
    if (lowerMime === "image/avif" || extension === "avif") return "AVIF";
    if (lowerMime === "image/gif" || extension === "gif") return "GIF";
    if (lowerMime === "image/bmp" || extension === "bmp") return "BMP";
    if (lowerMime === "image/svg+xml" || extension === "svg") return "SVG";
    if (lowerMime === "image/heic" || extension === "heic") return "HEIC";
    if (lowerMime === "image/heif" || extension === "heif") return "HEIF";
    if (lowerMime === "image/tiff" || extension === "tif" || extension === "tiff") return "TIFF";

    return extension ? extension.toUpperCase() : "Bild";
  }

  function baseNameFromFileName(name) {
    return String(name || "bild")
      .replace(/\.[a-z0-9]{2,6}$/iu, "")
      .trim() || "bild";
  }

  function safeFileName(extension) {
    const baseName = String(filenameInput.value || "")
      .trim()
      .replace(/\.[a-z0-9]{2,6}$/iu, "")
      .replace(/[<>:"/\\|?*\u0000-\u001f]+/gu, "-")
      .replace(/\s+/gu, "-")
      .replace(/-+/gu, "-")
      .replace(/^-|-$/gu, "");

    return `${baseName || "bild-konvertiert"}.${extension}`;
  }

  function isSvgFile(file) {
    return file && (file.type === "image/svg+xml" || /\.svg$/iu.test(file.name));
  }

  function isHeicFile(file) {
    return file && (/^image\/(heic|heif)$/iu.test(file.type) || /\.(heic|heif)$/iu.test(file.name));
  }

  function isImageFile(file) {
    if (!file) return false;
    return String(file.type || "").startsWith("image/") || commonImageExtension.test(file.name);
  }

  function minifySvgText(svgText) {
    return String(svgText || "")
      .replace(/<!--([\s\S]*?)-->/gu, "")
      .replace(/>\s+</gu, "><")
      .trim();
  }

  async function browserReadableBlobFor(file) {
    if (!isHeicFile(file)) {
      return file;
    }

    if (typeof window.heic2any !== "function") {
      throw new Error("HEIC-Unterstützung konnte nicht geladen werden.");
    }

    const converted = await window.heic2any({
      blob: file,
      toType: "image/png",
      quality: 1
    });
    const blob = Array.isArray(converted) ? converted[0] : converted;

    if (!(blob instanceof Blob)) {
      throw new Error("HEIC konnte nicht gelesen werden.");
    }

    return blob;
  }

  function isOutputMimeSupported(mimeType) {
    if (mimeType === "image/svg+xml") {
      return Boolean(sourceSvgText);
    }

    if (mimeType === "image/png") {
      return true;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL(mimeType).startsWith(`data:${mimeType}`);
  }

  function selectedOutputFormat() {
    const selectedRadio = formatRadios.find((radio) => radio.checked && !radio.disabled);
    const fallbackRadio = formatRadios.find((radio) => !radio.disabled);
    const mimeType = (selectedRadio || fallbackRadio || formatRadios[0]).value;
    return outputFormats.find((format) => format.mime === mimeType) || outputFormats[0];
  }

  function updateDownloadName() {
    const fileName = safeFileName(outputExtension);

    if (downloadButton.href) {
      downloadButton.download = fileName;
    }

    if (!downloadButton.classList.contains("d-none")) {
      summaryFile.textContent = fileName;
    }
  }

  function updateFormatSupport() {
    formatRadios.forEach((radio) => {
      const format = outputFormats.find((item) => item.mime === radio.value);
      const isSupported = format ? isOutputMimeSupported(format.mime) : false;
      const choice = radio.closest(".format-choice");

      radio.disabled = !isSupported;
      if (choice) {
        choice.classList.toggle("is-disabled", !isSupported);
        choice.title = isSupported ? "" : (format && format.svgOnly ? "Nur für SVG-Dateien" : "In diesem Browser nicht verfügbar");
      }
    });

    if (!formatRadios.some((radio) => radio.checked && !radio.disabled)) {
      const firstSupported = formatRadios.find((radio) => !radio.disabled);
      if (firstSupported) firstSupported.checked = true;
    }
  }

  function updateFormatControls() {
    updateFormatSupport();

    const format = selectedOutputFormat();
    const min = Number(qualityInput.min);
    const max = Number(qualityInput.max);
    const value = Number(qualityInput.value);
    const progress = ((value - min) / (max - min)) * 100;
    const transparentOption = backgroundSelect.querySelector('option[value="transparent"]');

    maxEdgeSelect.disabled = Boolean(format.svgOnly);
    backgroundSelect.disabled = Boolean(format.svgOnly);

    if (targetSizeInput) {
      targetSizeInput.disabled = Boolean(format.svgOnly);
    }

    if (transparentOption) {
      transparentOption.disabled = format.mime === "image/jpeg";
    }

    if (format.mime === "image/jpeg" && backgroundSelect.value === "transparent") {
      backgroundSelect.value = "#ffffff";
      backgroundWasForcedForJpeg = true;
    } else if (format.mime !== "image/jpeg" && !format.svgOnly && backgroundWasForcedForJpeg) {
      backgroundSelect.value = "transparent";
      backgroundWasForcedForJpeg = false;
    }

    qualityInput.disabled = !format.lossy || Boolean(format.svgOnly);
    const hasTargetSize = Boolean(targetSizeInput && String(targetSizeInput.value || "").trim() && !targetSizeInput.disabled);
    qualityValue.textContent = format.lossy && !format.svgOnly
      ? `${hasTargetSize ? "bis " : ""}${qualityInput.value} %`
      : "verlustfrei";
    qualityInput.style.setProperty("--range-progress", `${Math.min(Math.max(progress, 0), 100)}%`);

    if (targetSizeHelp) {
      targetSizeHelp.textContent = format.svgOnly
        ? "Für SVG wird die Datei bereinigt, aber nicht auf eine Zielgröße gerastert."
        : "Optional. Qualität und Abmessungen werden bei Bedarf automatisch reduziert.";
    }
  }

  function resetOutput() {
    if (outputObjectUrl) {
      URL.revokeObjectURL(outputObjectUrl);
      outputObjectUrl = undefined;
    }

    outputPreview.removeAttribute("src");
    outputPreview.classList.add("d-none");
    outputPlaceholder.classList.remove("d-none");
    downloadButton.removeAttribute("href");
    downloadButton.classList.add("d-none");
    summaryOutput.textContent = "-";
    summaryFile.textContent = "-";
  }

  function resetSelection() {
    conversionToken += 1;
    window.clearTimeout(conversionTimer);
    resetOutput();

    if (sourceObjectUrl) {
      URL.revokeObjectURL(sourceObjectUrl);
      sourceObjectUrl = undefined;
    }

    sourceFile = undefined;
    sourceImage = undefined;
    sourceSvgText = "";
    selectedFileName.textContent = "Noch keine Datei ausgewählt";
    originalPreview.removeAttribute("src");
    originalPreview.classList.add("d-none");
    originalPlaceholder.classList.remove("d-none");
    summaryOriginal.textContent = "-";
    summaryDimensions.textContent = "-";
    convertButton.disabled = true;
    convertButton.textContent = "Konvertieren";
    updateFormatControls();
  }

  async function loadImage(file) {
    const readableBlob = await browserReadableBlobFor(file);

    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(readableBlob);
      const image = new Image();

      image.onload = () => {
        resolve({ image, url });
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Dieses Bildformat kann nicht gelesen werden."));
      };
      image.src = url;
    });
  }

  function dimensionsFor(image) {
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const maxEdge = Number(maxEdgeSelect.value);

    if (!maxEdge || Math.max(sourceWidth, sourceHeight) <= maxEdge) {
      return {
        width: sourceWidth,
        height: sourceHeight
      };
    }

    const scale = maxEdge / Math.max(sourceWidth, sourceHeight);
    return {
      width: Math.max(1, Math.round(sourceWidth * scale)),
      height: Math.max(1, Math.round(sourceHeight * scale))
    };
  }

  function canvasToBlob(canvas, mimeType, quality) {
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
            return;
          }

          reject(new Error("Das Bild konnte nicht erstellt werden."));
        }, mimeType, quality);
      } catch (error) {
        reject(error);
      }
    });
  }

  function warningTextFor(file, blobSize, outputInfo) {
    const warnings = [];

    if (/\.gif$/iu.test(file.name)) {
      warnings.push("GIF wurde als Einzelbild exportiert.");
    }

    if (outputInfo && outputInfo.targetBytes && blobSize > outputInfo.targetBytes) {
      warnings.push(`Die Zielgröße ${formatBytes(outputInfo.targetBytes)} konnte nicht ganz erreicht werden.`);
    }

    if (outputInfo && outputInfo.targetUnsupported) {
      warnings.push("Die Zielgröße kann für SVG nicht automatisch erzwungen werden.");
    }

    if (blobSize > file.size && !(outputInfo && outputInfo.targetBytes)) {
      warnings.push("Ergebnis ist größer als das Original.");
    }

    return warnings.join(" ");
  }

  function showOutputBlob(blob, format, dimensionsText, outputInfo) {
    outputExtension = format.extension;
    outputObjectUrl = URL.createObjectURL(blob);

    outputPreview.src = outputObjectUrl;
    outputPreview.classList.remove("d-none");
    outputPlaceholder.classList.add("d-none");

    downloadButton.href = outputObjectUrl;
    downloadButton.classList.remove("d-none");
    updateDownloadName();

    const qualitySuffix = outputInfo && format.lossy && Number.isFinite(outputInfo.quality)
      ? `, ${Math.round(outputInfo.quality * 100)} %`
      : "";

    summaryOutput.textContent = `${formatBytes(blob.size)} (${format.label}${qualitySuffix})`;
    summaryDimensions.textContent = dimensionsText;
  }

  function drawImageToCanvas(image, dimensions, format, background) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Ihr Browser kann das Bild nicht verarbeiten.");
    }

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    if (format.mime === "image/jpeg" || background !== "transparent") {
      context.fillStyle = background === "transparent" ? "#ffffff" : background;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    context.drawImage(image, 0, 0, dimensions.width, dimensions.height);
    return canvas;
  }

  function scaledDimensions(dimensions, scale) {
    return {
      width: Math.max(1, Math.round(dimensions.width * scale)),
      height: Math.max(1, Math.round(dimensions.height * scale))
    };
  }

  async function encodeCanvasForTarget(canvas, format, quality, targetBytes) {
    if (!targetBytes || !format.lossy) {
      const blob = await canvasToBlob(canvas, format.mime, format.lossy ? quality : undefined);

      return {
        blob,
        quality: format.lossy ? quality : undefined
      };
    }

    const minQuality = Number(qualityInput.min) / 100;
    const maxQuality = Math.max(minQuality, quality);
    const maxQualityBlob = await canvasToBlob(canvas, format.mime, maxQuality);

    if (maxQualityBlob.size <= targetBytes) {
      return {
        blob: maxQualityBlob,
        quality: maxQuality
      };
    }

    let bestBlob = await canvasToBlob(canvas, format.mime, minQuality);

    if (bestBlob.size > targetBytes) {
      return {
        blob: bestBlob,
        quality: minQuality
      };
    }

    let low = minQuality;
    let high = maxQuality;
    let bestQuality = minQuality;

    for (let index = 0; index < 6; index += 1) {
      const nextQuality = (low + high) / 2;
      const blob = await canvasToBlob(canvas, format.mime, nextQuality);

      if (blob.size <= targetBytes) {
        bestBlob = blob;
        bestQuality = nextQuality;
        low = nextQuality;
      } else {
        high = nextQuality;
      }
    }

    return {
      blob: bestBlob,
      quality: bestQuality
    };
  }

  async function createRasterOutput(image, format, initialDimensions, background, quality, targetBytes) {
    let dimensions = { ...initialDimensions };
    let bestOutput;

    for (let attempt = 0; attempt < 7; attempt += 1) {
      const canvas = drawImageToCanvas(image, dimensions, format, background);
      const output = await encodeCanvasForTarget(canvas, format, quality, targetBytes);
      const outputWithDimensions = {
        ...output,
        dimensions,
        targetBytes,
        targetMatched: !targetBytes || output.blob.size <= targetBytes
      };

      if (!bestOutput || output.blob.size < bestOutput.blob.size) {
        bestOutput = outputWithDimensions;
      }

      if (!targetBytes || output.blob.size <= targetBytes) {
        return outputWithDimensions;
      }

      const scale = Math.min(0.9, Math.max(0.45, Math.sqrt(targetBytes / output.blob.size) * 0.95));
      const nextDimensions = scaledDimensions(dimensions, scale);

      if (
        nextDimensions.width === dimensions.width ||
        nextDimensions.height === dimensions.height ||
        nextDimensions.width < 24 ||
        nextDimensions.height < 24
      ) {
        break;
      }

      dimensions = nextDimensions;
    }

    return bestOutput;
  }

  async function convertImage() {
    if (!sourceFile || !sourceImage) {
      setMessage("Bitte zuerst ein Bild auswählen.", "warning");
      return;
    }

    updateFormatControls();

    const token = conversionToken + 1;
    conversionToken = token;
    const currentFile = sourceFile;
    const currentImage = sourceImage;
    const format = selectedOutputFormat();
    const quality = Number(qualityInput.value) / 100;
    const targetBytes = targetSizeBytes();
    const outputDimensions = dimensionsFor(currentImage);
    const background = backgroundSelect.value;

    if (Number.isNaN(targetBytes) || (targetBytes && targetBytes < 10 * 1024)) {
      resetOutput();
      setMessage("Bitte geben Sie eine Zielgröße ab 10 KB ein.", "warning");
      return;
    }

    if (!isOutputMimeSupported(format.mime)) {
      resetOutput();
      setMessage("Dieses Ausgabeformat ist in Ihrem Browser nicht verfügbar.", "warning");
      return;
    }

    convertButton.disabled = true;
    convertButton.textContent = "Wird verarbeitet";
    setMessage("", "info");
    resetOutput();

    try {
      if (format.svgOnly) {
        const blob = new Blob([minifySvgText(sourceSvgText)], { type: "image/svg+xml" });
        const dimensionsText = `${outputDimensions.width} x ${outputDimensions.height} px`;
        const outputInfo = {
          targetBytes,
          targetUnsupported: Boolean(targetBytes),
          targetMatched: !targetBytes || blob.size <= targetBytes
        };

        if (token !== conversionToken || currentImage !== sourceImage || currentFile !== sourceFile) {
          return;
        }

        showOutputBlob(blob, format, dimensionsText, outputInfo);
        setMessage(warningTextFor(currentFile, blob.size, outputInfo), "warning");
        return;
      }

      const output = await createRasterOutput(currentImage, format, outputDimensions, background, quality, targetBytes);
      const blob = output.blob;
      const dimensionsText = `${output.dimensions.width} x ${output.dimensions.height} px`;

      if (token !== conversionToken || currentImage !== sourceImage || currentFile !== sourceFile) {
        return;
      }

      if (blob.type && blob.type !== format.mime) {
        throw new Error("Dieses Ausgabeformat ist in Ihrem Browser nicht verfügbar.");
      }

      showOutputBlob(blob, format, dimensionsText, output);
      setMessage(warningTextFor(currentFile, blob.size, output), "warning");
    } catch (error) {
      if (token === conversionToken) {
        resetOutput();
        setMessage(error.message || "Das Bild konnte nicht verarbeitet werden.", "danger");
      }
    } finally {
      if (token === conversionToken) {
        convertButton.disabled = false;
        convertButton.textContent = "Neu konvertieren";
      }
    }
  }

  function scheduleConversion() {
    updateFormatControls();

    if (!sourceFile || !sourceImage) {
      return;
    }

    window.clearTimeout(conversionTimer);
    conversionTimer = window.setTimeout(convertImage, 300);
  }

  async function handleFile(file) {
    resetSelection();
    updateFormatControls();

    if (!file) {
      setMessage("", "info");
      return;
    }

    if (!isImageFile(file)) {
      setMessage("Bitte wählen Sie eine Bilddatei aus.", "warning");
      return;
    }

    if (file.size > maxFileBytes) {
      setMessage(`Die Datei ist größer als ${formatBytes(maxFileBytes)}.`, "warning");
      return;
    }

    const token = conversionToken;
    selectedFileName.textContent = `${file.name} (${formatBytes(file.size)})`;

    try {
      const svgText = isSvgFile(file) ? await file.text() : "";
      const loaded = await loadImage(file);

      if (token !== conversionToken) {
        URL.revokeObjectURL(loaded.url);
        return;
      }

      const width = loaded.image.naturalWidth || loaded.image.width;
      const height = loaded.image.naturalHeight || loaded.image.height;

      if (!width || !height) {
        URL.revokeObjectURL(loaded.url);
        throw new Error("Die Bildgröße konnte nicht erkannt werden.");
      }

      if (width * height > maxPixels) {
        URL.revokeObjectURL(loaded.url);
        throw new Error("Das Bild ist zu groß für die Verarbeitung im Browser.");
      }

      sourceFile = file;
      sourceImage = loaded.image;
      sourceSvgText = svgText;
      sourceObjectUrl = loaded.url;
      originalPreview.src = sourceObjectUrl;
      originalPreview.classList.remove("d-none");
      originalPlaceholder.classList.add("d-none");
      summaryOriginal.textContent = `${formatBytes(file.size)} (${labelForMimeOrName(file.type, file.name)})`;
      summaryDimensions.textContent = `${width} x ${height} px`;
      filenameInput.value = `${baseNameFromFileName(file.name)}-konvertiert`;
      convertButton.disabled = false;
      setMessage("", "info");
      updateFormatControls();

      await convertImage();
    } catch (error) {
      resetSelection();
      setMessage(error.message || "Das Bild konnte nicht gelesen werden.", "danger");
    }
  }

  fileInput.addEventListener("change", () => {
    handleFile(fileInput.files[0]);
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add("is-dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.remove("is-dragover");
    });
  });

  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  });

  formatRadios.forEach((radio) => {
    radio.addEventListener("change", scheduleConversion);
  });

  maxEdgeSelect.addEventListener("change", scheduleConversion);
  if (targetSizeInput) {
    targetSizeInput.addEventListener("input", scheduleConversion);
  }
  backgroundSelect.addEventListener("change", () => {
    backgroundWasForcedForJpeg = false;
    scheduleConversion();
  });

  qualityInput.addEventListener("input", scheduleConversion);
  filenameInput.addEventListener("input", updateDownloadName);
  convertButton.addEventListener("click", convertImage);

  window.addEventListener("beforeunload", () => {
    if (sourceObjectUrl) URL.revokeObjectURL(sourceObjectUrl);
    if (outputObjectUrl) URL.revokeObjectURL(outputObjectUrl);
  });

  updateFormatSupport();
  updateFormatControls();
})();
