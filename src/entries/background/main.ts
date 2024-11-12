import browser from "webextension-polyfill";

// Store CORS handling settings
const corsSettings = {
  enabled: true,
  'overwrite-origin': true,
  'allow-credentials': true
};

// Handle CORS headers
chrome.webRequest.onHeadersReceived.addListener(
  details => {
    if (!corsSettings.enabled) return;

    const headers = details.responseHeaders || [];

    // Add CORS headers
    headers.push({
      name: 'Access-Control-Allow-Origin',
      value: '*'
    });

    if (corsSettings['allow-credentials']) {
      headers.push({
        name: 'Access-Control-Allow-Credentials',
        value: 'true'
      });
    }

    headers.push({
      name: 'Access-Control-Allow-Methods',
      value: 'GET, POST, OPTIONS'
    });

    return { responseHeaders: headers };
  },
  {
    urls: ['<all_urls>'],
    types: ['xmlhttprequest']
  },
  ['blocking', 'responseHeaders', 'extraHeaders']
);


// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'fetchWithCORS') {
    fetch(request.url)
      .then(response => response.text())
      .then(data => {
        sendResponse({ data });
      })
      .catch(error => {
        sendResponse({ error: error.message });
      });
    return true; // Required for async response
  }
});

browser.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});
