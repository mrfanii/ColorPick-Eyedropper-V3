const options = {};
const localStorage = {};

importScripts('/js/options_prefs.js');
importScripts('/js/options_prefs_helpers.js');

function fromPrefs() {
  var iconWasCustom = localStorage['iconIsBitmap'] === 'true' || localStorage['appleIcon'] === 'true';
  for (var i in pOptions) {
    if (typeof pOptions[i].def == 'boolean') options[i] = localStorage[i] === 'true' ? true : localStorage[i] === 'false' ? false : pOptions[i].def;
    else options[i] = localStorage[i] ? localStorage[i] : pOptions[i].def;
  }

  for (var i in pAdvOptions) {
    if (typeof pAdvOptions[i].def == 'boolean') options[i] = localStorage[i] === 'true' ? true : localStorage[i] === 'false' ? false : pAdvOptions[i].def;
    else options[i] = localStorage[i] ? localStorage[i] : pAdvOptions[i].def;
  }

  if (typeof localStorage['usageStatistics'] === 'undefined') {
    localStorage['usageStatistics'] = false;
  }

  if (localStorage['usageStatistics'] === 'true' && !navigator.doNotTrack) {
    localStorage.removeItem('feedbackOptOut');
  } else {
    localStorage.feedbackOptOut = 'true';
  }

  defaultIcon(iconWasCustom);
}

function defaultIcon(force) {
  if (localStorage['iconIsBitmap'] === 'true' || localStorage['appleIcon'] === 'true' || force) {
    var iconPath = 'img/';
    if (localStorage['appleIcon'] === 'true') iconPath += 'apple/';
    if (localStorage['resetIcon'] === 'true')
      chrome.action.setIcon({ path: { 19: chrome.runtime.getURL(iconPath + 'icon19.png'), 38: chrome.runtime.getURL(iconPath + 'icon38.png') } });
    return true;
  }
  return false;
}

let x;
let tabid = 0;
let lsnaptabid = 0;
let winid = 0;
let curentHex = 0;
let lastHex = 'FFF';
let lastLastHex = 'FFF';
let isCurrentEnableReady = false;
let isRunning = false;
let lastActiveTabTime = 0;
let timeRequiredToBeOnTabSinceChange = 500;

function doCaptueForTab(request, tabId, winId) {
  var cbf = function (dataUrl) {
    var currentTime = new Date().getTime();
    var snapDuration = currentTime - lastActiveTabTime;

    if (snapDuration > timeRequiredToBeOnTabSinceChange && dataUrl) {
      chrome.tabs.sendMessage(tabId, { setPickerImage: true, pickerImage: dataUrl, to: request.to }, function (response) {});
    }
  };
  if (winId < 1) winId = null;
  if (localStorage['usePNG']) chrome.tabs.captureVisibleTab(winId, { format: 'png' }, cbf);
  else chrome.tabs.captureVisibleTab(winId, { format: 'jpeg', quality: 100 }, cbf);
}

function processSetColor(request) {
  if (request.hex) curentHex = request.hex;
  if (lastHex !== curentHex) {
    localStorage['colorPickHistory'] = (localStorage['colorPickHistory'] || '') + '#' + curentHex;
    chrome.runtime.sendMessage({ historypush: true }, function () {
      if (chrome.runtime.lastError) console.log('historypush error (options screen not open?): ' + chrome.runtime.lastError.message);
    });
  }
  if (localStorage['autocopyhex'] && localStorage['autocopyhex'] !== 'false') {
    copyColor(request);
  }
  if (curentHex) {
    chrome.tabs.sendMessage(tabid, { hexValueWasSelected: curentHex.toLowerCase() }, function (response) {});
  }
  lastLastHex = lastHex;
  lastHex = curentHex;
}

function copyColor(request) {
  let fmt = request.hex;
  if (request.rgb && localStorage['autocopyhex'] === 'rgb') fmt = 'rgb' + formatColorValues(request.rgb.r, request.rgb.g, request.rgb.b);
  if (request.hsv && localStorage['autocopyhex'] === 'hsl') fmt = 'hsl' + formatColorValues(request.hsv.h, request.hsv.s, request.hsv.v, 0, 1, 1);
  chrome.tabs.sendMessage(tabid, { copyToClipboard: fmt }, function (response) {});
}

function start() {
  chrome.tabs.onActivated.addListener(function () {
    lastActiveTabTime = new Date().getTime();
  });

  chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
    sendResponse({});
  });

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (sender.tab && sender.tab.id >= 0) {
      tabid = sender.tab.id;
      winid = sender.tab.windowId;
    }
    if (request.tabi) {
      tabid = request.tabi;
    }
    if (request.tabw) {
      winid = request.tabw - 0;
    }
    if (request.newImage) {
      lsnaptabid = tabid;
      doCaptueForTab(request, lsnaptabid, winid);
      sendResponse({});
    } else if (request.activateOnTab) {
      lastActiveTabTime = new Date().getTime() - timeRequiredToBeOnTabSinceChange;
      chrome.tabs.sendMessage(tabid, { enableColorPicker: true, forSnapMode: request.forSnapMode, historyLen: 25 }, function (r) {});
      sendResponse({});
    } else if (request.isBgAlive) {
      sendResponse({});
    } else if (request.movePixel) {
      chrome.tabs.sendMessage(tabid, Object.assign({ from_bg: true }, request), function (r) {});
      sendResponse({});
    } else if (request.setColor) {
      processSetColor(request);
      sendResponse({});
    } else if (request.browserIconMsg) {
      chrome.action.setIcon({ path: request.path });
      sendResponse({});
    } else if (request.beginGame) {
      chrome.tabs.executeScript(tabid, { file: '/js/colorgame.user.js' }, function () {});
      sendResponse({});
    } else if (request.disableColorPicker) {
      isRunning = false;
      defaultIcon();
      chrome.tabs.sendMessage(tabid, { disableColorPicker: true }, function (response) {});
      sendResponse({});
    } else if (request.activateForInput) {
      chrome.tabs.sendMessage(tabid, { enableColorPicker: true, historyLen: 25 }, function (response) {});
      sendResponse({});
    } else if (request.goToOrVisitTab) {
      goToOrOpenTab(request.goToOrVisitTab);
      sendResponse({});
    } else if (request.reloadprefs) {
      setTimeout(function () {
        chrome.tabs.sendMessage(lsnaptabid, { reloadPrefs: true }, function (r) {});
      }, 255);
      fromPrefs();
      sendResponse({});
    } else sendResponse({});
  });

  chrome.runtime.onConnect.addListener(function (port) {});

  loadSettingsFromChromeSyncStorage(function () {
    fromPrefs();
  });
}
start();
