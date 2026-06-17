<p align="center">
  <img src="docs/logo.svg" alt="su(K)no" width="200"/>
</p>

<h1 align="center">☽ su(K)no ✦</h1>
<p align="center"><em>Tarot Card Prompt Builder — harmonia muzyki przez karty</em></p>

<p align="center">
  <a href="https://github.com/13ty/su-k-no/issues">Zgłoś problem</a>
  ·
  <a href="https://github.com/13ty/su-k-no/discussions">Dyskusje</a>
  ·
  <a href="docs/design">Dokumentacja ADR</a>
</p>

---

## 🎯 Wizja

**su(K)no** to nie kolejny builder promptów. To **interaktywna, muzyczna symfonia kart tarota**, gdzie każda karta to potencjalny dźwięk, każda selekcja to akord, każda kombinacja to motyw.

Zamiast suchych tagów — **karty tarota** z symbolami, numerami i opisami. Zamiast klikania — **odkrywanie harmonii** poprzez wybieranie kart, które rezonują z twoją muzyką.

> _„Karty tarota które nie układają losu, lecz harmonizują muzykę w symfonię”_

---

## ✨ Kluczowe Funkcje

| Funkcja                    | Opis                                                                     |
| -------------------------- | ------------------------------------------------------------------------ |
| **🎴 Karty Tarotowe**      | Stylizowane karty z symbolami, numerami rzymskimi i złotymi zdobieniami  |
| **✨ Particle Dissolve**   | Wybrana karta rozpada się w pył (30-80 cząsteczek, 3-fazowa trajektoria) |
| **🔍 Detail Window**       | Hover pokazuje pełny opis tagu, zbieżność i sugerowane kombinacje        |
| **📊 Zbieżność Tagów**     | Paski postępu pokazujące jak tag współgra z już wybranymi                |
| **💡 Sugestie Kombinacji** | Np. "deep drone" = dark + drone — jeden klik by dodać                    |
| **🔄 Batch Flow**          | Partie kart (10→5→5) z falowym rozpadem i składaniem z iskier            |
| **🎵 Audio Integration**   | Ambientowe tło, dźwięki interakcji, muzyczna celebracja                  |
| **📱 Responsywność**       | Desktop (4 kolumny) → Tablet (3) → Mobile (2)                            |

---

## 🎨 Doświadczenie Użytkownika

### Przepływ

```
★ START — 10 kart tarota unosi się w przestrzeni
    ↓
☽ HOVER — Detail window pokazuje: opis, kategorię, zbieżność tagów, sugestie
    ↓
✦ SELECT — Karta wybucha → rozpada się w złoty pył (1.2s particle animation)
    ↓           → Token ląduje na workbenchu (bounce + glow)
♢ BATCH END — Niewybrane karty rozpływają się falowo (staggered dissolve)
    ↓
🎯 GENERATE — ≥10 tagów → prompt preview → eksplozja cząsteczek → gotowe!
```

### Stany Karty

```
QUEUED → ENTERING (iskry składają się w kartę) → IDLE (unosi się, migocze)
                                                    ↓
                                              HOVER (skala 1.08, glow, detail window)
                                                    ↓
                                              SELECTED (burst glow) → DISSOLVING (pył)
                                                    ↓
                                              TOKEN na workbenchu

IDLE → FADING (przyciemnienie) → DISSOLVING (odrzucona)
IDLE → DIMMED (gdy inna karta wybrana)
```

### Efekty Wizualne

| Efekt                 | Szczegóły                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| **Particle Dissolve** | 30-80 cząsteczek, 3 fazy: eksplozja (0-200ms) → unoszenie (200-800ms) → zanikanie (800-1200ms) |
| **Particle Assemble** | Iskry zbiegają się z przestrzeni, formując kartę (1000ms)                                      |
| **Staggered Wave**    | Fala rozpadu przechodząca przez grid (co 200ms)                                                |
| **Float Animation**   | Karty unoszą się lekko (Y 8-20px, 5-8s ease-in-out)                                            |
| **Gold Glow**         | Pulsujący glow na hover, burst glow na select                                                  |
| **Color Sampling**    | Particle dziedziczą kolor z piksela karty                                                      |

---

## 📁 Struktura Projektu

```
su-k-no/
├── src/
│   ├── components/
│   │   ├── Card/              # Tarot Card Component (stany, animacje, hover)
│   │   ├── DetailWindow/      # Detail Window (info, convergence, sugestie)
│   │   └── ...
│   ├── engines/
│   │   ├── particle-system/   # Canvas particle engine (dissolve/assemble)
│   │   ├── audio-engine/      # Web Audio API (ambient, SFX, celebration)
│   │   └── convergence/       # Tag convergence + combo suggestions
│   ├── core/                  # Istniejący system (przeniesiony)
│   │   ├── analyzer-engine.js
│   │   ├── app-logic.js
│   │   ├── tags-data.js
│   │   ├── ai-providers.js
│   │   └── project-store.js
│   └── utils/
├── docs/
│   ├── design/                # ADR Documentation
│   │   ├── 001_unified_view.md
│   │   ├── 002_tag_intent_engine.md
│   │   ├── 003_synergy_audit.md
│   │   └── 004_tarot_card_system.md
│   └── spec-kafelki.json
├── examples/                  # Przykładowe grafiki
├── .github/workflows/         # CI/CD
├── package.json
├── README.md
└── LICENSE
```

---

## 🚀 Szybki Start

```bash
# Klonuj
git clone https://github.com/13ty/su-k-no.git
cd su-k-no

# Zainstaluj (preferowany Bun)
bun install        # lub: npm install

# Uruchom
bun run dev        # lub: npm run dev
```

### Wymagania

- **Node.js 18+** (lub Bun)
- **Git**

---

## 📚 Dokumentacja Techniczna

Wszystkie decyzje architektoniczne są udokumentowane jako **ADR** (Architecture Decision Records) w `docs/design/`:

| Dokument    | Status   | Opis                                     |
| ----------- | -------- | ---------------------------------------- |
| **ADR-001** | ✅ Done  | Unified Song View + Intent Input         |
| **ADR-002** | ✅ Done  | Tag Intent Engine (rule-based + AI)      |
| **ADR-003** | ✅ Done  | Synergy Audit — co już istnieje          |
| **ADR-004** | 📝 Draft | System Kart Tarotowych (ta specyfikacja) |

---

## 🎯 Roadmap

### Faza 1: Fundament (3 dni)

- [ ] Particle System Engine — Canvas dissolve/assemble (30-80 particles)
- [ ] Audio Integration System — Web Audio API, ambient, SFX
- [ ] Tarot Card Component — stany, animacje, hover
- [ ] Detail Window Component — info, convergence, sugestie

### Faza 2: Funkcjonalność (7 dni)

- [ ] Convergence Engine — zbieżność tagów, combo names
- [ ] Batch Flow Manager — partie, timing, staggered wave
- [ ] Integration z istniejącym systemem (analyzer-engine, app-logic)
- [ ] Performance optimization (mobile, desktop tiers)

### Faza 3: Doskonalenie (5 dni)

- [ ] Zaawansowany particle system (color sampling, trails)
- [ ] Spatial audio i muzyczna celebracja
- [ ] Mobile optimizations (bottom sheet detail)
- [ ] Accessibility (keyboard, screen reader, reduced motion)

---

## 🧠 Architektura

```
┌─────────────────────────────────────────────────────┐
│                   UI Layer                           │
│  Card ↔ DetailWindow ↔ ParticleSystem ↔ BatchFlow   │
├─────────────────────────────────────────────────────┤
│                  Engine Layer                        │
│  analyzer-engine  |  app-logic  |  tags-data        │
├─────────────────────────────────────────────────────┤
│                  Audio Layer                         │
│  Web Audio API — ambient → interaction → celebration │
└─────────────────────────────────────────────────────┘
```

### Kluczowe Decyzje Techniczne

| Decyzja               | Wybór                                  | Uzasadnienie                    |
| --------------------- | -------------------------------------- | ------------------------------- |
| **Particle Renderer** | Canvas 2D + requestAnimationFrame      | 800+ particles w 60 FPS         |
| **Animation**         | CSS3 + JS-driven keyframes             | Performance + kontrola          |
| **Audio**             | Web Audio API                          | Zero dependency, pełna kontrola |
| **State Management**  | Event-driven (window.SunoProjectState) | Istniejący pattern              |

---

## 🤝 Jak Pomóc

1. **Zgłoś problem** — otwórz Issue z opisem + screenshot
2. **Zaproponuj funkcję** — Issue z diagramem stanu i szacunkiem
3. **Pull Request** — branch → commit → PR → review

---

## 📄 Licencja

**MIT License** — zobacz [LICENSE](LICENSE) dla szczegółów.

---

<p align="center">
  <strong>✦ su(K)no — harmonia muzyki przez karty ✦</strong><br>
  <em>zbudowane z 🔥 i ☕ przez</em><br>
  <a href="https://github.com/13ty">13ty</a>
</p>
