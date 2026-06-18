const SunoTarotDetailWindow = (function () {
  "use strict";

  var _el = null;
  var _visible = false;
  var _currentTagData = null;
  var _fadeTimer = null;

  function getCategoryColor(cat) {
    return (
      (typeof CATEGORY_COLORS !== "undefined" && CATEGORY_COLORS[cat]) || "#888"
    );
  }

  function createElement() {
    var el = document.createElement("div");
    el.className = "tarot-detail-window";
    el.innerHTML =
      '<div class="tarot-detail-header">' +
      '<h3 class="tarot-detail-name"></h3>' +
      '<span class="tarot-detail-category"></span>' +
      "</div>" +
      '<div class="tarot-detail-description"></div>' +
      '<div class="tarot-detail-convergence"></div>' +
      '<div class="tarot-detail-combos"></div>' +
      '<div class="tarot-detail-selected-tags"></div>';
    document.body.appendChild(el);
    return el;
  }

  function getElement() {
    if (!_el) {
      _el = createElement();
    }
    return _el;
  }

  function position(cardElement) {
    var el = getElement();
    if (!cardElement || !cardElement.getBoundingClientRect) return;

    var cardRect = cardElement.getBoundingClientRect();
    var gap = 10;

    var elW = el.offsetWidth || 280;
    var elH = el.offsetHeight || 300;

    var x = cardRect.right + gap;
    var y = cardRect.top;

    if (x + elW > window.innerWidth - 10) {
      x = cardRect.left - elW - gap;
    }

    if (y + elH > window.innerHeight - 10) {
      y = Math.max(10, window.innerHeight - elH - 10);
    }

    if (x < 10) x = 10;
    if (y < 10) y = 10;

    el.style.left = x + "px";
    el.style.top = y + "px";
  }

  function getSynergy(tag1, tag2) {
    if (
      typeof SunoAnalyzer !== "undefined" &&
      SunoAnalyzer.computeSynergyStrength
    ) {
      return SunoAnalyzer.computeSynergyStrength(tag1, tag2);
    }
    return null;
  }

  function getTagById(id) {
    if (typeof SunoAnalyzer !== "undefined" && SunoAnalyzer.getTagById) {
      return SunoAnalyzer.getTagById(id);
    }
    var found = null;
    if (typeof TAG_DATA !== "undefined") {
      for (var i = 0; i < TAG_DATA.length; i++) {
        if (TAG_DATA[i].id === id) {
          found = TAG_DATA[i];
          break;
        }
      }
    }
    return found;
  }

  function getComboName(tagId1, tagId2) {
    if (typeof COMBO_NAMES === "undefined") return null;
    var key = tagId1 + "+" + tagId2;
    var rev = tagId2 + "+" + tagId1;
    return COMBO_NAMES[key] || COMBO_NAMES[rev] || null;
  }

  function renderConvergence(tagData, selectedTags) {
    var container = getElement().querySelector(".tarot-detail-convergence");
    if (!container) return;

    var html = "";
    var count = 0;
    for (var i = 0; i < selectedTags.length; i++) {
      var selId = selectedTags[i];
      if (selId === tagData.id) continue;
      var selTag = getTagById(selId);
      if (!selTag) continue;

      var synergy = getSynergy(tagData, selTag);
      var score = synergy ? synergy.score : 50;
      var label = synergy ? synergy.label : "";

      var color =
        score >= 80
          ? "#00e676"
          : score >= 60
            ? "#00d4ff"
            : score >= 40
              ? "#ffeb3b"
              : score >= 20
                ? "#ff9100"
                : "#ff1744";

      html +=
        '<div class="tarot-detail-convergence-bar">' +
        '<span class="bar-label">' +
        selTag.name +
        "</span>" +
        '<div class="bar-track">' +
        '<div class="bar-fill" style="width:' +
        score +
        "%;background:" +
        color +
        '"></div>' +
        "</div>" +
        '<span class="bar-score">' +
        score +
        "%</span>" +
        "</div>";
      count++;
    }

    if (count > 0) {
      container.innerHTML =
        '<div class="convergence-label">Zbie\u017cno\u015b\u0107 z wybranymi</div>' +
        html;
    } else {
      container.innerHTML = "";
    }
  }

  function renderCombos(tagData, selectedTags) {
    var container = getElement().querySelector(".tarot-detail-combos");
    if (!container) return;

    var allIds = [tagData.id];
    for (var i = 0; i < selectedTags.length; i++) {
      if (selectedTags[i] !== tagData.id) {
        allIds.push(selectedTags[i]);
      }
    }

    var combos = [];
    for (var i = 0; i < allIds.length; i++) {
      for (var j = i + 1; j < allIds.length; j++) {
        var name = getComboName(allIds[i], allIds[j]);
        if (name) {
          combos.push(name);
        }
      }
    }

    if (combos.length > 0) {
      var html = '<div class="combos-label">Kombinacje</div>';
      for (var k = 0; k < combos.length; k++) {
        html += '<span class="combo-chip">' + combos[k] + "</span>";
      }
      container.innerHTML = html;
    } else {
      container.innerHTML = "";
    }
  }

  function renderSelectedTags(tagData, selectedTags) {
    var container = getElement().querySelector(".tarot-detail-selected-tags");
    if (!container) return;

    if (selectedTags.length === 0) {
      container.innerHTML = "";
      return;
    }

    var html =
      '<div class="selected-tags-label">Wybrane tagi</div>' +
      '<div class="selected-tags-list">';

    for (var i = 0; i < selectedTags.length; i++) {
      var id = selectedTags[i];
      var tag = getTagById(id);
      if (!tag) continue;
      var color = getCategoryColor(tag.category);
      html +=
        '<span class="selected-tag-chip" style="border-color:' +
        color +
        '">' +
        '<span class="chip-dot" style="background:' +
        color +
        '"></span>' +
        tag.name +
        "</span>";
    }

    html += "</div>";
    container.innerHTML = html;
  }

  return {
    DetailWindow: {
      show: function (tagData, cardElement, selectedTags) {
        _currentTagData = tagData;
        var tags = selectedTags || [];

        var el = getElement();

        el.querySelector(".tarot-detail-name").textContent =
          tagData.name || tagData.id || "";

        var catColor = getCategoryColor(tagData.category);
        var catEl = el.querySelector(".tarot-detail-category");
        catEl.textContent = tagData.category || "";
        catEl.style.color = catColor;
        catEl.style.borderColor = catColor;

        el.querySelector(".tarot-detail-description").textContent =
          tagData.description || "";

        renderConvergence(tagData, tags);
        renderCombos(tagData, tags);
        renderSelectedTags(tagData, tags);

        position(cardElement);

        clearTimeout(_fadeTimer);
        requestAnimationFrame(function () {
          el.classList.add("tarot-detail-window--visible");
        });
        _visible = true;
      },

      hide: function () {
        var el = getElement();
        el.classList.remove("tarot-detail-window--visible");
        _visible = false;
        _currentTagData = null;

        _fadeTimer = setTimeout(function () {
          if (!_visible) {
            el.style.pointerEvents = "none";
          }
        }, 250);
      },

      update: function (selectedTags) {
        if (!_visible || !_currentTagData) return;
        var tags = selectedTags || [];
        renderConvergence(_currentTagData, tags);
        renderCombos(_currentTagData, tags);
        renderSelectedTags(_currentTagData, tags);
      },
    },
  };
})();
