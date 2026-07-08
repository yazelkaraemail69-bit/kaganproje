const MAX_IMAGES = 10;

const state = {
  workflow: null,
  selectedModel: null,
  images: [],
  pdfFile: null,
  pdfPageCount: 0,
  editedText: "",
  translatedText: "",
  skippedTranslation: false,
};

const WORKFLOW_META = {
  handwriting: {
    subtitle: "El yazisini dijital metne cevirin ve farkli dosya turlerine aktarin.",
    step1Label: "1. Fotograf",
    step3Hint: "Isterseniz metni baska bir dile cevirin veya atlayin.",
    step2Hint: "Tarama sonucunu kontrol edip duzeltin.",
    exportTitle: "El Yazisi Cevirmen",
    exportFilename: "el-yazisi",
  },
  "pdf-translate": {
    subtitle: "PDF dosyanizi baska bir dile cevirin.",
    step1Label: "1. PDF",
    step3Hint: "PDF icerigini hedef dile cevirin.",
    step2Hint: "PDF'den cikarilan metni kontrol edip duzeltin.",
    exportTitle: "PDF Cevirisi",
    exportFilename: "pdf-cevirisi",
  },
};

function getSelectedModel() {
  return document.getElementById("ai-model")?.value || state.selectedModel || window.APP_CONFIG?.defaultModel;
}

function initModelPicker() {
  const select = document.getElementById("ai-model");
  const hint = document.getElementById("model-hint");
  const models = window.APP_CONFIG?.models ?? [];

  if (!select) return;

  select.innerHTML = "";
  for (const model of models) {
    const option = document.createElement("option");
    option.value = model.id;
    option.textContent = model.label;
    select.appendChild(option);
  }

  const defaultModel = window.APP_CONFIG?.defaultModel ?? models[0]?.id;
  if (defaultModel) {
    select.value = defaultModel;
    state.selectedModel = defaultModel;
  }

  function updateHint() {
    const current = models.find((m) => m.id === select.value);
    if (hint) hint.textContent = current?.hint ?? "";
    state.selectedModel = select.value;
  }

  select.addEventListener("change", updateHint);
  updateHint();
}

function getSecret() {
  return window.APP_CONFIG?.sharedSecret ?? "";
}

async function apiPost(path, body) {
  let response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-app-secret": getSecret(),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Sunucuya baglanilamadi. Backend calisiyor mu? PowerShell'de: cd backend → npm run dev"
    );
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error ?? `Istek basarisiz (HTTP ${response.status})`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return data;
}

function showStep(step) {
  document.querySelectorAll(".step-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.step === String(step));
  });
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `step-${step}`);
  });

  const stepsNav = document.getElementById("steps-nav");
  if (step === 0) {
    stepsNav.classList.add("hidden");
  } else {
    stepsNav.classList.remove("hidden");
  }
}

function setStatus(id, message, isError = false) {
  const el = document.getElementById(id);
  if (!message) {
    el.hidden = true;
    el.textContent = "";
    return;
  }
  el.hidden = false;
  el.textContent = message;
  el.classList.toggle("error", isError);
}

async function checkServerSetup() {
  const setupBanner = document.getElementById("setup-banner");
  const serverBanner = document.getElementById("server-banner");

  try {
    const response = await fetch("/health");
    if (!response.ok) throw new Error("health failed");
    const data = await response.json();
    if (serverBanner) serverBanner.classList.add("hidden");
    if (setupBanner) {
      setupBanner.classList.toggle("hidden", data.openRouterConfigured !== false);
    }
  } catch {
    if (serverBanner) serverBanner.classList.remove("hidden");
    if (setupBanner) setupBanner.classList.add("hidden");
  }
}

function updateWorkflowUI() {
  const meta = WORKFLOW_META[state.workflow];
  if (!meta) return;

  document.getElementById("header-subtitle").textContent = meta.subtitle;
  document.getElementById("step2-hint").textContent = meta.step2Hint;
  document.getElementById("step3-hint").textContent = meta.step3Hint;

  const step1Tab = document.querySelector('.step-tab[data-step="1"]');
  if (step1Tab) step1Tab.textContent = meta.step1Label;

  const isHandwriting = state.workflow === "handwriting";
  document.getElementById("upload-handwriting").hidden = !isHandwriting;
  document.getElementById("upload-pdf").hidden = isHandwriting;
  document.getElementById("skip-translate-btn").hidden = !isHandwriting;
}

function selectWorkflow(workflow) {
  state.workflow = workflow;
  state.skippedTranslation = false;
  updateWorkflowUI();
  showStep(1);
}

const OCR_MAX_DIMENSION = 2000;
const OCR_JPEG_QUALITY = 0.92;

function enhanceContrast(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const contrast = 1.35;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    let enhanced = (gray - 128) * contrast + 128;
    enhanced = Math.max(0, Math.min(255, enhanced));
    data[i] = data[i + 1] = data[i + 2] = enhanced;
  }

  ctx.putImageData(imageData, 0, 0);
}

function resizeImage(file, maxWidth = OCR_MAX_DIMENSION) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Goruntu islenemedi."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        enhanceContrast(ctx, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", OCR_JPEG_QUALITY);
        const base64 = dataUrl.split(",")[1];
        resolve({ base64, mimeType: "image/jpeg", previewUrl: dataUrl });
      };
      img.onerror = () => reject(new Error("Goruntu yuklenemedi."));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Dosya okunamadi."));
    reader.readAsDataURL(file);
  });
}

function showEditPreview(images) {
  const wrap = document.getElementById("edit-preview-wrap");
  const grid = document.getElementById("edit-preview-grid");
  if (!wrap || !grid) return;

  if (images?.length && state.workflow === "handwriting") {
    grid.innerHTML = images
      .map(
        (img, i) =>
          `<div class="preview-thumb"><span class="preview-thumb-num">${i + 1}</span><img src="${img.previewUrl}" alt="Sayfa ${i + 1}" /></div>`
      )
      .join("");
    wrap.classList.remove("hidden");
  } else {
    grid.innerHTML = "";
    wrap.classList.add("hidden");
  }
}

function renderImagePreviews() {
  const grid = document.getElementById("preview-grid");
  const placeholder = document.getElementById("preview-placeholder");
  const countEl = document.getElementById("image-count");
  const clearBtn = document.getElementById("clear-images-btn");
  const box = document.getElementById("preview-box");

  if (!grid || !placeholder) return;

  if (state.images.length === 0) {
    grid.hidden = true;
    grid.innerHTML = "";
    placeholder.hidden = false;
    box.classList.add("empty");
    if (countEl) countEl.hidden = true;
    if (clearBtn) clearBtn.hidden = true;
    const scanBtn = document.getElementById("ocr-btn");
    if (scanBtn) scanBtn.disabled = true;
    return;
  }

  placeholder.hidden = true;
  box.classList.remove("empty");
  grid.hidden = false;
  grid.innerHTML = state.images
    .map(
      (img, i) =>
        `<div class="preview-thumb"><span class="preview-thumb-num">${i + 1}</span><img src="${img.previewUrl}" alt="${escapeHtml(img.name)}" /></div>`
    )
    .join("");

  if (countEl) {
    countEl.hidden = false;
    countEl.textContent = `${state.images.length} / ${MAX_IMAGES} fotograf`;
  }
  if (clearBtn) clearBtn.hidden = false;
  const scanBtn = document.getElementById("ocr-btn");
  if (scanBtn) scanBtn.disabled = false;
}

async function addImagesFromFiles(fileList) {
  const remaining = MAX_IMAGES - state.images.length;
  if (remaining <= 0) {
    setStatus("step1-status", `En fazla ${MAX_IMAGES} fotograf ekleyebilirsiniz.`, true);
    return;
  }

  const files = Array.from(fileList).slice(0, remaining);
  if (fileList.length > remaining) {
    setStatus("step1-status", `Sadece ilk ${remaining} fotograf eklendi (limit: ${MAX_IMAGES}).`, true);
  } else {
    setStatus("step1-status", "Goruntuler hazirlaniyor...");
  }

  try {
    for (const file of files) {
      const result = await resizeImage(file);
      state.images.push({
        base64: result.base64,
        mimeType: result.mimeType,
        previewUrl: result.previewUrl,
        name: file.name,
      });
    }
    renderImagePreviews();
    if (fileList.length <= remaining) setStatus("step1-status", "");
  } catch (error) {
    setStatus("step1-status", error.message, true);
  }
}

async function extractPdfText(file) {
  if (!window.pdfjsLib) {
    throw new Error("PDF kutuphanesi yuklenemedi. Sayfayi yenileyip tekrar deneyin.");
  }

  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const parts = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ").trim();
    if (pageText) parts.push(pageText);
  }

  const text = parts.join("\n\n").trim();
  if (!text) {
    throw new Error(
      "PDF'den metin cikarilamadi. Dosya taranmis (gorsel) olabilir; el yazisi akisini deneyin."
    );
  }

  return { text, pageCount: pdf.numPages };
}

// --- Akis secimi ---
document.querySelectorAll(".workflow-card").forEach((card) => {
  card.addEventListener("click", () => selectWorkflow(card.dataset.workflow));
});

document.getElementById("back-to-choice-btn").addEventListener("click", () => {
  showStep(0);
});

// --- Model secimi initModelPicker() ile yapilir ---

// --- Adim sekmeleri ---
document.querySelectorAll(".step-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    if (state.workflow) showStep(Number(tab.dataset.step));
  });
});

// --- Fotograf sec (el yazisi) ---
const imageInput = document.getElementById("image-input");
const ocrBtn = document.getElementById("ocr-btn");

document.getElementById("pick-image-btn").addEventListener("click", () => imageInput.click());

document.getElementById("clear-images-btn").addEventListener("click", () => {
  state.images = [];
  imageInput.value = "";
  renderImagePreviews();
  setStatus("step1-status", "");
});

imageInput.addEventListener("change", async () => {
  const files = imageInput.files;
  if (!files?.length) return;
  await addImagesFromFiles(files);
  imageInput.value = "";
});

// --- PDF sec ---
const pdfInput = document.getElementById("pdf-input");
const pdfPreviewBox = document.getElementById("pdf-preview-box");
const pdfPreviewPlaceholder = document.getElementById("pdf-preview-placeholder");
const pdfFileInfo = document.getElementById("pdf-file-info");
const extractPdfBtn = document.getElementById("extract-pdf-btn");

document.getElementById("pick-pdf-btn").addEventListener("click", () => pdfInput.click());

pdfInput.addEventListener("change", () => {
  const file = pdfInput.files?.[0];
  if (!file) return;

  state.pdfFile = file;
  document.getElementById("pdf-file-name").textContent = file.name;
  document.getElementById("pdf-page-count").textContent = "";
  pdfPreviewPlaceholder.hidden = true;
  pdfFileInfo.hidden = false;
  pdfPreviewBox.classList.remove("empty");
  extractPdfBtn.disabled = false;
  setStatus("step1-status", "");
});

// --- OCR (el yazisi) ---
ocrBtn.addEventListener("click", async () => {
  if (state.images.length === 0) return;

  ocrBtn.disabled = true;
  const langHint = document.getElementById("source-lang-hint")?.value || undefined;
  const model = getSelectedModel();
  const textParts = [];

  try {
    for (let i = 0; i < state.images.length; i++) {
      const img = state.images[i];
      setStatus("step1-status", `Metin taraniyor (${i + 1}/${state.images.length})...`);

      const result = await apiPost("/api/ocr", {
        imageBase64: img.base64,
        mimeType: img.mimeType,
        sourceLangHint: langHint || undefined,
        model,
      });

      const header = state.images.length > 1 ? `--- Sayfa ${i + 1} ---\n` : "";
      textParts.push(`${header}${result.text}`);
    }

    const combinedText = textParts.join("\n\n");
    state.editedText = combinedText;
    state.translatedText = "";
    state.skippedTranslation = false;
    document.getElementById("edited-text").value = combinedText;
    showEditPreview(state.images);
    setStatus("step1-status", `${state.images.length} fotograf tarandi.`);
    showStep(2);
  } catch (error) {
    setStatus("step1-status", error.message, true);
  } finally {
    ocrBtn.disabled = false;
  }
});

// --- PDF metin cikarma ---
extractPdfBtn.addEventListener("click", async () => {
  if (!state.pdfFile) return;

  extractPdfBtn.disabled = true;
  setStatus("step1-status", "PDF'den metin cikariliyor...");

  try {
    const result = await extractPdfText(state.pdfFile);
    state.pdfPageCount = result.pageCount;
    state.editedText = result.text;
    state.translatedText = "";
    state.skippedTranslation = false;
    document.getElementById("pdf-page-count").textContent = `${result.pageCount} sayfa`;
    document.getElementById("edited-text").value = result.text;
    showEditPreview(null);
    setStatus("step1-status", `${result.pageCount} sayfadan metin cikarildi.`);
    showStep(2);
  } catch (error) {
    setStatus("step1-status", error.message, true);
  } finally {
    extractPdfBtn.disabled = false;
  }
});

// --- Duzenle -> Cevir ---
document.getElementById("to-translate-btn").addEventListener("click", () => {
  state.editedText = document.getElementById("edited-text").value.trim();
  if (!state.editedText) {
    alert("Lutfen once metni duzenleyin veya yukleyin.");
    return;
  }
  showStep(3);
});

// --- Ceviri ---
const translateBtn = document.getElementById("translate-btn");
const toExportBtn = document.getElementById("to-export-btn");

translateBtn.addEventListener("click", async () => {
  state.editedText = document.getElementById("edited-text").value.trim();
  const sourceLang = document.getElementById("source-lang").value;
  const targetLang = document.getElementById("target-lang").value;

  translateBtn.disabled = true;
  setStatus("step3-status", "Ceviri yapiliyor...");

  try {
    const result = await apiPost("/api/translate", {
      text: state.editedText,
      sourceLang,
      targetLang,
      model: getSelectedModel(),
    });
    state.translatedText = result.translatedText;
    state.skippedTranslation = false;
    document.getElementById("translated-text").textContent = result.translatedText;
    document.getElementById("translation-result").hidden = false;
    toExportBtn.disabled = false;
    setStatus("step3-status", `Tamamlandi (${result.modelLabel ?? result.modelUsed})`);
  } catch (error) {
    setStatus("step3-status", error.message, true);
  } finally {
    translateBtn.disabled = false;
  }
});

document.getElementById("skip-translate-btn").addEventListener("click", () => {
  state.translatedText = "";
  state.skippedTranslation = true;
  document.getElementById("translation-result").hidden = true;
  toExportBtn.disabled = false;
  setStatus("step3-status", "Ceviri atlandi. Metin oldugu gibi disa aktarilacak.");
  goToExport();
});

toExportBtn.addEventListener("click", goToExport);

function goToExport() {
  const meta = WORKFLOW_META[state.workflow];
  const hasTranslation = state.translatedText.length > 0;

  document.getElementById("export-original").textContent = state.editedText;
  document.getElementById("export-translated").textContent = state.translatedText;

  const translatedSection = document.getElementById("export-translated-section");
  translatedSection.hidden = !hasTranslation;

  document.getElementById("export-original-label").textContent =
    state.workflow === "pdf-translate" ? "Orijinal PDF Metni" : "Dijitallestirilmis Metin";
  document.getElementById("export-translated-label").textContent = hasTranslation
    ? "Ceviri"
    : "Ceviri";

  showStep(4);
}

// --- Disa aktarma ---
function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getExportMeta() {
  return WORKFLOW_META[state.workflow] ?? WORKFLOW_META.handwriting;
}

document.getElementById("export-txt-btn").addEventListener("click", () => {
  const meta = getExportMeta();
  const hasTranslation = state.translatedText.length > 0;
  const lines = hasTranslation
    ? ["=== ORIJINAL METIN ===", state.editedText, "", "=== CEVIRI ===", state.translatedText]
    : [state.editedText];
  downloadBlob(`${meta.exportFilename}.txt`, new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }));
});

document.getElementById("export-pdf-btn").addEventListener("click", () => {
  const meta = getExportMeta();
  const hasTranslation = state.translatedText.length > 0;
  const printArea = document.getElementById("print-area");

  let html = `<h1>${escapeHtml(meta.exportTitle)}</h1>`;
  html += `<h2>${state.workflow === "pdf-translate" ? "Orijinal PDF Metni" : "Dijitallestirilmis Metin"}</h2>`;
  html += `<p>${escapeHtml(state.editedText).replace(/\n/g, "<br>")}</p>`;
  if (hasTranslation) {
    html += `<h2>Ceviri</h2><p>${escapeHtml(state.translatedText).replace(/\n/g, "<br>")}</p>`;
  }

  printArea.innerHTML = html;
  printArea.hidden = false;
  window.print();
  printArea.hidden = true;
});

document.getElementById("export-docx-btn").addEventListener("click", async () => {
  const meta = getExportMeta();
  setStatus("step4-status", "DOCX olusturuluyor...");
  try {
    const response = await fetch("/api/export/docx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-app-secret": getSecret(),
      },
      body: JSON.stringify({
        originalText: state.editedText,
        translatedText: state.translatedText,
        title: meta.exportTitle,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "DOCX olusturulamadi.");

    const binary = atob(data.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    downloadBlob(`${meta.exportFilename}.docx`, new Blob([bytes], { type: data.mimeType }));
    setStatus("step4-status", "DOCX indirildi.");
  } catch (error) {
    setStatus("step4-status", error.message, true);
  }
});

document.getElementById("restart-btn").addEventListener("click", () => {
  state.workflow = null;
  state.images = [];
  state.pdfFile = null;
  state.pdfPageCount = 0;
  state.editedText = "";
  state.translatedText = "";
  state.skippedTranslation = false;

  imageInput.value = "";
  pdfInput.value = "";
  renderImagePreviews();
  pdfPreviewPlaceholder.hidden = false;
  pdfFileInfo.hidden = true;
  pdfPreviewBox.classList.add("empty");

  document.getElementById("edited-text").value = "";
  document.getElementById("translation-result").hidden = true;
  document.getElementById("translated-text").textContent = "";
  toExportBtn.disabled = true;
  ocrBtn.disabled = true;
  extractPdfBtn.disabled = true;
  showEditPreview(null);

  ["step1-status", "step3-status", "step4-status"].forEach((id) => setStatus(id, ""));
  showStep(0);
});

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Baslangic
initModelPicker();
showStep(0);
checkServerSetup();
