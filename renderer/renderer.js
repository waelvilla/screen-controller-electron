window.addEventListener('DOMContentLoaded', () => {
  const output = document.getElementById('ping');
  if (output && window.api) {
    output.textContent = window.api.ping();
  }

  const btn = document.getElementById('screenshotBtn');
  const status = document.getElementById('status');
  const ocrBtn = document.getElementById('ocrBtn');
  const ocrText = document.getElementById('ocrText');
  const cropCanvas = document.getElementById('cropCanvas');
  const ocrFromImageBtn = document.getElementById('ocrFromImageBtn');
  const imageFileInput = document.getElementById('imageFile');
  const ocrTextFromImage = document.getElementById('ocrTextFromImage');
  if (btn) {
    btn.addEventListener('click', async () => {
      if (!window.api || !window.api.takeScreenshot) {
        if (status) status.textContent = 'API not available.';
        return;
      }
      if (status) status.textContent = 'Taking screenshot...';
      try {
        const result = await window.api.takeScreenshot();
        if (result.ok) {
          if (status) status.textContent = `Saved: ${result.filePath}`;
        } else {
          if (status) status.textContent = `Error: ${result.error}`;
        }
      } catch (e) {
        if (status) status.textContent = 'Unexpected error.';
      }
    });
  }

  async function runOcrOnTopLeft(dataUrl, options = {}) {
    const { leftRatio = 0, topRatio = 0.06, widthRatio = 0.52, heightRatio = 0.06 } = options;
    const img = new Image();
    const loadPromise = new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    img.src = dataUrl;
    await loadPromise;

    // Crop tuned for banner like in the reference screenshot
    const cropX = Math.round(img.naturalWidth * leftRatio);
    const cropY = Math.round(img.naturalHeight * topRatio);
    const cropWidth = Math.round(img.naturalWidth * widthRatio);
    const cropHeight = Math.round(img.naturalHeight * heightRatio);

    const canvas = cropCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    // Optional: simple contrast/threshold could be added here if needed

    if (ocrText) ocrText.textContent = 'Reading...';
    const { data } = await Tesseract.recognize(canvas, 'eng+deu', { logger: () => {} });
    if (ocrText) ocrText.textContent = data.text.trim();
  }

  if (ocrBtn) {
    ocrBtn.addEventListener('click', async () => {
      if (!window.api || !window.api.captureScreenshotPng) {
        if (status) status.textContent = 'API not available.';
        return;
      }
      if (status) status.textContent = 'Capturing screen...';
      try {
        const result = await window.api.captureScreenshotPng();
        if (result.ok) {
          if (status) status.textContent = 'Running OCR...';
          await runOcrOnTopLeft(result.dataUrl);
          if (status) status.textContent = 'Done.';
        } else {
          if (status) status.textContent = `Error: ${result.error}`;
        }
      } catch (e) {
        if (status) status.textContent = 'Unexpected error.';
      }
    });
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  if (ocrFromImageBtn && imageFileInput) {
    ocrFromImageBtn.addEventListener('click', () => imageFileInput.click());

    imageFileInput.addEventListener('change', async (e) => {
      const input = e.target;
      if (!input.files || input.files.length === 0) return;
      const file = input.files[0];
      if (status) status.textContent = 'Loading image...';
      if (ocrTextFromImage) ocrTextFromImage.textContent = '';
      try {
        const dataUrl = await readFileAsDataUrl(file);
        // Use tuned ratios for the given screenshot layout
        // Aim to capture the name banner: left ~0, top ~6%, width ~52%, height ~6%
        if (status) status.textContent = 'Running OCR on image...';
        const img = new Image();
        const p = new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
        img.src = dataUrl;
        await p;

        // Draw crop with same function but temporarily direct output to the image section
        const prevOcrText = ocrText.textContent;
        try {
          if (ocrText) ocrText.textContent = 'Reading...';
          const { leftRatio, topRatio, widthRatio, heightRatio } = { leftRatio: 0, topRatio: 0.06, widthRatio: 0.52, heightRatio: 0.06 };
          const imgDataUrl = dataUrl;
          // Run and temporarily capture result
          const canvas = cropCanvas;
          const ctx = canvas.getContext('2d');
          const cropX = Math.round(img.naturalWidth * leftRatio);
          const cropY = Math.round(img.naturalHeight * topRatio);
          const cropWidth = Math.round(img.naturalWidth * widthRatio);
          const cropHeight = Math.round(img.naturalHeight * heightRatio);
          canvas.width = cropWidth;
          canvas.height = cropHeight;
          ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
          const { data } = await Tesseract.recognize(canvas, 'eng+deu', { logger: () => {} });
          if (ocrTextFromImage) ocrTextFromImage.textContent = data.text.trim();
        } finally {
          if (ocrText) ocrText.textContent = prevOcrText || '';
        }
        if (status) status.textContent = 'Done.';
      } catch (err) {
        if (status) status.textContent = 'Failed to read image.';
      } finally {
        imageFileInput.value = '';
      }
    });
  }
});


