document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('mode-toggle');
  const stateText = document.getElementById('current-state');

  // Initialize UI from storage
  chrome.storage.sync.get(['productiveMode'], (result) => {
    const isEnabled = result.productiveMode ?? false;
    toggle.checked = isEnabled;
    updateUI(isEnabled);
  });

  // Handle toggle change - Just update storage
  // content.js uses chrome.storage.onChanged to react instantly
  toggle.addEventListener('change', () => {
    const isEnabled = toggle.checked;
    chrome.storage.sync.set({ productiveMode: isEnabled }, () => {
      updateUI(isEnabled);
    });
  });

  function updateUI(isEnabled) {
    stateText.textContent = isEnabled ? 'Enabled' : 'Disabled';
    stateText.className = isEnabled ? 'state-on' : 'state-off';
  }
});
