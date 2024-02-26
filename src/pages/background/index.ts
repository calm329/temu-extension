// import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
// import 'webextension-polyfill';

// reloadOnUpdate('pages/background');

// /**
//  * Extension reloading is necessary because the browser automatically caches the css.
//  * If you do not use the css of the content script, please delete it.
//  */
// reloadOnUpdate('pages/content/style.scss');

// console.log('background loaded');

chrome.runtime.onMessage.addListener(function (message, sender) {
  if (message.type === 'PRODUCT_URL') {
    chrome.storage.local.get(['TEMU_urls'], function (result) {
      const delta = (result.TEMU_urls || []).length;
      const urls = [...new Set([...(result.TEMU_urls || []), ...message.urls])];

      chrome.storage.local.set({ TEMU_urls: urls }, function () {
        chrome.runtime.sendMessage({ type: 'RECEIVE_URL', delta: urls.length - delta, total: urls.length });
      });
    });
    // chrome.storage.local.set(
    //   {
    //     TEMU_urls: message.urls,
    //   },
    //   function () {
    //     chrome.runtime.sendMessage({ type: 'RECEIVE_URL', urls: message.urls.length });
    //   },
    // );
  } else if (message.type === 'START_PROCESSING') {
    chrome.storage.local.get(['TEMU_from'], function (result) {
      chrome.storage.local.set({ TEMU_processing: true }, function () {
        if (result.TEMU_from) {
          start(result.TEMU_from - 1);
        } else {
          start(0);
        }

        chrome.runtime.sendMessage({ type: 'STARTED_PROCESSING' });
      });
    });
  } else if (message.type === 'STOP_PROCESSING') {
    chrome.storage.local.set({ TEMU_processing: false }, function () {
      chrome.runtime.sendMessage({ type: 'STOPPED_PROCESSING' });
    });
  } else if (message.type === 'CLEAR_URLS') {
    chrome.storage.local.set({ TEMU_urls: [] }, function () {
      chrome.runtime.sendMessage({ type: 'CLEARED_URLS' });
    });
  } else if (message.type === 'GET_URLS') {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.storage.local.get(['TEMU_rate_min', 'TEMU_rate_max'], function (result) {
        const rateRange = [result.TEMU_rate_min || 1, result.TEMU_rate_max || 4];

        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_URLS', rateRange: rateRange });
      });
    });
  } else if (message.type === 'GET_RATE_RANGE') {
    chrome.storage.local.get(['TEMU_rate_min', 'TEMU_rate_max'], function (result) {
      chrome.tabs.sendMessage(sender.tab.id, {
        type: 'SEND_RATE_RANGE',
        rateRange: [
          typeof result.TEMU_rate_min === 'number' ? result.TEMU_rate_min : 1,
          typeof result.TEMU_rate_max === 'number' ? result.TEMU_rate_max : 4,
        ],
        data: message.data,
      });
    });
  } else if (message.type === 'VERIFICATION') {
    chrome.storage.local.set({ TEMU_processing: false }, function () {
      chrome.runtime.sendMessage({ type: 'STOPPED_PROCESSING' });
    });
  }
});

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function openTab(i) {
  try {
    await chrome.storage.local.set({ TEMU_currentpos: i });
    const {
      TEMU_processing: temu_processing,
      TEMU_urls: temu_urls,
      TEMU_delay: temu_delay,
    } = await chrome.storage.local.get(['TEMU_processing', 'TEMU_urls', 'TEMU_delay']);

    const processing = temu_processing || false;
    const urls = temu_urls || [];
    const delay_sec = temu_delay || 30;

    if (i >= urls.length || !processing) return;

    const tab = await chrome.tabs.create({ url: urls[i], active: true });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('assets/js/inject.js');
        (document.head || document.documentElement).appendChild(script);
        script.remove();
      },
    });

    await delay(delay_sec * 1000);

    await chrome.tabs.remove(tab.id);

    const {
      TEMU_number: temu_number,
      TEMU_urls: _temu_urls,
      TEMU_from: temu_from,
    } = await chrome.storage.local.get(['TEMU_number', 'TEMU_urls', 'TEMU_from']);

    const from = temu_number === 'number' ? temu_from : 0;
    const number = temu_number || _temu_urls?.length || 100;

    if (i + 1 < from + number && i + 1 < urls.length) {
      await openTab(i + 1);
    } else {
      await chrome.storage.local.set({ TEMU_processing: false });
      await chrome.runtime.sendMessage({ type: 'STOPPED_PROCESSING' });
    }
  } catch (error) {
    console.log('=====');
  }
}

function start(index) {
  openTab(index);
}
