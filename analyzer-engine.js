const SunoAnalyzer = (function () {
  "use strict";

  const MODIFIERS = {
    resonant: {
      weight: 0,
      organic: 15,
      brightness: 5,
      desc: "Rezonans wzmacnia naturalność",
    },
    distorted: {
      weight: 15,
      organic: -15,
      brightness: -10,
      desc: "Przesterowanie zwiększa ciężar, zmniejsza organiczność i jasność",
    },
    ambient: {
      weight: -8,
      organic: -5,
      brightness: 5,
      desc: "Ambient obniża ciężar",
    },
    clean: {
      weight: -5,
      organic: 10,
      brightness: 5,
      desc: "Czyste brzmienie zwiększa organiczność",
    },
    heavy: {
      weight: 15,
      organic: -5,
      brightness: -8,
      desc: "Heavy zwiększa ciężar",
    },
    soft: {
      weight: -10,
      organic: 10,
      brightness: 5,
      desc: "Soft zmniejsza ciężar, dodaje organiczności",
    },
    dark: {
      weight: 5,
      organic: 0,
      brightness: -15,
      desc: "Dark znacząco obniża jasność",
    },
    bright: {
      weight: -3,
      organic: 0,
      brightness: 15,
      desc: "Bright zwiększa jasność",
    },
    warm: {
      weight: -3,
      organic: 12,
      brightness: -5,
      desc: "Warm dodaje organiczności, zmniejsza jasność",
    },
    cold: {
      weight: 5,
      organic: -8,
      brightness: 8,
      desc: "Cold zmniejsza organiczność",
    },
    dry: {
      weight: 0,
      organic: -10,
      brightness: 0,
      desc: "Dry zmniejsza organiczność",
    },
    wet: {
      weight: 0,
      organic: 12,
      brightness: 5,
      desc: "Wet zwiększa organiczność",
    },
    deep: {
      weight: 8,
      organic: 0,
      brightness: -5,
      desc: "Deep zwiększa ciężar",
    },
    harsh: {
      weight: 12,
      organic: -12,
      brightness: -8,
      desc: "Harsh zwiększa ciężar, zmniejsza organiczność",
    },
    smooth: {
      weight: -5,
      organic: 10,
      brightness: 8,
      desc: "Smooth zwiększa organiczność i jasność",
    },
    aggressive: {
      weight: 18,
      organic: -8,
      brightness: -10,
      desc: "Aggressive zwiększa ciężar",
    },
    gentle: {
      weight: -10,
      organic: 12,
      brightness: 5,
      desc: "Gentle zmniejsza ciężar, dodaje organiczności",
    },
    minimal: {
      weight: -15,
      organic: 5,
      brightness: 0,
      desc: "Minimal znacząco zmniejsza ciężar",
    },
    complex: {
      weight: 10,
      organic: -3,
      brightness: 5,
      desc: "Complex zwiększa ciężar",
    },
    raw: {
      weight: 15,
      organic: 15,
      brightness: -5,
      desc: "Raw zwiększa ciężar i organiczność",
    },
    polished: {
      weight: -5,
      organic: -10,
      brightness: 10,
      desc: "Polished zmniejsza organiczność, zwiększa jasność",
    },
    lush: {
      weight: 5,
      organic: 12,
      brightness: 8,
      desc: "Lush zwiększa organiczność i jasność",
    },
    gritty: {
      weight: 12,
      organic: -8,
      brightness: -10,
      desc: "Gritty zwiększa ciężar, zmniejsza jasność",
    },
    airy: {
      weight: -8,
      organic: 5,
      brightness: 15,
      desc: "Airy zmniejsza ciężar, zwiększa jasność",
    },
    punchy: {
      weight: 12,
      organic: -3,
      brightness: 5,
      desc: "Punchy zwiększa ciężar",
    },
    tight: {
      weight: 5,
      organic: -5,
      brightness: 8,
      desc: "Tight zwiększa ciężar i jasność",
    },
    loose: {
      weight: -5,
      organic: 10,
      brightness: -3,
      desc: "Loose zwiększa organiczność",
    },
    epic: {
      weight: 15,
      organic: 5,
      brightness: 5,
      desc: "Epic zwiększa wszystkie osie",
    },
    cinematic: {
      weight: 10,
      organic: 8,
      brightness: 3,
      desc: "Cinematic zwiększa ciężar i organiczność",
    },
  };

  const TAG_BY_ID = {};
  const TAG_BY_NAME = {};
  const TAG_BY_KEYWORD = {};
  let initialized = false;

  function initIndex() {
    if (initialized) return;
    for (const tag of TAG_DATA) {
      TAG_BY_ID[tag.id] = tag;
      TAG_BY_NAME[tag.name.toLowerCase()] = tag;
      for (const kw of tag.keywords) {
        const key = kw.toLowerCase();
        if (!TAG_BY_KEYWORD[key]) TAG_BY_KEYWORD[key] = [];
        TAG_BY_KEYWORD[key].push(tag);
      }
    }
    initialized = true;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function findTagByText(text) {
    initIndex();
    const t = text.trim().toLowerCase();
    if (!t) return null;
    if (TAG_BY_ID[t]) return { tag: TAG_BY_ID[t], matchType: "id" };
    if (TAG_BY_NAME[t]) return { tag: TAG_BY_NAME[t], matchType: "name" };
    if (TAG_BY_KEYWORD[t] && TAG_BY_KEYWORD[t].length > 0) {
      return { tag: TAG_BY_KEYWORD[t][0], matchType: "keyword" };
    }
    return null;
  }

  function calcStats(values) {
    if (!values || values.length === 0)
      return { mean: 0, stdDev: 0, min: 0, max: 0, n: 0 };
    const n = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    const stdDev = Math.sqrt(variance);
    return {
      mean: Math.round(mean * 10) / 10,
      stdDev: Math.round(stdDev * 10) / 10,
      min: Math.min(...values),
      max: Math.max(...values),
      n,
    };
  }

  function computeAxisStats(tags) {
    const weights = tags.map((t) => t.adjustedWeight);
    const organics = tags.map((t) => t.adjustedOrganic);
    const brightnesses = tags.map((t) => t.adjustedBrightness);
    return {
      weight: calcStats(weights),
      organic: calcStats(organics),
      brightness: calcStats(brightnesses),
    };
  }

  function detectConflicts(tags) {
    const conflicts = [];
    const groups = {};
    for (const t of tags) {
      const tag = TAG_BY_ID[t.id];
      if (tag && tag.conflictGroup) {
        if (!groups[tag.conflictGroup]) groups[tag.conflictGroup] = [];
        groups[tag.conflictGroup].push(tag);
      }
    }
    for (const [group, members] of Object.entries(groups)) {
      if (members.length > 1) {
        conflicts.push({
          group,
          members,
          description: `Konflikt w grupie "${group}": ${members.map((m) => m.name).join(", ")}`,
        });
      }
    }
    return conflicts;
  }

  function calcCoherence(tags, conflicts) {
    if (tags.length === 0)
      return { score: 0, level: "none", label: "Brak tagów" };
    if (tags.length === 1)
      return { score: 100, level: "perfect", label: "Idealna" };

    const stats = computeAxisStats(tags);
    const maxStdDev = 50;
    const wStd = Math.min(stats.weight.stdDev / maxStdDev, 1);
    const oStd = Math.min(stats.organic.stdDev / maxStdDev, 1);
    const bStd = Math.min(stats.brightness.stdDev / maxStdDev, 1);
    const avgStd = (wStd + oStd + bStd) / 3;

    const conflictPenalty = conflicts.length * 15;
    const categoryBonus = Math.min(tags.length / 3, 1) * 5;

    let score = Math.round(
      Math.max(
        0,
        Math.min(100, (1 - avgStd) * 100 - conflictPenalty + categoryBonus),
      ),
    );

    let level, label;
    if (score >= 85) {
      level = "excellent";
      label = "Bardzo wysoka";
    } else if (score >= 65) {
      level = "good";
      label = "Wysoka";
    } else if (score >= 45) {
      level = "fair";
      label = "Średnia";
    } else if (score >= 25) {
      level = "low";
      label = "Niska";
    } else {
      level = "poor";
      label = "Bardzo niska";
    }

    return { score, level, label };
  }

  function parseSynergies(text) {
    if (!text) return [];
    const cleaned = text
      .replace(
        /^(świetnie\s+)?działa\s+z|idealn(y|a|e)\s+z|ł\S+\s+z|łącz\s+z/i,
        "",
      )
      .trim();
    const parts = cleaned
      .split(/,|\bi\b/)
      .map((p) => p.trim().replace(/^[^a-zA-Z0-9#]+/, ""))
      .filter(Boolean);
    const result = [];
    for (const p of parts) {
      const found = findTagByText(p);
      if (found)
        result.push({ text: p, tag: found.tag, matchType: found.matchType });
    }
    return result;
  }

  function generateDiagnostics(tags, stats, conflicts, coherence) {
    const diags = [];

    if (tags.length === 0) {
      diags.push({
        type: "warn",
        message:
          "Nie znaleziono żadnych tagów w podanym tekście. Spróbuj użyć nazw tagów z biblioteki.",
      });
      return diags;
    }

    if (tags.length === 1) {
      diags.push({
        type: "info",
        message: `Znaleziono tylko 1 tag. Dodaj więcej tagów dla pełniejszego obrazu stylu.`,
      });
    } else if (tags.length <= 3) {
      diags.push({
        type: "info",
        message: `Znaleziono ${tags.length} tagi. Rozważ dodanie większej różnorodności.`,
      });
    } else {
      diags.push({
        type: "good",
        message: `Znaleziono ${tags.length} tagów – dobra podstawa do analizy.`,
      });
    }

    if (conflicts.length > 0) {
      for (const c of conflicts) {
        diags.push({ type: "bad", message: c.description });
      }
    } else if (tags.length > 1) {
      diags.push({
        type: "good",
        message:
          "Brak konfliktów między tagami – wszystkie tagi są kompatybilne.",
      });
    }

    const w = stats.weight;
    if (w.mean <= 12)
      diags.push({
        type: "info",
        message: `Średni ciężar (${w.mean}) sugeruje lekki, subtelny styl.`,
      });
    else if (w.mean >= 50)
      diags.push({
        type: "info",
        message: `Średni ciężar (${w.mean}) sugeruje ciężkie, intensywne brzmienie.`,
      });
    else
      diags.push({
        type: "info",
        message: `Średni ciężar (${w.mean}) – zrównoważone brzmienie.`,
      });

    const o = stats.organic;
    if (o.mean >= 70)
      diags.push({
        type: "info",
        message: `Wysoka organiczność (${o.mean}) – naturalne, akustyczne brzmienie.`,
      });
    else if (o.mean <= 25)
      diags.push({
        type: "info",
        message: `Niska organiczność (${o.mean}) – elektroniczne, syntetyczne brzmienie.`,
      });
    else
      diags.push({
        type: "info",
        message: `Średnia organiczność (${o.mean}) – mieszanka naturalnych i elektronicznych elementów.`,
      });

    const b = stats.brightness;
    if (b.mean >= 65)
      diags.push({
        type: "info",
        message: `Wysoka jasność (${b.mean}) – pogodny, optymistyczny charakter.`,
      });
    else if (b.mean <= 30)
      diags.push({
        type: "info",
        message: `Niska jasność (${b.mean}) – mroczny, poważny nastrój.`,
      });
    else
      diags.push({
        type: "info",
        message: `Średnia jasność (${b.mean}) – zbalansowana paleta tonalna.`,
      });

    if (w.stdDev > 20)
      diags.push({
        type: "warn",
        message: `Duże zróżnicowanie ciężaru (σ=${w.stdDev}) – tagi mieszają lekkie i ciężkie elementy.`,
      });
    if (o.stdDev > 20)
      diags.push({
        type: "warn",
        message: `Duże zróżnicowanie organiczności (σ=${o.stdDev}) – mieszanka brzmień naturalnych i syntetycznych.`,
      });
    if (b.stdDev > 20)
      diags.push({
        type: "warn",
        message: `Duże zróżnicowanie jasności (σ=${b.stdDev}) – szeroki zakres tonalny od ciemnych do jasnych.`,
      });

    if (coherence.score >= 65)
      diags.push({
        type: "good",
        message: `Spójność kompozycji: ${coherence.label} (${coherence.score}/100).`,
      });
    else if (coherence.score >= 25)
      diags.push({
        type: "warn",
        message: `Spójność kompozycji: ${coherence.label} (${coherence.score}/100). Rozważ uproszczenie zestawu tagów.`,
      });
    else
      diags.push({
        type: "bad",
        message: `Spójność kompozycji: ${coherence.label} (${coherence.score}/100). Tagi są bardzo zróżnicowane.`,
      });

    return diags;
  }

  function getSuggestedTags(tags) {
    const suggested = [];
    const seen = new Set(tags.map((t) => t.id));
    for (const t of tags) {
      const tag = TAG_BY_ID[t.id];
      if (tag && tag.synergy) {
        const parsed = parseSynergies(tag.synergy);
        for (const p of parsed) {
          if (!seen.has(p.tag.id)) {
            suggested.push(p.tag);
            seen.add(p.tag.id);
          }
        }
      }
    }
    return suggested;
  }

  function analyzePrompt(input) {
    initIndex();
    if (!input || !input.trim()) {
      return {
        foundTags: [],
        stats: null,
        conflicts: [],
        coherence: { score: 0, level: "none", label: "Brak tagów" },
        synergies: [],
        diagnostics: [
          { type: "warn", message: "Pusty prompt – wpisz tekst do analizy." },
        ],
        unrecognized: [],
      };
    }

    const segments = input
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const foundTags = [];
    const usedRanges = [];
    const allTokens = [];

    for (const segment of segments) {
      const words = segment.split(/\s+/).filter(Boolean);
      const segmentLower = segment.toLowerCase();

      const wordResults = [];
      const consumed = new Array(words.length).fill(false);

      for (let i = 0; i < words.length; i++) {
        if (consumed[i]) continue;

        let bestMatch = null;
        let bestLen = 0;

        for (let len = Math.min(3, words.length - i); len >= 1; len--) {
          const phrase = words.slice(i, i + len).join(" ");
          const match = findTagByText(phrase);
          if (match) {
            bestMatch = { match, len, start: i };
            bestLen = len;
            break;
          }
        }

        if (bestMatch) {
          for (
            let j = bestMatch.start;
            j < bestMatch.start + bestMatch.len;
            j++
          )
            consumed[j] = true;
          const prevWord =
            bestMatch.start > 0
              ? words[bestMatch.start - 1].toLowerCase()
              : null;
          const modifier =
            prevWord && MODIFIERS[prevWord] ? MODIFIERS[prevWord] : null;
          const modifierWord = modifier ? prevWord : null;

          const mw = modifier ? modifier.weight : 0;
          const mo = modifier ? modifier.organic : 0;
          const mb = modifier ? modifier.brightness : 0;

          if (modifier) consumed[bestMatch.start - 1] = true;

          foundTags.push({
            id: bestMatch.match.tag.id,
            name: bestMatch.match.tag.name,
            category: bestMatch.match.tag.category,
            weight: bestMatch.match.tag.weight,
            organic: bestMatch.match.tag.organic,
            brightness: bestMatch.match.tag.brightness,
            conflictGroup: bestMatch.match.tag.conflictGroup,
            description: bestMatch.match.tag.description,
            synergy: bestMatch.match.tag.synergy,
            keywords: bestMatch.match.tag.keywords,
            matchType: bestMatch.match.matchType,
            modifier: modifierWord,
            modifierDesc: modifier ? modifier.desc : null,
            adjustedWeight: clamp(bestMatch.match.tag.weight + mw, 1, 100),
            adjustedOrganic: clamp(bestMatch.match.tag.organic + mo, 1, 100),
            adjustedBrightness: clamp(
              bestMatch.match.tag.brightness + mb,
              1,
              100,
            ),
            originalWeight: bestMatch.match.tag.weight,
            originalOrganic: bestMatch.match.tag.organic,
            originalBrightness: bestMatch.match.tag.brightness,
          });
        }
      }

      for (let i = 0; i < words.length; i++) {
        if (!consumed[i]) {
          allTokens.push(words[i]);
        }
      }
    }

    const stats = computeAxisStats(foundTags);
    const conflicts = detectConflicts(foundTags);
    const coherence = calcCoherence(foundTags, conflicts);
    const synergies = getSuggestedTags(foundTags);
    const diagnostics = generateDiagnostics(
      foundTags,
      stats,
      conflicts,
      coherence,
    );

    return {
      foundTags,
      stats,
      conflicts,
      coherence,
      synergies,
      diagnostics,
      unrecognized: allTokens.filter((t) => {
        const low = t.toLowerCase();
        return !MODIFIERS[low] && !findTagByText(t);
      }),
    };
  }

  function getTagById(id) {
    initIndex();
    return TAG_BY_ID[id] || null;
  }

  function generateComboName(tagIds) {
    if (!tagIds || tagIds.length < 2) return null;
    const sorted = tagIds.slice().sort();
    const results = [];
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const key = sorted[i] + "+" + sorted[j];
        const reverseKey = sorted[j] + "+" + sorted[i];
        const name = COMBO_NAMES[key] || COMBO_NAMES[reverseKey] || null;
        results.push({
          tagA: sorted[i],
          tagB: sorted[j],
          name: name,
          isNamed: name !== null,
        });
      }
    }
    const named = results.filter(function (r) {
      return r.isNamed;
    });
    if (named.length > 0) {
      return { primary: named[0], all: results };
    }
    const tagA = getTagById(sorted[0]);
    const tagB = getTagById(sorted[1]);
    if (tagA && tagB) {
      return {
        primary: {
          tagA: tagA.id,
          tagB: tagB.id,
          name: tagA.name + " + " + tagB.name,
          isNamed: false,
        },
        all: results,
      };
    }
    return null;
  }

  function computeSynergyStrength(tag1, tag2) {
    if (!tag1 || !tag2) return { score: 0, label: "Brak danych" };
    if (tag1.id === tag2.id) return { score: 100, label: "Tożsamość" };
    var score = 50;
    var factors = [];
    if (tag1.conflictGroup && tag1.conflictGroup === tag2.conflictGroup) {
      score -= 40;
      factors.push({
        type: "penalty",
        value: -40,
        reason: "Konflikt: ta sama grupa (" + tag1.conflictGroup + ")",
      });
    }
    if (tag1.category !== tag2.category) {
      score += 15;
      factors.push({ type: "bonus", value: 15, reason: "Różne kategorie" });
    }
    initIndex();
    var t1 = TAG_BY_ID[tag1.id];
    var t2 = TAG_BY_ID[tag2.id];
    var mutualSynergy = false;
    if (t1 && t2) {
      var s1 = parseSynergies(t1.synergy);
      var s2 = parseSynergies(t2.synergy);
      for (var k = 0; k < s1.length; k++) {
        if (s1[k].tag && s1[k].tag.id === tag2.id) {
          mutualSynergy = true;
          break;
        }
      }
      if (!mutualSynergy) {
        for (var k = 0; k < s2.length; k++) {
          if (s2[k].tag && s2[k].tag.id === tag1.id) {
            mutualSynergy = true;
            break;
          }
        }
      }
    }
    if (mutualSynergy) {
      score += 25;
      factors.push({
        type: "bonus",
        value: 25,
        reason: "Wzajemna synergia w tagach",
      });
    }
    var diffWeight = Math.abs(
      (tag1.adjustedWeight || tag1.weight) -
        (tag2.adjustedWeight || tag2.weight),
    );
    var diffOrganic = Math.abs(
      (tag1.adjustedOrganic || tag1.organic) -
        (tag2.adjustedOrganic || tag2.organic),
    );
    var diffBright = Math.abs(
      (tag1.adjustedBrightness || tag1.brightness) -
        (tag2.adjustedBrightness || tag2.brightness),
    );
    var axisScore = 0;
    if (diffWeight <= 15) axisScore += 5;
    else if (diffWeight <= 30) axisScore += 2;
    if (diffOrganic <= 15) axisScore += 5;
    else if (diffOrganic <= 30) axisScore += 2;
    if (diffBright <= 15) axisScore += 5;
    else if (diffBright <= 30) axisScore += 2;
    score += axisScore;
    if (axisScore > 0)
      factors.push({
        type: "bonus",
        value: axisScore,
        reason:
          "Zgodność osi (W:" +
          diffWeight +
          ", O:" +
          diffOrganic +
          ", B:" +
          diffBright +
          ")",
      });
    score = clamp(score, 0, 100);
    var label;
    if (score >= 80) label = "Bardzo silna";
    else if (score >= 60) label = "Silna";
    else if (score >= 40) label = "Umiarkowana";
    else if (score >= 20) label = "Słaba";
    else label = "Bardzo słaba";
    return { score: Math.round(score), label: label, factors: factors };
  }

  return {
    MODIFIERS,
    findTagByText,
    analyzePrompt,
    calcStats,
    computeAxisStats,
    detectConflicts,
    calcCoherence,
    generateDiagnostics,
    getTagById,
    parseSynergies,
    getSuggestedTags,
    generateComboName,
    computeSynergyStrength,
  };
})();
