# ADR-005: System Kart Tarotowych — Plan Implementacji i Architektura Techniczna

## Status: Draft

## Data: 2026-06-18

## Wymaga: ADR-001 (Unified View), ADR-002 (Intent Engine), ADR-003 (Synergy Audit), ADR-004 (Tarot Card Spec)

---

## Spis treści

1. [Wizja estetyczna — Art Deco z Mistycyzmem](#1-wizja-estetyczna--art-deco-z-mistycyzmem)
2. [Zalecenia architektoniczne](#2-zalecenia-architektoniczne)
3. [Stos technologiczny](#3-stos-technologiczny)
4. [Architektura modułowa — przegląd](#4-architektura-modułowa--przegląd)
5. [CardStateManager — maszyna stanów karty](#5-cardstatemanager--maszyna-stanów-karty)
6. [System audio — Web Audio API](#6-system-audio--web-audio-api)
7. [Tryby pracy](#7-tryby-pracy)
   - [7.1 Full-Screen Mode](#71-full-screen-mode)
   - [7.2 Mobile Mode](#72-mobile-mode)
   - [7.3 Deep Focus Mode](#73-deep-focus-mode)
8. [Fazy implementacyjne](#8-fazy-implementacyjne)
   - [Faza 0: Przygotowanie i refaktoring istniejącego kodu](#faza-0-przygotowanie-i-refaktoring-istniejącego-kodu)
   - [Faza 1: CardStateManager i maszyna stanów](#faza-1-cardstatemanager-i-maszyna-stanów)
   - [Faza 2: Renderer kart tarota (tarot-deck.js)](#faza-2-renderer-kart-tarota-tarot-deckjs)
   - [Faza 3: Particle system (tarot-particle.js)](#faza-3-particle-system-tarot-particlejs)
   - [Faza 4: Detail Window (tarot-detail-window.js)](#faza-4-detail-window-tarot-detail-windowjs)
   - [Faza 5: Convergence engine (tarot-convergence.js)](#faza-5-convergence-engine-tarot-convergencejs)
   - [Faza 6: Web Audio API i warstwa dźwiękowa](#faza-6-web-audio-api-i-warstwa-dźwiękowa)
   - [Faza 7: Full-Screen, Mobile, Deep Focus — polerowanie](#faza-7-full-screen-mobile-deep-focus--polerowanie)
9. [Style CSS — grid i karty tarota](#9-style-css--grid-i-karty-tarota)
10. [Rozszerzenia istniejących modułów](#10-rozszerzenia-istniejących-modułów)
11. [Mapa zależności między modułami](#11-mapa-zależności-między-modułami)
12. [Kamienie milowe](#12-kamienie-milowe)
13. [Ryzyka i strategie mitigacji](#13-ryzyka-i-strategie-mitigacji)
14. [Podsumowanie](#14-podsumowanie)

---

## 1. Wizja estetyczna — Art Deco z Mistycyzmem

### 1.1 Założenia stylistyczne

System kart tarota w su(K)no łączy **geometryczną elegancję Art Deco** z **mistyczną aurą tarota**. Nie kopiujemy żadnego istniejącego systemu kart — tworzymy własny język wizualny, który rezonuje z ciepłym, ogniskowym motywem przewodnim aplikacji.

| Wartość estetyczna        | Źródło                    | Manifestacja wizualna                                                   |
| ------------------------- | ------------------------- | ----------------------------------------------------------------------- |
| **Geometryczny ornament** | Art Deco (1920s)          | Złote linie pod 45°, symetryczne wzory, łuki, powtarzalne motywy        |
| **Złoto i czerń**         | Art Deco + mistycyzm      | Gradienty złota (#ffcc00 → #996600) na czarnym tle (#0a0a05)            |
| **Symetria lustrzana**    | Tarot klasyczny           | Numery i symbole powtórzone w górnym i dolnym rogu                      |
| **Misterium**             | Symbolika Tarota          | Każda karta ma „głębię" — glow, cienie, warstwy przezroczystości        |
| **Rzemiosło**             | Ręcznie rysowane wrażenie | Nierównomierne krawędzie ramek, subtelna tekstura pergaminu w tle karty |
| **Światło własne**        | Magia, iluminacja         | Karty emitują własne światło (gold glow), nie są oświetlone z zewnątrz  |

### 1.2 Paleta kolorów (rozszerzenie emberglow)

```css
:root {
  /* === Art Deco Gold Palette === */
  --gold-leaf: #ffd700;
  --gold-bright: #ffcc00;
  --gold-primary: #e6a800;
  --gold-accent: #cc8800;
  --gold-dim: #996600;
  --gold-shadow: #664400;

  /* === Card Surface === */
  --card-bg: linear-gradient(135deg, #1a1a0f 0%, #2a1f0a 50%, #1a1a0f 100%);
  --card-bg-hover: linear-gradient(
    135deg,
    #2a1f0a 0%,
    #3a2a10 50%,
    #2a1f0a 100%
  );
  --card-border: linear-gradient(135deg, #ffcc00, #996600, #ffcc00);
  --card-glow: rgba(255, 204, 0, 0.15);
  --card-glow-hover: rgba(255, 204, 0, 0.35);

  /* === Ornament Colors === */
  --ornament-light: rgba(255, 204, 0, 0.4);
  --ornament-dim: rgba(153, 102, 0, 0.25);
  --parchment: rgba(245, 230, 200, 0.06);

  /* === Mist Overlay === */
  --mist-dark: rgba(10, 10, 5, 0.6);
  --mist-glow: rgba(255, 204, 0, 0.03);
}
```

### 1.3 Motywy ornamentacyjne

Każda karta zawiera **stałe ornamenty Art Deco**:

1. **Narożniki** — Złote linie pod kątem 45° w 4 rogach ramki zewnętrznej
2. **Separator poziomy** — Powtarzalny wzór `═══ ✦ ═══` między nazwą a opisem
3. **Dolne kropki** — 5 kropek (`● ● ● ● ●`), gradient od gold do ciemnego, wskazujący siłę synergii
4. **Linia bazowa** — Cienka linia równoległa do dolnej krawędzi, z małym rombem w środku

Wzory są generowane w CSS przez pseudoelementy (`::before`, `::after`) — zero dodatkowych elementów DOM dla ornamentów.

---

## 2. Zalecenia architektoniczne

### 2.1 Decyzja o stosie technologicznym

Mimo że wizja „Symfonia Kart Tarotowych" dopuszcza warstwę UI opartą o React/Vue/Svelte, **wdrożenie produkcyjne następuje w czystym Vanilla JS ES5 z wzorcem IIFE**, zgodnie z obowiązującą konwencją projektu su(K)no.

**Uzasadnienie:**

| Kryterium                    | Vanilla JS IIFE                              | React/Vue                                     |
| ---------------------------- | -------------------------------------------- | --------------------------------------------- |
| Zgodność z istniejącym kodem | Identyczny wzorzec jak SunoApp, SunoAnalyzer | Wymaga bundlera, nowej struktury, migracji    |
| Rozmiar i performance        | ~15 KB JS (3 moduły tarot) + 0 zależności    | ~120 KB minimalny bundle z React              |
| Łatwość utrzymania           | Jeden język, jeden paradygmat                | Dwa równoległe systemy (SunoApp IIFE + React) |
| Czas implementacji           | 2-3 fazy równolegle                          | 5-6 faz, w tym migracja istniejącego kodu     |
| LCP/FID                      | Brak overhead frameworku                     | Konieczność hydracji, potencjalny regres      |

**Wyjatek:** Jeśli w przyszłości cała aplikacja zostanie zmigrowana do frameworka (decyzja poza zakresem ADR-005), moduły tarotowe można zaadaptować jako web komponenty lub composables — ich logika jest w pełni odseparowana od warstwy renderowania.

### 2.2 Wzorzec modułu IIFE

Każdy nowy moduł tarotowy stosuje identyczny wzorzec:

```js
const TarotDeck = (function () {
  "use strict";

  /* === prywatne stałe i stan === */
  var _cards = [];
  var _container = null;
  var _config = {};

  /* === prywatne funkcje === */
  function _init(containerEl, config) {
    _container = containerEl;
    _config = config;
  }

  function _render(cards) {
    // ...
  }

  /* === API publiczne === */
  return {
    init: _init,
    render: _render,
    getState: function () {
      return _cards;
    },
  };
})();
```

### 2.3 Event bus — komunikacja między modułami

Moduły komunikują się przez nazwane eventy DOM (`CustomEvent`) na `document`, a nie przez bezpośrednie wywołania. To pozwala na luźne sprzężenie i łatwe testowanie.

```js
// Karta wybrana → powiadomienie systemu
function _onCardSelected(cardId) {
  var evt = new CustomEvent("tarot:card-selected", {
    detail: { cardId: cardId, timestamp: Date.now() },
  });
  document.dispatchEvent(evt);
}

// Nasłuchiwanie w app-logic.js
document.addEventListener("tarot:card-selected", function (e) {
  SunoApp.addTag(e.detail.cardId);
});
```

**Lista eventów:**

| Event                      | Dispatch             | Kto nasłuchuje                     |
| -------------------------- | -------------------- | ---------------------------------- |
| `tarot:card-selected`      | tarot-deck.js        | app-logic.js, tarot-convergence.js |
| `tarot:card-hover`         | tarot-deck.js        | tarot-detail-window.js             |
| `tarot:card-leave`         | tarot-deck.js        | tarot-detail-window.js             |
| `tarot:particle-done`      | tarot-particle.js    | tarot-deck.js (cleanup DOM)        |
| `tarot:batch-end`          | app-logic.js         | tarot-deck.js, tarot-particle.js   |
| `tarot:convergence-update` | tarot-convergence.js | tarot-detail-window.js             |

---

## 3. Stos technologiczny

| Warstwa             | Technologia                 | Uwagi                                                                         |
| ------------------- | --------------------------- | ----------------------------------------------------------------------------- |
| **Język**           | JavaScript ES5              | Strict mode, brak arrow functions, brak `const/let` w pętli (wszystkie `var`) |
| **Moduły**          | IIFE                        | Wzór `(function() { ... return { ... }; })()`                                 |
| **Rendering**       | DOM API                     | `document.createElement`, `element.classList`, `element.addEventListener`     |
| **Animacje CSS**    | CSS Transitions + Keyframes | Wszystkie animacje w CSS gdzie to możliwe, JS tylko dla particle              |
| **Particle system** | Canvas 2D API               | `<canvas>` overlay, requestAnimationFrame loop                                |
| **Audio**           | Web Audio API               | `AudioContext`, `OscillatorNode`, `GainNode` — żadnych `<audio>` tagów        |
| **Reaktywność**     | CustomEvent bus             | `document.dispatchEvent` / `document.addEventListener`                        |
| **Stan**            | Plain objects               | Brak bibliotek stanu, ręczna synchronizacja przez eventy                      |

---

## 4. Architektura modułowa — przegląd

```
┌─────────────────────────────────────────────────────────────────────┐
│                       ISTNIEJĄCE MODUŁY                             │
├─────────────────┬─────────────────┬─────────────────┬───────────────┤
│  app-logic.js   │ analyzer-engine │   tags-data.js  │ spec-kafelki  │
│  (SunoApp)      │ (SunoAnalyzer)  │   (TAG_DATA)    │   .json       │
├─────────┬───────┴──────┬──────────┴────────────────┬───────────────┤
│         │              │                            │               │
│         ▼              ▼                            ▼               │
│  ┌──────────┐   ┌──────────┐              ┌──────────────────┐     │
│  │ TarotDeck│   │ TarotParticle │          │ TarotConvergence │     │
│  │ Render   │   │ Canvas system  │          │ Logika zbieżności│     │
│  │ State    │   │ Dissolve +     │          │ + combo names    │     │
│  │ Machine  │   │ Assemble       │          │ + sugestie       │     │
│  └────┬─────┘   └───────┬────────┘          └───────┬──────────┘     │
│       │                 │                           │                 │
│       ▼                 ▼                           ▼                 │
│  ┌────────────────────────────────────────────────────────┐          │
│  │              TarotDetailWindow                          │          │
│  │  Detail overlay na hover + sugestie + convergence bars  │          │
│  └────────────────────────────────────────────────────────┘          │
│                                                                       │
│  ┌────────────────────────────────────────────────────────┐          │
│  │              TarotAudioEngine                            │          │
│  │  Web Audio API — ambient + feedback dźwiękowy           │          │
│  └────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.1 Nowe moduły

| Moduł                 | Plik                     | Odpowiedzialność                                                         | Zależności                  |
| --------------------- | ------------------------ | ------------------------------------------------------------------------ | --------------------------- |
| **TarotDeck**         | `tarot-deck.js`          | Renderowanie kart, maszyna stanów (CardStateManager), batch flow, eventy | —                           |
| **TarotParticle**     | `tarot-particle.js`      | Canvas particle system: dissolve, assemble, celebration                  | TarotDeck (pozycje kart)    |
| **TarotDetailWindow** | `tarot-detail-window.js` | Overlay szczegółów na hover, timing, pozycjonowanie                      | TarotDeck, TarotConvergence |
| **TarotConvergence**  | `tarot-convergence.js`   | Analiza zbieżności tagów, combo names, sugestie                          | SunoAnalyzer (synergy)      |
| **TarotAudioEngine**  | `tarot-audio-engine.js`  | Web Audio API — ambient tła, dźwięki interakcji                          | —                           |

### 4.2 Rozszerzenia istniejących modułów

| Moduł                | Rozszerzenie                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `app-logic.js`       | Nowy stan `tarot_selection` w flow_states, metody `showNextBatch()`, `dissolveCard()`, integracja eventowa z tarot-deck |
| `analyzer-engine.js` | Nowa metoda `generateComboName(tagA, tagB)`, rozszerzenie `computeSynergyStrength()` o skalę 1-5                        |
| `tags-data.js`       | Nowe pole `comboNames` (patrz ADR-004 §16), pole `tarotSymbol` dla kategorii                                            |

---

## 5. CardStateManager — maszyna stanów karty

Centralny element systemu. Każda karta tarota przechodzi przez zdefiniowaną maszynę stanów. `CardStateManager` jest instancjonowany wewnątrz `TarotDeck` i zarządza wszystkimi kartami w bieżącym batchu.

### 5.1 Diagram stanów

```
                  ┌──────────┐
                  │  QUEUED  │ ← karta czeka w puli
                  └────┬─────┘
                       │ aktywacja batcha
                       ▼
                  ┌──────────┐
          ┌──────►│  IDLE    │ ← karta widoczna, unosi się
          │       └────┬─────┘
          │            │ mouseenter          mouseleave
          │       ┌────┴─────┐    ┌──────────────┐
          │       │  HOVER   │◄──►│    IDLE      │
          │       └────┬─────┘    └──────────────┘
          │            │ click
          │            ▼
          │       ┌──────────┐
          │       │ SELECTED │ ← 300ms burst glow
          │       └────┬─────┘
          │            ▼
          │       ┌──────────────┐
          │       │ DISSOLVING   │ ← particle dissolve, 1.2s
          │       └──────┬───────┘
          │              │ particle done → token na workbenchu
          │              ▼
          │         (karta usuwa się z DOM)
          │
          │  (ścieżka odrzucenia)
          │       ┌──────────┐
          │       │  IDLE    │ → timer / "dalej"
          │       └────┬─────┘
          │            ▼
          │       ┌──────────┐
          │       │  FADING  │ ← przyciemnienie 0.4s
          │       └────┬─────┘
          │            ▼
          │       ┌──────────────┐
          │       │ DISSOLVING   │ ← rozpad (20-40 particle), bez tokena
          │       └──────────────┘
          │
          │  (ścieżka przywrócenia)
          │       ┌──────────┐
          └───────┤  IDLE    │ ← karta wrócona z workbencha
                  └──────────┘
```

### 5.2 Implementacja CardStateManager

```js
/**
 * CardStateManager — maszyna stanów dla kart tarota.
 * Wzorzec: Finite State Machine (deterministyczna, 7 stanów)
 * Zgodność: ES5, IIFE
 *
 * Stany: QUEUED → ENTERING → IDLE ↔ HOVER → SELECTED → DISSOLVING → (DOM remove)
 *         IDLE → FADING → DISSOLVING → (DOM remove)
 *
 * Każda karta ma własną instancję state machine.
 */

const CardStateManager = (function () {
  "use strict";

  /* ─── Stałe ─── */
  var STATES = {
    QUEUED: "queued",
    ENTERING: "entering",
    IDLE: "idle",
    HOVER: "hover",
    SELECTED: "selected",
    FADING: "fading",
    DISSOLVING: "dissolving",
  };

  /* ─── Dozwolone tranzycje ─── */
  var TRANSITIONS = {};
  TRANSITIONS[STATES.QUEUED] = [STATES.ENTERING];
  TRANSITIONS[STATES.ENTERING] = [STATES.IDLE];
  TRANSITIONS[STATES.IDLE] = [STATES.HOVER, STATES.FADING, STATES.SELECTED];
  TRANSITIONS[STATES.HOVER] = [STATES.IDLE, STATES.SELECTED];
  TRANSITIONS[STATES.SELECTED] = [STATES.DISSOLVING];
  TRANSITIONS[STATES.FADING] = [
    STATES.DISSOLVING,
    STATES.IDLE,
  ]; /* IDLE = przywrócenie */
  TRANSITIONS[STATES.DISSOLVING] = []; /* końcowy — brak wyjścia */

  /* ─── Konstruktor ─── */
  function StateMachine(cardId, callbacks) {
    var self = this;
    self.cardId = cardId;
    self._state = STATES.QUEUED;
    self._callbacks = callbacks || {};
    self._timers = [];
    self._elapsed = 0;
  }

  /* ─── Pobierz aktualny stan ─── */
  StateMachine.prototype.getState = function () {
    return this._state;
  };

  /* ─── Tranzycja ─── */
  StateMachine.prototype.transition = function (newState) {
    var self = this;
    var allowed = TRANSITIONS[self._state];

    if (!allowed || allowed.indexOf(newState) === -1) {
      console.warn(
        "[CardStateManager] Nieprawidlowa tranzycja:",
        self._state,
        "->",
        newState,
        "dla karty",
        self.cardId,
      );
      return false;
    }

    var oldState = self._state;
    self._state = newState;
    self._elapsed = 0;

    /* callback onLeave */
    if (self._callbacks.onLeave) {
      self._callbacks.onLeave(oldState, newState, self.cardId);
    }

    /* callback onEnter */
    if (self._callbacks.onEnter) {
      self._callbacks.onEnter(newState, oldState, self.cardId);
    }

    /* event DOM */
    var evt = new CustomEvent("tarot:state-change", {
      detail: {
        cardId: self.cardId,
        from: oldState,
        to: newState,
      },
    });
    document.dispatchEvent(evt);

    return true;
  };

  /* ─── Wymuś tranzycję — bez walidacji (dla inicjalizacji) ─── */
  StateMachine.prototype.forceState = function (state) {
    var oldState = this._state;
    this._state = state;
    if (this._callbacks.onEnter) {
      this._callbacks.onEnter(state, oldState, this.cardId);
    }
  };

  /* ─── Zegar stanu — wywoływany co frame z delta ms ─── */
  StateMachine.prototype.tick = function (deltaMs) {
    this._elapsed += deltaMs;

    /* Automatyczne tranzycje czasowe */
    switch (this._state) {
      case STATES.ENTERING:
        if (this._elapsed >= 1000) {
          this.transition(STATES.IDLE);
        }
        break;

      case STATES.SELECTED:
        if (this._elapsed >= 300) {
          this.transition(STATES.DISSOLVING);
        }
        break;

      case STATES.IDLE:
        if (this._elapsed >= 8000 && this._elapsed < 12000) {
          if (this._callbacks.onFadeWarning) {
            this._callbacks.onFadeWarning(this.cardId, "level-1");
          }
        }
        if (this._elapsed >= 12000 && this._elapsed < 15000) {
          if (this._callbacks.onFadeWarning) {
            this._callbacks.onFadeWarning(this.cardId, "level-2");
          }
        }
        if (this._elapsed >= 18000) {
          this.transition(STATES.FADING);
        }
        break;

      case STATES.FADING:
        if (this._elapsed >= 400) {
          this.transition(STATES.DISSOLVING);
        }
        break;

      case STATES.HOVER:
        /* HOVER resetuje timer IDLE — elapsed zostaje, ale karta nie blaknie */
        break;

      case STATES.DISSOLVING:
        if (this._elapsed >= 1400 && this._callbacks.onDissolveComplete) {
          this._callbacks.onDissolveComplete(this.cardId);
        }
        break;
    }
  };

  /* ─── Reset timera (np. powrót z HOVER do IDLE) ─── */
  StateMachine.prototype.resetTimer = function () {
    this._elapsed = 0;
  };

  /* ─── Sprawdź czy karta jest w stanie aktywnym wizualnie ─── */
  StateMachine.prototype.isVisible = function () {
    return this._state !== STATES.QUEUED && this._state !== STATES.DISSOLVING;
  };

  /* ─── Zniszcz — wyczyść timery ─── */
  StateMachine.prototype.destroy = function () {
    this._timers.forEach(function (t) {
      clearTimeout(t);
    });
    this._timers = [];
    this._callbacks = {};
  };

  return {
    create: function (cardId, callbacks) {
      return new StateMachine(cardId, callbacks);
    },
    STATES: STATES,
  };
})();
```

### 5.3 Callbacki CardStateManager

```js
/* Callbacki dla każdej karty */
var callbacks = {
  onEnter: function (newState, oldState, cardId) {
    /* TarotDeck aplikuje odpowiednią klasę CSS na elemencie karty */
    TarotDeck.setStateClass(cardId, newState);
  },
  onLeave: function (oldState, newState, cardId) {
    /* Zatrzymanie animacji specyficznej dla stanu */
  },
  onFadeWarning: function (cardId, level) {
    /* level-1: opacity 0.85→0.65, level-2: 0.65→0.45 */
    TarotDeck.applyFade(cardId, level);
  },
  onDissolveComplete: function (cardId) {
    /* Particle system już działa — teraz usuń element DOM */
    TarotDeck.removeCardElement(cardId);
  },
};
```

---

## 6. System audio — Web Audio API

### 6.1 Założenia

Dźwięk jest **opcjonalny** (domyślnie włączony, ale respektuje `prefers-reduced-motion` i systemowy setting audio). Żadnych zewnętrznych plików dźwiękowych — wszystko generowane syntetycznie przez Web Audio API.

AudioContext jest tworzony **lazy** — przy pierwszej interakcji użytkownika (click/touch), aby ominąć restrykcje autoplay w przeglądarkach.

### 6.2 Architektura TarotAudioEngine

```js
const TarotAudioEngine = (function () {
  "use strict";

  /* ─── Stan ─── */
  var _ctx = null;
  var _masterGain = null;
  var _ambientGain = null;
  var _ambientOsc = null;
  var _enabled = true;
  var _volume = 0.3;

  /* ─── Inicjalizacja lazy ─── */
  function _ensureContext() {
    if (_ctx) return;
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
    _masterGain = _ctx.createGain();
    _masterGain.gain.value = _volume;
    _masterGain.connect(_ctx.destination);

    _ambientGain = _ctx.createGain();
    _ambientGain.gain.value = 0.02; /* bardzo cicho */
    _ambientGain.connect(_masterGain);
  }

  /* ─── Ambient — niskie, ciągłe tło ─── */
  function _startAmbient() {
    if (!_enabled) return;
    _ensureContext();
    if (_ambientOsc) return;

    /* Dwa oscylatory dla bogatszego dźwięku */
    _ambientOsc = _ctx.createOscillator();
    _ambientOsc.type = "sine";
    _ambientOsc.frequency.value = 55; /* A1 */

    var osc2 = _ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 82.41; /* E2 */
    osc2.detune.value = 5;

    var lfo = _ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.15; /* bardzo wolne falowanie */

    var lfoGain = _ctx.createGain();
    lfoGain.gain.value = 0.005;

    lfo.connect(lfoGain);
    lfoGain.connect(_ambientGain.gain);
    _ambientOsc.connect(_ambientGain);
    osc2.connect(_ambientGain);

    _ambientOsc.start();
    osc2.start();
    lfo.start();

    _ambientOsc._helper = osc2;
    _ambientOsc._lfo = lfo;
  }

  function _stopAmbient() {
    if (!_ambientOsc) return;
    try {
      _ambientOsc.stop();
      if (_ambientOsc._helper) _ambientOsc._helper.stop();
      if (_ambientOsc._lfo) _ambientOsc._lfo.stop();
    } catch (e) {
      /* już zatrzymany */
    }
    _ambientOsc = null;
  }

  /* ─── Dźwięki interakcji ─── */

  /* Hover — krótki, delikatny ping */
  function _playHover() {
    if (!_enabled) return;
    _ensureContext();
    var osc = _ctx.createOscillator();
    var gain = _ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880; /* A5 */
    gain.gain.setValueAtTime(0.04, _ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, _ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(_masterGain);
    osc.start();
    osc.stop(_ctx.currentTime + 0.15);
  }

  /* Click — krótki impuls + harmoniczna */
  function _playClick() {
    if (!_enabled) return;
    _ensureContext();
    var now = _ctx.currentTime;

    /* Impuls basowy */
    var osc1 = _ctx.createOscillator();
    var gain1 = _ctx.createGain();
    osc1.type = "triangle";
    osc1.frequency.value = 220;
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(_masterGain);
    osc1.start(now);
    osc1.stop(now + 0.08);

    /* Harmoniczna górna */
    var osc2 = _ctx.createOscillator();
    var gain2 = _ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = 1320; /* E6 */
    gain2.gain.setValueAtTime(0.06, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc2.connect(gain2);
    gain2.connect(_masterGain);
    osc2.start(now + 0.02);
    osc2.stop(now + 0.2);
  }

  /* Dissolve — szum opadający + glissando */
  function _playDissolve() {
    if (!_enabled) return;
    _ensureContext();
    var now = _ctx.currentTime;

    /* Szum opadający */
    var bufferSize = _ctx.sampleRate * 0.8;
    var buffer = _ctx.createBuffer(1, bufferSize, _ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    var noise = _ctx.createBufferSource();
    noise.buffer = buffer;
    var gainNoise = _ctx.createGain();
    gainNoise.gain.setValueAtTime(0.06, now);
    gainNoise.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    noise.connect(gainNoise);
    gainNoise.connect(_masterGain);
    noise.start(now);
  }

  /* Landing (token na stole) — krótki "thud" */
  function _playLanding() {
    if (!_enabled) return;
    _ensureContext();
    var now = _ctx.currentTime;
    var osc = _ctx.createOscillator();
    var gain = _ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(_masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /* Celebration — sekwencja dźwięków przy zakończeniu batcha */
  function _playCelebration() {
    if (!_enabled) return;
    _ensureContext();
    var now = _ctx.currentTime;
    var notes = [523.25, 659.25, 783.99, 1046.5]; /* C5, E5, G5, C6 */

    for (var i = 0; i < notes.length; i++) {
      (function (freq, delay) {
        var osc = _ctx.createOscillator();
        var gain = _ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        var t = now + delay;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.connect(gain);
        gain.connect(_masterGain);
        osc.start(t);
        osc.stop(t + 0.6);
      })(notes[i], 0.1 * i);
    }
  }

  /* ─── API publiczne ─── */
  return {
    init: function () {
      _ensureContext();
    },
    startAmbient: _startAmbient,
    stopAmbient: _stopAmbient,
    playHover: _playHover,
    playClick: _playClick,
    playDissolve: _playDissolve,
    playLanding: _playLanding,
    playCelebration: _playCelebration,
    setEnabled: function (v) {
      _enabled = v;
    },
    setVolume: function (v) {
      _volume = v;
      if (_masterGain) _masterGain.gain.value = v;
    },
    isEnabled: function () {
      return _enabled;
    },
  };
})();
```

### 6.3 Mapa dźwięków interakcji

| Interakcja              | Dźwięk                                            | Czas  | Głośność |
| ----------------------- | ------------------------------------------------- | ----- | -------- |
| **Hover**               | Delikatny ping (A5, sine)                         | 150ms | 0.04     |
| **Click (select)**      | Impuls basowy (triangle 220Hz) + harmoniczna (E6) | 200ms | 0.12     |
| **Dissolve**            | Szum opadający z glissandem                       | 800ms | 0.06     |
| **Landing (token)**     | Thud (150→60Hz)                                   | 150ms | 0.15     |
| **Celebration**         | Arpeggio C-dur (4 dźwięki)                        | 600ms | 0.08     |
| **Batch start**         | Ciche „westchnienie" (szum narastający)           | 500ms | 0.03     |
| **Odrzucenie (FADING)** | Bardzo ciche glissando w dół                      | 300ms | 0.02     |

---

## 7. Tryby pracy

### 7.1 Full-Screen Mode

System tarotowy aktywuje pełnoekranowy widok, który tymczasowo ukrywa elementy interfejsu (logo, progress bar, workbench) i wyświetla karty na 100% viewportu.

**Aktywacja:** Przycisk `⛶` w rogu tarot container, lub klawisz `F`.

**Dezaktywacja:** `Escape`, kliknięcie `⛶` ponownie, lub wyjście z full-screen przez przeglądarkę.

```js
function _toggleFullScreen() {
  var container = document.getElementById("tarot_container");

  if (!document.fullscreenElement) {
    /* Zapisz stan interfejsu */
    _savedUIState = {
      logo: document.getElementById("logo").style.opacity,
      workbench: document.getElementById("the-workbench").style.opacity,
      progress: document.getElementById("progress-bar").style.opacity,
    };

    /* Ukryj elementy interfejsu */
    _setUIElementsOpacity(0);

    /* Powiększ container */
    container.classList.add("tarot-fullscreen");

    /* API Fullscreen */
    if (container.requestFullscreen) {
      container.requestFullscreen();
    } else if (container.webkitRequestFullscreen) {
      container.webkitRequestFullscreen();
    }

    /* Dodatkowy padding dla kart */
    TarotDeck.setLayoutMode("fullscreen");

    document.dispatchEvent(new CustomEvent("tarot:fullscreen-enter"));
  } else {
    _exitFullScreen();
  }
}

function _exitFullScreen() {
  var container = document.getElementById("tarot_container");

  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }

  container.classList.remove("tarot-fullscreen");
  _setUIElementsOpacity(1);
  TarotDeck.setLayoutMode("normal");

  document.dispatchEvent(new CustomEvent("tarot:fullscreen-exit"));
}
```

**CSS:**

```css
.tarot-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  background: radial-gradient(ellipse at center, #1a1a0f 0%, #0a0a05 100%);
}

.tarot-fullscreen .tarot-grid {
  grid-template-columns: repeat(5, 1fr);
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 5vh;
}
```

### 7.2 Mobile Mode

Na ekranach poniżej 600px szerokości system przełącza się w tryb mobilny.

**Zmiany:**

| Element             | Desktop             | Mobile                                                   |
| ------------------- | ------------------- | -------------------------------------------------------- |
| **Grid**            | 4-5 kolumn          | 2 kolumny, 3 wiersze (6 kart max)                        |
| **Detail window**   | Overlay boczny      | Bottom sheet (`position: fixed; bottom: 0; width: 100%`) |
| **Particle count**  | 40-60               | 10-15                                                    |
| **Float animation** | Tak, 5-8s           | Wyłączone (tylko subtle glow)                            |
| **Hover**           | Pełny detail window | Tap → detail window (jak hover)                          |
| **Full-screen**     | Dostępny            | Automatyczny (karty na full viewport)                    |
| **Workbench**       | Widoczny stale      | Ukryty, pokazuje się na swipe up lub przy selekcji       |

**Bottom sheet implementation:**

```js
function _showMobileSheet(cardData, convergenceData) {
  var sheet = document.getElementById("mobile-sheet");
  if (!sheet) {
    sheet = document.createElement("div");
    sheet.id = "mobile-sheet";
    sheet.className = "tarot-mobile-sheet";
    document.body.appendChild(sheet);

    /* Zamknięcie swipe down */
    var startY = 0;
    sheet.addEventListener("touchstart", function (e) {
      startY = e.touches[0].clientY;
    });
    sheet.addEventListener("touchmove", function (e) {
      var diff = e.touches[0].clientY - startY;
      if (diff > 80) _hideMobileSheet();
    });
  }

  sheet.innerHTML =
    '<div class="sheet-handle"></div>' +
    '<div class="sheet-header">' +
    '<span class="sheet-symbol">' +
    cardData.symbol +
    "</span>" +
    '<span class="sheet-name">' +
    cardData.name +
    "</span>" +
    '<span class="sheet-number">' +
    cardData.number +
    "</span>" +
    "</div>" +
    '<div class="sheet-body">' +
    '<p class="sheet-desc">' +
    cardData.description +
    "</p>" +
    '<div class="sheet-convergence">' +
    _renderConvergenceBars(convergenceData) +
    "</div>" +
    "</div>" +
    '<button class="sheet-select" data-id="' +
    cardData.id +
    '">Wybierz tę kartę</button>';

  sheet.classList.add("active");
}

function _hideMobileSheet() {
  var sheet = document.getElementById("mobile-sheet");
  if (sheet) sheet.classList.remove("active");
}
```

**CSS dla bottom sheet:**

```css
.tarot-mobile-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  max-height: 60vh;
  background: linear-gradient(180deg, #1a1a0f 0%, #0f0f08 100%);
  border-top: 1px solid rgba(255, 204, 0, 0.3);
  border-radius: 16px 16px 0 0;
  z-index: 500;
  transform: translateY(100%);
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  padding: 12px 16px 24px;
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.7);
  overflow-y: auto;
}

.tarot-mobile-sheet.active {
  transform: translateY(0);
}

.sheet-handle {
  width: 40px;
  height: 4px;
  background: rgba(255, 204, 0, 0.3);
  border-radius: 2px;
  margin: 0 auto 12px;
}
```

### 7.3 Deep Focus Mode

Tryb dla użytkowników, którzy chcą maksymalnie skupić się na selekcji kart. Eliminuje wszystkie dystrakcje.

**Aktywacja:** Przycisk `◎` w toolbarze, lub dwukrotne kliknięcie w pustą przestrzeń tarot container.

**Co się zmienia:**

1. **Workbench** — ukryty (tokeny widoczne tylko jako licznik)
2. **Ambient particles** — background wyłączony (oszczędność GPU)
3. **Atmosphere layer** — przyciemniony do 0.3 opacity
4. **Detail window** — pojawia się tylko na długie przytrzymanie (1s), nie na hover
5. **Dźwięk ambient** — wyciszony
6. **Progress bar** — zamieniony na subtelną kropkę
7. **Float animation** — spowolniona 3× (ledwo zauważalna)
8. **Wszystkie CTA** — ukryte, pojawiają się fade na hover w dolnym rogu

**Implementacja:**

```js
var _deepFocus = false;

function _toggleDeepFocus() {
  _deepFocus = !_deepFocus;
  var body = document.body;

  body.classList.toggle("deep-focus", _deepFocus);

  if (_deepFocus) {
    /* Zapisz stan */
    _savedFocusState = {
      ambientVolume: TarotAudioEngine.isEnabled() ? 0.02 : 0,
      particleBg: true,
      workbenchVisible: true,
    };

    /* Aplikuj Deep Focus */
    TarotAudioEngine.setVolume(0.05);
    document.getElementById("the-workbench").classList.add("df-hidden");
    document.getElementById("progress-bar").classList.add("df-dot");
    TarotDeck.setDetailWindowMode("long-press");
    TarotDeck.setFloatSpeed(0.33); /* 3× wolniej */

    document.dispatchEvent(new CustomEvent("tarot:deep-focus-enter"));
  } else {
    /* Przywróć */
    TarotAudioEngine.setVolume(_savedFocusState.ambientVolume || 0.3);
    document.getElementById("the-workbench").classList.remove("df-hidden");
    document.getElementById("progress-bar").classList.remove("df-dot");
    TarotDeck.setDetailWindowMode("hover");
    TarotDeck.setFloatSpeed(1.0);

    document.dispatchEvent(new CustomEvent("tarot:deep-focus-exit"));
  }
}
```

**CSS:**

```css
/* Deep Focus — workbench ukryty */
.deep-focus #the-workbench {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.6s ease;
}

/* Progress bar → kropka */
.deep-focus #progress-bar {
  height: 4px;
  width: 4px;
  border-radius: 50%;
  top: 8px;
  right: 8px;
  left: auto;
  background: #e6a800;
  box-shadow: 0 0 8px rgba(230, 168, 0, 0.5);
}

/* CTA ukryte, pojawiaja sie na hover w dolnym rogu */
.deep-focus .cta-button {
  opacity: 0;
  transition: opacity 0.5s ease;
}

.deep-focus .cta-button:hover,
.deep-focus .cta-button:focus-visible {
  opacity: 1;
}

/* Atmosfera przyciemniona */
.deep-focus .atmosphere-layer {
  opacity: 0.3;
}

/* Detail window tylko na long-press */
.deep-focus .tarot-detail-window {
  transition-delay: 1s;
}
```

---

## 8. Fazy implementacyjne

### Faza 0: Przygotowanie i refaktoring istniejącego kodu

**Cel:** Przygotowanie gruntu pod moduły tarotowe — rozszerzenia istniejących modułów.

#### 8.0.1 analyzer-engine.js — rozszerzenia

Dodaj metody wymagane przez system kart:

```js
/* W analyzer-engine.js, wewnątrz return {} */
generateComboName: function(tagA, tagB) {
  if (!tagA || !tagB) return null;

  /* Szukaj w comboNames z tags-data */
  var key1 = tagA.id + '+' + tagB.id;
  var key2 = tagB.id + '+' + tagA.id;

  if (TAG_DATA.comboNames && TAG_DATA.comboNames[key1]) {
    return TAG_DATA.comboNames[key1];
  }
  if (TAG_DATA.comboNames && TAG_DATA.comboNames[key2]) {
    return TAG_DATA.comboNames[key2];
  }

  /* Fallback: generuj nazwę opisową */
  return tagA.name + ' + ' + tagB.name;
},

/* Rozszerzona wersja computeSynergyStrength — zwraca skalę 1-5 */
computeSynergyRank: function(tagA, tagB) {
  var strength = this.computeSynergyStrength(tagA, tagB);
  /* 0-20% → 1, 20-40% → 2, 40-60% → 3, 60-80% → 4, 80-100% → 5 */
  if (strength < 20) return 1;
  if (strength < 40) return 2;
  if (strength < 60) return 3;
  if (strength < 80) return 4;
  return 5;
}
```

#### 8.0.2 tags-data.js — rozszerzenia

```js
/* Nowa sekcja na końcu TAG_DATA (przed ewentualnym exportem) */
var COMBO_NAMES = {
  "deep+drone": "deep drone",
  "dark+ambient": "dark ambient",
  "dark+gothic": "dark gothic",
  "dark+industrial": "dark industrial",
  "industrial+metal": "industrial metal",
  "ethereal+vocal": "ethereal vocal",
  "female-vocal+ethereal": "ethereal female vocal",
  "acoustic+folk": "acoustic folk",
  "electronic+synth": "electronic synth",
  "orchestra+cinematic": "orchestral cinematic",
  "lo-fi+ambient": "lo-fi ambient",
  "trap+808-bass": "trap 808",
  "piano+melancholic": "melancholic piano",
  "drone+ambient": "ambient drone",
  "drone+dark": "deep drone",
};

/* Symbol tarota dla kategorii — dodaj do obiektu kategorii */
var CATEGORY_TAROT_SYMBOLS = {
  "Vocal Style": "\u266A" /* ♪ */,
  "Vocal Technique": "\u25C7" /* ◇ */,
  Instrument: "\u2662" /* ♢ */,
  Genre: "\u2605" /* ★ */,
  Mood: "\u263D" /* ☽ */,
  Production: "\u2699" /* ⚙ */,
  Structure: "\u2726" /* ✦ */,
  Effect: "\u2727" /* ✧ */,
  "Tempo/Energy": "\u25B2" /* ▲ */,
  "Era/Reference": "\u25CF" /* ● */,
};

var CATEGORY_TAROT_COLORS = {
  "Vocal Style": "#ffcc00",
  "Vocal Technique": "#ffaa33",
  Instrument: "#ff8800",
  Genre: "#e6a800",
  Mood: "#cc8800",
  Production: "#b37700",
  Structure: "#996600",
  Effect: "#cc4400",
  "Tempo/Energy": "#aa4400",
  "Era/Reference": "#884400",
};
```

**Uwaga:** `COMBO_NAMES` jest przypisywany jako `TAG_DATA.comboNames`, jeśli `TAG_DATA` jest tablicą — wtedy tworzymy osobny obiekt `TagDataMeta`:

```js
/* Na końcu tags-data.js */
var TagDataMeta = {
  comboNames: COMBO_NAMES,
  tarotSymbols: CATEGORY_TAROT_SYMBOLS,
  tarotColors: CATEGORY_TAROT_COLORS,
};
```

#### 8.0.3 app-logic.js — nowy stan tarot_selection

W `flow_states` w `spec-kafelki.json` dodaj stan między `initial` a `selection`:

```json
{
  "id": "tarot_selection",
  "description": "System kart tarota — batch kart do wyboru. Karty wchodza z particle assemble, znikaja przez dissolve.",
  "workbench": "widoczne tokeny (jesli jakies wybrano), 'dalej' aktywny po 1+",
  "parameters": {
    "batch_1_size": 10,
    "batch_n_size": 5,
    "max_batches": 5,
    "batch_timeout_1": 30000,
    "batch_timeout_n": 25000
  }
}
```

W `app-logic.js`:

```js
/* Nowa metoda do zarządzania przepływem tarota */
var _tarotFlow = {
  active: false,
  currentBatch: 0,
  totalBatches: 0,
  cardsInBatch: 0,
};

function startTarotSelection() {
  _tarotFlow.active = true;
  _tarotFlow.currentBatch = 1;
  _tarotFlow.totalBatches = 5;

  /* Ukryj ember container, pokaż tarot container */
  document.getElementById("ember_container").style.display = "none";
  document.getElementById("tarot_container").style.display = "block";

  /* Zainicjalizuj TarotDeck z pierwszym batchem */
  var tags = TarotDeck.selectBatch(10);
  TarotDeck.render(tags);

  document.dispatchEvent(new CustomEvent("tarot:selection-start"));
}

function showNextBatch() {
  _tarotFlow.currentBatch++;

  if (_tarotFlow.currentBatch > _tarotFlow.totalBatches) {
    endTarotSelection();
    return;
  }

  var size = _tarotFlow.currentBatch === 1 ? 10 : 5;
  var tags = TarotDeck.selectBatch(size);
  TarotDeck.render(tags);

  document.dispatchEvent(
    new CustomEvent("tarot:batch-show", {
      detail: { batch: _tarotFlow.currentBatch, size: size },
    }),
  );
}

function endTarotSelection() {
  _tarotFlow.active = false;
  document.getElementById("tarot_container").style.display = "none";
  document.getElementById("ember_container").style.display = "block";

  /* Przejdź do prompt_preview */
  /* (implementacja z istniejącego flow) */

  document.dispatchEvent(new CustomEvent("tarot:selection-end"));
}
```

---

### Faza 1: CardStateManager i maszyna stanów

**Cel:** Implementacja `CardStateManager` (patrz sekcja 5) i integracja z `TarotDeck`.

**Plik:** `tarot-deck.js` (część 1 — state management)

**Zadania:**

1. Osadź `CardStateManager` jako prywatny moduł wewnątrz `TarotDeck` lub jako osobny, zależny moduł.
2. Zaimplementuj callbacki stanów (CSS class binding, fade warning, dissolve complete).
3. Dodaj `requestAnimationFrame` loop dla tickowania wszystkich aktywnych kart.
4. Zintegruj z event busem — dispatch `tarot:state-change` na każdej tranzycji.

**Kryterium akceptacji:**

- Każda karta ma poprawny initial state (`QUEUED`).
- Po renderze batcha wszystkie karty przechodzą `QUEUED → ENTERING → IDLE`.
- Po 18s bez interakcji karta przechodzi `IDLE → FADING → DISSOLVING`.
- Debug mode: w konsoli `TarotDeck.debugStates()` zwraca tablicę `{cardId, state, elapsed}`.

---

### Faza 2: Renderer kart tarota (tarot-deck.js)

**Cel:** Renderowanie kart w gridzie, zarządzanie DOM, obsługa eventów myszy i dotyku.

**Plik:** `tarot-deck.js` (część 2 — rendering)

#### 8.2.1 Struktura DOM karty

```js
function _createCardElement(tag, index) {
  var card = document.createElement("div");
  card.className = "tarot-card";
  card.dataset.id = tag.id;
  card.dataset.index = index;

  var symbol = TagDataMeta.tarotSymbols[tag.category] || "\u2726";
  var number = _generateCardNumber(tag.category, index);
  var synergyDots = _getSynergyDots(tag);

  card.innerHTML =
    '<div class="tarot-card-outer">' +
    '<div class="tarot-card-inner">' +
    /* Górny róg */
    '<div class="card-corner card-corner--tl"></div>' +
    '<div class="card-corner card-corner--tr"></div>' +
    /* Symbol + numer (góra) */
    '<div class="card-header">' +
    '<span class="card-symbol">' +
    symbol +
    "</span>" +
    '<span class="card-number">' +
    number +
    "</span>" +
    "</div>" +
    /* Główna etykieta */
    '<div class="card-body">' +
    '<div class="card-name">' +
    _escapeHtml(tag.name) +
    "</div>" +
    '<div class="card-divider">&#x2550;&#x2550;&#x2550; &#x2726; &#x2550;&#x2550;&#x2550;</div>' +
    '<div class="card-desc">' +
    _escapeHtml(tag.description || "") +
    "</div>" +
    "</div>" +
    /* Synergy indicator */
    '<div class="card-footer">' +
    '<div class="card-synergy-dots">' +
    synergyDots +
    "</div>" +
    '<div class="card-synergy-hint">' +
    _getSynergyHint(tag) +
    "</div>" +
    "</div>" +
    "</div>" +
    /* Lustrzane dolne narożniki */
    '<div class="card-corner card-corner--bl"></div>' +
    '<div class="card-corner card-corner--br"></div>' +
    '<div class="card-number-mirror">' +
    number +
    "</div>" +
    "</div>";

  return card;
}
```

#### 8.2.2 Event binding

```js
function _bindCardEvents(cardEl) {
  var cardId = cardEl.dataset.id;

  cardEl.addEventListener("mouseenter", function () {
    var sm = _stateMachines[cardId];
    if (!sm || sm.getState() !== CardStateManager.STATES.IDLE) return;

    sm.transition(CardStateManager.STATES.HOVER);
    TarotAudioEngine.playHover();
    TarotDetailWindow.show(cardId);
  });

  cardEl.addEventListener("mouseleave", function () {
    var sm = _stateMachines[cardId];
    if (!sm || sm.getState() !== CardStateManager.STATES.HOVER) return;

    sm.transition(CardStateManager.STATES.IDLE);
    TarotDetailWindow.hide(300);
  });

  cardEl.addEventListener("click", function () {
    var sm = _stateMachines[cardId];
    if (!sm) return;
    var state = sm.getState();

    if (
      state === CardStateManager.STATES.IDLE ||
      state === CardStateManager.STATES.HOVER
    ) {
      sm.transition(CardStateManager.STATES.SELECTED);
      TarotAudioEngine.playClick();
      TarotDetailWindow.hide(0);

      /* Particle dissolve start po krótkim delay (burst glow) */
      setTimeout(function () {
        var rect = cardEl.getBoundingClientRect();
        TarotParticle.dissolve(cardId, rect, tag, false);
      }, 200);
    }
  });

  /* Touch — dla mobile: tap = hover, double-tap = select */
  var tapCount = 0;
  var tapTimer = null;

  cardEl.addEventListener("touchend", function (e) {
    tapCount++;
    if (tapCount === 1) {
      /* Pojedynczy tap → jak hover */
      var sm = _stateMachines[cardId];
      if (sm && sm.getState() === CardStateManager.STATES.IDLE) {
        sm.transition(CardStateManager.STATES.HOVER);
        TarotDetailWindow.showMobile(cardId);
      }

      tapTimer = setTimeout(function () {
        tapCount = 0;
      }, 300);
    } else if (tapCount >= 2) {
      /* Podwójny tap → jak click */
      clearTimeout(tapTimer);
      tapCount = 0;

      cardEl.click();
    }
  });
}
```

#### 8.2.3 Grid i batch flow

```js
function _renderGrid(cardElements) {
  var grid = document.getElementById("tarot-grid");
  if (!grid) {
    grid = document.createElement("div");
    grid.id = "tarot-grid";
    grid.className = "tarot-grid";
    document.getElementById("tarot_container").appendChild(grid);
  }

  /* Wyczyść grid z poprzednimi kartami */
  grid.innerHTML = "";

  /* Dodaj karty ze staggerem */
  cardElements.forEach(function (el, i) {
    el.style.opacity = "0";
    el.style.transform = "scale(0.8) translateY(20px)";
    grid.appendChild(el);

    /* Staggered entry */
    setTimeout(function () {
      el.classList.add("tarot-card--entering");
      var sm = _stateMachines[el.dataset.id];
      if (sm) sm.transition(CardStateManager.STATES.ENTERING);
    }, i * 200); /* 200ms stagger */

    /* Po animacji entering → IDLE */
    setTimeout(
      function () {
        el.classList.remove("tarot-card--entering");
        el.classList.add("tarot-card--idle");
        var sm = _stateMachines[el.dataset.id];
        if (sm) sm.transition(CardStateManager.STATES.IDLE);
      },
      1000 + i * 200,
    );
  });
}
```

---

### Faza 3: Particle system (tarot-particle.js)

**Cel:** Canvasowy system cząsteczek dla dissolve (wybór), assemble (pojawienie się) i celebration (koniec batcha).

**Plik:** `tarot-particle.js`

#### 8.3.1 Architektura

```js
const TarotParticle = (function () {
  "use strict";

  var _canvas = null;
  var _ctx = null;
  var _particles = [];
  var _animId = null;
  var _performance = "high"; /* 'high' | 'medium' | 'low' */
  var _container = null;

  /* ─── Inicjalizacja ─── */
  function _init(containerEl) {
    _container = containerEl;
    _canvas = document.createElement("canvas");
    _canvas.className = "tarot-particle-canvas";
    _canvas.style.cssText =
      "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:100;";
    _container.appendChild(_canvas);
    _ctx = _canvas.getContext("2d");
    _resize();
    _detectPerformance();
  }

  function _resize() {
    if (!_canvas) return;
    var rect = _container.getBoundingClientRect();
    _canvas.width = rect.width * window.devicePixelRatio;
    _canvas.height = rect.height * window.devicePixelRatio;
    _canvas.style.width = rect.width + "px";
    _canvas.style.height = rect.height + "px";
    if (_ctx) {
      _ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }

  function _detectPerformance() {
    /* Mobile / prefers-reduced-motion → low */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      _performance = "low";
      return;
    }
    if (window.innerWidth < 600) {
      _performance = "low";
    } else if (window.innerWidth < 1024) {
      _performance = "medium";
    } else {
      _performance = "high";
    }
  }

  /* ─── Struktura particle ─── */
  function _createParticle(x, y, color, config) {
    var angle = Math.random() * Math.PI * 2;
    var speed = config.speed || 60;
    var size =
      config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin);

    return {
      x: x,
      y: y,
      vx: Math.cos(angle) * speed * (0.5 + Math.random()),
      vy: Math.sin(angle) * speed * (0.5 + Math.random()),
      size: size,
      originalSize: size,
      color: color,
      opacity: 1.0,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 4,
      life: 0,
      maxLife: config.lifespan || 1200,
      gravity: config.gravity || 0.15,
      drag: config.drag || 0.92,
      phase: "explosion" /* explosion | float | disperse */,
    };
  }

  /* ─── Dissolve — karta rozpada się na particle ─── */
  function _dissolve(cardId, rect, tag, isRejected) {
    if (_performance === "low") {
      /* Fallback: zwykły fade */
      _emitFadeEvent(cardId, 1200);
      return;
    }

    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var count = isRejected ? 20 : _performance === "high" ? 50 : 30;
    var palette = _getColorPalette(tag);
    var config = {
      count: count,
      speed: isRejected ? 30 : 60,
      lifespan: 1200,
      sizeMin: 2,
      sizeMax: 6,
      gravity: 0.15,
      drag: 0.92,
    };

    for (var i = 0; i < count; i++) {
      var color = palette[Math.floor(Math.random() * palette.length)];
      _particles.push(_createParticle(cx, cy, color, config));
    }

    if (!_animId) _loop();
  }

  /* ─── Celebration — fala cząsteczek ─── */
  function _celebrate(rect) {
    if (_performance === "low") return;

    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;

    for (var wave = 0; wave < 3; wave++) {
      setTimeout(function () {
        var colors = ["#ffcc00", "#ffaa33", "#ffd700", "#ff8800", "#ffffff"];
        for (var i = 0; i < 15; i++) {
          var p = _createParticle(
            cx,
            cy,
            colors[Math.floor(Math.random() * colors.length)],
            {
              speed: 80 + Math.random() * 60,
              lifespan: 1500,
              sizeMin: 3,
              sizeMax: 8,
              gravity: 0.05,
              drag: 0.95,
            },
          );
          p.phase = "float";
          _particles.push(p);
        }
        if (!_animId) _loop();
      }, wave * 200);
    }
  }

  /* ─── Pętla animacji ─── */
  function _loop() {
    _animId = requestAnimationFrame(_loop);

    if (_particles.length === 0) {
      cancelAnimationFrame(_animId);
      _animId = null;
      _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
      return;
    }

    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

    var maxParticles =
      _performance === "low" ? 15 : _performance === "medium" ? 35 : 200;
    var renderCount = Math.min(_particles.length, maxParticles);

    for (var i = _particles.length - 1; i >= 0; i--) {
      var p = _particles[i];
      p.life += 16; /* ~60fps */

      if (p.life >= p.maxLife) {
        _particles.splice(i, 1);
        continue;
      }

      var progress = p.life / p.maxLife;
      var dt = 16;

      /* Fazy */
      if (progress < 0.2) {
        /* Explosion */
        p.phase = "explosion";
      } else if (progress < 0.7) {
        /* Float */
        p.phase = "float";
        p.vy -= 0.02; /* lekkie unoszenie */
        p.vx *= 0.98;
      } else {
        /* Disperse */
        p.phase = "disperse";
        p.opacity = 1 - (progress - 0.7) / 0.3;
        p.size = p.originalSize * (1 - ((progress - 0.7) / 0.3) * 0.5);
      }

      /* Fizyka */
      p.vy += p.gravity * (progress < 0.5 ? 0.3 : 1);
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.x += ((p.vx * dt) / 1000) * 60;
      p.y += ((p.vy * dt) / 1000) * 60;

      /* Rotation */
      p.rotation += p.rotationSpeed;

      /* Render */
      _ctx.save();
      _ctx.globalAlpha = p.opacity;
      _ctx.translate(p.x, p.y);
      _ctx.rotate((p.rotation * Math.PI) / 180);
      _ctx.fillStyle = p.color;
      _ctx.shadowColor = p.color;
      _ctx.shadowBlur = p.size * 0.5;
      _ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      _ctx.restore();
    }
  }

  /* ─── Paleta kolorów dla tagu ─── */
  function _getColorPalette(tag) {
    var cat = tag.category;
    switch (cat) {
      case "Vocal Style":
      case "Vocal Technique":
        return ["#ffcc00", "#ffaa33", "#ffffff", "#ffdd77"];
      case "Instrument":
        return ["#ff8800", "#ffcc00", "#cc6600", "#ffaa33"];
      case "Genre":
        return ["#e6a800", "#ffcc00", "#996600", "#cc8800"];
      case "Mood":
        return ["#664400", "#cc8800", "#ffcc00", "#ffaa33"];
      default:
        return ["#996600", "#cc8800", "#ffcc00", "#c4a87c"];
    }
  }

  /* ─── Cleanup ─── */
  function _clear() {
    _particles = [];
    if (_animId) {
      cancelAnimationFrame(_animId);
      _animId = null;
    }
    if (_ctx) _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
  }

  return {
    init: _init,
    resize: _resize,
    dissolve: _dissolve,
    celebrate: _celebrate,
    clear: _clear,
    getPerformance: function () {
      return _performance;
    },
  };
})();
```

**Event na zakończenie dissolve:**

```js
/* W _loop, po usunięciu ostatniego particle z danego dissolve */
/* Użyj słabego ref lub batch ID do detekcji */

function _emitDissolveComplete(cardId) {
  var evt = new CustomEvent("tarot:particle-done", {
    detail: { cardId: cardId },
  });
  document.dispatchEvent(evt);
}
```

---

### Faza 4: Detail Window (tarot-detail-window.js)

**Cel:** Overlay szczegółów tagu na hover karty.

**Plik:** `tarot-detail-window.js`

#### 8.4.1 Architektura

```js
const TarotDetailWindow = (function () {
  "use strict";

  var _el = null;
  var _currentCardId = null;
  var _hideTimer = null;
  var _mode = "hover"; /* 'hover' | 'long-press' | 'mobile' */
  var _delayShow = 150;
  var _delayHide = 300;

  /* ─── Inicjalizacja — stwórz element DOM ─── */
  function _init() {
    _el = document.createElement("div");
    _el.id = "tarot-detail-window";
    _el.className = "tarot-detail-window";
    document.body.appendChild(_el);

    /* Nie znikaj gdy mouseenter na oknie */
    _el.addEventListener("mouseenter", function () {
      clearTimeout(_hideTimer);
    });
    _el.addEventListener("mouseleave", function () {
      _hide(200);
    });
  }

  /* ─── Pokaż ─── */
  function _show(cardId, delay) {
    if (_mode === "long-press") {
      delay = Math.max(delay || 0, 1000);
    } else {
      delay = delay || _delayShow;
    }

    clearTimeout(_hideTimer);

    setTimeout(function () {
      var tag = SunoAnalyzer.getTagById(cardId);
      if (!tag) return;

      _currentCardId = cardId;
      _render(tag, cardId);

      /* Pozycjonuj względem karty */
      var cardEl = document.querySelector(
        '.tarot-card[data-id="' + cardId + '"]',
      );
      if (cardEl) _position(cardEl);
    }, delay);
  }

  /* ─── Render treści ─── */
  function _render(tag, cardId) {
    var symbol = TagDataMeta.tarotSymbols[tag.category] || "\u2726";
    var number = _getCardNumber(cardId);
    var synergyRank = _calcSynergyRank(tag);
    var relatedTags = _getRelatedTags(tag);
    var convergenceData = TarotConvergence.getConvergence(tag);

    var html = "";

    /* Header */
    html += '<div class="dw-header">';
    html += '  <span class="dw-symbol">' + symbol + "</span>";
    html += '  <span class="dw-name">' + _escapeHtml(tag.name) + "</span>";
    html += '  <span class="dw-number">[' + number + "]</span>";
    html +=
      '  <span class="dw-synergy">' + _renderStars(synergyRank) + "</span>";
    html += "</div>";

    /* Divider */
    html += '<div class="dw-divider"></div>';

    /* Opis */
    html +=
      '<div class="dw-description">' +
      _escapeHtml(tag.description || "") +
      "</div>";
    html += '<div class="dw-divider"></div>';

    /* Kategoria + drzewo */
    html += '<div class="dw-meta">';
    html +=
      '  <div><span class="dw-label">Kategoria:</span> ' +
      tag.category +
      "</div>";
    html +=
      '  <div><span class="dw-label">Drzewo:</span> ' +
      _getTreePath(tag) +
      "</div>";
    html += "</div>";
    html += '<div class="dw-divider"></div>';

    /* Powiązane tagi */
    html += '<div class="dw-related">';
    html += '  <div class="dw-label">Powiązane tagi:</div>';
    html += '  <div class="dw-related-chips">';
    for (var i = 0; i < relatedTags.length; i++) {
      html +=
        '    <button class="chip" data-id="' +
        relatedTags[i].id +
        '">+' +
        _escapeHtml(relatedTags[i].name) +
        "</button>";
    }
    html += "  </div>";
    html += "</div>";
    html += '<div class="dw-divider"></div>';

    /* Zbieżność */
    if (convergenceData && convergenceData.length > 0) {
      html += '<div class="dw-convergence">';
      html += '  <div class="dw-label">Zbieżność z wybranymi tagami:</div>';
      for (var j = 0; j < convergenceData.length; j++) {
        var c = convergenceData[j];
        html += '  <div class="conv-row">';
        html +=
          '    <span class="conv-label">' + _escapeHtml(c.tagName) + "</span>";
        html +=
          '    <div class="conv-bar-bg"><div class="conv-bar-fill" style="width:' +
          c.score +
          '%"></div></div>';
        html += '    <span class="conv-score">' + c.score + "%</span>";
        html += "  </div>";
      }
      html += "</div>";
      html += '<div class="dw-divider"></div>';
    }

    /* Sugerowane tagi */
    var suggestions = TarotConvergence.getSuggestions(tag);
    if (suggestions && suggestions.length > 0) {
      html += '<div class="dw-suggestions">';
      html += '  <div class="dw-label">Sugerowane tagi:</div>';
      for (var k = 0; k < Math.min(suggestions.length, 3); k++) {
        var s = suggestions[k];
        html += '  <div class="suggestion-item">';
        html += '    <span class="suggestion-icon">&#x25C6;</span>';
        html +=
          '    <span class="suggestion-name">' +
          _escapeHtml(s.name) +
          "</span>";
        html +=
          '    <span class="suggestion-desc">' +
          _escapeHtml(s.description) +
          "</span>";
        html += "  </div>";
      }
      html += "</div>";
    }

    /* Losuj */
    html +=
      '<button class="dw-random-btn" data-card="' +
      cardId +
      '">&#x1F52E; Losuj kombinację</button>';

    _el.innerHTML = html;
    _el.classList.add("active");
    _el.classList.remove("inactive");
  }

  /* ─── Pozycjonowanie ─── */
  function _position(cardEl) {
    var cardRect = cardEl.getBoundingClientRect();
    var winW = window.innerWidth;
    var winH = window.innerHeight;
    var elW = 340;
    var elH = _el.offsetHeight || 400;

    var left, top;

    /* Nad czy pod kartą? */
    if (cardRect.top < winH / 2) {
      /* Pod kartą */
      top = cardRect.bottom + 12;
    } else {
      /* Nad kartą */
      top = cardRect.top - elH - 12;
    }

    /* Wyśrodkuj względem karty */
    left = cardRect.left + cardRect.width / 2 - elW / 2;

    /* Nie wychodź poza ekran */
    left = Math.max(12, Math.min(left, winW - elW - 12));
    top = Math.max(12, Math.min(top, winH - elH - 12));

    _el.style.left = left + "px";
    _el.style.top = top + "px";
    _el.style.width = elW + "px";
  }

  /* ─── Ukryj ─── */
  function _hide(delay) {
    delay = delay || _delayHide;
    clearTimeout(_hideTimer);

    _hideTimer = setTimeout(function () {
      if (_el) {
        _el.classList.remove("active");
        _el.classList.add("inactive");
      }
      _currentCardId = null;
    }, delay);
  }

  /* ─── API ─── */
  return {
    init: _init,
    show: function (cardId, delay) {
      _show(cardId, delay);
    },
    showMobile: function (cardId) {
      /* delegacja do mobile sheet */
    },
    hide: _hide,
    setMode: function (m) {
      _mode = m;
    },
    isVisible: function () {
      return _el && _el.classList.contains("active");
    },
  };
})();
```

#### 8.4.2 Obsługa chipów w detail window

```js
/* Event delegation na chipach */
document.addEventListener("click", function (e) {
  var chip = e.target.closest(".chip");
  if (!chip) return;

  var tagId = chip.dataset.id;
  /* Symuluj kliknięcie na karcie tego tagu */
  var cardEl = document.querySelector('.tarot-card[data-id="' + tagId + '"]');
  if (cardEl) {
    cardEl.click();
  }
});
```

---

### Faza 5: Convergence engine (tarot-convergence.js)

**Cel:** Analiza zbieżności tagów, generowanie sugestii combo, dostarczanie danych do Detail Window.

**Plik:** `tarot-convergence.js`

```js
const TarotConvergence = (function () {
  "use strict";

  /* ─── Pobierz zbieżność między tagiem a wybranymi ─── */
  function _getConvergence(tag) {
    var selected = SunoApp.state.selectedTags;
    if (!selected || selected.length === 0) return [];

    var results = [];

    for (var i = 0; i < selected.length; i++) {
      var selectedTag = SunoAnalyzer.getTagById(selected[i]);
      if (!selectedTag || selectedTag.id === tag.id) continue;

      var score = SunoAnalyzer.computeSynergyStrength(tag, selectedTag);
      if (score > 0) {
        results.push({
          tagId: selectedTag.id,
          tagName: selectedTag.name,
          score: Math.round(score),
        });
      }
    }

    /* Sortuj od najwyższej zbieżności */
    results.sort(function (a, b) {
      return b.score - a.score;
    });
    return results.slice(0, 5); /* max 5 */
  }

  /* ─── Pobierz sugestie combo ─── */
  function _getSuggestions(tag) {
    var selected = SunoApp.state.selectedTags;
    if (!selected || selected.length === 0) return [];

    var suggestions = [];

    /* Dla każdego wybranego tagu, znajdź combo name */
    for (var i = 0; i < selected.length; i++) {
      var selectedTag = SunoAnalyzer.getTagById(selected[i]);
      if (!selectedTag || selectedTag.id === tag.id) continue;

      var comboName = SunoAnalyzer.generateComboName(tag, selectedTag);
      if (comboName) {
        var synergy = SunoAnalyzer.computeSynergyStrength(tag, selectedTag);
        suggestions.push({
          name: comboName,
          tags: [tag.id, selectedTag.id],
          description: _generateComboDescription(tag, selectedTag),
          synergy: synergy,
        });
      }
    }

    /* Sortuj po sile synergii */
    suggestions.sort(function (a, b) {
      return b.synergy - a.synergy;
    });
    return suggestions.slice(0, 5);
  }

  /* ─── Generuj opis combo ─── */
  function _generateComboDescription(tagA, tagB) {
    /* Użyj synergy string z tagów */
    var desc = "";
    if (tagA.synergy && tagB.synergy) {
      desc = tagA.name + " + " + tagB.name;
    }
    return desc;
  }

  /* ─── Losuj kombinację ─── */
  function _randomSuggestion(tag) {
    /* Wybierz losowy tag z obecnego batcha */
    var batchTags = TarotDeck.getCurrentBatchTags();
    if (!batchTags || batchTags.length < 2) return null;

    /* Filtruj — pomiń bieżący tag */
    var others = batchTags.filter(function (t) {
      return t.id !== tag.id;
    });
    if (others.length === 0) return null;

    var pick = others[Math.floor(Math.random() * others.length)];
    var comboName = SunoAnalyzer.generateComboName(tag, pick);

    return {
      name: comboName || tag.name + " + " + pick.name,
      tags: [tag.id, pick.id],
      description: _generateComboDescription(tag, pick),
    };
  }

  /* ─── API ─── */
  return {
    getConvergence: _getConvergence,
    getSuggestions: _getSuggestions,
    randomSuggestion: _randomSuggestion,
  };
})();
```

---

### Faza 6: Web Audio API i warstwa dźwiękowa

**Cel:** Pełna implementacja `TarotAudioEngine` (patrz sekcja 6) i integracja z lifecyclem kart.

**Plik:** `tarot-audio-engine.js`

**Zadania:**

1. Implementacja `TarotAudioEngine` wg specyfikacji z sekcji 6.
2. Integracja z `TarotDeck`:
   - `mouseenter` → `TarotAudioEngine.playHover()`
   - `click` → `TarotAudioEngine.playClick()`
   - `DISSOLVING` → `TarotAudioEngine.playDissolve()`
   - `token landing` → `TarotAudioEngine.playLanding()`
   - `batch end` → `TarotAudioEngine.playCelebration()`
3. Ambient start/stop:
   - Start: pierwsza interakcja usera z tarot container
   - Stop: `tarot:selection-end`, `Deep Focus`, wyłączenie audio
4. UI kontroli:
   - Przycisk głośnika w toolbarze (toggle on/off)
   - Przeciąganie głośności (0-100%) w settings overlay

**Kryterium akceptacji:**

- AudioContext tworzy się dopiero po pierwszym clicku/touchu.
- Wszystkie 6 dźwięków interakcji grają poprawnie.
- Ambient jest subtelny (gain 0.02) i nie przeszkadza.
- `prefers-reduced-motion: reduce` → audio wyłączone.
- Brak leaków AudioContext po zakończeniu sesji tarota.

---

### Faza 7: Full-Screen, Mobile, Deep Focus — polerowanie

**Cel:** Finalne dopracowanie trzech trybów pracy (patrz sekcja 7).

**Zadania:**

1. **Full-Screen Mode:**
   - Przycisk `⛶` w tarot container
   - Obsługa `fullscreenchange` event (przywrócenie UI po Escape)
   - Responsywny grid w full-screen (5 kolumn)
   - Ukrycie workbencha i logo podczas full-screen

2. **Mobile Mode:**
   - Bottom sheet zamiast detail window
   - Double-tap do selekcji (single tap = hover)
   - Particle system na `low` (10-15 particle, bez fizyki)
   - Brak float animation (oszczędność baterii)
   - Swipe down do zamknięcia sheet
   - Automatyczne wejście w mobilny full-screen przy obrocie

3. **Deep Focus Mode:**
   - Przycisk `◎` w toolbarze
   - Toggle class na `body`
   - Wyciszenie ambient audio
   - Detail window tylko na `long-press` (1s)
   - Spowolnienie float animation 3×
   - Zachowanie stanu między toggle

4. **Testy krzyżowe:**
   - Full-Screen + Mobile (obrócony tablet)
   - Deep Focus + Full-Screen (czysty widok kart)
   - Mobile + Deep Focus (minimalistyczny mobile)
   - Wszystkie trzy + reduced-motion (brak animacji)

---

## 9. Style CSS — grid i karty tarota

### 9.1 Grid — kontener główny

```css
/* ─── Tarot Container ─── */
#tarot_container {
  display: none; /* domyślnie ukryty, pokazuje go JS */
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(
    ellipse at 50% 30%,
    rgba(26, 26, 15, 0.6) 0%,
    #0a0a05 100%
  );
}

/* ─── Grid ─── */
.tarot-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: clamp(8px, 1.2vw, 20px);
  padding: clamp(12px, 2vw, 32px);
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  align-content: center;
  justify-items: center;
}

/* Responsywność */
@media (max-width: 1024px) {
  .tarot-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .tarot-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    padding: 12px;
  }
}

@media (max-width: 600px) {
  .tarot-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    padding: 8px;
  }
}

@media (min-width: 1920px) {
  .tarot-grid {
    grid-template-columns: repeat(5, 1fr);
    max-width: 1600px;
    gap: 24px;
  }
}

/* Deep Focus — więcej przestrzeni */
.deep-focus .tarot-grid {
  max-width: 1200px;
  gap: 28px;
}
```

### 9.2 Karta tarota — komponent główny

```css
/* ─── Karta Tarota ─── */
.tarot-card {
  position: relative;
  width: 100%;
  max-width: 180px;
  aspect-ratio: 2.75 / 4.75;
  cursor: pointer;
  border-radius: clamp(4px, 0.6vw, 10px);
  transition:
    transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.3s ease,
    filter 0.2s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* ─── Ramka zewnętrzna ─── */
.tarot-card-outer {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(135deg, #ffcc00, #996600, #ffcc00);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.4),
    inset 0 0 20px rgba(255, 204, 0, 0.05);
  position: relative;
  transition:
    box-shadow 0.2s ease,
    filter 0.2s ease;
}

/* ─── Wnętrze karty ─── */
.tarot-card-inner {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a0f 0%, #2a1f0a 50%, #1a1a0f 100%);
  border-radius: inherit;
  padding: clamp(6px, 0.8vw, 14px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

/* ─── Narożniki dekoracyjne ─── */
.card-corner {
  position: absolute;
  width: 16px;
  height: 16px;
  border-color: rgba(255, 204, 0, 0.4);
  border-style: solid;
}

.card-corner--tl {
  top: 4px;
  left: 4px;
  border-width: 1px 0 0 1px;
}

.card-corner--tr {
  top: 4px;
  right: 4px;
  border-width: 1px 1px 0 0;
}

.card-corner--bl {
  bottom: 4px;
  left: 4px;
  border-width: 0 0 1px 1px;
}

.card-corner--br {
  bottom: 4px;
  right: 4px;
  border-width: 0 1px 1px 0;
}

/* ─── Header karty ─── */
.card-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  margin-bottom: 4px;
  gap: 6px;
}

.card-symbol {
  font-size: clamp(14px, 1.6vw, 22px);
  color: #ffcc00;
  text-shadow: 0 0 8px rgba(255, 204, 0, 0.4);
  line-height: 1;
}

.card-number {
  font-family: "Georgia", "Times New Roman", serif;
  font-size: clamp(10px, 1.1vw, 14px);
  color: #c4a87c;
  letter-spacing: 1px;
}

/* ─── Body karty ─── */
.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 2px;
}

.card-name {
  font-family: "Georgia", "Times New Roman", serif;
  font-size: clamp(12px, 1.4vw, 18px);
  font-weight: bold;
  color: #e6a800;
  text-align: center;
  letter-spacing: 0.5px;
  text-shadow: 0 0 6px rgba(230, 168, 0, 0.3);
  line-height: 1.2;
  word-break: break-word;
}

.card-divider {
  font-size: clamp(8px, 0.8vw, 11px);
  color: rgba(255, 204, 0, 0.3);
  letter-spacing: 2px;
  margin: 2px 0;
  line-height: 1;
}

.card-desc {
  font-family: "Georgia", "Times New Roman", serif;
  font-style: italic;
  font-size: clamp(8px, 0.8vw, 11px);
  color: #7a6b4e;
  text-align: center;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 90%;
}

/* ─── Footer karty ─── */
.card-footer {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  margin-top: auto;
}

.card-synergy-dots {
  display: flex;
  gap: 3px;
  justify-content: center;
}

.card-synergy-dots span {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 204, 0, 0.2);
  transition: background 0.3s ease;
}

.card-synergy-dots span.active {
  background: #ffcc00;
  box-shadow: 0 0 4px rgba(255, 204, 0, 0.5);
}

.card-synergy-hint {
  font-size: clamp(6px, 0.6vw, 9px);
  color: #7a6b4e;
  text-align: center;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ─── Numer lustrzany ─── */
.card-number-mirror {
  position: absolute;
  bottom: 6px;
  right: 8px;
  font-family: "Georgia", "Times New Roman", serif;
  font-size: clamp(8px, 0.8vw, 11px);
  color: rgba(196, 168, 124, 0.4);
  transform: rotate(180deg);
}

/* ════════════════════════════════════════ */
/* STANY KARTY                             */
/* ════════════════════════════════════════ */

/* ENTERING — pojawianie się */
.tarot-card--entering {
  animation: tarot-card-enter 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes tarot-card-enter {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
    filter: blur(4px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
    filter: blur(0);
  }
}

/* IDLE — domyślny stan */
.tarot-card--idle {
  opacity: 0.85;
  filter: brightness(0.9);
  animation: tarot-card-float 7s ease-in-out infinite;
}

@keyframes tarot-card-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

/* HOVER */
.tarot-card--hover {
  opacity: 1;
  transform: scale(1.08) translateY(-8px);
  filter: brightness(1.15);
  z-index: 50;
  animation: tarot-card-glow-pulse 2s ease-in-out infinite;
}

.tarot-card--hover .tarot-card-outer {
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.6),
    0 0 30px rgba(255, 204, 0, 0.25);
  filter: brightness(1.3);
}

@keyframes tarot-card-glow-pulse {
  0%,
  100% {
    box-shadow: 0 0 20px rgba(255, 204, 0, 0.2);
  }
  50% {
    box-shadow: 0 0 35px rgba(255, 204, 0, 0.35);
  }
}

/* SELECTED — burst glow */
.tarot-card--selected {
  animation: tarot-card-select 0.3s ease forwards;
}

@keyframes tarot-card-select {
  0% {
    transform: scale(1.08);
    filter: brightness(1.15);
  }
  50% {
    transform: scale(1.15);
    filter: brightness(1.4);
    box-shadow: 0 0 80px rgba(255, 204, 0, 0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1.1);
    filter: brightness(1.3);
  }
}

/* FADING — starzenie się */
.tarot-card--fading {
  transition:
    opacity 0.4s ease,
    filter 0.4s ease;
}

.tarot-card--fading-level-1 {
  opacity: 0.65;
  filter: brightness(0.85);
}

.tarot-card--fading-level-2 {
  opacity: 0.45;
  filter: brightness(0.7) grayscale(30%);
}

/* DISSOLVING — zanikanie */
.tarot-card--dissolving {
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

/* DIMMED — pozostałe karty po wyborze */
.tarot-card--dimmed {
  opacity: 0.4;
  filter: brightness(0.6);
  transform: scale(0.95);
  transition: all 0.4s ease;
  pointer-events: none;
}
```

### 9.3 Detail Window — CSS

```css
/* ─── Detail Window ─── */
.tarot-detail-window {
  position: fixed;
  z-index: 200;
  width: 340px;
  max-height: 70vh;
  overflow-y: auto;
  background: linear-gradient(180deg, #1a1a0f 0%, #0f0f08 100%);
  border: 1px solid rgba(255, 204, 0, 0.3);
  border-radius: 8px;
  padding: 16px;
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.7),
    0 0 30px rgba(255, 204, 0, 0.08);
  opacity: 0;
  transform: translateY(8px) scale(0.96);
  transition:
    opacity 0.15s ease,
    transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
}

.tarot-detail-window.active {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

.tarot-detail-window.inactive {
  opacity: 0;
  transform: translateY(4px) scale(0.98);
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

/* Header */
.dw-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.dw-symbol {
  font-size: 20px;
  color: #ffcc00;
}

.dw-name {
  font-family: "Georgia", serif;
  font-size: 18px;
  font-weight: bold;
  color: #e6a800;
}

.dw-number {
  font-family: "Courier New", monospace;
  font-size: 12px;
  color: #7a6b4e;
  margin-left: auto;
}

.dw-synergy {
  display: flex;
  gap: 2px;
  color: #ffcc00;
  font-size: 14px;
}

/* Divider */
.dw-divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 204, 0, 0.2),
    transparent
  );
  margin: 8px 0;
}

/* Description */
.dw-description {
  font-style: italic;
  color: #c4a87c;
  font-size: 13px;
  line-height: 1.5;
}

/* Meta */
.dw-meta {
  font-size: 12px;
  color: #7a6b4e;
  line-height: 1.6;
}

.dw-label {
  font-family: "Courier New", monospace;
  font-size: 10px;
  color: #7a6b4e;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

/* Related tags chips */
.dw-related-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  padding: 2px 10px;
  border: 1px solid rgba(255, 204, 0, 0.3);
  border-radius: 12px;
  background: transparent;
  color: #c4a87c;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: "Georgia", serif;
}

.chip:hover {
  background: rgba(255, 204, 0, 0.1);
  border-color: #ffcc00;
  color: #ffcc00;
  box-shadow: 0 0 12px rgba(255, 204, 0, 0.15);
}

/* Convergence bars */
.conv-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0;
}

.conv-label {
  font-size: 12px;
  color: #c4a87c;
  width: 80px;
  text-align: right;
  flex-shrink: 0;
}

.conv-bar-bg {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
  overflow: hidden;
}

.conv-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #996600, #ffcc00);
  border-radius: 3px;
  transition: width 0.4s ease;
}

.conv-score {
  font-family: "Courier New", monospace;
  font-size: 11px;
  color: #7a6b4e;
  width: 32px;
  text-align: right;
  flex-shrink: 0;
}

/* Suggestions */
.suggestion-item {
  display: flex;
  flex-direction: column;
  padding: 6px 8px;
  margin: 4px 0;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.suggestion-item:hover {
  background: rgba(255, 204, 0, 0.06);
}

.suggestion-icon {
  color: #ffcc00;
  font-size: 10px;
  margin-right: 6px;
}

.suggestion-name {
  font-size: 13px;
  color: #e6a800;
  font-weight: bold;
}

.suggestion-desc {
  font-size: 11px;
  color: #7a6b4e;
  margin-top: 2px;
}

/* Random button */
.dw-random-btn {
  display: block;
  width: 100%;
  padding: 8px;
  margin-top: 10px;
  background: rgba(255, 204, 0, 0.08);
  border: 1px solid rgba(255, 204, 0, 0.25);
  border-radius: 6px;
  color: #e6a800;
  font-family: "Georgia", serif;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dw-random-btn:hover {
  background: rgba(255, 204, 0, 0.15);
  border-color: #ffcc00;
  box-shadow: 0 0 16px rgba(255, 204, 0, 0.15);
}
```

---

## 10. Rozszerzenia istniejących modułów

### 10.1 app-logic.js

| Miejsce        | Zmiana                                                                    |
| -------------- | ------------------------------------------------------------------------- |
| `state`        | Nowe pole: `tarotMode: false`, `currentBatch: 0`                          |
| `flow_states`  | Nowy stan `tarot_selection` między `initial` a `selection`                |
| Nowe metody    | `startTarotSelection()`, `showNextBatch()`, `endTarotSelection()`         |
| Event listener | `document.addEventListener('tarot:card-selected', ...)` → `toggleTag(id)` |
| Event listener | `document.addEventListener('tarot:batch-end', ...)` → `showNextBatch()`   |

### 10.2 analyzer-engine.js

| Miejsce      | Zmiana                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------- |
| Nowa metoda  | `generateComboName(tagA, tagB)` — szuka w `TagDataMeta.comboNames`, fallback do `"tagA + tagB"` |
| Nowa metoda  | `computeSynergyRank(tagA, tagB)` — mapuje `computeSynergyStrength` (0-100) na skalę 1-5         |
| Rozszerzenie | `getSuggestedTags(tagId, count)` — opcjonalny parametr `count` (domyślnie 3)                    |

### 10.3 tags-data.js

| Miejsce     | Zmiana                                                                                                                |
| ----------- | --------------------------------------------------------------------------------------------------------------------- |
| Nowy obiekt | `TagDataMeta` z `comboNames`, `tarotSymbols`, `tarotColors`                                                           |
| Opisowo     | Każdy tag w `TAG_DATA` powinien mieć pole `description`. Jeśli brak — fallback: `"Tag {name} z kategorii {category}"` |

---

## 11. Mapa zależności między modułami

```
                  ┌──────────────────┐
                  │   tags-data.js   │
                  │   (TAG_DATA,     │
                  │    TagDataMeta)  │
                  └────────┬─────────┘
                           │ zależy
                           ▼
                  ┌──────────────────┐
                  │ analyzer-engine  │
                  │ .js (SunoAnalyz- │
                  │ er)              │
                  └────────┬─────────┘
                           │ zależy
                           ▼
         ┌───────────────────────────────────┐
         │            TarotConvergence        │
         │  (zależność: SunoAnalyzer +        │
         │   SunoApp.state.selectedTags)      │
         └────────────────┬──────────────────┘
                          │ dostarcza dane
                          ▼
         ┌───────────────────────────────────┐
         │         TarotDetailWindow          │
         │  (zależność: TarotConvergence,     │
         │   SunoAnalyzer)                    │
         └────────────────┬──────────────────┘
                          │ nasłuchuje eventów
                          ▼
         ┌───────────────────────────────────┐
         │            TarotDeck               │◄──┐
         │  (CardStateManager, rendering,     │    │
         │   batch flow, eventy)              │    │
         └────────┬───────────┬───────────────┘    │
                  │           │                    │
                  ▼           ▼                    │
         ┌────────────┐ ┌────────────┐            │
         │ TarotParticle │ TarotAudio │            │
         │ (Canvas)    │ │ Engine     │            │
         └────────────┘ └────────────┘            │
                                                  │
         ┌───────────────────────────────────┐    │
         │          app-logic.js              │────┘
         │  (SunoApp — orkiestracja flow)     │
         └───────────────────────────────────┘
```

**Kolejność ładowania w HTML:**

```html
<script src="tags-data.js"></script>
<script src="analyzer-engine.js"></script>
<script src="tarot-convergence.js"></script>
<script src="tarot-particle.js"></script>
<script src="tarot-audio-engine.js"></script>
<script src="tarot-detail-window.js"></script>
<script src="tarot-deck.js"></script>
<script src="app-logic.js"></script>
```

---

## 12. Kamienie milowe

| Kamień milowy       | Faza | Criterium akceptacji                                                                                           | Szacowany czas |
| ------------------- | ---- | -------------------------------------------------------------------------------------------------------------- | -------------- |
| **M0: Kod gotowy**  | 0    | `analyzer-engine` ma `generateComboName`, `tags-data` ma `TagDataMeta`, `app-logic` ma `tarot_selection` state | 1 dzień        |
| **M1: Karty żyją**  | 1-2  | Grid renderuje 10 kart, każda przechodzi QUEUED→ENTERING→IDLE, hover działa, klik wyzwala SELECTED→DISSOLVING  | 2 dni          |
| **M2: Pył i iskry** | 3    | Karta rozpada się na particle przy wyborze, pojawia się z iskier, celebration na koniec batcha                 | 2 dni          |
| **M3: Szczegóły**   | 4-5  | Detail window pokazuje pełne dane, convergence bars, sugestie, losuj kombinację                                | 1.5 dnia       |
| **M4: Dźwięk**      | 6    | Wszystkie 6 dźwięków działa, ambient gra, audio context lazy                                                   | 1 dzień        |
| **M5: Tryby**       | 7    | Full-Screen działa, mobile ma bottom sheet, Deep Focus ukrywa dystrakcje                                       | 1.5 dnia       |
| **M6: QA i bugfix** | —    | Wszystkie stany przetestowane, brak leaków DOM/Canvas/Audio, działa na mobile + desktop                        | 1 dzień        |
| **M7: Release**     | —    | Code review, merge do main, deploy                                                                             | 0.5 dnia       |

**Łączny szacowany czas: 10.5 dnia roboczego** (ok. 2 tygodnie kalendarzowe).

---

## 13. Ryzyka i strategie mitigacji

| Ryzyko                                        | Prawdopodobieństwo | Wpływ  | Mitigacja                                                                                       |
| --------------------------------------------- | ------------------ | ------ | ----------------------------------------------------------------------------------------------- |
| **Canvas performance na mobile**              | Medium             | Wysoki | Wykrywanie `prefers-reduced-motion`, `performance=lów` z 15 particle, fallback do zwykłego fade |
| **AudioContext blokowany przez przeglądarkę** | Niskie             | Średni | Lazy init przy pierwszym user gesture, obsługa braku `AudioContext`                             |
| **Zbyt wiele kart w DOM (memory leak)**       | Medium             | Wysoki | Pooling DOM elementów, usuwanie z DOM po DISSOLVING + event `tarot:particle-done`               |
| **Konflikt eventów touch/mouse**              | Medium             | Średni | Detekcja touch device, wyłączenie mouse eventów na touch, dedykowana ścieżka mobile             |
| **Staggered entry + particle assemble = lag** | Niskie             | Średni | Batchowanie particle (max 20 na frame), Web Worker dla fizyki particle (opcjonalnie)            |
| **Detail window wychodzi poza viewport**      | Niskie             | Niski  | Kalkulacja pozycji z `getBoundingClientRect`, clamp do viewport                                 |
| **Full-screen API nie wspierane**             | Niskie             | Niski  | Fallback do `position: fixed + 100vw/100vh` (emulacja full-screen)                              |
| **Deep Focus + Full-Screen niespójność**      | Niskie             | Niski  | Testy krzyżowe w F7, unified state: `TarotDeck.getModeState()`                                  |
| **Regresja istniejących funkcji**             | Medium             | Wysoki | Testy regresyjne (manual): initial flow, selection, suggestion, prompt_preview, completion      |

---

## 14. Podsumowanie

ADR-005 definiuje pełny plan implementacji systemu kart tarotowych dla su(K)no. Dokument rozszerza wizję z ADR-004 o szczegóły techniczne, kod referencyjny i harmonogram.

**Co dostarcza ta implementacja:**

| Wartość                       | Opis                                                                                         |
| ----------------------------- | -------------------------------------------------------------------------------------------- |
| **Doświadczenie użytkownika** | Selekcja tagów staje się rytuałem — otwieranie kart, czytanie znaczeń, decydowanie o energii |
| **Estetyka**                  | Art Deco z mistycyzmem — złote ornamenty, geometryczne wzory, światło własne kart            |
| **Dźwięk**                    | Syntetyczna ścieżka dźwiękowa przez Web Audio API — ambient + 6 dźwięków interakcji          |
| **Dostępność**                | 3 tryby (Full-Screen, Mobile, Deep Focus) + `prefers-reduced-motion`                         |
| **Spójność kodu**             | Czysty Vanilla JS ES5/IIFE, zero zależności, zgodny z istniejącą architekturą                |
| **Modularność**               | 5 nowych modułów, każdy z pojedynczą odpowiedzialnością, komunikacja przez event bus         |

**Architektura została zaprojektowana tak, aby:**

- Każdy moduł można testować niezależnie (wstrzykując zależności przez init).
- System można rozszerzać o nowe stany karty bez zmiany istniejących.
- W przyszłości (jeśli zajdzie potrzeba) moduły można zaadoptować jako web komponenty lub composables frameworkowe.
- Wdrożenie odbywa się fazami, z kamerami milowymi po każdej fazie, minimalizując ryzyko regresji.

---

## Appendix A: Indeks plików

| Plik                     | Status            | Opis                                                                       |
| ------------------------ | ----------------- | -------------------------------------------------------------------------- |
| `tarot-deck.js`          | **Nowy**          | Renderer kart, CardStateManager, batch flow, eventy                        |
| `tarot-particle.js`      | **Nowy**          | Canvas particle system (dissolve, assemble, celebration)                   |
| `tarot-detail-window.js` | **Nowy**          | Detail overlay na hover z danymi tagu                                      |
| `tarot-convergence.js`   | **Nowy**          | Analiza zbieżności tagów, combo names, sugestie                            |
| `tarot-audio-engine.js`  | **Nowy**          | Web Audio API (ambient + dźwięki interakcji)                               |
| `analyzer-engine.js`     | **Rozszerzony**   | `generateComboName()`, `computeSynergyRank()`                              |
| `tags-data.js`           | **Rozszerzony**   | `TagDataMeta` (comboNames, tarotSymbols, tarotColors)                      |
| `app-logic.js`           | **Rozszerzony**   | `tarot_selection` state, `showNextBatch()`, `endTarotSelection()`          |
| `spec-kafelki.json`      | **Aktualizowany** | Nowy stan `tarot_selection`, `tarot_container` zastępuje `ember_container` |

## Appendix B: Słownik pojęć

| Pojęcie                | Definicja                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------- |
| **Batch**              | Partia kart (10 lub 5) wyświetlana użytkownikowi w jednej rundzie selekcji          |
| **Card State Machine** | Deterministyczna maszyna stanów zarządzająca lifecyclem pojedynczej karty           |
| **Convergence**        | Wskaźnik procentowy pokazujący, jak bardzo nowy tag jest zbieżny z już wybranymi    |
| **Detail Window**      | Overlay z pełnymi szczegółami tagu, pojawiający się na hover karty                  |
| **Dissolve**           | Efekt rozpadu karty na cząsteczki (particle) przy wyborze lub odrzuceniu            |
| **Particle**           | Pojedyncza cząsteczka w systemie particle — kolorowy kwadrat 2-6px z fizyką         |
| **Stagger**            | Opóźnienie sekwencyjne między kartami (entry stagger 200ms, dissolve stagger 200ms) |
| **Token**              | Reprezentacja wybranego tagu na workbenchu (istniejący element)                     |
