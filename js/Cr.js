var Cr = {
  doc: typeof document != 'undefined' ? document : null,
  elm: function (nodeType, attributes, addchilds, appnedTo) {
    var ne = this.doc.createElement(nodeType),
      i,
      l,
      lev,
      a;
    if (attributes) {
      if ((lev = attributes.event || attributes.events)) {
        if (typeof lev[0] == 'string') ne.addEventListener(lev[0], lev[1], lev[2]);
        else if (lev.length) for (i = 0, l = lev.length; i < l; i++) ne.addEventListener(lev[i][0], lev[i][1], lev[i][2]);
        else if (Object.keys(lev).length) for (i in lev) ne.addEventListener(i, lev[i]);
      }
      if (attributes.childNodes) {
        if (appnedTo || (addchilds && addchilds.length)) {
          console.warn('Cr Exception: if providing attributes.childNodes; 3 args max, addchilds argument becomes final argument appnedTo');
          if (addchilds.length) {
            attributes.childNodes = attributes.childNodes.concat(addchilds);
            addchilds = appnedTo;
          }
        }
        appnedTo = addchilds;
        addchilds = attributes.childNodes;
      }
      for (i in attributes) {
        a = attributes[i];
        if (i.substring(0, 5) == 'event' || i == 'childNodes') {
          //handled earlier
        } else if (i == 'checked' || i == 'selected') {
          if (a) ne.setAttribute(i, i);
        } else if (a || a == false) ne.setAttribute(i, '' + a);
      }
    }
    if (addchilds) {
      if (addchilds.length) {
        for (i = 0, l = addchilds.length; i < l; i++) {
          if (addchilds[i]) ne.appendChild(addchilds[i]);
        }
      } else if (addchilds.length !== 0) console.warn('Cr Exception: child nodes must be an array: [...]');
    }
    if (appnedTo) {
      this.insertNode(ne, appnedTo);
    }
    return ne;
  },
  txt: function (textContent) {
    return this.doc.createTextNode(textContent);
  },
  ent: function (textContent) {
    return this.doc.createTextNode(this.unescapeHtml(textContent));
  },
  frag: function (nodes) {
    var f = this.doc.createDocumentFragment();
    if (nodes) this.insertNodes(nodes, f);
    return f;
  },
  css: function (map) {
    var o = '',
      k;
    for (k in map) o += k + ':' + map[k] + ';';
    return o;
  },
  classList: function (arr, seperator) {
    seperator = seperator || ' ';
    return arr.join(seperator);
  },
  keys: function (map, allKeys) {
    var keys = Object.keys(map);
    if (allKeys) return keys;
    for (var k = 0, l = keys.length, ret = []; k < l; k++) {
      if (map[keys[k]]) ret.push(keys[k]);
    }
    return ret;
  },
  listKeys: function (map, seperator) {
    return this.classList(this.keys(map), seperator);
  },
  evt: function (eventType, callback, useCapture) {
    return Array.prototype.slice.call(arguments);
  },
  evts: null,
  event: null,
  events: null,
  paragraphs: function (textContent) {
    var textPieces = textContent.split('\n');
    var elmArray = [];
    for (var i = 0, l = textPieces.length; i < l; i++) {
      elmArray.push(Cr.elm('p', {}, [Cr.ent(textPieces[i])]));
    }
    return elmArray;
  },
  insertNode: function (newNode, parentElem, optionalInsertBefore) {
    if (!parentElem) parentElem = this.doc.body;
    if (optionalInsertBefore && optionalInsertBefore.parentNode == parentElem) {
      parentElem.insertBefore(newNode, optionalInsertBefore);
    } else {
      parentElem.appendChild(newNode);
    }
  },
  insertNodes: function (newNodes, parentElem, optionalInsertBefore) {
    if (newNodes.nodeType) this.insertNode(newNodes, parentElem, optionalInsertBefore);
    else {
      for (var i = 0, l = newNodes.length; i < l; i++) {
        this.insertNode(newNodes[i], parentElem, optionalInsertBefore);
      }
    }
  },
  empty: function (node) {
    while (node.lastChild) node.removeChild(node.lastChild);
    return node;
  },
  unescapeHtml: function (str) {
    var txt = this.doc.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
  },
};

Cr.evts = Cr.evt;
Cr.event = Cr.evt;
Cr.events = Cr.evt;
