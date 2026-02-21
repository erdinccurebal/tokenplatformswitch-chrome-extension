// Background script for Token Platform Switch

// Listen for extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open the website in a new tab
  chrome.tabs.create({ url: 'https://tokenplatformswitch.fun' });
});
