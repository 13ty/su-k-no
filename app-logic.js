const SunoApp = (function() {
  'use strict';

  const state = {
    selectedTags: [],
    activeFilter: 'all',
    activeTab: 'creator',
    tagElements: {}
  };

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  function getCategoryColor(cat) {
    return CATEGORY_COLORS[cat] || '#888';
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function weightClass(w) {
    const c = clamp(Math.round(w / 4), 1, 25);
    return 'weight-' + c;
  }

  function showToast(msg, type) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast' + (type === 'error' ? ' error' : '');
    el.classList.add('show');
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(function() { el.classList.remove('show'); }, 2200);
  }

  function updateBadges() {
    const totalBadge = document.getElementById('totalTagsBadge');
    if (totalBadge) totalBadge.textContent = state.selectedTags.length + ' tagów';
  }

  function updateBasket() {
    const container = document.getElementById('basketItems');
    const countEl = document.getElementById('basketCount');
    if (!container) return;

    if (countEl) countEl.textContent = state.selectedTags.length;

    if (state.selectedTags.length === 0) {
      container.innerHTML =
        '<div class="basket-empty">' +
        '  <div class="basket-empty-icon">⊞</div>' +
        '  <div>Kliknij tag na tablicy,<br>aby dodać go do koszyka</div>' +
        '</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < state.selectedTags.length; i++) {
      var id = state.selectedTags[i];
      var tag = SunoAnalyzer.getTagById(id);
      if (!tag) continue;
      var color = getCategoryColor(tag.category);
      html +=
        '<div class="basket-item" data-id="' + id + '">' +
        '  <span class="item-cat" style="background:' + color + '"></span>' +
        '  <span class="item-name">' + tag.name + '</span>' +
        '  <button class="item-remove" data-id="' + id + '" title="Usuń">✕</button>' +
        '</div>';
    }
    container.innerHTML = html;

    container.querySelectorAll('.item-remove').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleTag(this.dataset.id);
      });
    });
  }

  function updatePrompts() {
    var styleEl = document.getElementById('stylePrompt');
    var layoutEl = document.getElementById('lyricsLayout');
    if (!styleEl || !layoutEl) return;

    if (state.selectedTags.length === 0) {
      styleEl.textContent = 'Wybierz tagi, aby wygenerować prompt...';
      styleEl.className = 'prompt-text placeholder';
      layoutEl.textContent = 'Wybierz tagi struktury, aby wygenerować układ...';
      layoutEl.className = 'prompt-text placeholder';
      return;
    }

    var tags = state.selectedTags.map(function(id) { return SunoAnalyzer.getTagById(id); }).filter(Boolean);
    var styleParts = [];
    for (var ci = 0; ci < CATEGORY_ORDER.length; ci++) {
      var cat = CATEGORY_ORDER[ci];
      var catTags = tags.filter(function(t) { return t.category === cat; });
      if (catTags.length > 0) {
        styleParts.push(catTags.map(function(t) { return t.name; }).join(', '));
      }
    }
    styleEl.textContent = styleParts.join(' | ');
    styleEl.className = 'prompt-text';

    var structTags = tags.filter(function(t) { return t.category === 'Structure'; });
    if (structTags.length > 0) {
      var layoutLines = structTags.map(function(t) { return '[' + t.name + ']'; });
      layoutEl.textContent = layoutLines.join('\n');
      layoutEl.className = 'prompt-text';
    } else {
      layoutEl.textContent = 'Brak tagów struktury – dodaj sekcje (Intro, Verse, Chorus itp.)';
      layoutEl.className = 'prompt-text';
    }
  }

  function getConflictIds() {
    var groups = {};
    for (var i = 0; i < state.selectedTags.length; i++) {
      var id = state.selectedTags[i];
      var tag = SunoAnalyzer.getTagById(id);
      if (tag && tag.conflictGroup) {
        if (!groups[tag.conflictGroup]) groups[tag.conflictGroup] = [];
        groups[tag.conflictGroup].push(id);
      }
    }
    var conflicts = {};
    for (var g in groups) {
      if (groups[g].length > 0) {
        for (var k = 0; k < TAG_DATA.length; k++) {
          var t = TAG_DATA[k];
          if (t.conflictGroup === g && state.selectedTags.indexOf(t.id) === -1) {
            conflicts[t.id] = true;
          }
        }
      }
    }
    return conflicts;
  }

  function toggleTag(id) {
    var idx = state.selectedTags.indexOf(id);
    if (idx > -1) {
      state.selectedTags.splice(idx, 1);
    } else {
      var conflicts = getConflictIds();
      if (conflicts[id]) {
        showToast('Nie można dodać – konflikt z wybranym tagiem', 'error');
        return;
      }
      state.selectedTags.push(id);
    }
    updateBadges();
    updateBasket();
    updatePrompts();
    renderTagBoard();
  }

  function clearAllTags() {
    state.selectedTags = [];
    updateBadges();
    updateBasket();
    updatePrompts();
    renderTagBoard();
    showToast('Wyczyszczono wszystkie tagi');
  }

  function renderTagBoard() {
    var board = document.getElementById('tagBoard');
    if (!board) return;
    var conflicting = getConflictIds();
    board.innerHTML = '';

    for (var ci = 0; ci < CATEGORY_ORDER.length; ci++) {
      var cat = CATEGORY_ORDER[ci];
      if (state.activeFilter !== 'all' && state.activeFilter !== cat) continue;

      var catTags = TAG_DATA.filter(function(t) { return t.category === cat; });
      if (catTags.length === 0) continue;

      var color = getCategoryColor(cat);
      var section = document.createElement('div');
      section.className = 'category-section';

      var totalInCat = catTags.length;
      var selectedInCat = catTags.filter(function(t) { return state.selectedTags.indexOf(t.id) > -1; }).length;

      var header = document.createElement('div');
      header.className = 'category-header';
      header.innerHTML =
        '<div class="category-title">' +
        '  <span class="cat-color" style="background:' + color + '"></span>' + cat +
        '</div>' +
        '<div class="weight-legend">' +
        '  <span>' + selectedInCat + '/' + totalInCat + '</span>' +
        '  <span class="weight-bar"></span>' +
        '  <span>ciężar →</span>' +
        '</div>';
      section.appendChild(header);

      var grid = document.createElement('div');
      grid.className = 'tag-grid';

      for (var ti = 0; ti < catTags.length; ti++) {
        var tag = catTags[ti];
        var isSelected = state.selectedTags.indexOf(tag.id) > -1;
        var isConflicting = !isSelected && conflicting[tag.id];

        var card = document.createElement('div');
        card.className = 'tag-card ' + weightClass(tag.weight);
        if (isSelected) card.classList.add('selected');
        if (isConflicting) card.classList.add('conflicting');
        card.dataset.id = tag.id;
        card.textContent = tag.name;

        card.addEventListener('click', function(e) {
          var id = this.dataset.id;
          if (this.classList.contains('conflicting')) {
            showToast('Konflikt – odznacz tag z tej samej grupy', 'error');
            return;
          }
          toggleTag(id);
        });

        card.addEventListener('mouseenter', function(e) {
          showTooltip(e, this.dataset.id);
        });
        card.addEventListener('mousemove', function(e) {
          positionTooltip(e);
        });
        card.addEventListener('mouseleave', function() {
          hideTooltip();
        });

        grid.appendChild(card);
      }

      section.appendChild(grid);
      board.appendChild(section);
    }

    if (board.children.length === 0) {
      board.innerHTML = '<div class="empty-state"><div class="es-icon">◇</div><div>Brak tagów w tej kategorii.</div></div>';
    }
  }

  function renderPills() {
    var bar = document.getElementById('pillBar');
    if (!bar) return;
    bar.innerHTML = '';

    var allPill = document.createElement('button');
    allPill.className = 'pill' + (state.activeFilter === 'all' ? ' active' : '');
    allPill.innerHTML = '<span class="pill-icon">◈</span> All';
    allPill.dataset.filter = 'all';
    allPill.addEventListener('click', function() { setFilter('all'); });
    bar.appendChild(allPill);

    for (var i = 0; i < CATEGORY_ORDER.length; i++) {
      var cat = CATEGORY_ORDER[i];
      var pill = document.createElement('button');
      pill.className = 'pill' + (state.activeFilter === cat ? ' active' : '');
      var color = getCategoryColor(cat);
      var count = TAG_DATA.filter(function(t) { return t.category === cat; }).length;
      pill.innerHTML = '<span class="pill-icon" style="color:' + color + '">●</span> ' + cat + ' <span style="color:var(--text-muted);font-size:10px">' + count + '</span>';
      pill.dataset.filter = cat;
      (function(c) {
        pill.addEventListener('click', function() { setFilter(c); });
      })(cat);
      bar.appendChild(pill);
    }
  }

  function setFilter(category) {
    state.activeFilter = category;
    renderPills();
    renderTagBoard();
  }

  function switchTab(tabId) {
    state.activeTab = tabId;
    qsa('.nav-tab').forEach(function(t) { t.classList.toggle('active', t.dataset.tab === tabId); });
    var creator = document.getElementById('tabCreator');
    var check = document.getElementById('tabCheck');
    if (creator) creator.classList.toggle('active', tabId === 'creator');
    if (check) check.classList.toggle('active', tabId === 'check');
  }

  function showTooltip(e, id) {
    if (window.__externalShowTooltip && window.__externalShowTooltip(e, id)) return;
    var tooltip = document.getElementById('tooltip');
    var tag = SunoAnalyzer.getTagById(id);
    if (!tooltip || !tag) return;

    document.getElementById('ttName').textContent = tag.name;
    var catColor = getCategoryColor(tag.category);
    document.getElementById('ttCategory').innerHTML = '<span style="color:' + catColor + '">' + tag.category + '</span>';
    document.getElementById('ttDescription').textContent = tag.description;
    document.getElementById('ttSynergy').innerHTML = tag.synergy ? '<strong>Synergia:</strong> ' + tag.synergy : '';

    var kw = tag.keywords && tag.keywords.length > 0 ? tag.keywords.slice(0, 5).join(', ') : '';
    document.getElementById('ttKeywords').innerHTML = kw ? '<strong>Słowa kluczowe:</strong> ' + kw : '';

    var axesEl = document.getElementById('ttAxes');
    axesEl.innerHTML =
      '<div class="axis-row"><span class="axis-label" style="color:#ff9100">W</span><div class="axis-track"><div class="axis-fill" style="width:' + tag.weight + '%;background:#ff9100"></div></div><span class="axis-val">' + tag.weight + '</span></div>' +
      '<div class="axis-row"><span class="axis-label" style="color:#00e676">O</span><div class="axis-track"><div class="axis-fill" style="width:' + tag.organic + '%;background:#00e676"></div></div><span class="axis-val">' + tag.organic + '</span></div>' +
      '<div class="axis-row"><span class="axis-label" style="color:#00d4ff">B</span><div class="axis-track"><div class="axis-fill" style="width:' + tag.brightness + '%;background:#00d4ff"></div></div><span class="axis-val">' + tag.brightness + '</span></div>';

    tooltip.style.display = 'block';
    positionTooltip(e);
  }

  function positionTooltip(e) {
    if (window.__externalPositionTooltip && window.__externalPositionTooltip(e)) return;
    var tooltip = document.getElementById('tooltip');
    if (!tooltip || tooltip.style.display === 'none') return;
    var x = e.clientX + 16;
    var y = e.clientY + 12;
    var w = tooltip.offsetWidth;
    var h = tooltip.offsetHeight;
    if (x + w > window.innerWidth - 10) x = e.clientX - w - 10;
    if (y + h > window.innerHeight - 10) y = e.clientY - h - 10;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }

  function hideTooltip() {
    if (window.__externalHideTooltip && window.__externalHideTooltip()) return;
    var tooltip = document.getElementById('tooltip');
    if (tooltip) tooltip.style.display = 'none';
  }

  function copyText(el) {
    var text = el.textContent || el.innerText;
    if (el.classList.contains('placeholder')) {
      showToast('Brak treści do skopiowania', 'error');
      return;
    }
    navigator.clipboard.writeText(text).then(function() {
      showToast('Skopiowano do schowka ✓');
    }).catch(function() {
      showToast('Nie udało się skopiować', 'error');
    });
  }

  function handleAnalyze() {
    var input = document.getElementById('checkInput');
    var results = document.getElementById('checkResults');
    if (!input || !results) return;

    var text = input.value;
    var data = SunoAnalyzer.analyzePrompt(text);

    if (!data || data.foundTags.length === 0 && data.diagnostics.length <= 1) {
      results.innerHTML =
        '<div class="empty-state">' +
        '  <div class="es-icon">◈</div>' +
        '  <div>Nie znaleziono tagów w podanym tekście.<br>Spróbuj wpisać nazwy tagów z biblioteki.</div>' +
        '</div>';
      return;
    }

    var html = '';

    html += '<div class="result-section">';
    html += '  <div class="result-label"><span class="dot" style="background:' + (data.foundTags.length > 0 ? '#00e676' : '#ff1744') + '"></span> Znalezione tagi (' + data.foundTags.length + ')</div>';
    if (data.foundTags.length > 0) {
      html += '  <div class="found-tags">';
      for (var i = 0; i < data.foundTags.length; i++) {
        var ft = data.foundTags[i];
        var isSyn = ft.matchType === 'keyword' || ft.matchType === 'synonym';
        var modTag = ft.modifier ? '<span class="modifier-tag timbre">' + ft.modifier + '</span> ' : '';
        html += '    <div class="found-tag' + (isSyn ? ' synonym-match' : '') + '">' + modTag + ft.name + '<span class="ft-weight">' + ft.adjustedWeight + '</span></div>';
      }
      html += '  </div>';
    } else {
      html += '  <div style="color:var(--text-muted);font-size:11px">Brak rozpoznanych tagów</div>';
    }
    html += '</div>';

    if (data.unrecognized && data.unrecognized.length > 0) {
      html += '<div class="result-section">';
      html += '  <div class="result-label"><span class="dot" style="background:var(--accent-orange)"></span> Nierozpoznane terminy</div>';
      html += '  <div style="color:var(--text-muted);font-size:11px">' + data.unrecognized.join(', ') + '</div>';
      html += '</div>';
    }

    html += '<div class="result-section">';
    html += '  <div class="result-label"><span class="dot" style="background:' + (data.conflicts.length === 0 ? '#00e676' : '#ff1744') + '"></span> Konflikty</div>';
    if (data.conflicts.length > 0) {
      html += '  <div class="conflict-alert">⚠ ' + data.conflicts.length + ' konflikt(y) wykryto</div>';
      for (var ci = 0; ci < data.conflicts.length; ci++) {
        html += '  <div class="conflict-detail">' + data.conflicts[ci].description + '</div>';
      }
    } else {
      html += '  <div class="conflict-alert ok">✓ Brak konfliktów między tagami</div>';
    }
    html += '</div>';

    if (data.stats) {
      html += '<div class="result-section">';
      html += '  <div class="result-label"><span class="dot" style="background:var(--accent-cyan)"></span> Statystyki osi</div>';
      html += '  <div class="axis-summary">';
      html += '    <div class="axis-stat"><div class="as-label">W – Ciężar</div><div class="as-value" style="color:#ff9100">' + data.stats.weight.mean + '</div><div class="as-bar" style="width:' + data.stats.weight.mean + '%;background:#ff9100"></div><div style="font-size:9px;color:var(--text-muted)">σ=' + data.stats.weight.stdDev + '</div></div>';
      html += '    <div class="axis-stat"><div class="as-label">O – Organiczność</div><div class="as-value" style="color:#00e676">' + data.stats.organic.mean + '</div><div class="as-bar" style="width:' + data.stats.organic.mean + '%;background:#00e676"></div><div style="font-size:9px;color:var(--text-muted)">σ=' + data.stats.organic.stdDev + '</div></div>';
      html += '    <div class="axis-stat"><div class="as-label">B – Jasność</div><div class="as-value" style="color:#00d4ff">' + data.stats.brightness.mean + '</div><div class="as-bar" style="width:' + data.stats.brightness.mean + '%;background:#00d4ff"></div><div style="font-size:9px;color:var(--text-muted)">σ=' + data.stats.brightness.stdDev + '</div></div>';
      html += '  </div>';
      html += '</div>';

      html += '<div class="result-section">';
      html += '  <div class="result-label"><span class="dot" style="background:' + (data.coherence.score >= 65 ? '#00e676' : data.coherence.score >= 25 ? '#ff9100' : '#ff1744') + '"></span> Spójność: ' + data.coherence.score + '/100</div>';
      html += '  <div class="cohesion-ring">';
      var circumference = 2 * Math.PI * 24;
      var offset = circumference - (data.coherence.score / 100) * circumference;
      var ringColor = data.coherence.score >= 65 ? '#00e676' : data.coherence.score >= 25 ? '#ff9100' : '#ff1744';
      html += '    <div class="ring-chart">';
      html += '      <svg viewBox="0 0 64 64"><circle class="ring-bg" cx="32" cy="32" r="24"/><circle class="ring-fill" cx="32" cy="32" r="24" stroke="' + ringColor + '" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '"/></svg>';
      html += '      <div class="ring-label" style="color:' + ringColor + '">' + data.coherence.score + '</div>';
      html += '    </div>';
      html += '    <div class="ring-text">' + data.coherence.label + '</div>';
      html += '  </div>';
      html += '</div>';
    }

    if (data.diagnostics && data.diagnostics.length > 0) {
      html += '<div class="result-section">';
      html += '  <div class="result-label"><span class="dot" style="background:var(--accent-purple)"></span> Diagnostyka</div>';
      for (var di = 0; di < data.diagnostics.length; di++) {
        var d = data.diagnostics[di];
        html += '  <div class="diagnostic-box ' + d.type + '">' + d.message + '</div>';
      }
      html += '</div>';
    }

    if (data.synergies && data.synergies.length > 0) {
      html += '<div class="result-section">';
      html += '  <div class="result-label"><span class="dot" style="background:var(--accent-cyan)"></span> Sugerowane tagi</div>';
      html += '  <div class="synergy-grid">';
      for (var si = 0; si < data.synergies.length; si++) {
        var syn = data.synergies[si];
        if (state.selectedTags.indexOf(syn.id) > -1) continue;
        html += '    <div class="syn-chip" data-id="' + syn.id + '"><span class="syn-add">+</span> ' + syn.name + '</div>';
      }
      html += '  </div>';
      html += '</div>';
    }

    results.innerHTML = html;

    results.querySelectorAll('.syn-chip').forEach(function(chip) {
      chip.addEventListener('click', function() {
        toggleTag(this.dataset.id);
      });
    });
  }

  function init() {
    renderPills();
    renderTagBoard();
    updateBasket();
    updateBadges();
    updatePrompts();

    qsa('.nav-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        switchTab(this.dataset.tab);
      });
    });

    var copyStyle = document.getElementById('copyStylePrompt');
    var copyLyrics = document.getElementById('copyLyricsLayout');
    if (copyStyle) {
      copyStyle.addEventListener('click', function() {
        var el = document.getElementById('stylePrompt');
        if (el) copyText(el);
      });
    }
    if (copyLyrics) {
      copyLyrics.addEventListener('click', function() {
        var el = document.getElementById('lyricsLayout');
        if (el) copyText(el);
      });
    }

    var analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', handleAnalyze);
    }

    var checkInput = document.getElementById('checkInput');
    if (checkInput) {
      checkInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          handleAnalyze();
        }
      });
    }

    var clearBtn = document.getElementById('clearAllBtn');
    if (!clearBtn) {
      var sidebarHeader = qs('.sidebar-header h2');
      if (sidebarHeader) {
        var btn = document.createElement('button');
        btn.className = 'clear-all-btn';
        btn.id = 'clearAllBtn';
        btn.textContent = 'Wyczyść';
        btn.addEventListener('click', clearAllTags);
        sidebarHeader.appendChild(btn);
      }
    } else {
      clearBtn.addEventListener('click', clearAllTags);
    }

    document.addEventListener('click', function(e) {
      if (!e.target.closest('.tag-card') && !e.target.closest('.tooltip-overlay')) {
        hideTooltip();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    state: state,
    toggleTag: toggleTag,
    clearAll: clearAllTags,
    setFilter: setFilter,
    switchTab: switchTab,
    handleAnalyze: handleAnalyze
  };
})();
