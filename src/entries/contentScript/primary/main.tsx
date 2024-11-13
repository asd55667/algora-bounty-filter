/**
https://console.algora.io/bounties/t/typescript
 */
import "../../enableDevHmr";
// import React from "react";
// import ReactDOM from "react-dom/client";
// import renderContent from "../renderContent";
// import App from "./App";

// renderContent(import.meta.PLUGIN_WEB_EXT_CHUNK_CSS_PATHS, (appRoot) => {
//   ReactDOM.createRoot(appRoot).render(
//     <React.StrictMode>
//       <App />
//     </React.StrictMode>
//   );
// });

const removeBounties = () => {
  // check current web page is algora with regex
  if (!/console\.algora\.io/.test(document.URL)) {
    return;
  }
  getBounties().forEach(async bounty => {
    const isOpen = await isIssueOpen(bounty);
    if (!isOpen) {
      bounty.element.remove();
    }
  });
};

// Define the bounty structure
interface Bounty {
  element: Element;
  href: string;
}

const cache = new WeakMap<HTMLTableRowElement, Bounty>();

// get all bounties elements
function getBounties(): Bounty[] {
  // bounty was wrapped in <tr></tr>, then get all <tr> tags
  const container = document.querySelectorAll('tr');

  // filter out a tag inside <tr> has href containing https://github.com/*, then return bounty objects
  const bounties = Array.from(container)
    .map(element => {
      if (cache.has(element)) {
        return null;
      }

      const aTags = element.querySelectorAll('a');

      // find the first a tag that has href looks like https://github.com/algorand/go-algorand/issues/1234, check href with regex
      const aTag = Array.from(aTags).find(aTag => /https:\/\/github\.com\/.*\/issues\/\d+/.test(aTag.href));
      if (aTag) {
        const bounty = {
          element,
          href: aTag.href
        };
        cache.set(element, bounty);
        return bounty;
      }
      return null;
    })
    .filter(Boolean) as Bounty[];
  return bounties;
}

// check if bounty is closed/deleted 
async function isIssueOpen(bounty: Bounty) {
  if (!bounty.href) {
    return false;
  }

  // Instead of direct fetch, send message to background script
  const bool = await new Promise<boolean>(resolve => {
    chrome.runtime.sendMessage({
      type: 'fetchWithCORS',
      url: bounty.href
    }, response => {
      if (response.error) {
        console.log('Error fetching bounty:', response.error);
        resolve(true);
        return;
      }

      if (/"Status: Open"/.test(response.data)) {
        resolve(true);
      } else if (/"Status: Closed"/.test(response.data)) {
        resolve(false);
      } else if (/This issue has been deleted/.test(response.data)) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });

  console.log('is issue open', bounty.href, bool);
  return bool;
}

// Set up a MutationObserver to handle dynamically loaded content
const observer = new MutationObserver((mutations) => {
  removeBounties();
});

// Start observing the target node for configured mutations
observer.observe(document.body, {
  childList: true,
  subtree: true
});