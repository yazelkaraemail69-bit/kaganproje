const MAX_IMAGES = window.APP_CONFIG?.maxImages || 25;
const MAX_PDF_PAGES = window.APP_CONFIG?.maxPdfPages || 100;
/** Vercel istek govdesi ~4.5MB; base64 ~%33 buyur → guvenli dosya limiti */
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

const DOCUMENT_ACCEPT_ALL =
  ".pdf,.docx,.xlsx,.xls,.csv,.txt,.md,.html,.htm,.srt,.vtt,.rtf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv,text/markdown,text/html,text/vtt";
const DOCUMENT_ACCEPT_TRANSCRIPT = ".txt,.md,.srt,.vtt,.html,.htm,text/plain,text/markdown,text/vtt";

const state = {
  workflow: null,
  selectedModel: null,
  images: [],
  documentFile: null,
  documentMeta: null,
  documentKind: null,
  documentTables: null,
  documentSegments: null,
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
    imageUploadTitle: "El yazisi fotografi yukleyin",
    imageUploadHint: "En fazla 25 fotograf. Her biri icin ayri panel acilir.",
  },
  "document-convert": {
    subtitle: "PDF, Word, Excel ve diger belgeleri cevirip istediginiz formata donusturun.",
    step1Label: "1. Yukle",
    step3Hint: "Belge icerigini hedef dile cevirin veya atlayin.",
    step2Hint: "Cikarilan metni / tabloyu kontrol edip duzeltin.",
    exportTitle: "Belge Cevirisi",
    exportFilename: "belge-cevirisi",
    uploadTitle: "Belge dosyasi yukleyin",
    uploadHint:
      "Desteklenen: PDF, DOCX, XLSX, XLS, CSV, TXT, MD, HTML, SRT, VTT, RTF (en fazla ~3 MB).",
    imageUploadTitle: "Belge / sayfa fotografi yukleyin",
    imageUploadHint:
      "Taranmis sayfalar veya el yazisi fotograflari — en fazla 25. Asagidan dosya da yukleyebilirsiniz.",
  },
  transcript: {
    subtitle: "Google Meet / Recorder ve benzeri transkriptleri duzenli rapora cevirin.",
    step1Label: "1. Yukle",
    step3Hint: "Transkripti hedef dile cevirin veya atlayin.",
    step2Hint: "Zaman damgali metni kontrol edin; gerekirse duzenleyin.",
    exportTitle: "Transkript Raporu",
    exportFilename: "transkript",
    uploadTitle: "Transkript dosyasi yukleyin",
    uploadHint: "TXT, MD, SRT, VTT veya Meet/Recorder disa aktarimi (metin).",
    imageUploadTitle: "Transkript / sayfa fotografi yukleyin",
    imageUploadHint:
      "Fotograf cekerek metin cikarin — en fazla 25. Asagidan dosya da yukleyebilirsiniz.",
  },
};

function isDocumentWorkflow() {
  return state.workflow === "document-convert" || state.workflow === "transcript";
}

function hasUploadedImages() {
  return state.images.length > 0;
}

function usesImagePanels() {
  return hasUploadedImages();
}

function updateDocumentInputAccept() {
  const input = document.getElementById("document-input");
  if (!input) return;
  input.accept = state.workflow === "transcript" ? DOCUMENT_ACCEPT_TRANSCRIPT : DOCUMENT_ACCEPT_ALL;
}

function updateExportButtonsVisibility() {
  const show = (id, visible) => {
    const el = document.getElementById(id);
    if (el) el.hidden = !visible;
  };

  const kind = state.documentKind;
  const wf = state.workflow;

  const defaults = {
    txt: true,
    md: true,
    docx: true,
    pdf: true,
    xlsx: false,
    csv: false,
    html: false,
    srt: false,
    vtt: false,
  };

  let formats = { ...defaults };

  if (wf === "document-convert") {
    formats = { txt: true, md: true, docx: true, pdf: true, xlsx: true, csv: true, html: true, srt: false, vtt: false };
    if (kind === "table") {
      formats.xlsx = true;
      formats.csv = true;
    }
    if (kind === "subtitle" || kind === "transcript") {
      formats.srt = true;
      formats.vtt = true;
    }
  } else if (wf === "transcript") {
    formats = { txt: true, md: true, docx: true, pdf: true, xlsx: false, csv: false, html: true, srt: true, vtt: true };
  }

  show("export-txt-btn", formats.txt);
  show("export-md-btn", formats.md);
  show("export-docx-btn", formats.docx);
  show("export-pdf-btn", formats.pdf);
  show("export-xlsx-btn", formats.xlsx);
  show("export-csv-btn", formats.csv);
  show("export-html-btn", formats.html);
  show("export-srt-btn", formats.srt);
  show("export-vtt-btn", formats.vtt);
}

function buildExportPayload() {
  const meta = getExportMeta();
  const translated = hasActiveTranslation();
  const sourceLang = document.getElementById("source-lang")?.value;
  const targetLang = document.getElementById("target-lang")?.value;
  return {
    title: meta.exportTitle,
    originalText: state.editedText,
    translatedText: translated ? state.translatedText : undefined,
    sourceLang: sourceLang || undefined,
    targetLang: translated ? targetLang || undefined : undefined,
    tables: state.documentTables || undefined,
    segments: state.documentSegments || undefined,
  };
}

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
    const tabStep = Number(tab.dataset.step);
    tab.classList.toggle("active", tabStep === step);
    tab.classList.toggle("completed", tabStep < step);
  });
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `step-${step}`);
  });

  const stepsNav = document.getElementById("steps-nav");
  if (step === 0) {
    stepsNav.classList.add("hidden");
  } else {
    stepsNav.classList.remove("hidden");
    const progressLine = document.getElementById("steps-progress-line");
    if (progressLine) {
      const percentage = ((step - 1) / 3) * 100;
      progressLine.style.width = `${percentage}%`;
    }
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

  const isDocument = isDocumentWorkflow();
  document.getElementById("upload-images").hidden = false;
  document.getElementById("upload-document").hidden = !isDocument;
  document.getElementById("upload-document-divider").hidden = !isDocument;
  document.getElementById("skip-translate-btn").hidden = false;

  document.getElementById("upload-images-title").textContent =
    meta.imageUploadTitle || "Fotograf yukleyin";
  document.getElementById("upload-images-hint").textContent =
    meta.imageUploadHint || `En fazla ${MAX_IMAGES} fotograf.`;

  if (isDocument) {
    document.getElementById("document-upload-title").textContent = meta.uploadTitle || "Belge yukleyin";
    document.getElementById("document-upload-hint").textContent =
      meta.uploadHint || "Desteklenen dosya turlerini yukleyin.";
    updateDocumentInputAccept();
  }
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
  if (hasUploadedImages()) {
    syncCombinedText();
    return state.editedText;
  }
  if (isDocumentWorkflow()) {
    return document.getElementById("edited-text-pdf")?.value.trim() ?? state.editedText;
  }
  syncCombinedText();
  return state.editedText;
}

function confidenceBadgeHtml(img) {
  if (img.averageConfidence == null) return "";
  const pct = Math.round(img.averageConfidence * 100);
  const low = img.averageConfidence < 0.55;
  return `<span class="confidence-badge ${low ? "low" : "ok"}" title="Ortalama guven skoru">Guven %${pct}</span>`;
}

function highlightUncertainText(text) {
  return escapeHtml(text).replace(/\[(\?)\]/g, '<span class="uncertain-token">[?]</span>');
}

function confidenceLinesHtml(img) {
  const lines = img.document?.lines;
  if (!Array.isArray(lines) || lines.length === 0) return "";
  const uncertain = lines.filter((l) => l.uncertain || (typeof l.confidence === "number" && l.confidence < 0.55));
  if (uncertain.length === 0) return "";
  const preview = uncertain
    .slice(0, 6)
    .map((l) => `<li><span class="uncertain-token">${escapeHtml(l.text || "[?]")}</span> <small>%${Math.round((l.confidence ?? 0) * 100)}</small></li>`)
    .join("");
  return `<div class="confidence-lines"><p class="hint" style="margin:6px 0 2px">Dusuk guvenli satirlar (${uncertain.length}):</p><ul>${preview}</ul></div>`;
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
            <p class="photo-panel-title">Fotoğraf ${index + 1}</p>
            <span class="photo-panel-status ${statusClass}">${statusLabel(img.status) === "Taraniyor..." ? "Taranıyor..." : statusLabel(img.status) === "Tamam" ? "Tamam" : statusLabel(img.status) === "Hata" ? "Hata" : "Hazır"}</span>
            ${confidenceBadgeHtml(img)}
          </div>
          <p class="hint" style="margin:0">${escapeHtml(img.name)}</p>
          ${
            img.text?.trim()
              ? `<p class="hint" style="margin:4px 0 0">Taranan metin:</p>
          <p class="translate-panel-result upload-text-preview">${highlightUncertainText(img.text.trim())}</p>
          ${confidenceLinesHtml(img)}`
              : ""
          }
          <div class="photo-panel-actions">
            <button type="button" class="btn secondary" data-action="scan-one" data-id="${img.id}">Bu fotoğrafı tara</button>
            <button type="button" class="btn secondary" data-action="remove" data-id="${img.id}">Kaldır</button>
          </div>
          ${img.errorMessage ? `<p class="photo-panel-error">${escapeHtml(img.errorMessage)}</p>` : ""}
        </div>
      </article>`;
  }

  if (mode === "edit") {
    if (img.status === "scanning") {
      return `
        <article class="photo-panel is-scanning" data-id="${img.id}">
          <div class="photo-panel-thumb">
            <span class="photo-panel-num">${index + 1}</span>
            <img src="${img.previewUrl}" alt="Sayfa ${index + 1}" />
          </div>
          <div class="photo-panel-body">
            <div class="photo-panel-head">
              <p class="photo-panel-title">Sayfa ${index + 1}</p>
              <span class="photo-panel-status scanning">Taranıyor...</span>
            </div>
            <div class="skeleton-body" style="width:100%; margin-top:8px;">
              <div class="skeleton-line title"></div>
              <div class="skeleton-line text-1"></div>
              <div class="skeleton-line text-2"></div>
              <div class="skeleton-line text-3"></div>
            </div>
          </div>
        </article>`;
    }
    return `
      <article class="photo-panel ${panelClass}" data-id="${img.id}">
        <div class="photo-panel-thumb">
          <span class="photo-panel-num">${index + 1}</span>
          <img src="${img.previewUrl}" alt="Sayfa ${index + 1}" />
        </div>
        <div class="photo-panel-body">
          <div class="photo-panel-head">
            <p class="photo-panel-title">Sayfa ${index + 1}</p>
            <span class="photo-panel-status ${statusClass}">${statusLabel(img.status) === "Taraniyor..." ? "Taranıyor..." : statusLabel(img.status) === "Tamam" ? "Tamam" : statusLabel(img.status) === "Hata" ? "Hata" : "Hazır"}</span>
            ${confidenceBadgeHtml(img)}
          </div>
          <textarea class="photo-panel-text" data-id="${img.id}" rows="6" placeholder="Bu fotoğrafın metni...">${escapeHtml(img.text ?? "")}</textarea>
          ${confidenceLinesHtml(img)}
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
          <p class="photo-panel-title">Sayfa ${index + 1} Çeviri</p>
        </div>
        <p class="translate-panel-result ${translated ? "" : "empty"}" data-translate-result="${img.id}">${translated ? escapeHtml(translated) : "Henüz çevrilmedi"}</p>
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
    title: isDocumentWorkflow() ? "Orijinal Belge Metni" : "Dijitallestirilmis Metin",
  };
}

function renderExportPanels() {
  const container = document.getElementById("photo-export-panels");
  const combined = document.getElementById("export-combined");
  if (!container) return;

  const show = usesImagePanels();
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

  const show = usesImagePanels();
  container.hidden = !show;
  if (resultBox) resultBox.hidden = show;

  if (!show) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = state.images.map((img, i) => photoPanelHtml(img, i, "translate")).join("");
}

function updateStep2Layout() {
  const showImagePanels = usesImagePanels();
  document.getElementById("step2-handwriting").hidden = !showImagePanels;
  document.getElementById("step2-pdf").hidden = showImagePanels;
  if (!showImagePanels) {
    document.getElementById("step2-pdf-hint").textContent =
      WORKFLOW_META[state.workflow]?.step2Hint || "Metni kontrol edin.";
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
      preprocess: true,
      enhanceContrast: true,
    });
    img.text = result.text;
    img.document = result.document ?? null;
    img.averageConfidence = result.document?.averageConfidence ?? null;
    img.fallbackUsed = Boolean(result.fallbackUsed);
    img.preprocessApplied = Boolean(result.preprocessApplied);
    img.status = "done";
    syncCombinedText();
    renderUploadPanels();
    renderEditPanels();
    const conf =
      img.averageConfidence != null ? ` · guven %${Math.round(img.averageConfidence * 100)}` : "";
    const fb = img.fallbackUsed ? " · yedek gecis" : "";
    setStatus("step1-status", `Sayfa ${index + 1} tarandi${conf}${fb}.`);
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
  const pageLimit = Math.min(pdf.numPages, MAX_PDF_PAGES);
  const parts = [];

  for (let pageNum = 1; pageNum <= pageLimit; pageNum++) {
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

  return {
    text,
    pageCount: pageLimit,
    totalPages: pdf.numPages,
    truncated: pdf.numPages > MAX_PDF_PAGES,
  };
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

// --- Belge / transkript sec ---
const documentInput = document.getElementById("document-input");
const documentPreviewBox = document.getElementById("document-preview-box");
const documentPreviewPlaceholder = document.getElementById("document-preview-placeholder");
const documentFileInfo = document.getElementById("document-file-info");
const extractDocumentBtn = document.getElementById("extract-document-btn");

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Dosya okunamadi."));
    reader.readAsDataURL(file);
  });
}

function kindLabel(kind) {
  const map = {
    plain: "Duz metin / belge",
    table: "Tablo",
    transcript: "Transkript",
    subtitle: "Altyazi",
    mixed: "Karisik",
    unknown: "Bilinmiyor",
  };
  return map[kind] || kind || "";
}

document.getElementById("pick-document-btn").addEventListener("click", () => documentInput.click());

documentInput.addEventListener("change", () => {
  const file = documentInput.files?.[0];
  if (!file) return;

  if (file.size > MAX_UPLOAD_BYTES) {
    setStatus(
      "step1-status",
      `Dosya cok buyuk (${Math.round(file.size / 1024 / 1024)} MB). En fazla ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB yukleyin.`,
      true
    );
    documentInput.value = "";
    return;
  }

  state.documentFile = file;
  document.getElementById("document-file-name").textContent = file.name;
  document.getElementById("document-file-meta").textContent = `${Math.round(file.size / 1024)} KB`;
  documentPreviewPlaceholder.hidden = true;
  documentFileInfo.hidden = false;
  documentPreviewBox.classList.remove("empty");
  extractDocumentBtn.disabled = false;
  setStatus("step1-status", "");
});

document.getElementById("rescan-all-btn")?.addEventListener("click", () => scanAllImages());

// --- OCR (el yazisi) ---
ocrBtn.addEventListener("click", () => scanAllImages());

// --- Belge metin cikarma ---
extractDocumentBtn.addEventListener("click", async () => {
  if (!state.documentFile) return;

  extractDocumentBtn.disabled = true;
  setStatus("step1-status", "Dosya analiz ediliyor...");

  try {
    const file = state.documentFile;
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    let text = "";
    let kind = "plain";
    let tables = null;
    let segments = null;
    let metaLabel = ext.toUpperCase();

    if (ext === "pdf") {
      const result = await extractPdfText(file);
      text = result.text;
      metaLabel = result.truncated
        ? `${result.pageCount} / ${result.totalPages} sayfa`
        : `${result.pageCount} sayfa`;
      if (!text.trim()) {
        throw new Error(
          "PDF'den metin cikarilamadi. Taranmis PDF ise 'El Yazisini Dijitallestir' akisini kullanin."
        );
      }
    } else {
      const base64 = await fileToBase64(file);
      const data = await apiPost("/api/convert/extract", {
        filename: file.name,
        mimeType: file.type,
        base64,
      });
      text = data.text || "";
      kind = data.kind || "plain";
      tables = data.tables || null;
      segments = data.segments || null;
      metaLabel = `${(data.sourceFormat || ext).toUpperCase()} · ${kindLabel(kind)}`;
      if (data.warnings?.length) {
        console.warn(data.warnings);
        setStatus("step1-status", `Uyari: ${data.warnings[0]}`, false);
      }
      if (!text.trim() && !tables?.length) {
        throw new Error("Dosyadan metin cikarilamadi.");
      }
    }

    state.documentMeta = metaLabel;
    state.documentKind = kind;
    state.documentTables = tables;
    state.documentSegments = segments;
    state.editedText = text;
    state.translatedText = "";
    state.skippedTranslation = false;
    document.getElementById("document-file-meta").textContent = metaLabel;
    document.getElementById("edited-text-pdf").value = text;
    const badge = document.getElementById("document-kind-badge");
    if (badge) {
      badge.hidden = false;
      badge.textContent = `Algilanan yapi: ${kindLabel(kind)}`;
    }
    setStatus("step1-status", "Icerik cikarildi. Duzenleyip ceviriye gecebilirsiniz.");
    showStep(2);
  } catch (error) {
    setStatus("step1-status", error.message, true);
  } finally {
    extractDocumentBtn.disabled = false;
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
  const usePanels = usesImagePanels();

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
          document: img.document || undefined,
        });
        img.translatedText = result.translatedText;
        img.translateDocument = result.document ?? null;
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
        tables: state.documentTables?.length ? state.documentTables : undefined,
        segments: state.documentSegments?.length ? state.documentSegments : undefined,
      });
      state.translatedText = result.translatedText;
      if (result.translatedTables?.length) state.documentTables = result.translatedTables;
      if (result.translatedSegments?.length) state.documentSegments = result.translatedSegments;
      if (state.images.length === 1) state.images[0].translatedText = result.translatedText;
      document.getElementById("translated-text").textContent = result.translatedText;
      document.getElementById("translation-result").hidden = false;
      const extra =
        result.tableModelLabel || result.segmentModelLabel
          ? ` (+ tablo/segment)`
          : "";
      setStatus("step3-status", `Tamamlandi (${result.modelLabel ?? result.modelUsed}${extra})`);
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
  if (usesImagePanels()) {
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

  document.getElementById("export-original-label").textContent = hasUploadedImages()
    ? "Dijitallestirilmis Metin"
    : isDocumentWorkflow()
      ? "Orijinal Belge"
      : "Dijitallestirilmis Metin";
  document.getElementById("export-translated-label").textContent = "Ceviri";

  if (hasTranslation) {
    document.getElementById("export-translated").textContent = exportContent.text;
  }

  renderExportPanels();
  updateExportButtonsVisibility();
  showStep(4);
}

// --- Disa aktarma ---
function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 250);
}

function getExportMeta() {
  return WORKFLOW_META[state.workflow] ?? WORKFLOW_META.handwriting;
}

document.getElementById("export-txt-btn").addEventListener("click", () => exportViaConvert("txt"));

document.getElementById("export-pdf-btn").addEventListener("click", () => exportViaConvert("pdf"));

document.getElementById("export-docx-btn").addEventListener("click", async () => {
  const meta = getExportMeta();
  const useHandwritingLines = usesImagePanels();

  if (!useHandwritingLines) {
    await exportViaConvert("docx");
    return;
  }

  setStatus("step4-status", "DOCX olusturuluyor...");
  try {
    const layoutLines = usesImagePanels()
        ? state.images.flatMap((img) => {
            const srcLines = img.document?.lines;
            if (Array.isArray(srcLines) && srcLines.length > 0) {
              const translatedLines = img.translateDocument?.lines;
              return srcLines.map((line, idx) => ({
                text: line.text ?? "",
                translatedText: translatedLines?.[idx]?.translatedText,
              }));
            }
            return [{ text: img.text ?? "", translatedText: img.translatedText }];
          })
        : undefined;

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
        lines: layoutLines,
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

async function exportViaConvert(format) {
  const meta = getExportMeta();
  setStatus("step4-status", `${format.toUpperCase()} olusturuluyor...`);
  try {
    const data = await apiPost("/api/convert/export", {
      format,
      ...buildExportPayload(),
    });
    const binary = atob(data.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const ext = format === "md" ? "md" : format;
    const filename = data.filename || `${meta.exportFilename}.${ext}`;
    downloadBlob(filename, new Blob([bytes], { type: data.mimeType }));
    setStatus("step4-status", `${format.toUpperCase()} indirildi.`);
  } catch (error) {
    setStatus("step4-status", error.message, true);
  }
}

document.getElementById("export-md-btn")?.addEventListener("click", () => exportViaConvert("md"));
document.getElementById("export-xlsx-btn")?.addEventListener("click", () => exportViaConvert("xlsx"));
document.getElementById("export-csv-btn")?.addEventListener("click", () => exportViaConvert("csv"));
document.getElementById("export-html-btn")?.addEventListener("click", () => exportViaConvert("html"));
document.getElementById("export-srt-btn")?.addEventListener("click", () => exportViaConvert("srt"));
document.getElementById("export-vtt-btn")?.addEventListener("click", () => exportViaConvert("vtt"));

document.getElementById("restart-btn").addEventListener("click", () => {
  state.workflow = null;
  state.images = [];
  state.documentFile = null;
  state.documentMeta = null;
  state.documentKind = null;
  state.documentTables = null;
  state.documentSegments = null;
  state.editedText = "";
  state.translatedText = "";
  state.skippedTranslation = false;

  imageInput.value = "";
  documentInput.value = "";
  renderImagePreviews();
  documentPreviewPlaceholder.hidden = false;
  documentFileInfo.hidden = true;
  documentPreviewBox.classList.add("empty");

  document.getElementById("edited-text-pdf").value = "";
  document.getElementById("edited-text").value = "";
  const badge = document.getElementById("document-kind-badge");
  if (badge) badge.hidden = true;
  document.getElementById("photo-edit-panels").innerHTML = "";
  document.getElementById("photo-upload-panels").innerHTML = "";
  document.getElementById("photo-translate-panels").innerHTML = "";
  document.getElementById("photo-export-panels").innerHTML = "";
  document.getElementById("export-combined").hidden = false;
  document.getElementById("translation-result").hidden = true;
  document.getElementById("translated-text").textContent = "";
  toExportBtn.disabled = true;
  ocrBtn.disabled = true;
  extractDocumentBtn.disabled = true;
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

// Theme Toggle Initializer
function initTheme() {
  const toggleBtn = document.getElementById("theme-toggle-btn");
  if (!toggleBtn) return;
  const currentTheme = localStorage.getItem("theme") || "light";
  if (currentTheme === "dark") {
    document.body.classList.add("dark-theme");
  }
  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    const theme = document.body.classList.contains("dark-theme") ? "dark" : "light";
    localStorage.setItem("theme", theme);
  });
}

// Copy Buttons Initializer
function initCopyButtons() {
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".copy-btn");
    if (!btn) return;
    e.stopPropagation();
    const targetId = btn.dataset.target;
    let textToCopy = "";
    const el = document.getElementById(targetId);
    if (el) {
      textToCopy = el.tagName === "TEXTAREA" || el.tagName === "INPUT" ? el.value : el.textContent || el.innerText;
    }
    if (!textToCopy.trim()) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      const originalHTML = btn.innerHTML;
      btn.classList.add("copied");
      if (btn.classList.contains("mini")) {
        btn.innerHTML = '<span class="copy-icon">✔️</span>';
      } else {
        btn.innerHTML = '<span class="copy-icon">✔️</span><span class="copy-text">Kopyalandı!</span>';
      }
      setTimeout(() => {
        btn.classList.remove("copied");
        btn.innerHTML = originalHTML;
      }, 2000);
    } catch (err) {
      console.error("Kopyalama hatası:", err);
    }
  });
}

// Fullscreen Lightbox Initializer
let lightboxScale = 1;
let lightboxX = 0;
let lightboxY = 0;
let isDraggingLightbox = false;
let startDragX = 0;
let startDragY = 0;

function initLightbox() {
  const modal = document.getElementById("lightbox-modal");
  const img = document.getElementById("lightbox-img");
  const closeBtn = document.getElementById("lightbox-close");
  const wrapper = document.getElementById("lightbox-content-wrapper");
  const zoomIn = document.getElementById("lightbox-zoom-in");
  const zoomOut = document.getElementById("lightbox-zoom-out");
  const zoomReset = document.getElementById("lightbox-zoom-reset");
  if (!modal || !img || !closeBtn) return;

  closeBtn.addEventListener("click", () => {
    modal.classList.remove("active");
    img.src = "";
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === wrapper) {
      modal.classList.remove("active");
      img.src = "";
    }
  });

  const updateTransform = () => {
    img.style.transform = `translate(${lightboxX}px, ${lightboxY}px) scale(${lightboxScale})`;
  };

  zoomIn.addEventListener("click", () => {
    lightboxScale = Math.min(lightboxScale + 0.25, 4);
    updateTransform();
  });

  zoomOut.addEventListener("click", () => {
    lightboxScale = Math.max(lightboxScale - 0.25, 0.5);
    updateTransform();
  });

  zoomReset.addEventListener("click", () => {
    lightboxScale = 1;
    lightboxX = 0;
    lightboxY = 0;
    updateTransform();
  });

  wrapper.addEventListener("mousedown", (e) => {
    e.preventDefault();
    isDraggingLightbox = true;
    startDragX = e.clientX - lightboxX;
    startDragY = e.clientY - lightboxY;
    wrapper.style.cursor = "grabbing";
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDraggingLightbox) return;
    lightboxX = e.clientX - startDragX;
    lightboxY = e.clientY - startDragY;
    updateTransform();
  });

  window.addEventListener("mouseup", () => {
    isDraggingLightbox = false;
    if (wrapper) wrapper.style.cursor = "grab";
  });

  document.addEventListener("click", (e) => {
    const thumb = e.target.closest(".photo-panel-thumb, .preview-thumb");
    if (!thumb) return;
    const srcImg = thumb.querySelector("img");
    if (!srcImg) return;
    lightboxScale = 1;
    lightboxX = 0;
    lightboxY = 0;
    img.src = srcImg.src;
    updateTransform();
    modal.classList.add("active");
  });
}

// Drag & Drop File Upload Initializer
function initDragAndDrop() {
  const dragDropOverlay = document.getElementById("drag-drop-overlay");
  if (!dragDropOverlay) return;

  window.addEventListener("dragenter", (e) => {
    if (!state.workflow) return;
    e.preventDefault();
    dragDropOverlay.classList.add("active");
  });

  dragDropOverlay.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  dragDropOverlay.addEventListener("dragleave", (e) => {
    e.preventDefault();
    if (e.relatedTarget === null || !dragDropOverlay.contains(e.relatedTarget)) {
      dragDropOverlay.classList.remove("active");
    }
  });

  dragDropOverlay.addEventListener("drop", async (e) => {
    e.preventDefault();
    dragDropOverlay.classList.remove("active");
    if (!state.workflow) return;
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    if (isDocumentWorkflow() && files[0].name.match(/\.(pdf|docx|xlsx|xls|csv|txt|md|html|htm|srt|vtt|rtf)$/i)) {
      const docInput = document.getElementById("document-input");
      if (docInput) {
        const dt = new DataTransfer();
        dt.items.add(files[0]);
        docInput.files = dt.files;
        docInput.dispatchEvent(new Event("change"));
      }
    } else {
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length > 0) {
        await addImagesFromFiles(imageFiles);
      } else {
        setStatus("step1-status", "Geçersiz dosya türü sürüklendi.", true);
      }
    }
  });
}

// Baslangic
initModelPicker();
showStep(0);
checkServerSetup();
initTheme();
initCopyButtons();
initLightbox();
initDragAndDrop();
