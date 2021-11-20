chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ['margin-check.css']
  });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['margin-check.js']
  });
  toggleBadgeText();

  async function toggleBadgeText() {
    const badge = await chrome.action.getBadgeText({tabId: tab.id});
    const state = (badge === 'ON')? 'OFF': 'ON';
    chrome.action.setBadgeText({text: state, tabId: tab.id});
  }
});
