# ADR-001: Unified Song View + Intent Input

## Status: Proposed
## Data: 2026-05-26

## Kontekst
Obecnie appka ma dwie osobne strony HTML: tag selector i lyrics editor. User musi nawigować między nimi, nie ma wspólnego stanu, AI nie wspomaga doboru tagów.

## Decyzja

### 1. Unified Song View
Nowy `index.html` zastępuje obie strony jako główny punkt wejścia:
- **Left Panel (380px)**: tag browser + intent input + tag grid
- **Right Panel (flex)**: lyrics editor + AI Assistant + chunk bar + validation
- **Header**: nazwa projektu, save/load/export, settings, AI status
- Stare pliki pozostają jako fallback (można otworzyć bezpośrednio)

**Architektura koordynacji:**
```js
// Event-driven state bus (window)
const SunoProjectState = {
  tags: [],      // obecnie wybrane tagi (sync z SunoApp.state.selectedTags)
  lyrics: '',    // obecny tekst z edytora
  name: 'Nowy Utwór',
  aiConfig: null // snapshot przy zapisie
};

// Eventy:
// 'project:tags-changed' → lyrics panel aktualizuje coherence
// 'project:lyrics-changed' → tag panel aktualizuje sugerowane tagi
// 'project:saved' → status bar "Zapisano"
```

### 2. Intent Input
Pole tekstowe + przycisk nad gridem tagów, dwa tryby:

#### Tryb A: Rule-based (offline, 80% cases)
Plik `tag-intent-engine.js`:
```js
const INTENT_MAP = {
  // ~200 entries
  dark: ['dark', 'gothic', 'minor', 'industrial'],
  mroczny: ['dark', 'gothic', 'minor', 'industrial'],
  smutny: ['melancholic', 'bittersweet', 'slow', 'minor'],
  szybki: ['fast', 'very-fast', 'energetic', 'driving'],
  // ...mapa PL→tagi + EN→tagi
};

function resolveIntent(text) {
  // tokenize → match → dedupe → resolve conflicts → return []
}
```

#### Tryb B: AI-powered (online, 20% cases)
Ten sam endpoint co AI Assistant, ale z dedykowanym system prompt:
```
"Jesteś ekspertem tagów Suno. Użytkownik opisał utwór.
Zwróć JASON: { "tags": ["id1", "id2"], "reasoning": "krótko" }
Dostępne tagi: [lista id+name z TAG_DATA]
"
```

### 3. Zmiany w istniejących modułach
- `app-logic.js`: eksportuj `SunoApp` jako `window.SunoApp` z wszystkimi metodami
- `analyzer-engine.js`: dodaj `getTagClusters(tagId)` i `computeSynergyStrength(tagA, tagB)`
- `ai-providers.js`: dodaj `AI_SYSTEM_PROMPTS.tagIntent` + `AI_PROMPTS_USER.tagIntent`

### 4. CSS Layout
```css
.app-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  grid-template-rows: 44px 1fr;
  height: 100vh;
}
.header { grid-column: 1 / -1; }
.left-panel { overflow-y: auto; border-right: 1px solid var(--border); }
.right-panel { display: flex; flex-direction: column; }
```

## Alternatywy rozważone
1. **IFrame** — odrzucone (stan w dwóch iframe'ach, komunikacja przez postMessage = overkill)
2. **Shared Web Worker** — odrzucone (za dużo overheadu dla prostej komunikacji)
3. **Dwa osobne okna + BroadcastChannel** — odrzucone (user musi zarządzać dwoma oknami)
4. **Osobny backend** — odrzucone (ma być zero-dependency, działa z lokalnego FS)

## Konsekwencje
- **Pozytywne**: jeden kontekst pracy, user nie skacze między stronami
- **Pozytywne**: intent input radykalnie obniża próg wejścia (249 tagów → wpisz i gotowe)
- **Negatywne**: `index.html` będzie duży (~600-800 linii)
- **Negatywne**: trzeba utrzymywać kompatybilność starych plików

## Implementacja
1. Stwórz `index.html` (szkielet layoutu)
2. Importuj wszystkie istniejące moduły w kolejności
3. Zainicjalizuj SunoApp w left panelu
4. Zainicjalizuj lyrics editor w right panelu
5. Dodaj `SunoProjectState` i event bus
6. Dodaj intent input + `tag-intent-engine.js`
7. Test: czy oba panele działają niezależnie?
8. Test: czy eventy syncują stan?
9. Usuń zbędne nawigacje, dodaj header bar
