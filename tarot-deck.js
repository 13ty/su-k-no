var SunoTarotDeck = (function () {
  "use strict";
  var STATES = {
    QUEUED: "queued",
    ENTERING: "entering",
    IDLE: "idle",
    HOVER: "hover",
    SELECTED: "selected",
    DISSOLVING: "dissolving",
    TOKEN: "token",
    FADING: "fading",
    DIMMED: "dimmed",
  };
  var TRANSITIONS = {
    queued: { entering: true },
    entering: { idle: true },
    idle: { hover: true, selected: true, dimmed: true, fading: true },
    hover: { idle: true },
    selected: { dissolving: true },
    dissolving: { token: true },
    dimmed: { idle: true },
    fading: { dissolving: true },
  };
  var CATEGORY_SYMBOLS = {
    Structure: "\u269C",
    Genres: "\u266A",
    Instruments: "\u266B",
    Vocals: "\u2661",
    Production: "\u2699",
    "Mood/Tempo": "\u263D",
  };
  var _styleInjected = false;
  function _getCatSymbol(cat) {
    return CATEGORY_SYMBOLS[cat] || "\u25C7";
  }
  function _getCatColor(cat) {
    return (
      (typeof CATEGORY_COLORS != "undefined" && CATEGORY_COLORS[cat]) || "#888"
    );
  }
  function _lookupTag(id) {
    if (typeof SunoAnalyzer != "undefined" && SunoAnalyzer.getTagById) {
      var t = SunoAnalyzer.getTagById(id);
      if (t) return t;
    }
    if (typeof TAG_DATA != "undefined") {
      for (var i = 0; i < TAG_DATA.length; i++)
        if (TAG_DATA[i].id === id) return TAG_DATA[i];
    }
    return null;
  }
  function _injectStyles() {
    if (_styleInjected) return;
    _styleInjected = true;
    var s = document.createElement("style");
    s.textContent =
      ".tarot-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;padding:12px;perspective:1000px}@media(max-width:1024px){.tarot-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:640px){.tarot-grid{grid-template-columns:repeat(2,1fr)}}.tarot-card{position:relative;border-radius:10px;cursor:pointer;transition:transform .3s ease,opacity .3s ease,box-shadow .3s ease;will-change:transform,opacity;background:linear-gradient(135deg,rgba(255,255,255,.06),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(4px);min-height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px 10px;text-align:center;user-select:none;overflow:hidden}.tarot-card:hover{border-color:rgba(255,255,255,.2)}.tarot-card.state-queued{opacity:0;transform:scale(.6) translateY(20px)}.tarot-card.state-entering{opacity:1;transform:scale(1) translateY(0);transition:transform .35s ease,opacity .35s ease}.tarot-card.state-idle{opacity:1;transform:translateY(0)}.tarot-card.state-hover{transform:translateY(-6px) scale(1.05);box-shadow:0 10px 30px rgba(255,215,0,.2),0 0 15px rgba(255,215,0,.08);border-color:rgba(255,215,0,.35);z-index:10}.tarot-card.state-selected{transform:scale(1.1);box-shadow:0 0 25px rgba(255,215,0,.45);border-color:#ffd700}.tarot-card.state-dissolving{opacity:0;transform:scale(.7) translateY(-15px);transition:transform .5s ease,opacity .5s ease}.tarot-card.state-token{display:none}.tarot-card.state-fading{opacity:.25;transform:scale(.92)}.tarot-card.state-dimmed{opacity:.35;transform:scale(.9);filter:grayscale(.5)}.tarot-card-inner{display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;position:relative;z-index:1}.card-symbol{font-size:26px;line-height:1}.card-name{font-size:12px;font-weight:600;color:#fff;line-height:1.3}.card-category{font-size:9px;text-transform:uppercase;letter-spacing:1px;opacity:.65}.card-bar{position:absolute;top:0;left:0;right:0;height:3px;border-radius:10px 10px 0 0}@keyframes tarot-float{0%,100%{transform:translateY(0)}50%{transform:translateY(calc(var(--fd,12px)*-1))}}.tarot-card.state-idle.af,.tarot-card.state-entering.af{animation:tarot-float var(--fdu,6s) ease-in-out infinite}";
    document.head.appendChild(s);
  }
  function CardStateManager() {
    this._cards = {};
    this._seq = 0;
  }
  CardStateManager.prototype.createCard = function (tagId, batchIndex) {
    this._seq++;
    var id = "tc-" + this._seq;
    var tag = _lookupTag(tagId);
    var cat = tag ? tag.category : "Unknown";
    this._cards[id] = {
      id: id,
      tagId: tagId,
      name: tag ? tag.name : tagId,
      category: cat,
      symbol: _getCatSymbol(cat),
      state: STATES.QUEUED,
      element: null,
      batchIndex: batchIndex !== undefined ? batchIndex : 0,
    };
    return this._cards[id];
  };
  CardStateManager.prototype.getCard = function (id) {
    return this._cards[id] || null;
  };
  CardStateManager.prototype.setState = function (id, ns) {
    var c = this._cards[id];
    if (!c) return false;
    var a = TRANSITIONS[c.state];
    if (!a || !a[ns]) return false;
    c.state = ns;
    if (c.element) {
      c.element.className = "tarot-card state-" + ns;
      c.element.dataset.state = ns;
      if (ns === STATES.IDLE || ns === STATES.ENTERING)
        c.element.classList.add("af");
    }
    return true;
  };
  CardStateManager.prototype.getCardsByState = function (s) {
    var r = [];
    for (var k in this._cards)
      if (this._cards[k].state === s) r.push(this._cards[k]);
    return r;
  };
  CardStateManager.prototype.getAllCards = function () {
    var r = [];
    for (var k in this._cards) r.push(this._cards[k]);
    return r;
  };
  CardStateManager.prototype.getActiveCards = function () {
    var o = STATES;
    var r = [];
    var a = this.getAllCards();
    for (var i = 0; i < a.length; i++) {
      var s = a[i].state;
      if (
        s === o.QUEUED ||
        s === o.ENTERING ||
        s === o.IDLE ||
        s === o.HOVER ||
        s === o.SELECTED ||
        s === o.DIMMED ||
        s === o.FADING
      )
        r.push(a[i]);
    }
    return r;
  };
  function DeckRenderer() {
    this._containerId = null;
    this._onClick = null;
    this._onHover = null;
    this._onLeave = null;
    this._sm = null;
    _injectStyles();
  }
  DeckRenderer.prototype.useStateManager = function (sm) {
    this._sm = sm;
  };
  DeckRenderer.prototype._buildEl = function (card) {
    var el = document.createElement("div");
    el.className = "tarot-card state-" + card.state;
    el.dataset.cardId = card.id;
    el.dataset.state = card.state;
    card.element = el;
    var c = _getCatColor(card.category);
    var bar = el.appendChild(document.createElement("div"));
    bar.className = "card-bar";
    bar.style.background = c;
    var inner = document.createElement("div");
    inner.className = "tarot-card-inner";
    var sym = inner.appendChild(document.createElement("div"));
    sym.className = "card-symbol";
    sym.style.color = c;
    sym.textContent = card.symbol;
    var nm = inner.appendChild(document.createElement("div"));
    nm.className = "card-name";
    nm.textContent = card.name;
    var cat = inner.appendChild(document.createElement("div"));
    cat.className = "card-category";
    cat.style.color = c;
    cat.textContent = card.category;
    el.appendChild(inner);
    var self = this;
    el.addEventListener("click", function (e) {
      if (self._onClick) self._onClick(this.dataset.cardId, e);
    });
    el.addEventListener("mouseenter", function (e) {
      if (self._onHover) self._onHover(this.dataset.cardId, e);
    });
    el.addEventListener("mouseleave", function (e) {
      if (self._onLeave) self._onLeave(this.dataset.cardId, e);
    });
    return el;
  };
  DeckRenderer.prototype.renderCards = function (containerId, cards) {
    this._containerId = containerId;
    var container = document.getElementById(containerId);
    if (!container) return;
    container.className = "tarot-grid";
    container.innerHTML = "";
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var el = this._buildEl(card);
      container.appendChild(el);
      el.style.setProperty("--fd", 8 + Math.random() * 12 + "px");
      el.style.setProperty("--fdu", 5 + Math.random() * 3 + "s");
      if (card.state === STATES.QUEUED) this._enterAnim(card, el, i);
      else if (card.state === STATES.IDLE || card.state === STATES.ENTERING)
        el.classList.add("af");
    }
  };
  DeckRenderer.prototype._enterAnim = function (card, el, index) {
    var self = this;
    setTimeout(function () {
      if (card.state !== STATES.QUEUED) return;
      card.state = STATES.ENTERING;
      el.className = "tarot-card state-" + STATES.ENTERING + " af";
      el.dataset.state = STATES.ENTERING;
      if (self._sm) self._sm.setState(card.id, STATES.ENTERING);
      setTimeout(function () {
        if (card.state !== STATES.ENTERING) return;
        card.state = STATES.IDLE;
        el.className = "tarot-card state-" + STATES.IDLE + " af";
        el.dataset.state = STATES.IDLE;
        if (self._sm) self._sm.setState(card.id, STATES.IDLE);
      }, 380);
    }, index * 80);
  };
  DeckRenderer.prototype.updateCard = function (cardId) {
    var sm = this._sm;
    var card = sm ? sm.getCard(cardId) : null;
    if (!card) return;
    var el = document.querySelector('[data-card-id="' + cardId + '"]');
    if (!el) return;
    el.className = "tarot-card state-" + card.state;
    el.dataset.state = card.state;
    if (card.state === STATES.IDLE || card.state === STATES.ENTERING)
      el.classList.add("af");
  };
  DeckRenderer.prototype.removeCard = function (cardId, animate) {
    var el = document.querySelector('[data-card-id="' + cardId + '"]');
    if (!el) return;
    var self = this;
    function cleanup() {
      if (el.parentNode) el.parentNode.removeChild(el);
      if (self._sm) {
        var c = self._sm.getCard(cardId);
        if (c) c.element = null;
      }
    }
    if (animate) {
      el.className = "tarot-card state-dissolving";
      setTimeout(cleanup, 550);
    } else {
      cleanup();
    }
  };
  DeckRenderer.prototype.onClick = function (cb) {
    this._onClick = cb;
  };
  DeckRenderer.prototype.onHover = function (cb) {
    this._onHover = cb;
  };
  DeckRenderer.prototype.onLeave = function (cb) {
    this._onLeave = cb;
  };
  function BatchManager(stateManager, renderer) {
    this._sm = stateManager;
    this._renderer = renderer;
    this._allCards = [];
    this._batches = [];
    this._currentIndex = -1;
    this._duration = 30000;
    this._timer = null;
    this._onBatchEnd = null;
    this._onAllComplete = null;
  }
  BatchManager.prototype._chunk = function (cards) {
    var sizes = [10, 5, 5];
    var remaining = cards.slice();
    var batches = [];
    for (var i = 0; i < sizes.length; i++) {
      if (remaining.length === 0) break;
      batches.push(remaining.splice(0, Math.min(sizes[i], remaining.length)));
    }
    if (remaining.length > 0) batches.push(remaining);
    return batches;
  };
  BatchManager.prototype.startBatch = function (allCards) {
    this._cancelTimer();
    this._allCards = allCards.slice();
    this._batches = this._chunk(allCards);
    this._currentIndex = -1;
    this._showNext();
  };
  BatchManager.prototype.showNextBatch = function () {
    this._cancelTimer();
    this._showNext();
  };
  BatchManager.prototype._showNext = function () {
    this._currentIndex++;
    if (this._currentIndex >= this._batches.length) {
      if (this._onAllComplete) this._onAllComplete();
      return;
    }
    var batch = this._batches[this._currentIndex];
    var cards = [];
    for (var i = 0; i < batch.length; i++) {
      cards.push(
        this._sm.createCard(
          typeof batch[i] === "object"
            ? batch[i].id || batch[i].tagId
            : batch[i],
          this._currentIndex,
        ),
      );
    }
    this._renderer.renderCards(this._renderer._containerId, cards);
    var self = this;
    this._timer = setTimeout(function () {
      self._onTimer();
    }, this._duration);
  };
  BatchManager.prototype._onTimer = function () {
    var all = this._sm.getAllCards();
    var unchosen = [];
    for (var i = 0; i < all.length; i++) {
      if (
        all[i].state === STATES.IDLE ||
        all[i].state === STATES.ENTERING ||
        all[i].state === STATES.QUEUED
      )
        unchosen.push(all[i]);
    }
    for (var j = 0; j < unchosen.length; j++)
      this._staggerDissolve(unchosen[j], j);
    if (this._onBatchEnd) this._onBatchEnd(this._currentIndex);
    var self = this;
    setTimeout(
      function () {
        self._showNext();
      },
      unchosen.length * 200 + 1000,
    );
  };
  BatchManager.prototype._staggerDissolve = function (card, idx) {
    var self = this;
    setTimeout(function () {
      if (
        card.state !== STATES.IDLE &&
        card.state !== STATES.ENTERING &&
        card.state !== STATES.QUEUED
      )
        return;
      self._sm.setState(card.id, STATES.FADING);
      self._renderer.updateCard(card.id);
      setTimeout(function () {
        if (card.state !== STATES.FADING) return;
        self._sm.setState(card.id, STATES.DISSOLVING);
        self._renderer.updateCard(card.id);
        setTimeout(function () {
          if (card.state !== STATES.DISSOLVING) return;
          self._sm.setState(card.id, STATES.TOKEN);
          self._renderer.removeCard(card.id, false);
        }, 550);
      }, 300);
    }, idx * 200);
  };
  BatchManager.prototype.getCurrentBatch = function () {
    if (this._currentIndex < 0 || this._currentIndex >= this._batches.length)
      return null;
    return this._batches[this._currentIndex];
  };
  BatchManager.prototype.isLastBatch = function () {
    return this._currentIndex >= this._batches.length - 1;
  };
  BatchManager.prototype.getRemainingCards = function () {
    var rem = [];
    for (var i = this._currentIndex + 1; i < this._batches.length; i++)
      for (var j = 0; j < this._batches[i].length; j++)
        rem.push(this._batches[i][j]);
    return rem;
  };
  BatchManager.prototype.setBatchDuration = function (ms) {
    this._duration = ms;
  };
  BatchManager.prototype.onBatchEnd = function (cb) {
    this._onBatchEnd = cb;
  };
  BatchManager.prototype.onAllComplete = function (cb) {
    this._onAllComplete = cb;
  };
  BatchManager.prototype.destroy = function () {
    this._cancelTimer();
  };
  BatchManager.prototype._cancelTimer = function () {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  };
  return {
    CardStateManager: CardStateManager,
    DeckRenderer: DeckRenderer,
    BatchManager: BatchManager,
    STATES: STATES,
  };
})();
