const SunoTarotConvergence = (function () {
  "use strict";

  function findTag(id) {
    if (
      typeof SunoAnalyzer !== "undefined" &&
      typeof SunoAnalyzer.getTagById === "function"
    ) {
      return SunoAnalyzer.getTagById(id);
    }
    return (
      TAG_DATA.find(function (t) {
        return t.id === id;
      }) || null
    );
  }

  function computeAxisProximity(tagA, tagB) {
    var diffWeight = Math.abs(tagA.weight - tagB.weight);
    var diffOrganic = Math.abs(tagA.organic - tagB.organic);
    var diffBright = Math.abs(tagA.brightness - tagB.brightness);
    var avgDiff = (diffWeight + diffOrganic + diffBright) / 3;
    var score = Math.round(
      Math.max(0, Math.min(100, (1 - avgDiff / 100) * 100)),
    );
    if (tagA.category !== tagB.category) {
      score = Math.min(100, score + 15);
    }
    if (tagA.conflictGroup && tagA.conflictGroup === tagB.conflictGroup) {
      score = Math.max(0, score - 40);
    }
    return score;
  }

  function getSynergyScore(tag1Id, tag2Id) {
    if (tag1Id === tag2Id) return 100;
    var tag1 = findTag(tag1Id);
    var tag2 = findTag(tag2Id);
    if (!tag1 || !tag2) return 0;
    if (
      typeof SunoAnalyzer !== "undefined" &&
      typeof SunoAnalyzer.computeSynergyStrength === "function"
    ) {
      var result = SunoAnalyzer.computeSynergyStrength(tag1, tag2);
      if (result && typeof result.score === "number") {
        return result.score;
      }
    }
    return computeAxisProximity(tag1, tag2);
  }

  function getSynergyLabel(score) {
    if (score >= 80) return "Bardzo silna";
    if (score >= 60) return "Silna";
    if (score >= 40) return "Umiarkowana";
    if (score >= 20) return "Słaba";
    return "Bardzo słaba";
  }

  function getConvergenceData(selectedTagIds) {
    if (!selectedTagIds || selectedTagIds.length < 2) return [];
    var results = [];
    var processed = {};
    for (var i = 0; i < selectedTagIds.length; i++) {
      for (var j = i + 1; j < selectedTagIds.length; j++) {
        var tagA = selectedTagIds[i];
        var tagB = selectedTagIds[j];
        var key = tagA < tagB ? tagA + "+" + tagB : tagB + "+" + tagA;
        if (processed[key]) continue;
        processed[key] = true;
        var score = getSynergyScore(tagA, tagB);
        var label = getSynergyLabel(score);
        var key1 = tagA + "+" + tagB;
        var key2 = tagB + "+" + tagA;
        var comboName = null;
        if (typeof COMBO_NAMES !== "undefined") {
          comboName = COMBO_NAMES[key1] || COMBO_NAMES[key2] || null;
        }
        results.push({
          tagA: tagA,
          tagB: tagB,
          score: score,
          label: label,
          named: comboName !== null,
          comboName: comboName,
        });
      }
    }
    return results;
  }

  function getTopCombos(selectedTagIds, limit) {
    if (limit === undefined || limit === null) limit = 5;
    var data = getConvergenceData(selectedTagIds);
    data.sort(function (a, b) {
      return b.score - a.score;
    });
    return data.slice(0, limit);
  }

  function getBarClass(score) {
    if (score >= 80) return "convergence-bar--strong";
    if (score >= 60) return "convergence-bar--medium";
    if (score >= 40) return "convergence-bar--weak";
    return "convergence-bar--conflict";
  }

  function renderBars(containerElement, convergenceData) {
    if (!containerElement) return;
    var html = "";
    for (var i = 0; i < convergenceData.length; i++) {
      var d = convergenceData[i];
      var tagAObj = findTag(d.tagA);
      var tagBObj = findTag(d.tagB);
      var nameA = tagAObj ? tagAObj.name : d.tagA;
      var nameB = tagBObj ? tagBObj.name : d.tagB;
      var barMod = getBarClass(d.score);
      html += '<div class="convergence-bar ' + barMod + '">';
      html +=
        '<div class="convergence-bar-fill ' +
        barMod +
        '" style="width:' +
        d.score +
        '%"></div>';
      html += '<div class="convergence-bar-label">';
      if (d.named && d.comboName) {
        html +=
          '<span class="convergence-combo-name">' + d.comboName + "</span> ";
      }
      html +=
        nameA +
        " + " +
        nameB +
        ' <span class="convergence-bar-score">' +
        d.score +
        "</span>";
      html += "</div>";
      html += "</div>";
    }
    containerElement.innerHTML = html;
  }

  function ConvergenceEngine(containerId) {
    this._containerId = containerId || null;
    this._container = null;
  }

  ConvergenceEngine.prototype.initialize = function (containerId) {
    this._containerId = containerId || this._containerId;
    if (this._containerId) {
      this._container = document.getElementById(this._containerId);
    }
    return this;
  };

  ConvergenceEngine.prototype.update = function (selectedTagIds) {
    if (!this._container) {
      if (this._containerId) {
        this._container = document.getElementById(this._containerId);
      }
      if (!this._container) return this;
    }
    renderBars(this._container, getConvergenceData(selectedTagIds));
    return this;
  };

  ConvergenceEngine.prototype.updateSingle = function (tagId, selectedTagIds) {
    if (!selectedTagIds || selectedTagIds.indexOf(tagId) === -1) return this;
    var pairs = [];
    for (var i = 0; i < selectedTagIds.length; i++) {
      if (selectedTagIds[i] !== tagId) {
        var score = getSynergyScore(tagId, selectedTagIds[i]);
        var key1 = tagId + "+" + selectedTagIds[i];
        var key2 = selectedTagIds[i] + "+" + tagId;
        var comboName = null;
        if (typeof COMBO_NAMES !== "undefined") {
          comboName = COMBO_NAMES[key1] || COMBO_NAMES[key2] || null;
        }
        pairs.push({
          tagA: tagId,
          tagB: selectedTagIds[i],
          score: score,
          label: getSynergyLabel(score),
          named: comboName !== null,
          comboName: comboName,
        });
      }
    }
    if (this._container) {
      renderBars(this._container, pairs);
    }
    return this;
  };

  ConvergenceEngine.prototype.clear = function () {
    if (this._container) {
      this._container.innerHTML = "";
    }
    return this;
  };

  ConvergenceEngine.prototype.getConvergenceData = getConvergenceData;
  ConvergenceEngine.prototype.getTopCombos = getTopCombos;

  ConvergenceEngine.prototype.renderBars = function (convergenceData) {
    if (this._container) {
      renderBars(this._container, convergenceData);
    }
    return this;
  };

  return {
    ConvergenceEngine: ConvergenceEngine,
    getSynergyScore: getSynergyScore,
  };
})();
