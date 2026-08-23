(function () {
  "use strict";

  const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxFileBytes = 25 * 1024 * 1024;
  const maxPixels = 50 * 1000 * 1000;
  const numberFormatter = new Intl.NumberFormat("de-AT", {
    maximumFractionDigits: 1
  });

  const statusPill = document.getElementById("image-status");
  const statusText = document.getElementById("image-status-text");
  const fileInput = document.getElementById("image-file");
  const dropZone = document.getElementById("image-drop-zone");
  const selectedFileName = document.getElementById("selected-file-name");
  const maxEdgeSelect = document.getElementById("image-max-edge");
  const formatSelect = document.getElementById("image-format");
  const formatHint = document.getElementById("format-hint");
  const qualityInput = document.getElementById("image-quality");
  const qualityValue = document.getElementById("image-quality-value");
  const filenameInput = document.getElementById("image-filename");
  const compressButton = document.getElementById("compress-button");
  const downloadButton = document.getElementById("download-button");
  const messageBox = document.getElementById("image-message");
  const originalPreview = document.getElementById("original-preview");
  const originalPlaceholder = document.getElementById("original-placeholder");
  const outputPreview = document.getElementById("output-preview");
  const outputPlaceholder = document.getElementById("output-placeholder");
  const summaryOriginalSize = document.getElementById("summary-original-size");
  const summaryOutputSize = document.getElementById("summary-output-size");
  const summarySavings = document.getElementById("summary-savings");
  const summaryDimensions = document.getElementById("summary-dimensions");
  const sizeMeterFill = document.getElementById("size-meter-fill");

  const formatHints = {
    "image/jpeg": "JPG eignet sich meist gut für Fotos. Transparente Bereiche werden weiß.",
    "image/webp": "WebP ist oft kleiner und kann Transparenz erhalten.",
    "image/png": "PNG bleibt verlustfrei, ist aber oft größer."
  };

  let sourceFile;
  let sourceImage;
  let sourceObjectUrl;
  let outputObjectUrl;
  let compressionTimer;
  let compressionToken = 0;

  function setStatus(kind, text) {
    statusPill.classList.remove("is-loading", "is-ready", "is-error");
    statusPill.classList.add(kind);
    statusText.textContent = text;

    const spinner = statusPill.querySelector(".spinner-border");
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

  function isSupportedImageFile(file) {
    if (!file) return false;
    const lowerName = file.name.toLowerCase();
    return supportedTypes.includes(file.type) || /\.(jpe?g|png|webp)$/u.test(lowerName);
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
    summaryOutputSize.textContent = "-";
    summarySavings.textContent = "-";
    sizeMeterFill.style.width = "0%";
    sizeMeterFill.classList.remove("is-warning");
  }

  function resetSelection() {
    compressionToken += 1;
    window.clearTimeout(compressionTimer);
    resetOutput();

    if (sourceObjectUrl) {
      URL.revokeObjectURL(sourceObjectUrl);
      sourceObjectUrl = undefined;
    }

    sourceFile = undefined;
    sourceImage = undefined;
    selectedFileName.textContent = "Noch keine Datei ausgewählt";
    originalPreview.removeAttribute("src");
    originalPreview.classList.add("d-none");
    originalPlaceholder.classList.remove("d-none");
    summaryOriginalSize.textContent = "-";
    summaryDimensions.textContent = "-";
    compressButton.disabled = true;
    compressButton.innerHTML = '<i class="bi bi-file-earmark-arrow-down me-1"></i> Bild komprimieren';
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        resolve({ image, url });
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Das Bild konnte nicht gelesen werden."));
      };
      image.src = url;
    });
  }

  function baseNameFromFileName(name) {
    return String(name || "bild")
      .replace(/\.[a-z0-9]{2,5}$/iu, "")
      .trim() || "bild";
  }

  function safeFileName(extension) {
    const baseName = String(filenameInput.value || "")
      .trim()
      .replace(/\.[a-z0-9]{2,5}$/iu, "")
      .replace(/[<>:"/\\|?*\u0000-\u001f]+/gu, "-")
      .replace(/\s+/gu, "-")
      .replace(/-+/gu, "-")
      .replace(/^-|-$/gu, "");

    return `${baseName || "bild-komprimiert"}.${extension}`;
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

  function isMimeSupported(mimeType) {
    if (mimeType === "image/png") {
      return true;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL(mimeType).startsWith(`data:${mimeType}`);
  }

  function extensionForMime(mimeType) {
    if (mimeType === "image/webp") return "webp";
    if (mimeType === "image/png") return "png";
    return "jpg";
  }

  function labelForMime(mimeType) {
    if (mimeType === "image/webp") return "WebP";
    if (mimeType === "image/png") return "PNG";
    return "JPG";
  }

  function canvasToBlob(canvas, mimeType, quality) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, mimeType, mimeType === "image/png" ? undefined : quality);
    });
  }

  function setSavingsMeter(originalBytes, outputBytes) {
    if (!originalBytes || !outputBytes) {
      sizeMeterFill.style.width = "0%";
      sizeMeterFill.classList.remove("is-warning");
      return;
    }

    const ratio = Math.min((outputBytes / originalBytes) * 100, 100);
    sizeMeterFill.style.width = `${ratio}%`;
    sizeMeterFill.classList.toggle("is-warning", outputBytes > originalBytes);
  }

  function savingsText(originalBytes, outputBytes) {
    if (!originalBytes || !outputBytes) {
      return "-";
    }

    const difference = originalBytes - outputBytes;
    const percent = Math.round((Math.abs(difference) / originalBytes) * 100);

    if (difference > 0) {
      return `${percent} % kleiner`;
    }

    if (difference < 0) {
      return `${percent} % größer`;
    }

    return "Keine Änderung";
  }

  function updateFormatControls() {
    const selectedFormat = formatSelect.value;
    const isPng = selectedFormat === "image/png";

    formatHint.textContent = formatHints[selectedFormat] || "";
    qualityInput.disabled = isPng;
    qualityValue.textContent = isPng ? "verlustfrei" : `${qualityInput.value} %`;
  }

  async function compressImage() {
    if (!sourceFile || !sourceImage) {
      setMessage("Bitte zuerst ein Bild auswählen.", "warning");
      return;
    }

    const token = compressionToken + 1;
    compressionToken = token;
    const currentImage = sourceImage;
    const currentFile = sourceFile;
    const mimeType = formatSelect.value;
    const quality = Number(qualityInput.value) / 100;
    const outputDimensions = dimensionsFor(currentImage);

    if (!isMimeSupported(mimeType)) {
      resetOutput();
      setStatus("is-error", "Format nicht verfügbar");
      setMessage("Dieses Ausgabeformat wird von Ihrem Browser nicht unterstützt.", "danger");
      return;
    }

    compressButton.disabled = true;
    compressButton.innerHTML = '<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span> Wird verarbeitet';
    setStatus("is-loading", "Wird komprimiert");
    setMessage("", "info");
    resetOutput();

    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Ihr Browser kann das Bild nicht verarbeiten.");
      }

      canvas.width = outputDimensions.width;
      canvas.height = outputDimensions.height;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      if (mimeType === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      context.drawImage(currentImage, 0, 0, outputDimensions.width, outputDimensions.height);

      const blob = await canvasToBlob(canvas, mimeType, quality);

      if (token !== compressionToken || currentImage !== sourceImage || currentFile !== sourceFile) {
        return;
      }

      if (!blob) {
        throw new Error("Das Bild konnte nicht erstellt werden.");
      }

      const actualMimeType = blob.type || mimeType;
      const extension = extensionForMime(actualMimeType);
      outputObjectUrl = URL.createObjectURL(blob);

      outputPreview.src = outputObjectUrl;
      outputPreview.classList.remove("d-none");
      outputPlaceholder.classList.add("d-none");

      downloadButton.href = outputObjectUrl;
      downloadButton.download = safeFileName(extension);
      downloadButton.classList.remove("d-none");

      summaryOutputSize.textContent = `${formatBytes(blob.size)} (${labelForMime(actualMimeType)})`;
      summarySavings.textContent = savingsText(currentFile.size, blob.size);
      summaryDimensions.textContent = `${outputDimensions.width} x ${outputDimensions.height} px`;
      setSavingsMeter(currentFile.size, blob.size);

      if (blob.size <= currentFile.size) {
        setMessage("Das Bild wurde erfolgreich komprimiert.", "success");
      } else {
        setMessage("Das Ergebnis ist größer als die Originaldatei. Wählen Sie ein anderes Format oder eine niedrigere Qualität.", "warning");
      }

      setStatus("is-ready", "Bereit");
    } catch (error) {
      if (token === compressionToken) {
        resetOutput();
        setStatus("is-error", "Fehler");
        setMessage(error.message || "Das Bild konnte nicht verarbeitet werden.", "danger");
      }
    } finally {
      if (token === compressionToken) {
        compressButton.disabled = false;
        compressButton.innerHTML = '<i class="bi bi-file-earmark-arrow-down me-1"></i> Neu komprimieren';
      }
    }
  }

  function scheduleCompression() {
    updateFormatControls();

    if (!sourceFile || !sourceImage) {
      return;
    }

    window.clearTimeout(compressionTimer);
    compressionTimer = window.setTimeout(compressImage, 350);
  }

  async function handleFile(file) {
    resetSelection();

    if (!file) {
      setStatus("is-ready", "Bereit");
      setMessage("", "info");
      return;
    }

    if (!isSupportedImageFile(file)) {
      setStatus("is-error", "Nicht unterstützt");
      setMessage("Bitte wählen Sie ein JPG-, PNG- oder WebP-Bild aus.", "warning");
      return;
    }

    if (file.size > maxFileBytes) {
      setStatus("is-error", "Datei zu groß");
      setMessage(`Die Datei ist größer als ${formatBytes(maxFileBytes)}. Bitte wählen Sie ein kleineres Bild.`, "warning");
      return;
    }

    setStatus("is-loading", "Bild wird gelesen");
    selectedFileName.textContent = `${file.name} (${formatBytes(file.size)})`;

    try {
      const loaded = await loadImage(file);
      const width = loaded.image.naturalWidth || loaded.image.width;
      const height = loaded.image.naturalHeight || loaded.image.height;

      if (!width || !height) {
        URL.revokeObjectURL(loaded.url);
        throw new Error("Die Bildgröße konnte nicht erkannt werden.");
      }

      if (width * height > maxPixels) {
        URL.revokeObjectURL(loaded.url);
        throw new Error("Das Bild ist sehr groß und kann im Browser nicht zuverlässig verarbeitet werden.");
      }

      sourceFile = file;
      sourceImage = loaded.image;
      sourceObjectUrl = loaded.url;
      originalPreview.src = sourceObjectUrl;
      originalPreview.classList.remove("d-none");
      originalPlaceholder.classList.add("d-none");
      summaryOriginalSize.textContent = formatBytes(file.size);
      summaryDimensions.textContent = `${width} x ${height} px`;
      filenameInput.value = `${baseNameFromFileName(file.name)}-komprimiert`;
      compressButton.disabled = false;
      setStatus("is-ready", "Bereit");
      setMessage("", "info");

      await compressImage();
    } catch (error) {
      resetSelection();
      setStatus("is-error", "Fehler");
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

  [maxEdgeSelect, formatSelect].forEach((input) => {
    input.addEventListener("change", scheduleCompression);
  });

  qualityInput.addEventListener("input", scheduleCompression);
  compressButton.addEventListener("click", compressImage);

  window.addEventListener("beforeunload", () => {
    if (sourceObjectUrl) URL.revokeObjectURL(sourceObjectUrl);
    if (outputObjectUrl) URL.revokeObjectURL(outputObjectUrl);
  });

  updateFormatControls();
})();
