/*
The purpose of this script
is to find and identify the input[type=color] fields in this frame
and to add a feature to trigger ColorPick extension near these input fields

TL;DR this lets your users leverage ColorPick Eyedropper on your website as long as:
	1) the user has the extension
	2) your code uses an input type=color field
	3) the page is responsive enough that we may add the icon trigger before your input field
	    a) you may add the attribute colorpick-skip="1" to disable the extension for a particular input
	    b) you may add the attribute colorpick-after="1" to add the trigger after the input field instead of before

testing: test here https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color#Result
specifically the change event should fire when we assign the value

dev note: the scope of this script may be odd, in that it has access to other content scripts if those ran, but there is no guarantee they did run in this context either....
so great care is needed to name functions uniquely here, but also to register listeners carefully....
*/

var colorInputOpts = {};
var lastColorInputField = null;
var colorInputsHaveRun = false;
var errorMessage = 'Sorry:';

function loadColorInputPrefs(cbf) {
  var defaults = {
    supportColorInputs: navigator.platform.substr(0, 3).toLowerCase() == 'mac' ? 'false' : 'true',
  };
  var storage = chrome.storage.sync || chrome.storage.local;
  storage.get(defaults, function (obj) {
    if (chrome.runtime.lastError) console.log(chrome.runtime.lastError.message);
    obj = obj || {};
    for (var prop in defaults) {
      if (obj[prop] && obj[prop] !== 'false') {
        colorInputOpts[prop] = true;
      } else {
        colorInputOpts[prop] = false;
      }
    }
    if (typeof cbf == 'function') cbf();
  });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.disableColorPicker) {
    lastColorInputField = null;
    beginColorInputProcessing();
  } else if (request.hexValueWasSelected && lastColorInputField) {
    lastColorInputField.value = '#' + request.hexValueWasSelected;
    lastColorInputField.dispatchEvent(new Event('change', { bubbles: true }));
    lastColorInputField = null;
    chrome.runtime.sendMessage({ disableColorPicker: true }, function (r) {});
    sendResponse({ result: true });
  } else if (request.copyToClipboard) {
    copyColor(request.copyToClipboard);
  }
});

function copyColor(fmt) {
  const n = document.createElement('input');
  document.body.appendChild(n);
  n.value = fmt;
  n.select();
  document.execCommand('copy');
  n.parentNode.removeChild(n);
}

function getClickListenerForColorInput(inputColor) {
  return function (ev) {
    var targ = ev.target;
    lastColorInputField = inputColor;
    try {
      chrome.runtime.sendMessage({ activateForInput: true }, function (response) {});
    } catch (e) {
      alert(errorMessage + ' ' + e);
      targ.remove();
      removeColorPickInputTriggers(document);
    }
  };
}

function removeColorPickInputTriggers(context) {
  var triggers = context.querySelectorAll('.colorpick-eyedropper-input-trigger');
  if (triggers && triggers.length) {
    for (var t = 0; t < triggers.length; t++) {
      triggers[t].remove();
    }
  }
}

function beginColorInputProcessing() {
  loadColorInputPrefs(function () {
    errorMessage = chrome.i18n.getMessage('reloadRequired');
    if (!colorInputsHaveRun && !colorInputOpts.supportColorInputs) {
      colorInputsHaveRun = true;
      return;
    }
    var colorInputs = document.querySelectorAll('input[type=color]');
    if (!colorInputs || !colorInputs.length) return;
    var toolTipMessage =
      chrome.i18n.getMessage('selectWithExt') + ' - ' + chrome.i18n.getMessage('seeAdvOption') + ': "' + chrome.i18n.getMessage('supportColorInputs') + '"';
    for (var i = 0, l = colorInputs.length; i < l; i++) {
      if (colorInputs[i].getAttribute('colorpick-skip')) {
        continue;
      }
      if (colorInputs[i].getAttribute('colorpick-eyedropper-active')) {
        if (!colorInputOpts.supportColorInputs) {
          removeColorPickInputTriggers(colorInputs[i].parentNode);
          colorInputs[i].removeAttribute('colorpick-eyedropper-active');
        }
        continue;
      }
      if (!colorInputOpts.supportColorInputs) continue;
      var modeAfter = colorInputs[i].getAttribute('colorpick-after');
      var btn = document.createElement('img');
      btn.setAttribute(
        'style',
        'min-width:16px;min-height:16px;box-sizing:unset;box-shadow:none;background:unset;padding:' + (modeAfter ? '0 0 0 6px' : '0 6px 0 0') + ';cursor:pointer;',
      );
      btn.setAttribute('src', chrome.runtime.getURL('img/icon16.png'));
      btn.setAttribute('title', toolTipMessage);
      btn.setAttribute('class', 'colorpick-eyedropper-input-trigger');
      btn.addEventListener('click', getClickListenerForColorInput(colorInputs[i]), true);
      colorInputs[i].parentNode.insertBefore(btn, modeAfter ? colorInputs[i].nextSibling : colorInputs[i]);
      colorInputs[i].setAttribute('colorpick-eyedropper-active', true);
    }
    colorInputsHaveRun = true;
  });
}

beginColorInputProcessing();
