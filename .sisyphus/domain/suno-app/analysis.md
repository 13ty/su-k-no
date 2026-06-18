# Suno App — Analiza i Plan Rozwoju

## Status: 2026-05-26

---

## 1. Obecna Architektura (v1)

```
suno-prompt-builder.html     ← tag selector (249 tagów, 6 kategorii)
suno-lyrics-creator.html     ← edytor lyrics + AI Assistant
ai-providers.js              ← adapter AI (4 providerów)
tags-data.js                 ← 249 definicji tagów z wagami/synergiami/konfliktami
analyzer-engine.js           ← analiza promptu (dopasowanie tagów, modyfikatory, koherencja)
app-logic.js                 ← kontroler UI dla prompt-builder
Sunodocs/*.js                ← struktury, triggery wokalne, formatowanie rytmu
suno-reference/*.md          ← dokumentacja Suno (nie załadowana do appki)
```

### Mocne strony
- 249 tagów z bogatym modelem (3 osie W/O/B, synergia, konflikty, słowa kluczowe)
- 31 modyfikatorów (przymiotniki zmieniające osie tagów)
- Silnik analizy promptu (koherencja, statystyki, diagnostyka)
- Działający adapter AI (4 providerów, SSE streaming, timeout, abort)
- Smart-Parser w lyrics (synonimy + wzorce adj+rzeczownik)
- Suno Chunking (1000 znaków granica)
- Historia schowka + Undo stack

### Słabe strony / luki
1. **Dwie osobne strony** — user nawiguje między tagami a lyrics, brak unified view
2. **Brak Intent Input** — 249 tagów do ręcznego przeglądania, żadnego "opisz nastrój → auto-dobierz tagi"
3. **Synergia niewykorzystana** — synergy strings są w danych, ale nie są proaktywnie sugerowane podczas przeglądania
4. **Brak persistencji projektów** — localStorage tylko dla configu i schowka, zamknięcie = utrata pracy
5. **AI nie wspomaga tagów** — AI działa tylko w lyrics (3 prompt), nie ma dostępu do tag-data ani analyzer-engine
6. **Brak spójności lyrics-tagi** — można wybrać "aggressive" i napisać kołysankę, system nie ostrzeże
7. **Brak wersjonowania** — tylko undo (20 stanów w pamięci), brak snapshotów projektu

---

## 2. Plan: Ścieżka Konserwatywna (6 faz)

### Faza 1: Unified Song View — Jeden widok zamiast dwóch stron
**Cel:** Połączyć Prompt Builder + Lyrics Creator w jeden HTML z dwupanelowym layoutem.

**Zmiany:**
- Nowy `index.html` jako główny plik
- LEFT PANEL: tag browser + intent input
- RIGHT PANEL: edytor lyrics + AI Assistant
- HEADERBAR: nazwa projektu, przyciski save/load/export, status AI, settings
- Wszystkie istniejące moduły pozostają bez zmian (tylko zmiana układu DOM)
- `suno-prompt-builder.html` i `suno-lyrics-creator.html` pozostają jako fallback

**Szczegóły techniczne:**
- CSS Grid: `grid-template-columns: 380px 1fr` (lewy panel jak obecny sidebar)
- LEFT: kategorie tagów z paskami filtrów, grid tagów (tak jak jest)
- RIGHT: textarea + chunk bar + stats + validation + AI buttons
- Shared `SunoProjectState` obiekt na window: `{ tags: [], lyrics: '' }`
- Event-based sync: zmiana tagu → `dispatchEvent('project:tags-changed')` → lyrics panel reaguje
- Żadne moduły nie są przebudowywane — tylko nowa koordynacja

**Pliki:** `index.html` (NEW), modyfikacja `app-logic.js` (export SunoApp dla dwóch paneli)
**Czas:** 1 dzień

---

### Faza 2: Intent Input — "Opisz nastrój, a ja dobiorę tagi"
**Cel:** Pole tekstowe + AI, które na podstawie opisu nastroju/gatunku sugeruje optymalne tagi.

**UX:**
- Pole "Opisz czego szukasz" nad gridem tagów (np. "mroczny elektroniczny utwór z żeńskim wokalem")
- Przycisk "🔍 Dobierz tagi" → AI zwraca listę tagów
- Tagi są automatycznie zaznaczone z podświetleniem "AI-suggested"
- Użytkownik może kliknąć "Akceptuj wszystkie" lub ręcznie poprawić

**Implementacja:**
- Nowy moduł: `tag-intent-engine.js`
- Dwa tryby:

**Tryb A: Rule-based (offline, bez AI)**
Mapa keyword→tag, np.:
```
mroczny → dark, minor, cinematic
szybki → fast, energetic, driving
smutny → melancholic, bittersweet, slow
elektroniczny → electronic, synth, drum-machine
żeński wokal → female-vocal, ethereal
```
Około 200 keywordów mapowanych na ~80 tagów. Wystarczy na 80% przypadków.

**Tryb B: AI-powered (wymaga połączenia)**
```
System: "Jesteś ekspertem Suno tagów. Użytkownik opisuje utwór.
Zwróć JSON: { tags: [...], reasoning: '...' }"
User: "mroczny utwór jak zawodzenie wiatru"
→ AI: { tags: [dark, ambient, ethereal, female-vocal, reverb], reasoning: '...' }
```

- AI tryb fallback do rule-based gdy offline
- Wynik AI walidowany przez analyzer-engine (czy tagi istnieją, czy nie ma konfliktów)

**Pliki:** `tag-intent-engine.js` (NEW), modyfikacja `app-logic.js`, modyfikacja `index.html`
**Czas:** 2 dni

---

### Faza 3: Smart Tag Suggestions — Synergia w czasie rzeczywistym
**Cel:** Podczas przeglądania tagów, system pokazuje powiązane tagi (synergy) i sugeruje kompletacje.

**UX:**
- Po kliknięciu tagu: panel "Powiązane tagi" z 5-10 sugerowanymi
- Wizualne połączenia: subtelne linie między tagami w gridzie (SVG overlay)
- "Completion bar": "Wybrano 5/10 tagów typowych dla tego stylu" (oparte na synergy patterns)
- Grupowanie: "Często wybierane razem: Dark + Ambient + Drone + Reverb"

**Implementacja:**
- Wykorzystuje istniejące `parseSynergies()` i `getSuggestedTags()` z `analyzer-engine.js`
- Nowa funkcja `getTagClusters()` — analizuje siłę połączeń między tagami na podstawie synergy strings
- Cache: `TAG_SYNERGY_CACHE` — pre-komputacja na starcie (kto jest powiązany z kim)

```js
// Przykład: TAG_SYNERGY_CACHE struktura
{
  'dark': [
    { tag: 'industrial', strength: 0.8 },
    { tag: 'gothic', strength: 0.7 },
    { tag: 'minor', strength: 0.6 }
  ],
  ...
}
```

- Strength wyliczana: ile razy tag A pojawia się w synergy B + ile razy B pojawia się w synergy A + czy są w tym samym konflikcie (negatywna siła)
- Sugestie pojawiają się jako chipy pod wybranym tagiem

**Pliki:** Modyfikacja `analyzer-engine.js` (dodaj `getTagClusters()`, `computeSynergyStrength()`), modyfikacja `app-logic.js`, modyfikacja `index.html`
**Czas:** 1 dzień

---

### Faza 4: Project Store — Persystencja projektów w IndexedDB
**Cel:** Zapis i odczyt projektów (tagi + lyrics + metadane) między sesjami.

**Schema:**
```js
{
  id: 'auto_increment',
  name: 'Mój Utwór',
  createdAt: ISO,
  updatedAt: ISO,
  tags: ['dark', 'ambient', 'female-vocal'],
  lyrics: '[Verse]\nTekst...',
  stylePrompt: 'dark ambient, ethereal, female vocal',
  aiConfig: { provider, endpoint, model },  // snapshot z chwili zapisu
  rating: null,  // przyszłość: ocena Suno outputu
  notes: '',
  version: 1
}
```

**UI:**
- Header: Nazwa projektu (edytowalna) + "💾 Zapisz" + "📂 Otwórz" + "📋 Eksportuj JSON"
- "Otwórz" → modal z listą projektów (nazwa, data, tagi jako chipy, delete)
- "Eksport" → pojedynczy JSON do skopiowania/pobrania
- Auto-save na zmianę (debounced 5s) do localStorage jako fallback

**Implementacja:**
- Dexie.js jako wrapper IndexedDB (CDN, ~10KB gzip)
- Auto-migracja: jeśli Dexie nie ładuje się, fallback do localStorage

```js
// project-store.js
const db = new Dexie('SunoProjects');
db.version(1).stores({
  projects: '++id, name, createdAt, updatedAt, *tags'
});
```

**Pliki:** `project-store.js` (NEW), modyfikacja `index.html`, modyfikacja `app-logic.js`
**Czas:** 1 dzień

---

### Faza 5: Lyrics-Tag Coherence — Spójność między tagami a tekstem
**Cel:** Analiza czy wybrane tagi są spójne z napisanym tekstem.

**Jak działa:**
1. Użytkownik wybrał tagi (np. `aggressive, dark, metal, scream`)
2. Użytkownik pisze lyrics
3. Analyzer sprawdza:
   - **Słownictwo:** czy w tekście są słowa pasujące do energii tagów? (aggressive → "crush, destroy, rage" etc.)
   - **Długość linijek:** fast + bardzo krótkie linie = OK, fast + długie zdania = mismatch
   - **Struktura:** metal → ma [Breakdown]?, ambient → ma długie zwrotki?
   - **Wokal:** scream → dużo ALL CAPS?, whisper → mało znaków interpunkcyjnych?
4. Wynik: pasek "Spójność: 85%" + lista ostrzeżeń

**Implementacja:**
- Nowy moduł: `coherence-analyzer.js`
- Baza keyword-mood: słowa pogrupowane po nastroju (aggressive, calm, sad, joyful, etc.)

```js
// coherence-analyzer.js
const MOOD_KEYWORDS = {
  aggressive: ['crush', 'destroy', 'rage', 'hate', 'war', 'blood', 'pain', 'scream'],
  calm: ['moon', 'gentle', 'peace', 'soft', 'wave', 'drift', 'dream', 'silence'],
  sad: ['tears', 'lonely', 'gone', 'dark', 'lost', 'cry', 'rain', 'fade'],
  joyful: ['sun', 'dance', 'laugh', 'happy', 'light', 'sky', 'shine', 'sing'],
  // ~100 słów w 8-10 kategoriach nastroju
};
```

- `calcMoodCoherence(selectedTags, lyricsText)` → score 0-100 + mismatches
- `calcStructureCoherence(selectedTags, lyricsText)` → czy struktura tagów pasuje do struktury w tekście

**Pliki:** `coherence-analyzer.js` (NEW), modyfikacja `index.html` (dodaj panel spójności w right panelu)
**Czas:** 2 dni

---

### Faza 6: UX Polish — Dopracowanie detali
**Cel:** Poprawa komfortu użytkowania na podstawie feedbacku z wyżej wymienionych faz.

**Zmiany:**
- **AI Diff View:** kliknij "Optymalizuj Rytm" → AI proponuje zmiany (zielone = nowe, czerwone = usunięte, jak diff) → user approve/reject per chunk
- **Progress bar for AI:** zamiast "czekaj" — tokeny, czas, cancel button
- **Status bar:** połączenie z AI (online/offline/busy), ostatnia synchronizacja
- **Keyboard shortcuts:** `Ctrl+S` save, `Ctrl+O` open, `Ctrl+Shift+A` analyze coherence, `/` focus intent input
- **Mobile hints:** informacja, że appka działa najlepiej na desktopie (ale nie blokuje)
- **Error recovery:** jeśli IndexedDB nie działa → localStorage fallback z notyfikacją
- **Auto-save indicator:** "Zapisano przed 5s" / "Brak połączenia"

**Pliki:** Modyfikacje `index.html`, `app-logic.js`, `project-store.js`, `tag-intent-engine.js`
**Czas:** 1 dzień

---

## 3. Szersze wspomaganie — pomysły wykraczające poza Ścieżkę 1

### P3.1: Visual Tag Space — Mapowanie tagów na 2D
**Problem:** 249 tagów w 6 kategoriach, user nie widzi relacji między tagami.

**Rozwiązanie:** Canvas/WebGL render tag space:
- Oś X = organic (0-100), oś Y = brightness (0-100), kolor = kategoria
- Każdy tag to punkt na mapie, wielkość = weight
- User klikając "dark" widzi gdzie leży względem "ambient"
- Cluster visualization: tagi często wybierane razem są zgrupowane

**Technologia:** D3.js lub Canvas API

### P3.2: AI Song Coach — Wieloetapowy asystent
**Problem:** AI pomaga tylko w 3 konkretnych zadaniach, brak flow.

**Rozwiązanie:** Interaktywny asystent krok po kroku:
```
Krok 1: "Jaki gatunek?" → user wybiera / opisuje → AI sugeruje tagi
Krok 2: "Jaki nastrój?" → user opisuje → AI uzupełnia tagi nastroju
Krok 3: "O czym będzie tekst?" → user opisuje temat
Krok 4: "Jaka struktura?" → AI proponuje template (pop, ambient, metal...)
Krok 5: "Generuję propozycję lyrics" → AI pisze na podstawie kroków 1-4
```
User może w każdej chwili edytować dowolny krok.

**Narzędzie:** LangGraph dla flow + obecny AIProvider dla generacji

### P3.3: Suno Output Analyzer
**Problem:** Brak feedback loop. User generuje w Suno, ale nie wie co zadziałało.

**Rozwiązanie:** Upload audio z Suno → analiza:
- Waveform + timeline z zaznaczonymi sekcjami struktury
- Transkrypcja (Web Speech API) → porównanie z napisanym tekstem
- Manual rating (1-5 gwiazdek) zapisany w projekcie
- Z czasem: "dla tagów X+lyrics Y najlepsze rezultaty daje struktura Z"

### P3.4: Tag Performance Tracker
**Problem:** Nie wiadomo które tagi faktycznie dają dobre rezultaty.

**Rozwiązanie:** User ocenia wygenerowany utwór → appka notuje które tagi były użyte → analiza: "Twoje najlepsze utwory używają dark + ambient + reverb"

### P3.5: Obsidian Vault Bridge
**Problem:** Jeśli user używa Obsidian, projekty są odcięte od vaultu.

**Rozwiązanie:** Opcjonalny bridge przez Local REST API:
- Zapisz projekt jako `.md` z frontmatterem (tags, created, rating)
- Odczytaj pomysły z notatek w vault
- Obsidian graph view pokazuje połączenia między pomysłami a utworami

---

## 4. Przyszłe Ścieżki Rozwoju

### Ścieżka 2: Radykalna (1-2 tygodnie)
| Co | Czas | Zysk |
|---|---|---|
| Visual Tag Space (D3.js) | 2 dni | +++ |
| AI Song Coach (LangGraph flow) | 3 dni | ++++ |
| Coherence Engine + Mood Keywords | 2 dni | +++ |
| RAG z suno-reference/*.md | 1 dzień | ++ |
| Suno Output Analyzer | 3 dni | +++++ |

### Ścieżka 3: Eksperymentalna (2-4 tygodnie)
| Co | Czas | Zysk |
|---|---|---|
| WebLLM in-browser (Gemma-2B) | 5 dni | +++++ |
| CRDT sync (Y.js) między kartami | 2 dni | ++++ |
| Tag Performance Tracker | 2 dni | ++++ |
| Obsidian Vault Bridge | 2 dni | +++ |
| WaveSurfer.js timeline | 3 dni | +++++ |
| Community template sharing | 2 dni | +++ |

### Ścieżka 4: Integracyjna (ciągła)
- Suno API integration (gdy dostępne)
- Multi-language UI (EN/PL toggle)
- PWA z Service Worker (offline-capable)
- Export do PDF/SRT (napisy do wideo)
- Automatyczne dopasowanie rytmu (syllable counter do BPM)

---

## 5. Natychmiastowe Quick Wins (do zrobienia w 1 dzień)

Te rzeczy można zrobić bez żadnych zmian architektury:

1. **Dodaj synergy chips w tag tooltip** — tooltip już pokazuje synergy string, ale jako tekst. Zamień na klikalne chipy → dodaje tag.
2. **Intent Input w sidebar** — małe pole tekstowe z przyciskiem "Dobierz" pod filtrami kategorii. Rule-based tylko (bez AI) — 1 plik, 1 funkcja.
3. **Auto-dopasuj strukturę do gatunku** — gdy user wybiera gatunek (pop, metal, etc.), system pyta "Czy chcesz załadować template struktury?".
4. **Walidacja spójności w Tag Check** — dodaj prostą wersję: "tagi agresywne → sprawdź czy tekst zawiera słowa o wysokiej energii".

## 6. Rekomendacja

**Zacznij od Fazy 1 + 2 (Unified View + Intent Input) — to fundament.**
Bez unified view user ciągle skacze między stronami. Bez intent input user gubi się w 249 tagach.

**Równolegle: Quick Wins #1 i #2 (synergy chips + intent input rule-based).**
Zero ryzyka, widoczna poprawka w godzinę.

**Po Fazie 4 (Project Store) appka staje się użyteczna na serio** — user nie traci pracy.

**Faza 5 (Coherence) to największy value-add dla jakości outputu** — ale wymaga najwięcej researchu (baza keyword-mood musi być dobrze zaprojektowana).

---

*Dokument utworzony: 2026-05-26*
*Ostatnia aktualizacja: 2026-05-26*
