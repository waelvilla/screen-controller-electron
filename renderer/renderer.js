window.addEventListener('DOMContentLoaded', () => {
  const output = document.getElementById('ping');
  if (output && window.api) {
    output.textContent = window.api.ping();
  }

  const btn = document.getElementById('screenshotBtn');
  const status = document.getElementById('status');
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
});


