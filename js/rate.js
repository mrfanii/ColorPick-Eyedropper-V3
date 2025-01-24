let uc_staro = '\u2606';
let uc_starf = '\u2605';
let ln_sprt = 'https://chrome.google.com/webstore/detail/nmjfgehlhiknpmfimbicbgnmppklloia/support';
let ln_rate = 'https://chrome.google.com/webstore/detail/nmjfgehlhiknpmfimbicbgnmppklloia/reviews';
let interactiveMode = false;

function createRatings() {
  setTimeout(function () {
    restorePreviousRating();
  }, 500);
  return Cr.elm(
    'span',
    {
      id: 'rate_container',
      style: 'cursor:pointer;',
      events: [
        ['mouseover', rateOver],
        ['mouseout', rateOut],
      ],
    },
    [
      Cr.elm(
        'a',
        {
          id: 'star1',
          events: [
            ['mousemove', moStar],
            ['click', clickStar],
          ],
          href: ln_sprt,
          target: '_blank',
        },
        [Cr.txt(uc_staro)],
      ),
      Cr.elm(
        'a',
        {
          id: 'star2',
          events: [
            ['mousemove', moStar],
            ['click', clickStar],
          ],
          href: ln_sprt,
          target: '_blank',
        },
        [Cr.txt(uc_staro)],
      ),
      Cr.elm(
        'a',
        {
          id: 'star3',
          events: [
            ['mousemove', moStar],
            ['click', clickStar],
          ],
          href: ln_sprt,
          target: '_blank',
        },
        [Cr.txt(uc_staro)],
      ),
      Cr.elm(
        'a',
        {
          id: 'star4',
          events: [
            ['mousemove', moStar],
            ['click', clickStar],
          ],
          href: ln_sprt,
          target: '_blank',
        },
        [Cr.txt(uc_staro)],
      ),
      Cr.elm(
        'a',
        {
          id: 'star5',
          events: [
            ['mousemove', moStar],
            ['click', clickStar],
          ],
          href: ln_rate,
          target: '_blank',
        },
        [Cr.txt(uc_staro)],
      ),
    ],
  );
}

function createAndAttachRatings(container) {
  var containingElm = container;
  chrome.i18n.getAcceptLanguages(function (lang) {
    if (lang && lang[0]) {
      ln_sprt += '?hl=' + lang[0];
      ln_rate += '?hl=' + lang[0];
    }
    containingElm.appendChild(createRatings());
  });
}
function rateOver(ev) {
  if (ev.target.id == 'rate_container') {
  }
}
function rateOut(ev) {
  if (ev.target.id == 'rate_container') {
    restorePreviousRating();
  }
}
function restorePreviousRating() {
  if (typeof localStorage['lastRating'] != 'undefined') {
    setRating(localStorage['lastRating'] - 0);
  } else {
    setRating(4);
  }
}
function setRating(starNo) {
  for (var s = 1; s < 6; s++) {
    if (s <= starNo) {
      document.getElementById('star' + s).textContent = uc_starf;
    } else {
      document.getElementById('star' + s).textContent = uc_staro;
    }
  }
}
function moStar(ev) {
  var star = ev.target;
  var starNo = star.id.replace('star', '') - 0;
  setRating(starNo);
}
function clickStar(ev) {
  var star = ev.target;
  var starNo = star.id.replace('star', '') - 0;
  setRating(starNo);
  interactiveMode = false;
  localStorage['lastRating'] = starNo;
}
