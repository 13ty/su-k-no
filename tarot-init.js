var SunoTarotInit = (function () {
  "use strict";

  var _active = false;
  var _stateManager = null;
  var _deckRenderer = null;
  var _batchManager = null;
  var _particleEngine = null;
  var _convergenceEngine = null;
  var _toggleBtn = null;
  var _container = null;
  var _tagBoard = null;
  var _pillBar = null;

  function init() {
    _toggleBtn = document.getElementById("tarotToggleBtn");
    _container = document.getElementById("tarot-container");
    _tagBoard = document.getElementById("tagBoard");
    _pillBar = document.getElementById("pillBar");
    if (_toggleBtn) {
      _toggleBtn.addEventListener("click", toggleMode);
    }
  }

  function toggleMode() {
    if (_active) {
      disableTarotMode();
    } else {
      enableTarotMode();
    }
  }

  function pickRandomTags(count) {
    if (typeof TAG_DATA === "undefined" || !TAG_DATA.length) return [];
    var pool = TAG_DATA.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    return pool.slice(0, count);
  }

  function enableTarotMode() {
    if (_active) return;
    if (typeof SunoTarotDeck === "undefined") return;
    _active = true;

    if (_tagBoard) _tagBoard.style.display = "none";
    if (_pillBar) _pillBar.style.display = "none";
    if (_container) _container.style.display = "block";
    if (_toggleBtn) _toggleBtn.style.borderColor = "#ffd700";

    _stateManager = new SunoTarotDeck.CardStateManager();
    _deckRenderer = new SunoTarotDeck.DeckRenderer();
    _deckRenderer.useStateManager(_stateManager);
    if (_container && _container.id) {
      _deckRenderer._containerId = _container.id;
    }

    _particleEngine = new SunoTarotParticle.ParticleEngine({ mode: "auto" });
    _convergenceEngine = new SunoTarotConvergence.ConvergenceEngine();
    _convergenceEngine.initialize(null);

    _deckRenderer.onClick(function (cardId) {
      var card = _stateManager.getCard(cardId);
      if (!card) return;
      var tagId = card.tagId;

      if (
        card.state !== SunoTarotDeck.STATES.IDLE &&
        card.state !== SunoTarotDeck.STATES.HOVER
      ) {
        return;
      }

      _stateManager.setState(cardId, SunoTarotDeck.STATES.SELECTED);
      _deckRenderer.updateCard(cardId);

      dimOtherCards(cardId);

      if (typeof SunoApp !== "undefined" && SunoApp.toggleTag) {
        SunoApp.toggleTag(tagId);
      }

      if (card.element) {
        _stateManager.setState(cardId, SunoTarotDeck.STATES.DISSOLVING);
        _deckRenderer.updateCard(cardId);
        _particleEngine.createDissolveEffect(card.element, {
          particleCount: 40,
          duration: 1200,
        });
      }

      setTimeout(function () {
        if (!_stateManager) return;
        _stateManager.setState(cardId, SunoTarotDeck.STATES.TOKEN);
      }, 1200);
    });

    _deckRenderer.onHover(function (cardId, event) {
      var card = _stateManager.getCard(cardId);
      if (!card) return;
      if (
        card.state !== SunoTarotDeck.STATES.IDLE &&
        card.state !== SunoTarotDeck.STATES.HOVER
      )
        return;

      _stateManager.setState(cardId, SunoTarotDeck.STATES.HOVER);
      _deckRenderer.updateCard(cardId);

      var tagData = resolveTagData(card.tagId);
      var selected = getSelectedTagIds();
      if (tagData && typeof SunoTarotDetailWindow !== "undefined") {
        var cardEl = card.element || event.target;
        SunoTarotDetailWindow.DetailWindow.show(tagData, cardEl, selected);
      }
    });

    _deckRenderer.onLeave(function (cardId) {
      var card = _stateManager.getCard(cardId);
      if (!card) return;
      if (card.state !== SunoTarotDeck.STATES.HOVER) return;

      _stateManager.setState(cardId, SunoTarotDeck.STATES.IDLE);
      _deckRenderer.updateCard(cardId);

      if (typeof SunoTarotDetailWindow !== "undefined") {
        SunoTarotDetailWindow.DetailWindow.hide();
      }
    });

    var tags = pickRandomTags(20);
    _batchManager = new SunoTarotDeck.BatchManager(
      _stateManager,
      _deckRenderer,
    );
    _batchManager.setBatchDuration(25000);
    _batchManager.onBatchEnd(function (batchIndex) {
      if (typeof SunoTarotDetailWindow !== "undefined") {
        SunoTarotDetailWindow.DetailWindow.hide();
      }
    });
    _batchManager.onAllComplete(function () {});
    _batchManager.startBatch(tags);
  }

  function disableTarotMode() {
    if (!_active) return;
    _active = false;

    if (typeof SunoTarotDetailWindow !== "undefined") {
      SunoTarotDetailWindow.DetailWindow.hide();
    }

    if (_particleEngine) {
      _particleEngine.destroy();
      _particleEngine = null;
    }

    if (_batchManager) {
      _batchManager.destroy();
      _batchManager = null;
    }

    _stateManager = null;
    _deckRenderer = null;

    if (_container) {
      _container.style.display = "none";
      _container.innerHTML = "";
    }
    if (_tagBoard) _tagBoard.style.display = "";
    if (_pillBar) _pillBar.style.display = "";
    if (_toggleBtn) _toggleBtn.style.borderColor = "";
  }

  function dimOtherCards(selectedCardId) {
    var all = _stateManager.getAllCards();
    for (var i = 0; i < all.length; i++) {
      var c = all[i];
      if (c.id !== selectedCardId) {
        if (
          c.state === SunoTarotDeck.STATES.IDLE ||
          c.state === SunoTarotDeck.STATES.HOVER
        ) {
          _stateManager.setState(c.id, SunoTarotDeck.STATES.DIMMED);
          _deckRenderer.updateCard(c.id);
        }
      }
    }
  }

  function getSelectedTagIds() {
    if (typeof SunoApp !== "undefined" && SunoApp.state) {
      return SunoApp.state.selectedTags || [];
    }
    return [];
  }

  function resolveTagData(tagId) {
    if (typeof SunoAnalyzer !== "undefined" && SunoAnalyzer.getTagById) {
      return SunoAnalyzer.getTagById(tagId);
    }
    if (typeof TAG_DATA !== "undefined") {
      for (var i = 0; i < TAG_DATA.length; i++) {
        if (TAG_DATA[i].id === tagId) return TAG_DATA[i];
      }
    }
    return null;
  }

  document.addEventListener("DOMContentLoaded", init);

  return {
    init: init,
    enable: enableTarotMode,
    disable: disableTarotMode,
    isActive: function () {
      return _active;
    },
  };
})();
