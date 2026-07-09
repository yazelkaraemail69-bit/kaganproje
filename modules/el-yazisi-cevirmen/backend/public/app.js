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
  updateStep2Layout();
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

function nextImageId() {
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function statusLabel(status) {
  if (status === "scanning") return "Taraniyor...";
  if (status === "done") return "Tamam";
  if (status === "error") return "Hata";
  return "Hazir";
}

function buildPageHeader(index, total) {
  return total > 1 ? `--- Sayfa ${index + 1} ---\n` : "";
}

function syncCombinedText() {
  const parts = state.images
    .map((img, i) => {
      const text = (img.text ?? "").trim();
      if (!text) return "";
      return `${buildPageHeader(i, state.images.length)}${text}`;
    })
    .filter(Boolean);
  state.editedText = parts.join("\n\n");
  const combined = document.getElementById("edited-text");
  if (combined) combined.value = state.editedText;
}

function syncCombinedTranslation() {
  const parts = state.images
    .map((img, i) => {
      const text = (img.translatedText ?? "").trim();
      if (!text) return "";
      return `${buildPageHeader(i, state.images.length)}${text}`;
    })
    .filter(Boolean);
  state.translatedText = parts.join("\n\n");
  const el = document.getElementById("translated-text");
  if (el) el.textContent = state.translatedText;
}

function getActiveEditedText() {
  if (state.workflow === "pdf-translate") {
    return document.getElementById("edited-text-pdf")?.value.trim() ?? state.editedText;
  }
  syncCombinedText();
  return state.editedText;
}

function photoPanelHtml(img, index, mode) {
  const statusClass = img.status === "scanning" ? "scanning" : img.status === "done" ? "done" : img.status === "error" ? "error" : "";
  const panelClass = img.status === "scanning" ? "is-scanning" : img.status === "error" ? "is-error" : img.status === "done" ? "is-done" : "";

  if (mode === "upload") {
    return `
      <article class="photo-panel ${panelClass}" data-id="${img.id}">
        <div class="photo-panel-thumb">
          <span class="photo-panel-num">${index + 1}</span>
          <img src="${img.previewUrl}" alt="${escapeHtml(img.name)}" />
        </div>
        <div class="photo-panel-body">
          <div class="photo-panel-head">
            <p class="photo-panel-title">Fotograf ${index + 1}</p>
            <span class="photo-panel-status ${statusClass}">${statusLabel(img.status)}</span>
          </div>
          <p class="hint" style="margin:0">${escapeHtml(img.name)}</p>
          ${
            img.text?.trim()
              ? `<p class="hint" style="margin:4px 0 0">Taranan metin:</p>
          <p class="translate-panel-result upload-text-preview">${escapeHtml(img.text.trim())}</p>`
              : ""
          }
          <div class="photo-panel-actions">
            <button type="button" class="btn secondary" data-action="scan-one" data-id="${img.id}">Bu fotografi tara</button>
            <button type="button" class="btn secondary" data-action="remove" data-id="${img.id}">Kaldir</button>
          </div>
          ${img.errorMessage ? `<p class="photo-panel-error">${escapeHtml(img.errorMessage)}</p>` : ""}
        </div>
      </article>`;
  }

  if (mode === "edit") {
    return `
      <article class="photo-panel ${panelClass}" data-id="${img.id}">
        <div class="photo-panel-thumb">
          <span class="photo-panel-num">${index + 1}</span>
          <img src="${img.previewUrl}" alt="Sayfa ${index + 1}" />
        </div>
        <div class="photo-panel-body">
          <div class="photo-panel-head">
            <p class="photo-panel-title">Sayfa ${index + 1}</p>
            <span class="photo-panel-status ${statusClass}">${statusLabel(img.status)}</span>
          </div>
          <textarea class="photo-panel-text" data-id="${img.id}" rows="6" placeholder="Bu fotografin metni...">${escapeHtml(img.text ?? "")}</textarea>
          <div class="photo-panel-actions">
            <button type="button" class="btn secondary" data-action="rescan-one" data-id="${img.id}">Yeniden tara</button>
          </div>
          ${img.errorMessage ? `<p class="photo-panel-error">${escapeHtml(img.errorMessage)}</p>` : ""}
        </div>
      </article>`;
  }

  // translate mode
  const translated = (img.translatedText ?? "").trim();
  return `
    <article class="photo-panel" data-id="${img.id}">
      <div class="photo-panel-thumb">
        <span class="photo-panel-num">${index + 1}</span>
        <img src="${img.previewUrl}" alt="Sayfa ${index + 1}" />
      </div>
      <div class="photo-panel-body">
        <div class="photo-panel-head">
          <p class="photo-panel-title">Sayfa ${index + 1} ceviri</p>
        </div>
        <p class="translate-panel-result ${translated ? "" : "empty"}" data-translate-result="${img.id}">${translated ? escapeHtml(translated) : "Henuz cevrilmedi"}</p>
      </div>
    </article>`;
}

function bindPhotoPanelActions(container, mode) {
  if (!container) return;

  container.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === "remove") removeImage(id);
      if (action === "scan-one") await scanSingleImage(id);
      if (action === "rescan-one") await scanSingleImage(id, { goToEdit: false });
    });
  });

  if (mode === "edit") {
    container.querySelectorAll(".photo-panel-text").forEach((ta) => {
      ta.addEventListener("input", () => {
        const img = state.images.find((i) => i.id === ta.dataset.id);
        if (img) {
          img.text = ta.value;
          img.status = ta.value.trim() ? "done" : "ready";
          syncCombinedText();
        }
      });
    });
  }
}

function renderUploadPanels() {
  const container = document.getElementById("photo-upload-panels");
  if (!container) return;

  if (state.images.length === 0) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }

  container.hidden = false;
  container.innerHTML = state.images.map((img, i) => photoPanelHtml(img, i, "upload")).join("");
  bindPhotoPanelActions(container, "upload");
}

function renderEditPanels() {
  const container = document.getElementById("photo-edit-panels");
  if (!container) return;

  container.innerHTML = state.images.map((img, i) => photoPanelHtml(img, i, "edit")).join("");
  bindPhotoPanelActions(container, "edit");
  syncCombinedText();

  const rescanAll = document.getElementById("rescan-all-btn");
  if (rescanAll) rescanAll.hidden = state.images.length === 0;
}

function hasActiveTranslation() {
  return state.translatedText.length > 0 && !state.skippedTranslation;
}

function getExportContent() {
  if (hasActiveTranslation()) {
    return { text: state.translatedText, title: "Ceviri" };
  }
  return {
    text: state.editedText,
    title: state.workflow === "pdf-translate" ? "Orijinal PDF Metni" : "Dijitallestirilmis Metin",
  };
}

function renderExportPanels() {
  const container = document.getElementById("photo-export-panels");
  const combined = document.getElementById("export-combined");
  if (!container) return;

  const show = state.workflow === "handwriting" && state.images.length > 0;
  container.hidden = !show;
  if (combined) combined.hidden = show;

  if (!show) {
    container.innerHTML = "";
    return;
  }

  const translationOnly = hasActiveTranslation();
  container.innerHTML = state.images
    .map((img, i) => {
      const source = (img.text ?? "").trim();
      const translated = (img.translatedText ?? "").trim();
      const displayText = translationOnly ? translated : source;
      const label = translationOnly ? "Ceviri" : "Metin";
      return `
    <article class="photo-panel is-done" data-id="${img.id}">
      <div class="photo-panel-thumb">
        <span class="photo-panel-num">${i + 1}</span>
        <img src="${img.previewUrl}" alt="Sayfa ${i + 1}" />
      </div>
      <div class="photo-panel-body">
        <div class="photo-panel-head">
          <p class="photo-panel-title">Sayfa ${i + 1}</p>
        </div>
        <p class="hint" style="margin:0 0 4px">${label}:</p>
        <p class="translate-panel-result">${displayText ? escapeHtml(displayText) : "—"}</p>
      </div>
    </article>`;
    })
    .join("");
}

function renderTranslatePanels() {
  const container = document.getElementById("photo-translate-panels");
  const resultBox = document.getElementById("translation-result");
  if (!container) return;

  const show = state.workflow === "handwriting" && state.images.length > 0;
  container.hidden = !show;
  if (resultBox) resultBox.hidden = show;

  if (!show) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = state.images.map((img, i) => photoPanelHtml(img, i, "translate")).join("");
}

function updateStep2Layout() {
  const isHandwriting = state.workflow === "handwriting";
  document.getElementById("step2-handwriting").hidden = !isHandwriting;
  document.getElementById("step2-pdf").hidden = isHandwriting;
  if (!isHandwriting) {
    document.getElementById("step2-pdf-hint").textContent = WORKFLOW_META["pdf-translate"].step2Hint;
  }
}

function removeImage(id) {
  state.images = state.images.filter((img) => img.id !== id);
  renderImagePreviews();
  renderUploadPanels();
  syncCombinedText();
  setStatus("step1-status", "");
}

async function scanSingleImage(id, options = {}) {
  const { goToEdit = true } = options;
  const img = state.images.find((i) => i.id === id);
  if (!img) return;

  const langHint = document.getElementById("source-lang-hint")?.value || undefined;
  const model = getSelectedModel();
  const index = state.images.indexOf(img);

  img.status = "scanning";
  img.errorMessage = "";
  renderUploadPanels();
  renderEditPanels();
  setStatus("step1-status", `Metin taraniyor (${index + 1}/${state.images.length})...`);

  try {
    const result = await apiPost("/api/ocr", {
      imageBase64: img.base64,
      mimeType: img.mimeType,
      sourceLangHint: langHint || undefined,
      model,
    });
    img.text = result.text;
    img.status = "done";
    syncCombinedText();
    renderUploadPanels();
    renderEditPanels();
    setStatus("step1-status", `Sayfa ${index + 1} tarandi.`);
    if (goToEdit) {
      updateStep2Layout();
      showStep(2);
    }
  } catch (error) {
    img.status = "error";
    img.errorMessage = error.message;
    renderUploadPanels();
    renderEditPanels();
    setStatus("step1-status", error.message, true);
  }
}

async function scanAllImages() {
  if (state.images.length === 0) return;

  ocrBtn.disabled = true;
  state.translatedText = "";
  state.skippedTranslation = false;

  for (const img of state.images) {
    if (img.status !== "done" || !img.text?.trim()) {
      await scanSingleImage(img.id, { goToEdit: false });
      if (img.status === "error") break;
    }
  }

  syncCombinedText();
  updateStep2Layout();
  renderEditPanels();
  renderTranslatePanels();
  setStatus("step1-status", `${state.images.length} fotograf islendi.`);
  showStep(2);
  ocrBtn.disabled = false;
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
    box.hidden = false;
    if (countEl) countEl.hidden = true;
    if (clearBtn) clearBtn.hidden = true;
    const scanBtn = document.getElementById("ocr-btn");
    if (scanBtn) scanBtn.disabled = true;
    renderUploadPanels();
    return;
  }

  placeholder.hidden = true;
  box.classList.remove("empty");
  box.hidden = true;
  grid.hidden = true;
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
  renderUploadPanels();
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
        id: nextImageId(),
        base64: result.base64,
        mimeType: result.mimeType,
        previewUrl: result.previewUrl,
        name: file.name,
        text: "",
        translatedText: "",
        status: "ready",
        errorMessage: "",
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

document.getElementById("rescan-all-btn")?.addEventListener("click", () => scanAllImages());

// --- OCR (el yazisi) ---
ocrBtn.addEventListener("click", () => scanAllImages());

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
    document.getElementById("edited-text-pdf").value = result.text;
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
  state.editedText = getActiveEditedText();
  if (!state.editedText) {
    alert("Lutfen once metni duzenleyin veya fotograflari tarayin.");
    return;
  }
  renderTranslatePanels();
  showStep(3);
});

// --- Ceviri ---
const translateBtn = document.getElementById("translate-btn");
const toExportBtn = document.getElementById("to-export-btn");

translateBtn.addEventListener("click", async () => {
  state.editedText = getActiveEditedText();
  const sourceLang = document.getElementById("source-lang").value;
  const targetLang = document.getElementById("target-lang").value;
  const model = getSelectedModel();
  const usePanels = state.workflow === "handwriting" && state.images.length > 0;

  translateBtn.disabled = true;
  setStatus("step3-status", "Ceviri yapiliyor...");

  try {
    if (usePanels) {
      for (let i = 0; i < state.images.length; i++) {
        const img = state.images[i];
        const sourceText = (img.text ?? "").trim();
        if (!sourceText) {
          img.translatedText = "";
          continue;
        }
        setStatus("step3-status", `Ceviri yapiliyor (${i + 1}/${state.images.length})...`);
        const result = await apiPost("/api/translate", {
          text: sourceText,
          sourceLang,
          targetLang,
          model,
        });
        img.translatedText = result.translatedText;
        const resultEl = document.querySelector(`[data-translate-result="${img.id}"]`);
        if (resultEl) {
          resultEl.textContent = result.translatedText;
          resultEl.classList.remove("empty");
        }
      }
      syncCombinedTranslation();
      renderTranslatePanels();
    } else {
      const result = await apiPost("/api/translate", {
        text: state.editedText,
        sourceLang,
        targetLang,
        model,
      });
      state.translatedText = result.translatedText;
      if (state.images.length === 1) state.images[0].translatedText = result.translatedText;
      document.getElementById("translated-text").textContent = result.translatedText;
      document.getElementById("translation-result").hidden = false;
      setStatus("step3-status", `Tamamlandi (${result.modelLabel ?? result.modelUsed})`);
    }

    state.skippedTranslation = false;
    if (usePanels) {
      document.getElementById("translation-result").hidden = true;
      setStatus("step3-status", "Tum sayfalar cevrildi.");
    }
    toExportBtn.disabled = false;
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
  state.editedText = getActiveEditedText();
  if (state.workflow === "handwriting" && state.images.length > 0) {
    syncCombinedTranslation();
  }
  const hasTranslation = hasActiveTranslation();
  const exportContent = getExportContent();

  document.getElementById("export-original-label").hidden = hasTranslation;
  document.getElementById("export-original").hidden = hasTranslation;
  document.getElementById("export-original").textContent = state.editedText;
  document.getElementById("export-translated").textContent = state.translatedText;

  const translatedSection = document.getElementById("export-translated-section");
  translatedSection.hidden = !hasTranslation;

  document.getElementById("export-original-label").textContent =
    state.workflow === "pdf-translate" ? "Orijinal PDF Metni" : "Dijitallestirilmis Metin";
  document.getElementById("export-translated-label").textContent = "Ceviri";

  if (hasTranslation) {
    document.getElementById("export-translated").textContent = exportContent.text;
  }

  renderExportPanels();
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
  const { text } = getExportContent();
  downloadBlob(`${meta.exportFilename}.txt`, new Blob([text], { type: "text/plain;charset=utf-8" }));
});

document.getElementById("export-pdf-btn").addEventListener("click", () => {
  const meta = getExportMeta();
  const { text, title } = getExportContent();
  const printArea = document.getElementById("print-area");

  let html = `<h1>${escapeHtml(meta.exportTitle)}</h1>`;
  html += `<h2>${escapeHtml(title)}</h2>`;
  html += `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`;

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
        originalText: hasActiveTranslation() ? "" : state.editedText,
        translatedText: hasActiveTranslation() ? state.translatedText : "",
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

  document.getElementById("edited-text-pdf").value = "";
  document.getElementById("edited-text").value = "";
  document.getElementById("photo-edit-panels").innerHTML = "";
  document.getElementById("photo-upload-panels").innerHTML = "";
  document.getElementById("photo-translate-panels").innerHTML = "";
  document.getElementById("photo-export-panels").innerHTML = "";
  document.getElementById("export-combined").hidden = false;
  document.getElementById("translation-result").hidden = true;
  document.getElementById("translated-text").textContent = "";
  toExportBtn.disabled = true;
  ocrBtn.disabled = true;
  extractPdfBtn.disabled = true;
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
