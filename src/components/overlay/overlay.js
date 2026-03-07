async function fetchState() {
  try {
    const r = await fetch('/state');
    const s = await r.json();
    document.getElementById('counter').textContent =
      'total: ' +
      s.applicationsTotal +
      ' | today: ' +
      s.applicationsToday +
      ' | 2d: ' +
      s.applicationsTwoDays;
  } catch { }
}

document.getElementById('autofillBtn').addEventListener('click', async () => {
  const btn = document.getElementById('autofillBtn');
  btn.textContent = '...';
  btn.disabled = true;
  try {
    await fetch('/autofill', { method: 'POST' });
  } finally {
    btn.textContent = 'Autofill';
    btn.disabled = false;
  }
});

document.getElementById('submitBtn').addEventListener('click', async () => {
  const btn = document.getElementById('submitBtn');
  btn.textContent = '...';
  btn.disabled = true;
  try {
    await fetch('/submit', { method: 'POST' });
  } finally {
    btn.textContent = 'Submit';
    btn.disabled = false;
  }
});

document.getElementById('askAiBtn').addEventListener('click', async () => {
  const input = document.getElementById('aiInput');
  let text = input.value.trim();
  if (!text) {
    try {
      const r = await fetch('/get-selection');
      const s = await r.json();
      if (s.text) {
        input.value = s.text;
        text = s.text;
      }
    } catch { }
  }
  if (!text) return;
  const btn = document.getElementById('askAiBtn');
  btn.textContent = '...';
  btn.disabled = true;
  try {
    const r = await fetch('/ask-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const s = await r.json();
    if (s.response) {
      await navigator.clipboard.writeText(s.response);
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.textContent = 'Ask AI';
        btn.disabled = false;
      }, 2000);
      return;
    }
  } catch { }
  btn.textContent = 'Ask AI';
  btn.disabled = false;
});

fetchState();
setInterval(fetchState, 2000);

async function pollSelection() {
  try {
    const r = await fetch('/get-selection');
    const s = await r.json();
    if (s.text) {
      const input = document.getElementById('aiInput');
      if (input.value !== s.text) input.value = s.text;
    }
  } catch { }
}
setInterval(pollSelection, 500);
