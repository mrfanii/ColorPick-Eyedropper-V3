const loadedOptions = {};

function sendReloadPrefs(cb) {
  let cbf = cb;
  if (typeof cbf != 'function') cbf = function () {};
  chrome.runtime.sendMessage({ reloadprefs: true }, function () {
    if (chrome.runtime.lastError)
      console.log('sendReloadPrefs error (if there are active views we tell them to reload the preferences which may have changed): ' + chrome.runtime.lastError.message);
    cbf();
  });
}

function chromeStorageSaveALocalStor(tosave, cbf) {
  cbf = cbf || function () {};
  storage.set(tosave, function () {
    cbf();
  });
}

function saveToChromeSyncStorage(cbf) {
  const tosave = {};
  for (let i in pOptions) {
    tosave[i] = localStorage[i];
  }
  for (let i in pAdvOptions) {
    tosave[i] = localStorage[i];
  }
  chromeStorageSaveALocalStor(tosave, cbf);
}

function goToOrOpenTab(tabUrl, completedCallback) {
  if (tabUrl.match(/^http/)) tabUr = tabUrl;
  else if (!tabUrl.match(/^chrome/)) tabUrl = chrome.runtime.getURL(tabUrl);
  completedCallback = completedCallback || function () {};
  chrome.tabs.query(
    {
      url: tabUrl,
      currentWindow: true,
    },
    function (tabs) {
      if (tabs.length > 0) {
        chrome.tabs.update(tabs[0].id, { active: true }, completedCallback);
      } else {
        chrome.tabs.create(
          {
            url: tabUrl,
            active: true,
          },
          function (t) {
            chrome.tabs.update(t.id, { active: true }, completedCallback);
          },
        );
      }
    },
  );
}

function getDirection(el) {
  var dir;
  if (el.currentStyle) dir = el.currentStyle['direction'];
  else if (window.getComputedStyle) dir = getComputedStyle(el, null).getPropertyValue('direction');
  return dir;
}

function detectDirection() {
  var dir = getDirection(document.body);
  document.body.setAttribute('detected-dir', dir);
  document.body.classList.add(dir);
  return getDirMap(dir);
}

function getDirMap(dir) {
  var ltrtl = {
    ltr: {
      start: 'left',
      end: 'right',
      endResize: 'nwse',
      eventPageX: function (x) {
        return x;
      },
    },
    rtl: {
      start: 'right',
      end: 'left',
      endResize: 'nesw',
      eventPageX: function (x) {
        return window.innerWidth - x;
      },
    },
  };
  return ltrtl[dir || document.body.getAttribute('detected-dir')] || ltrtl.ltr;
}

function loadSettingsFromChromeSyncStorage(cbf) {
  storage.get(null, function (obj) {
    for (i in obj) {
      if (pOptions[i] || pAdvOptions[i] || pSyncItems[i]) {
        localStorage[i] = obj[i];
      }
    }
    loadPrefsFromLocalStorage(loadedOptions, function () {});
    sendReloadPrefs();
    if (typeof cbf == 'function') cbf();
  });
}

loadPrefsFromLocalStorage(loadedOptions, function () {});
