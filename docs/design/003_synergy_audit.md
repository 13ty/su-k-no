# ADR-003: Synergy Audit — Infrastruktura a Plan

## Status: Completed
## Data: 2026-05-26

---

## Złote odkrycie: 80% Planu JUŻ ISTNIEJE w analyzer-engine.js

Przeprowadziłem pełny audyt istniejącego kodu względem 6 faz Ścieżki 1. Wniosek: **3 z 6 faz można zrealizować bez nowych modułów JS — wystarczy przepiąć UI do istniejących funkcji.**

---

## 1. Mapa Synergii: Która istniejąca funkcja obsługuje którą fazę

| Faza Planu | Istniejąca funkcja | Status |
|---|---|---|
| **Faza 2: Intent Input** | `SunoAnalyzer.findTagByText()` + tag keywords | W 80% gotowe — keywords tagów SĄ mapą intencji |
| **Faza 3: Smart Suggestions** | `SunoAnalyzer.getSuggestedTags()` + `parseSynergies()` | W 100% gotowe — istnieje, niepodpięte pod UI |
| **Faza 5: Lyrics-Tag Coherence** | `SunoAnalyzer.analyzePrompt(lyrics)` → `foundTags` → compare z `selectedTags` | W 90% gotowe — wystarczy adapter |

### Szczegóły:

#### Faza 2 → NIE TRZEBA tag-intent-engine.js

Obecnie tags-data.js zawiera:
```js
// Przykład: tag 'dark' ma keywords: ['dark', 'minor', 'gothic', ...]
// A `findTagByText('dark')` już znajduje tag 'dark'
// A `SunoAnalyzer.getTagById('dark').keywords` zwraca: ['dark', 'minor', 'industrial', 'gothic']
// A `SunoAnalyzer.getTagById('dark').synergy` zwraca: "Łącz z Minor, Industrial, Gothic"
```

**Oznacza to:** INTENT_MAP (200 ręcznych wpisów) można zastąpić jedną pętlą:
```js
function resolveIntent(input) {
  const tokens = input.toLowerCase().split(/[\s,;]+/);
  const found = [];
  for (const token of tokens) {
    const match = SunoAnalyzer.findTagByText(token);
    if (match) {
      found.push(match.tag);
      // Dodaj też synergy tego tagu
      const synergies = SunoAnalyzer.parseSynergies(match.tag.synergy);
      for (const s of synergies) {
        if (!found.find(f => f.id === s.tag.id)) found.push(s.tag);
      }
    }
  }
  // Rozwiąż konflikty (użyj SunoAnalyzer.detectConflicts)
  return found;
}
```

**Efekt:** User wpisuje "ciemny elektroniczny" → `findTagByText('ciemny')` → szuka po keywords → znajduje 'dark' → dodaje jego synergy (minor, industrial, gothic) → `findTagByText('elektroniczny')` → znajduje 'electronic' → synergy: synth, arpeggio, drum-machine → gotowe.

**Zero nowych danych.** Tylko 30 linii kodu adaptera.

#### Faza 3 → TYLKO zmiana w renderTagBoard()

`SunoAnalyzer.getSuggestedTags(selectedTags)` już istnieje i zwraca deduplikowaną listę tagów powiązanych synergy. Wystarczy dodać panel "Powiązane" w `renderTagBoard()` lub tooltipie:

```js
// W showTooltip() już renderujemy synergy jako tekst.
// Wystarczy zmienić na klikalne chipy:
const suggested = SunoAnalyzer.getSuggestedTags([{id: tag.id}]);
// render suggested.map(s => `<span class="syn-chip" onclick="SunoApp.toggleTag('${s.id}')">+${s.name}</span>`)
```

**Efekt:** Hover na tag → w tooltipie klikalne chipy "dodaj powiązany tag". Zero nowej logiki.

#### Faza 5 → 50 linii, zero nowych modułów

```js
SunoApp.calcLyricsCoherence = function() {
  const lyrics = document.getElementById('lyricsEditor').value;
  if (!lyrics) return null;

  // Analizuj tekst pod kątem tagów
  const analysis = SunoAnalyzer.analyzePrompt(lyrics);

  // Porównaj z wybranymi tagami
  const selected = this.state.selectedTags;

  // Miernik 1: overlapp tagów
  const foundIds = analysis.foundTags.map(t => t.id);
  const overlap = selected.filter(id => foundIds.includes(id));
  const tagOverlapScore = (overlap.length / Math.max(selected.length, 1)) * 100;

  // Miernik 2: odległość profili osi
  if (analysis.stats && selected.length > 0) {
    const selTags = selected.map(id => SunoAnalyzer.getTagById(id)).filter(Boolean);
    const selStats = SunoAnalyzer.computeAxisStats(
      selTags.map(t => ({ adjustedWeight: t.weight, adjustedOrganic: t.organic, adjustedBrightness: t.brightness }))
    );
    const wDist = Math.abs(analysis.stats.weight.mean - selStats.weight.mean);
    const oDist = Math.abs(analysis.stats.organic.mean - selStats.organic.mean);
    const bDist = Math.abs(analysis.stats.brightness.mean - selStats.brightness.mean);
    const axisScore = Math.max(0, 100 - (wDist + oDist + bDist) / 3);
  }

  return { tagOverlapScore, axisScore, foundTags: analysis.foundTags, analysis };
};
```

**Efekt:** Coherence feedback bez nowego modułu. Wykorzystuje `analyzePrompt()` + `computeAxisStats()` + `getTagById()`.

---

## 2. Redundancje: Co jest zbędne

| Planowany moduł | Status | Uzasadnienie |
|---|---|---|
| `tag-intent-engine.js` | **⚠ ZBIĘDNY** | `findTagByText()` + keywords + synergy już robią intent→tagi. Wystarczy adapter 30 linii w app-logic.js |
| `coherence-analyzer.js` | **⚠ ZBIĘDNY** | `analyzePrompt(lyrics)` → porównaj z `selectedTags` — to 50 linii w app-logic.js |
| Osobny Intent Input UI | **⚠ NADMIAR** | Pole tekstowe + przycisk "Dobierz" — można wkomponować w istniejący pasek filtrów |
| Nowy moduł dla Smart Tag Suggestions | **⚠ ZBIĘDNY** | `getSuggestedTags()` już istnieje, tylko UI niepodpięte |

**Co NIE jest redundancją:**
- `project-store.js` (IndexedDB) — nowa funkcjonalność, nie istnieje
- `index.html` (Unified View) — nowy layout, nie istnieje
- Nowe `AI_SYSTEM_PROMPTS` dla Intent Input — rozszerzenie istniejącego

---

## 3. Reciprocal Upgrades: Co plan daje istniejącej infra

| Element Planu | Ulepsza w istniejącej infra | Jak |
|---|---|---|
| **Unified View** → `app-logic.js` | SunoApp zyskuje `saveState()` / `loadState()` do persistencji | `SunoApp.state` można serializować/deserializować |
| **Intent Input** → `analyzer-engine.js` | Nowa metoda `resolveIntent(text)` wzbogaca API | Może być używana przez Tag Check tab |
| **Smart Suggestions UI** → `analyzer-engine.js` | `getTagClusters()` jako nowa metoda z pre-komputacją siły synergii | Używane też przez Tag Check tab |
| **Lyrics Coherence** → `analyzer-engine.js` | Nowa metoda `analyzeLyricsCoherence(lyrics, tags)` | Może być użyta w diagnostyce |
| **Project Store** → wszystkie moduły | Projekty zapisują snapshot stanu wszystkich modułów | Przywracanie po zamknięciu przeglądarki |
| **AI Diff** → `ai-providers.js` | Nowy system prompt + logika diff w `AIProvider.send()` | Wielokrotnego użytku |

---

## 4. Konkretne integration pointy (1+1=3)

### Integration Point #1: `findTagByText()` + `parseSynergies()` → Intent Input
```
User: "mroczny ambient z wokalem"
→ findTagByText('mroczny') → trafia na keyword tagu 'dark'
→ parseSynergies(dark.synergy) → industrial, gothic, minor
→ findTagByText('ambient') → tag 'ambient'
→ parseSynergies(ambient.synergy) → drone, pads, field-recording
→ findTagByText('wokal') → trafia na keyword → female-vocal, male-vocal, choir...
→ detectConflicts() → usuwa konflikty
→ toggleTag() dla każdego
```
**Zysk:** Intent Input = 30 linii kodu, 0 nowych danych. 1+1=3 bo łączymy istniejące `findTagByText` + `parseSynergies` + `detectConflicts`, które nigdy nie były używane razem.

### Integration Point #2: `analyzePrompt(lyrics)` + `selectedTags` → Coherence
```
→ run analyzePrompt() na tekście lyrics → foundTags[] (co faktycznie jest w tekście)
→ porównaj foundTags z selectedTags[] (co user wybrał)
→ overlap score + axis distance score
→ dodaj do istniejącej listy walidacji w lyrics-creator
```
**Zysk:** 50 linii, zero nowych modułów. Użytkownik dostaje feedback "twoje tagi mówią aggressive, ale tekst brzmi calm".

### Integration Point #3: `getSuggestedTags()` + `renderTagBoard()` → Smart Suggestions
```
→ w showTooltip() lub w nowym panelu pod tagiem
→ getSuggestedTags([currentTag]) → lista powiązanych
→ render jako klikalne chipy (takie same jak w Tag Check tab)
→ chip dodaje tag przez toggleTag()
```
**Zysk:** 0 linii logiki, tylko zmiana renderowania. Funkcja `getSuggestedTags()` była "uśpiona" — tylko w Tag Check tab, nie w tag browser.

### Integration Point #4: `AIConfig` + `AI_SYSTEM_PROMPTS` + `analyzer-engine` → AI Tag Advisor
```
→ AIConfig.load() → pobierz config AI
→ AIProvider.send([system_prompt + user_intent], ...)
→ AI zwraca JSON z tagami
→ zweryfikuj przez SunoAnalyzer.getTagById() → czy istnieją?
→ detectConflicts() → czy nie kolidują?
→ toggleTag() → dodaj
```
**Zysk:** Pełna walidacja AI outputu przez istniejący silnik. AI może sugerować tagi, ale analyzer-engine je weryfikuje.

### Integration Point #5: `STRUCTURE_PATTERNS` + `SunoAnalyzer` → Structure-Aware Suggestions
```
→ User wybiera gatunek (pop, metal, ambient)
→ STRUCTURE_PATTERNS.find(p => p.genre === gatunek) → template
→ sections → map na tagi struktury
→ toggleTag() dla każdej sekcji
```
**Zysk:** Łączymy Sunodocs (które są statyczne) z app-logic.js. Obecnie structure patterns są dostępne TYLKO w lyrics-creator.html jako template do wstrzyknięcia. Połączone z tag selekcją → wybór gatunku auto-dodaje tagi struktury.

---

## 5. Rewizja planu: Zredukowany do 4 faz

Po audycie synergii plan ulega redukcji z 6 faz do 4, bo 3 fazy są w większości "wpięciem UI do istniejących funkcji":

### Faza 1: Unified Song View (1 dzień)
- `index.html` — layout dwupanelowy
- Bez zmian w logice

### Faza 2: Intent Input + Smart Suggestions (1 dzień)
- **Nie** nowy moduł — tylko 30 linii adaptera w app-logic.js
- Wykorzystuje: `findTagByText()`, `parseSynergies()`, `getSuggestedTags()`, `detectConflicts()`
- Zmiana renderowania tooltipa (klikalne synergy chipy)

### Faza 3: Project Store (1 dzień)
- `project-store.js` z Dexie.js
- `SunoApp.saveState()` / `SunoApp.loadState()`

### Faza 4: Coherence + AI Polish (1 dzień)
- **Nie** nowy moduł — 50 linii w app-logic.js
- Wykorzystuje: `analyzePrompt()`, `computeAxisStats()`
- Nowe AI_SYSTEM_PROMPTY w ai-providers.js

**Szacowany czas: 4 dni (zamiast 8)**

---

## 6. Co NIE zostało wykorzystane (ale warto rozważyć)

- **suno-reference/*.md** (5000+ linii dokumentacji) — niezaładowane do appki. Można użyć przy generowaniu AI promptów (RAG przez LanceDB MCP z skillu kb-management). To dałoby AI pełną wiedzę o tagach Suno.
- **Sunodocs/vocal-triggers.js** — 22 triggery wokalne nie są zintegrowane z AI Assistant. AI mógłby sugerować `(whispered)`, `(belted)` na podstawie analizy tekstu.
- **Sunodocs/rhythm-formatting.js** — 14 zasad formatowania nie są używane przez AI przy optymalizacji rytmu.
- **tags-data.js conflict groups** — analyzer-engine ma detectConflicts, ale Tag Check tab nie sugeruje zamienników dla skonfliktowanych tagów. ("Nie możesz dodać whisper, bo masz scream → zobacz co zamiast")

---

## 7. Rekomendacja

1. **Nie twórz tag-intent-engine.js** — użyj istniejącego `findTagByText()` + `parseSynergies()`
2. **Nie twórz coherence-analyzer.js** — rozszerz app-logic.js o 50 linii
3. **Nie twórz osobnego modułu Smart Tag Suggestions** — zmień renderTagBoard() + showTooltip()
4. **Zrób projekt-store.js** — to jedyna naprawdę nowa funkcjonalność
5. **Zintegruj Sunodocs z AI** — vocal-triggers + rhythm-formatting powinny być w promptach AI

**Efekt: 4 dni zamiast 8, mniej kodu, mniej utrzymania, więcej synergii.**
