/* ============================================================
   DepEd ID Order Form — script.js
   DPrints by Dylan
   ============================================================ */

// ── Disclaimer modal ─────────────────────────────────────────
(function () {
  const overlay   = document.getElementById('disclaimer-overlay');
  const body      = document.getElementById('disclaimer-body');
  const agreeBtn  = document.getElementById('disclaimer-agree-btn');
  const scrollHint = document.getElementById('disclaimer-scroll-hint');

  // Lock page scroll while modal is visible
  document.body.classList.add('disclaimer-open');

  // Enable the agree button only after the user scrolls to the bottom
  function checkScroll() {
    const threshold = 40; // px from bottom
    const atBottom  = body.scrollHeight - body.scrollTop - body.clientHeight <= threshold;
    if (atBottom) {
      agreeBtn.disabled = false;
      scrollHint.classList.add('hidden-hint');
      body.removeEventListener('scroll', checkScroll);
    }
  }

  // Also enable immediately if content fits without scrolling
  if (body.scrollHeight <= body.clientHeight) {
    agreeBtn.disabled = false;
    scrollHint.classList.add('hidden-hint');
  } else {
    body.addEventListener('scroll', checkScroll);
  }
})();

function closeDisclaimer() {
  const overlay = document.getElementById('disclaimer-overlay');
  overlay.classList.add('hidden');
  document.body.classList.remove('disclaimer-open');
}

// ── Configuration ────────────────────────────────────────────
// Replace this with your deployed Google Apps Script Web App URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzeCL0JrBU1SDn2VfEQW8lA5kOdwPboS36H056sjV8tNVQ6QRKBct5e3-lnm0ofQoFt/exec';

// ── File validation rules ────────────────────────────────────
// Raw file size cap before compression. Images are compressed
// client-side before upload, so the actual payload will be smaller.
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB raw input
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_DOC_TYPES   = ['image/jpeg', 'image/png', 'application/pdf'];

// ── Image compression settings ───────────────────────────────
// Images are resized to fit within MAX_IMAGE_DIMENSION and re-encoded
// as JPEG at IMAGE_QUALITY before being base64-encoded for upload.
// This keeps payloads well within Apps Script's POST body limit.
const MAX_IMAGE_DIMENSION = 1600; // px — enough for a crisp ID photo
const IMAGE_QUALITY       = 0.82; // 0–1 JPEG quality

// ── Compress an image File via canvas ───────────────────────
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = function () {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if either dimension exceeds the max
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        if (width >= height) {
          height = Math.round((height / width) * MAX_IMAGE_DIMENSION);
          width  = MAX_IMAGE_DIMENSION;
        } else {
          width  = Math.round((width / height) * MAX_IMAGE_DIMENSION);
          height = MAX_IMAGE_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      // toBlob is async and more memory-efficient than toDataURL
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Canvas compression failed.')); return; }
          // Return a File so the rest of the pipeline (name, type) stays intact
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
        },
        'image/jpeg',
        IMAGE_QUALITY
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load image.')); };
    img.src = url;
  });
}
// ── DOM references ───────────────────────────────────────────
const form          = document.getElementById('order-form');
const submitBtn     = document.getElementById('submit-btn');
const btnLabel      = document.getElementById('btn-label');
const btnSpinner    = document.getElementById('btn-spinner');
const submitError   = document.getElementById('submit-error');
const successScreen = document.getElementById('success-screen');
const refNumberEl   = document.getElementById('reference-number');

// ── File input listeners ─────────────────────────────────────
document.getElementById('idPhoto').addEventListener('change', function () {
  handleImageChange(this, 'photo-preview', 'photo-preview-wrap', 'upload-area-photo', 'err-idPhoto');
});

document.getElementById('esignature').addEventListener('change', function () {
  handleImageChange(this, 'esig-preview', 'esig-preview-wrap', 'upload-area-esig', 'err-esignature');
});

document.getElementById('supportingDoc1').addEventListener('change', function () {
  handleDocChange(this, 'doc1-name', 'doc1-name-wrap', 'upload-area-doc1', 'err-supportingDoc1', ALLOWED_DOC_TYPES);
});

// ── Handle image file selection (photo / e-signature) ────────
function handleImageChange(input, previewImgId, previewWrapId, uploadAreaId, errorElId) {
  const errorEl     = document.getElementById(errorElId);
  const previewWrap = document.getElementById(previewWrapId);
  const previewImg  = document.getElementById(previewImgId);
  const uploadArea  = document.getElementById(uploadAreaId);

  clearError(errorEl);

  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const validationError = validateFile(file, ALLOWED_IMAGE_TYPES);

  if (validationError) {
    showError(errorEl, validationError);
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    previewImg.src = e.target.result;
    previewWrap.classList.remove('hidden');
    uploadArea.classList.add('hidden');
  };
  reader.readAsDataURL(file);
}

// ── Handle document selection ────────────────────────────────
function handleDocChange(input, nameElId, nameWrapId, uploadAreaId, errorElId, allowedTypes) {
  const errorEl    = document.getElementById(errorElId);
  const nameEl     = document.getElementById(nameElId);
  const nameWrap   = document.getElementById(nameWrapId);
  const uploadArea = document.getElementById(uploadAreaId);

  clearError(errorEl);

  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const validationError = validateFile(file, allowedTypes);

  if (validationError) {
    showError(errorEl, validationError);
    input.value = '';
    return;
  }

  nameEl.textContent = file.name;
  nameWrap.classList.remove('hidden');
  uploadArea.classList.add('hidden');
}

// ── Remove a selected file ───────────────────────────────────
function removeFile(inputId, wrapId, uploadAreaId) {
  const input      = document.getElementById(inputId);
  const wrap       = document.getElementById(wrapId);
  const uploadArea = document.getElementById(uploadAreaId);

  input.value = '';
  wrap.classList.add('hidden');
  uploadArea.classList.remove('hidden');

  const errorEl = document.getElementById('err-' + inputId);
  if (errorEl) clearError(errorEl);

  // Clear image preview src
  if (inputId === 'idPhoto')    document.getElementById('photo-preview').src = '';
  if (inputId === 'esignature') document.getElementById('esig-preview').src  = '';
}

// ── File validation helper ───────────────────────────────────
function validateFile(file, allowedTypes) {
  if (!allowedTypes.includes(file.type)) {
    const labels = allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ');
    return `Invalid file type. Allowed: ${labels}.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'File exceeds the 10MB size limit.';
  }
  return null;
}

// ── Required fields list ─────────────────────────────────────
const REQUIRED_FIELDS = [
  { id: 'lastName',   label: 'Last Name' },
  { id: 'firstName',  label: 'First Name' },
  { id: 'dateOfBirth', label: 'Date of Birth' },
  { id: 'employeeId', label: 'Employee Number' },
  { id: 'position',   label: 'Position' },
  { id: 'schoolName', label: 'Name of School' },
  { id: 'division',   label: 'Schools Division of' },
  { id: 'region',     label: 'Region' },
];

// ── Form validation ──────────────────────────────────────────
function validateForm() {
  let isValid = true;

  REQUIRED_FIELDS.forEach(({ id, label }) => {
    const el      = document.getElementById(id);
    const errorEl = document.getElementById('err-' + id);
    const value   = el.value.trim();

    if (!value) {
      showError(errorEl, `${label} is required.`);
      el.classList.add('invalid');
      isValid = false;
    } else {
      clearError(errorEl);
      el.classList.remove('invalid');
      el.classList.add('valid');
    }
  });

  // Email format (optional field — only validate if filled)
  const emailEl = document.getElementById('email');
  if (emailEl && emailEl.value.trim() && !isValidEmail(emailEl.value.trim())) {
    showError(document.getElementById('err-email'), 'Please enter a valid email address.');
    emailEl.classList.add('invalid');
    isValid = false;
  }

  return isValid;
}

// ── Live validation on blur ──────────────────────────────────
REQUIRED_FIELDS.forEach(({ id }) => {
  const el = document.getElementById(id);
  if (!el) return;

  el.addEventListener('blur', () => {
    const errorEl = document.getElementById('err-' + id);
    if (!el.value.trim()) return;
    clearError(errorEl);
    el.classList.remove('invalid');
    el.classList.add('valid');

    if (id === 'contactNumber' || id === 'emergencyContact') return;
  });

  el.addEventListener('input', () => {
    const errorEl = document.getElementById('err-' + id);
    if (el.value.trim()) {
      clearError(errorEl);
      el.classList.remove('invalid');
    }
  });
});

// ── File to Base64 helper ────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Build payload for Apps Script ────────────────────────────
async function buildPayload() {
  const textFields = [
    'lastName', 'firstName', 'middleName',
    'address', 'contactNumber', 'dateOfBirth', 'bloodType',
    'tin', 'gsisBpNo', 'pagibigNo', 'philhealthNo',
    'employeeId', 'position', 'schoolName', 'schoolAddress',
    'division', 'region',
    'schoolHeadName', 'schoolHeadPosition',
    'emergencyName', 'emergencyAddress', 'emergencyContact',
  ];

  const params = new URLSearchParams();

  textFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) params.append(id, el.value.trim());
  });

  // Encode file fields — images are compressed before encoding
  const fileFields = [
    { id: 'idPhoto',        name: 'idPhoto',        isImage: true  },
    { id: 'esignature',     name: 'esignature',     isImage: true  },
    { id: 'supportingDoc1', name: 'supportingDoc1', isImage: false },
  ];

  for (const { id, name, isImage } of fileFields) {
    const input = document.getElementById(id);
    if (input && input.files && input.files[0]) {
      let file = input.files[0];

      // Compress images before encoding to keep payload size manageable
      if (isImage && ALLOWED_IMAGE_TYPES.includes(file.type)) {
        try {
          file = await compressImage(file);
        } catch (err) {
          console.warn(`Compression failed for ${id}, using original:`, err);
        }
      }

      const base64 = await fileToBase64(file);
      params.append(name,                  base64);
      params.append(name + '_filename',    file.name);
      params.append(name + '_mimetype',    file.type);
    }
  }

  return params;
}

// ── Form submit ──────────────────────────────────────────────
form.addEventListener('submit', async function (e) {
  e.preventDefault();
  hideElement(submitError);

  if (!validateForm()) {
    const firstError = form.querySelector('.invalid, .field-error:not(:empty)');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  setLoading(true);

  try {
    const payload = await buildPayload();

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString(),
    });

    const result = await response.json();

    if (result.status === 'success') {
      refNumberEl.textContent = result.referenceNumber;
      form.classList.add('hidden');
      successScreen.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showSubmitError(result.message || 'Something went wrong. Please try again.');
    }

  } catch (err) {
    showSubmitError('Unable to submit. Please check your connection and try again.');
  } finally {
    setLoading(false);
  }
});

// ── Reset form ───────────────────────────────────────────────
function resetForm() {
  form.reset();
  form.classList.remove('hidden');
  successScreen.classList.add('hidden');

  form.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  form.querySelectorAll('input, select').forEach(el => {
    el.classList.remove('valid', 'invalid');
  });

  removeFile('idPhoto',        'photo-preview-wrap', 'upload-area-photo');
  removeFile('esignature',     'esig-preview-wrap',  'upload-area-esig');
  removeFile('supportingDoc1', 'doc1-name-wrap',     'upload-area-doc1');

  hideElement(submitError);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── UI helpers ───────────────────────────────────────────────
function setLoading(loading) {
  submitBtn.disabled = loading;
  btnLabel.textContent = loading ? 'Submitting…' : 'Submit Order';
  btnSpinner.classList.toggle('hidden', !loading);
}

function showError(el, message) {
  if (el) el.textContent = message;
}

function clearError(el) {
  if (el) el.textContent = '';
}

function showSubmitError(message) {
  submitError.textContent = message;
  submitError.classList.remove('hidden');
  submitError.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideElement(el) {
  if (el) el.classList.add('hidden');
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
