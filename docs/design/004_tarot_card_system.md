# ADR-004: System Kart Tarotowych — Selekcja Tagów przez Tarot

## Status: Proposed

## Data: 2026-06-17

## Wymaga: ADR-001 (Unified View), ADR-002 (Intent Engine), ADR-003 (Synergy Audit)

---

## 1. Wizja — Co budujemy

Zamiast suchych tagów unoszących się jako iskry (obecny model `ember`), tagi prezentują się jako **fizyczne karty tarota**. Każda karta to osobny byt: ma swoją grafikę, symbol, oznaczenie numeryczne i kontekst. Użytkownik nie "klika tagów" — **otwiera karty, czyta ich znaczenie i decyduje, czy przyjąć ich energię**.

System łączy:

- **Estetykę tarota** (mistycyzm, symbolika, złoto, czerń, kulturowe archetypy)
- **Mechanikę builder promptów** (selekcja tagów → konstrukcja promptu)
- **Particle‑based UX** (znikanie = rozpad w pył, pojawianie = składanie z iskier)

> **Metafora przewodnia:** Użytkownik jest jak tarocista rozkładający karty na stole. Każda karta to potencjalny element promptu. Niektóre rezonują, inne odrzuca. Karty, które przyjmie, układają się w finalne zaklęcie (prompt).

---

## 2. Architektura i Miejsce w Systemie

```
┌─────────────────────────────────────────────────────┐
│  THE SPACE (przestrzeń nad stołem)                   │
│  ┌──────────────────────────────────────────────┐    │
│  │  Tarot Deck — stos kart do wyboru            │    │
│  │  [Karta][Karta][Karta][Karta][Karta]         │    │
│  │  [Karta][Karta][Karta][Karta][Karta]         │    │
│  │  (grid 2×5, każda karta żyje własnym cyklem) │    │
│  │                                               │    │
│  │  ↓ hover → detail window                     │    │
│  │  ↓ click → particle dissolve → spada na stół │    │
│  └──────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│  THE WORKBENCH (stół — istniejący, niezmieniony)     │
│  [token] [token] [token] — wybrane tagi              │
└─────────────────────────────────────────────────────┘
```

**Kluczowa decyzja:** `ember_container` w istniejącej specyfikacji (`spec-kafelki.json`) zostaje zastąpiony przez `tarot_container`. Reszta layoutu (workbench, atmosfera, UI) pozostaje bez zmian.

---

## 3. Anatomia Karty — Od Najmniejszego Elementu

### 3.1 Wymiary i Proporcje

| Właściwość         | Wartość                           | Uzasadnienie                         |
| ------------------ | --------------------------------- | ------------------------------------ |
| Proporcje          | **2.75 : 4.75** (standard tarota) | Natychmiast rozpoznawalne            |
| Szerokość          | `clamp(100px, 14vw, 180px)`       | Mieści 5 kart w rzędzie na desktopie |
| Wysokość           | auto (wynika z proporcji)         | Zachowanie aspect ratio              |
| Border-radius      | `clamp(4px, 0.6vw, 10px)`         | Delikatne zaokrąglenie               |
| Padding wewnętrzny | `clamp(6px, 0.8vw, 14px)`         | Przestrzeń na zawartość              |

### 3.2 Struktura Wizualna Karty (od zewnątrz do środka)

```
┌──────────────────────────────────┐
│  ╔══════════════════════════════╗ │ ← Złota ramka zewnętrzna (2px)
│  ║  ┌────────────────────────┐  ║ │
│  ║  │   ★  VII  ★           │  ║ │ ← Symbol (góra lewo) + Numer (góra środek)
│  ║  │                        │  ║ │
│  ║  │      (tag name)        │  ║ │ ← Główna etykieta tagu (środek)
│  ║  │      ═══════════       │  ║ │ ← Separator dekoracyjny
│  ║  │    "opis tagu"         │  ║ │ ← Krótki opis (centered, smaller)
│  ║  │                        │  ║ │
│  ║  │      ◇  ◆  ◇          │  ║ │ ← Symbol dolny + synergy indicator
│  ║  │     (synergy hint)     │  ║ │ ← Tekst sugestii synergii
│  ║  └────────────────────────┘  ║ │
│  ║     ◇  ●  ◇  ●  ◇         ║ │ ← Dots dekoracyjne na dole
│  ╚══════════════════════════════╝ │
│       VII  ★                     │ ← Numer + Symbol (dół lustrzany)
└──────────────────────────────────┘
```

### 3.3 Elementy Stałe (występują na KAŻDEJ karcie)

| #   | Element                   | Opis                                                            | Styl                                                                                       |
| --- | ------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | **Ramka zewnętrzna**      | Złota linia z lekkim gradientem                                 | `border: 1.5px solid; border-image: linear-gradient(135deg, #ffcc00, #996600, #ffcc00) 1;` |
| 2   | **Ramka wewnętrzna**      | Cieńsza linia wewnątrz                                          | `outline: 1px solid rgba(255,204,0,0.3); outline-offset: 3px;`                             |
| 3   | **Symbol karty**          | Ikona reprezentująca charakter tagu                             | Glyph: ★ ◆ ● ▲ ♪ ☽ ✦ ✧                                                                     |
| 4   | **Numer karty**           | Indeks + kod kategorii                                          | np. `VII` (rzymski) lub `A-07` (kod)                                                       |
| 5   | **Nazwa tagu**            | Główna etykieta                                                 | Font serif, `gold_primary`, letter-spacing                                                 |
| 6   | **Opis tagu**             | Krótkie znaczenie (1-2 wiersze)                                 | Font serif italic, `text_muted`, size `small`                                              |
| 7   | **Separator dekoracyjny** | Linia lub ornament                                              | `═` lub wzór geometryczny                                                                  |
| 8   | **Synergy indicator**     | Dots/kropki pokazujące siłę synergii z ostatnio wybranym tagiem | 1-5 kropek, gradient od złotego do ciemnego                                                |
| 9   | **Narożniki dekoracyjne** | Małe ornamenty w 4 rogach ramki zewnętrznej                     | Złote linie pod kątem 45°                                                                  |
| 10  | **Numer lustrzany**       | Powtórzenie numeru w dolnym rogu (styl tarota)                  | Mniejszy font, odwrócony układ                                                             |

### 3.4 Mapa Symboli ←→ Kategoria Tagów

| Kategoria               | Symbol | Glyph             | Znaczenie                       |
| ----------------------- | ------ | ----------------- | ------------------------------- |
| **Vocal Style**         | ♪      | `\u266A`          | Melodia, śpiew                  |
| **Instrument**          | ♢      | `\u2662`          | Instrument, dźwięk              |
| **Genre**               | ★      | `\u2605`          | Gwiazda przewodnia, gatunek     |
| **Mood**                | ☽      | `\u263D`          | Księżyc — nastrój, emocja       |
| **Production**          | ⚙      | `\u2699`          | Koło zębate — produkcja         |
| **Structure**           | ✦      | `\u2726`          | Kamień milowy, struktura        |
| **Vocal Technique**     | ◇      | `\u25C7`          | Diament — technika wokalna      |
| **Effect**              | ✧      | `\u2727`          | Iskra — efekt, texture          |
| **Tempo/Energy**        | ▲      | `\u25B2`          | Trójkąt — tempo, dynamika       |
| **Era/Reference**       | ●      | `\u25CF`          | Punkt w czasie                  |
| **Custom (AI‑matched)** | ◈      | `\u25C8` (z glow) | Gdy tag nie pasuje do kategorii |

### 3.5 System Numeracji — Dwa Formaty

```
Format na KARCIE:      [SYMBOL_RZYMSKI]
Format wewnętrzny:     [KATEGORIA]-[INDEKS]

Karta tarota pokazuje: VII (rzymski — estetyka)
Detail Window pokazuje: V-03 (kod — funkcjonalność)
```

| Miejsce                 | Format        | Przykład               | Uzasadnienie                  |
| ----------------------- | ------------- | ---------------------- | ----------------------------- |
| **Na karcie** (3.2)     | Rzymski       | `VII`, `XII`, `III`    | Estetyka tarota               |
| **Detail Window** (5.3) | Kod kategorii | `V-03`, `G-12`, `M-07` | Identyfikacja dla użytkownika |
| **Wewnętrznie** (JS)    | ID tagu       | `"dark"`, `"ambient"`  | Logika aplikacji              |

**Format kodu: `[KATEGORIA]-[INDEKS]`**

| Prefix | Kategoria       | Przykład |
| ------ | --------------- | -------- |
| V      | Vocal Style     | V-03     |
| G      | Genre           | G-12     |
| M      | Mood            | M-07     |
| I      | Instrument      | I-05     |
| P      | Production      | P-02     |
| S      | Structure       | S-01     |
| T      | Vocal Technique | T-04     |
| E      | Effect          | E-08     |
| B      | Tempo/Energy    | B-06     |
| R      | Era/Reference   | R-03     |
| X      | Custom (AI)     | X-01     |

Numeracja jest automatycznie przypisywana na podstawie indeksu tagu w ramach swojej kategorii w `tags-data.js`.

---

## 4. Stany Karty — Kompletna Maszyna Stanów

```
  ┌──────────┐
  │  QUEUED  │ ← karta czeka w puli (zarządzana przez BatchFlowManager)
  └────┬─────┘
       │ batch_start → dequeue z QUEUE
       ▼
  ┌────────────┐
  │  ENTERING  │ ← particle assemble (iskry składają się w kartę)
  │             │    czas: 1.0s (assembly 0.8s + reveal glow 0.2s)
  └──────┬─────┘
         │ enter_complete
         ▼
  ┌──────────┐
  │  IDLE    │ ← karta widoczna, unosi się lekko (float)
  └────┬─────┘
       │
  ┌────┴─────┐    ┌──────────────┐
  │  HOVER   │◄──→│  IDLE        │ ← mouseenter / mouseleave
  └────┬─────┘    └──────────────┘
       │ click                    │ (inna karta wybrana)
       ▼                          ▼
  ┌──────────┐            ┌──────────┐
  │ SELECTED │            │ DIMMED   │ ← przygaszenie (0.4 opacity)
  └────┬─────┘            └────┬─────┘
       │                       │ (inna karta odznaczona / przywrócona)
       ▼                       ▼
  ┌──────────────┐        ┌──────────┐
  │ DISSOLVING   │        │  IDLE    │ ← powrót do normalnego stanu
  └──────┬───────┘        └──────────┘
         │ particle → spada na stół
         │ karta znika z DOM
         ▼
    ┌──────────┐
    │  TOKEN   │ ← pojawia się na workbenchu jako token
    └──────────┘

  (osobna ścieżka z IDLE)
  ┌──────────┐
  │  IDLE    │ → timer (95% czasu batcha) / kliknięto "dalej" / batch_end
  └────┬─────┘
       │
       ▼
  ┌──────────┐
  │ FADING   │ ← karta się starzeje, przyciemnia (progresywny fade)
  └────┬─────┘
       │ opacity < 0.3 → DISSOLVING (bez tokena — odrzucona)
       ▼
  ┌──────────────┐
  │ DISSOLVING   │ ← rozpad w pył, znika z DOM
  └──────────────┘
```

### 4.1 State: QUEUED

Karty czekają w kolejce (QUEUE) na pojawienie się w batchu. QUEUE jest zarządzana przez `Batch Flow Manager`.

**Źródło kart:**

- Pula źródłowa = wszystkie tagi z `TAG_DATA` (~249) z wyłączeniem tagów już wybranych na workbenchu
- Selekcja do batcha: `weighted_random` z istniejącego `suggestion_logic` (spec-kafelki.json)
- QUEUE pre-fetch: 30 kart (`initial_pool_size`) pobranych przez `SunoAnalyzer.getSuggestedTags([])` przy inicjalizacji
- Batch 1: 10 kart z najwyższym weight z puli 30
- Batch 2+: 5 kart z puli, z uwzględnieniem już wybranych tagów (unikanie duplikatów)
- Gdy pula się wyczerpie: `SunoAnalyzer.getSuggestedTags(selectedTags)` generuje nową pulę 30 kart

| Właściwość   | Wartość                                                                        |
| ------------ | ------------------------------------------------------------------------------ |
| Widoczność   | `display: none` — karta istnieje w DOM, ale jest niewidoczna                   |
| Czas trwania | zmienny — do momentu aktywacji kolejnego batcha                                |
| Przejście    | natychmiastowe do ENTERING (gdy batch się rozpoczyna)                          |
| Zarządca     | `BatchFlowManager.nextBatch()` — decyduje która karta z QUEUE trafia do batcha |

### 4.2 State: IDLE (domyślny)

| Właściwość      | Wartość                                                      |
| --------------- | ------------------------------------------------------------ |
| Opacity         | `0.85`                                                       |
| Transform       | `scale(1)` + `translateY(0)`                                 |
| Filter          | `brightness(0.9)`                                            |
| Box-shadow      | `0 4px 20px rgba(0,0,0,0.4)`                                 |
| Float animation | Płynięcie w górę i na boki, 5-8s ease-in-out, Y range 8-20px |
| Twinkle         | Co 3-7s delikatne mrugnięcie gold glow (opacity 0.1 → 0.25)  |

### 4.3 State: HOVER

| Właściwość   | Wartość                                                          | Czas przejścia     |
| ------------ | ---------------------------------------------------------------- | ------------------ |
| Opacity      | `1.0`                                                            | 150ms              |
| Transform    | `scale(1.08)` + `translateY(-8px)`                               | 200ms cubic-bezier |
| Filter       | `brightness(1.15)` + `drop-shadow(0 0 12px rgba(255,204,0,0.5))` | 200ms              |
| Box-shadow   | `0 12px 40px rgba(0,0,0,0.6), 0 0 30px rgba(255,204,0,0.2)`      | 200ms              |
| Border       | Gold border intensywniejszy (brightness 1.3)                     | 150ms              |
| Glow overlay | Pulsujący overlay gold `rgba(255,204,0,0.08)`                    | Continuous pulse   |

**Dodatkowo na hover:** Pojawia się **Detail Window** (patrz sekcja 6).

### 4.4 State: SELECTED

Click na karcie → natychmiastowa sekwencja:

| Faza               | Czas        | Efekt                                                                           |
| ------------------ | ----------- | ------------------------------------------------------------------------------- |
| **Burst glow**     | 0-200ms     | Eksplozja gold glow od środka karty, `box-shadow: 0 0 80px rgba(255,204,0,0.8)` |
| **Scale up**       | 200-300ms   | `scale(1.15)` + brightness(1.4)                                                 |
| **Sound feedback** | natychmiast | Opcjonalny click dźwięk (jeśli audio enabled)                                   |

Po 300ms automatyczne przejście do DISSOLVING.

### 4.5 State: DISSOLVING — Rozpad w Pył (kluczowy efekt)

To **najważniejszy efekt wizualny** systemu. Karta nie znika — rozpada się.

**Mechanika:**

```
Karta rozpada się na N cząsteczek (30-60 particle).
Każda cząsteczka dziedziczy kolor z piksela karty w swoim punkcie startowym.
Particle poruszają się po krzywej 3-segmentowej:
  1. Eksplozja (0-200ms)  — particle odlatują od centrum
  2. Unoszenie (200-700ms) — particle płyną w górę, zwalniają
  3. Zanikanie (700-1200ms) — particle tracą opacity, rozpływają się
```

| Parametr         | Wartość                                         |
| ---------------- | ----------------------------------------------- |
| Liczba particle  | `clamp(30, 60, 80)` — zależna od rozmiaru karty |
| Particle size    | `clamp(2px, 4px, 6px)`                          |
| Particle color   | Sampling z karty (gold, dark, tekst)            |
| Explosion radius | `40-80px`                                       |
| Float trajectory | `ease-out`, z losowym odchyleniem X ±30px       |
| Opacity decay    | `1.0 → 0.0` przez 1.2s                          |
| Rotation         | Losowa rotacja particle 0-360°                  |
| Czas trwania     | **1200ms** (całość) + 200ms fade DOM removal    |

**Decyzja implementacyjna:** Canvas 2D + requestAnimationFrame.

**Uzasadnienie:**

- CSS particle system nie udźwignie 800+ particle (10 kart × 80 particle) w 60 FPS
- Canvas 2D daje pełną kontrolę nad trajektorią, kolorem, rotacją
- requestAnimationFrame zapewnia synchronizację z vsync
- Object pooling dla 800+ particle — alokacja raz, reużywanie

**Architektura particle-engine.js:**

```js
class ParticleEngine {
  constructor(canvas, { maxParticles = 800, pooling = true })

  // API
  dissolveCard(cardElement, options)  // rozpad karty w pył
  assembleCard(position, options)     // składanie karty z iskier
  burst(position, count, options)     // eksplozja cząsteczek (celebracja)

  // Zarządzanie
  setPerformanceTier('low'|'medium'|'high')
  pause() / resume()
  clear()
}
```

**Wariant fallback (gdy WebGL/Canvas niedostępny):** `clip-path` animation + CSS mask jako degradacja. Nie wspiera kolorowania particle, ale zachowuje efekt "rozpadu".

### 4.6 State: ENTERING — Pojawianie się Karty

Nowa karta pojawia się z iskier/particle składających się w kartę.

| Faza               | Czas       | Efekt                                                |
| ------------------ | ---------- | ---------------------------------------------------- |
| **Particle spawn** | 0-200ms    | 20-30 iskier pojawia się w pozycji docelowej karty   |
| **Assembly**       | 200-800ms  | Iskry zbiegają się do centrum, formując kartę        |
| **Reveal**         | 800-1000ms | Karta staje się w pełni widoczna, finalny glow burst |

**Wariant alternatywny:** `fadeInScale` (0 → 1, 0.8s, `cubic-bezier(0.34, 1.56, 0.64, 1)`) + `blur(4px → 0)`.

### 4.7 State: FADING — Starzenie się Karty (względem końca batcha)

Karta, która nie została wybrana, starzeje się **względem końca batcha**, a nie od momentu pojawienia się. Dzięki temu karty z początku gridu nie znikają, zanim użytkownik dojrzy do końca.

| Próg (procent czasu batcha) | Efekt                                            |
| --------------------------- | ------------------------------------------------ |
| Po 50% czasu batcha         | `opacity: 0.85 → 0.70` — pierwszy znak starzenia |
| Po 70% czasu batcha         | `opacity: 0.70 → 0.50`, `brightness: 0.85`       |
| Po 85% czasu batcha         | `opacity: 0.50 → 0.30`, `filter: grayscale(20%)` |
| Po 95% czasu batcha         | Przejście do DISSOLVING (bez tokena — odrzucona) |

**Przykład dla Batcha 1 (30s):**

- t=15s (50%): pierwszy fade
- t=21s (70%): drugi fade
- t=25.5s (85%): trzeci fade
- t=28.5s (95%): DISSOLVING
- t=30s: batch definitywnie kończy się → nowy batch

Czas odliczania resetuje się przy HOVER — ponowne najechanie przywraca kartę do 100% czasu batcha na jej pozycji.

**Zabezpieczenie:** Jeśli karta spędziła w IDLE dłużej niż 80% batcha bez żadnego HOVER, przyspieszamy FADING (skrócone progi o połowę) — to zapobiega sytuacji, gdzie nieoglądana karta "wisi" do końca.

### 4.8 State: DIMMED (karty odrzucone pośrednio)

Gdy użytkownik wybiera kartę, pozostałe karty w batchu delikatnie przygasają. **DIMMED jest stanem odwracalnym** — jeśli tag z workbencha zostanie usunięty (usuń/cofnij), karta wraca do IDLE.

| Właściwość     | Wartość                                             |
| -------------- | --------------------------------------------------- |
| Opacity        | `0.4`                                               |
| Filter         | `brightness(0.6)`                                   |
| Transform      | `scale(0.95)`                                       |
| Czas przejścia | 400ms ease                                          |
| Czas trwania   | Do momentu: własnego DISSOLVING LUB powrotu do IDLE |

**Przejścia:**

```
DIMMED → IDLE: gdy usunięto tag z workbencha, który spowodował DIMMED
DIMMED → DISSOLVING: gdy timer FADING wygaśnie (odrzucona na stałe)
```

---

## 5. Detail Window — Okno Szczegółów na Hover

### 5.1 Zachowanie

```
mouseenter na karcie → 150ms delay → pojawia się Detail Window
mouseleave z karty → 300ms delay → znika (tylko jeśli nie ma mouseenter na oknie)
mouseenter na Detail Window → utrzymuje widoczność (karta też zostaje w HOVER)
```

### 5.2 Pozycja

| Kontekst               | Pozycja                                                   |
| ---------------------- | --------------------------------------------------------- |
| Karta w górnym rzędzie | Poniżej karty, wyśrodkowane                               |
| Karta w dolnym rzędzie | Powyżej karty, wyśrodkowane                               |
| Karta blisko krawędzi  | Przesunięcie w lewo/prawo, żeby nie wychodziło poza ekran |

### 5.3 Wygląd

```
┌──────────────────────────────────────────┐
│  ✦ dark  [VII]  •  ★★★★☆  synergy       │
│  ─────────────────────────────────────── │
│  "Ciemny, mroczny klimat — podstawa      │
│   dla gothic, industrial, minor"         │
│  ─────────────────────────────────────── │
│  Kategoria: Vocal Style                  │
│  Drzewo:   Vocal Style > Dark > Gothic   │
│  ─────────────────────────────────────── │
│  Powiązane tagi:                         │
│  [+gothic] [+industrial] [+minor]       │
│  [+tense] [+whisper] [+reverb]          │
│  ─────────────────────────────────────── │
│  Zbieżność: wybrane tagi:               │
│  ←→ dark: █████████░ 91%                │
│  ←→ drone: ████░░░░░░ 38%               │
│  ←→ ambient: ██████░░░░ 55%             │
│  ─────────────────────────────────────── │
│  Sugerowane tagi (combo):               │
│  ◆ deep drone    (dark + ambient)       │
│  ◆ dark gothic   (dark + gothic)        │
│  ◆ dark industrial (dark + industrial)  │
│  [🔮 Losuj kombinację]                  │
└──────────────────────────────────────────┘
```

### 5.4 Sekcje Detail Window

| Sekcja               | Zawartość                                                             | Styl                     |
| -------------------- | --------------------------------------------------------------------- | ------------------------ |
| **Header**           | Symbol + nazwa tagu + numer karty + rating synergii                   | gold, serif, bold        |
| **Opis**             | Tekst opisu tagu (z tags-data.js)                                     | italic, `text_secondary` |
| **Kategoria**        | Ścieżka kategorii / drzewa tagów                                      | `text_muted`, mono       |
| **Powiązane tagi**   | Klikalne chipy "+tag"                                                 | Gold border, hover glow  |
| **Zbieżność**        | 🔥 **NOWOŚĆ** — paski postępu pokazujące overlap wybranych tagów      | Linear-gradient bars     |
| **Sugerowane tagi**  | 🔥 **NOWOŚĆ** — gotowe kombinacje (np. "deep drone" = dark + ambient) | Dark bg, gold text       |
| **Losuj kombinację** | Przycisk generujący losową kombinację powiązanych tagów               | CTA style                |

### 5.5 Zbieżność Tagów (Tag Convergence)

System analizuje obecnie wybrane tagi na workbenchu i pokazuje, jak nowy tag (ten na karcie) współgra z już wybranymi.

**Algorytm:**

```
dla każdego wybranego tagu T:
  score = SunoAnalyzer.computeSynergyStrength(tag_na_karcie, T)
  → wyświetl jako pasek postępu

dla każdej pary (tag_na_karcie + wybrany_tag):
  combo_name = znajdź wspólną nazwę kombinacji
  → wyświetl jako "Sugerowane tagi"
```

**Wymaganie wstępne:** Metoda `computeSynergyStrength()` musi być zaimplementowana w `analyzer-engine.js` przed implementacją tarot-deck. Poniżej specyfikacja metody:

```js
/**
 * Oblicza siłę synergii między dwoma tagami (0-100).
 * @param {Object} tagA - Tag z tags-data.js
 * @param {Object} tagB - Tag z tags-data.js
 * @returns {number} 0-100 (0 = konflikt, 100 = idealna synergia)
 *
 * Algorytm:
 *   1. CONFLICT CHECK: jeśli tagi są w konflikcie (ten sam vocal_style,
 *      przeciwna energia itp.) → return 0
 *   2. CATEGORY BONUS: jeśli ta sama kategoria → +20
 *   3. SYNERGY STRING: jeśli tagB występuje w synergy stringu tagA
 *      (lub odwrotnie) → +40
 *   4. AXIS PROXIMITY: oblicz odległość na osiach W/O/B
 *      (weight, organic, brightness):
 *      distance = |tagA.weight - tagB.weight| + |tagA.organic - tagB.organic|
 *               + |tagA.brightness - tagB.brightness|
 *      score = max(0, 40 - distance * 2)
 *   5. SUMA: conflict_check(0) + category_bonus(20) + synergy(40) + axis(40)
 *      → clamp(0, 100)
 *   6. Zwróć wynik zaokrąglony do liczby całkowitej
 */
```

Metoda jest kluczowym dependency dla sekcji Zbieżności (5.5) i Przymiotników (5.6).

**Przykład:** Użytkownik ma wybrane `ambient` i `dark`. Najeżdża na `drone`:

- Zbieżność dark ↔ drone: 62% (oba mroczne)
- Zbieżność ambient ↔ drone: 85% (oba ambientowe, drone jest childem ambient)
- Sugestia: "deep drone" (dark + drone) — nowa kombinacja tematyczna
- Sugestia: "dark ambient drone" — pełna kombinacja 3 tagów

### 5.6 Mechanizm "Przymiotniki do Tagów"

Gdy użytkownik ma już wybrany tag (np. `drone`), system proponuje **przymiotniki/qualifery**, które go modyfikują:

```
Masz wybrany: drone
→ deep drone
→ dark drone
→ ethereal drone
→ industrial drone
→ slow drone
→ pulsating drone
→ harmonic drone
```

Te sugestie pochodzą z:

1. Synergy tagów powiązanych z `drone` (np. `deep` ma synergy z `drone`) — `SunoAnalyzer.getSuggestedTags([drone])`
2. Popularnych kombinacji w bazie tagów (comboNames)
3. AI (jeśli dostępne) — generuje nowe, semantycznie spójne kombinacje
4. **Modyfikatory z analyzer-engine** — lista `MODIFIERS` (np. "deep", "dark", "ethereal", "industrial") — rozszerzona o nowe entry: "slow", "pulsating", "harmonic", "bright", "warm"

**Kliknięcie `[+tag]` w Detail Window:**

- `[+deep]` → dodaje tag `deep` do workbencha BEZ selekcji karty (symuluje kliknięcie karty)
- `[+deep] [+drone]` → dodaje OBA tagi jednocześnie (dwa tokeny lądują na workbenchu)
- Jeśli tag nie ma karty w obecnym batchu → dodaje się bezpośrednio (pomija particle assemble)
- Jeśli tag ma kartę w batchu → symuluje kliknięcie karty (particle dissolve + token)

---

## 6. Batch Flow — Przepływ Pomiędzy Partiami Kart

### 6.1 Struktura Batches

```
Batch 1: 10 kart (początkowy)
  → użytkownik wybiera dowolną liczbę
  → każda wybrana → DISSOLVING → TOKEN na stole
  → po kliknięciu "dalej" lub upływie czasu (30s):
     → wszystkie niewybrane karty → FADING → DISSOLVING
     → krótka pauza (500ms, pustka)
     → Batch 2 pojawia się (ENTERING)

Batch 2: 5 kart
  → ten sam mechanizm
  → po "dalej" lub 25s → Batch 3

Batch 3-N: 5 kart każdy

Gdy workbench ma już 10 tagów → prompt_preview (z istniejącej specyfikacji)
```

### 6.2 Timing i Stagger

| Batch | Liczba kart | Czas na batch | Akcja domyślna                             |
| ----- | ----------- | ------------- | ------------------------------------------ |
| 1     | 10          | 30s           | Po czasie → batch kończy się automatycznie |
| 2     | 5           | 25s           | Po czasie → batch kończy się               |
| 3+    | 5           | 20s           | Po czasie → batch kończy się               |

**Użytkownik może w każdej chwili kliknąć "dalej" → batch kończy się natychmiast.**

### 6.3 Staggered Entry Kart w Batchu

Karty nie pojawiają się wszystkie naraz — wchodzą z odstępem:

```
t=0.0s  → karta #1: ENTERING (assembly, 1s)
t=0.2s  → karta #2: ENTERING
t=0.4s  → karta #3: ENTERING
...
t=1.8s  → karta #10: ENTERING
         → wszystkie w IDLE po ~2.5s od startu batcha
```

### 6.4 Staggered Dissolve przy Końcu Batcha

Gdy batch się kończy, karty nie znikają jednocześnie — rozpływają się sekwencyjnie:

```
t=0s    → kliknięcie "dalej" / timer wygasa
t=0s    → karty wchodzą w FADING (przyciemnienie, 400ms)
t=0.4s  → karta #1: DISSOLVING start
t=0.6s  → karta #2: DISSOLVING start
t=0.8s  → karta #3: DISSOLVING start
...
t=2.2s  → karta #10: DISSOLVING start
t=3.4s  → ostatnia karta zniknęła
t=3.9s  → pauza (pustka, 500ms)
t=4.4s  → Batch 2: karta #1 ENTERING
t=4.6s  → Batch 2: karta #2 ENTERING
...
```

**Efekt:** Fala rozpadu przechodząca przez grid — jak domino w zwolnionym tempie.

---

## 7. Particle System — Szczegółowa Specyfikacja

### 7.1 Kiedy Particle System jest aktywny

| Stan/Przejście               | Particle Active | Metoda                                    |
| ---------------------------- | --------------- | ----------------------------------------- |
| ENTERING (karta się pojawia) | ✅              | Iskry składają się w kartę                |
| IDLE                         | ❌              | —                                         |
| HOVER                        | ❌              | Tylko glow, brak particle                 |
| SELECTED → DISSOLVING        | ✅              | Pełny rozpad (30-80 particle)             |
| FADING → DISSOLVING          | ✅              | Rozpad (20-40 particle, mniej intensywny) |

### 7.2 Particle Properties

| Parametr    | Wartość domyślna | Opis                                          |
| ----------- | ---------------- | --------------------------------------------- |
| `count`     | 40               | Liczba particle na kartę                      |
| `lifespan`  | 1200ms           | Czas życia particle                           |
| `sizeMin`   | 2px              | Minimalny rozmiar                             |
| `sizeMax`   | 6px              | Maksymalny rozmiar                            |
| `speed`     | 40-80px          | Zasięg eksplozji                              |
| `gravity`   | 0.15             | Siła grawitacji (niższa = wolniej opadają)    |
| `drag`      | 0.92             | Opór powietrza (niższy = dalej lecą)          |
| `colorMode` | `inherit`        | Particle dziedziczą kolor z pozycji na karcie |
| `spread`    | `random`         | Losowy kierunek + eksplozja                   |

### 7.3 Particle Phases (DISSOLVING)

```
Phase 1: EXPLOSION (0-200ms)
  → particle wystrzeliwują z centrum karty
  → prędkość: 80-120px/s
  → krzywa: ease-out
  → kolory: jasne złoto / amber / ciemne

Phase 2: FLOAT (200-800ms)
  → particle zwalniają, zaczynają opadać
  → prędkość: 20-40px/s
  → mały drift poziomy (±10px)
  → lekkie wirowanie (rotation: 0.5-2 turn)

Phase 3: DISPERSE (800-1200ms)
  → particle spowalniają do 5px/s
  → opacity spada od 1.0 → 0.0
  → rozmiar maleje (shrinking)
  → całkowity fade w tło
```

### 7.4 Particle Colors (sampling)

Idealnie: particle pobierają kolor z piksela karty w punkcie startowym.
Fallback: paleta bazująca na kolorach tagu:

| Typ tagu     | Kolory particle                    |
| ------------ | ---------------------------------- |
| Dark/Mroczny | #332200, #664400, #ff8800, #ffcc00 |
| Bright/Jasny | #ffcc00, #ffaa33, #ffffff, #ffdd77 |
| Neutralny    | #996600, #cc8800, #ffcc00, #c4a87c |

### 7.5 Performance

| Poziom            | Particle count | Efekty                    | Target FPS |
| ----------------- | -------------- | ------------------------- | ---------- |
| `low` (mobile)    | 10-15          | Brak float, tylko fade    | 30fps      |
| `medium` (tablet) | 20-30          | Uproszczona fizyka        | 45fps      |
| `high` (desktop)  | 40-60          | Pełna fizyka, glow trails | 60fps      |

**Detekcja:** `window.matchMedia('(prefers-reduced-motion: reduce)')` → particle OFF, zwykłe fade.

---

## 8. Tag Suggestion Engine — Propozycje Kombinacji

### 8.1 Skąd Pochodzą Sugestie

| Źródło                        | Priorytet | Opis                                                 |
| ----------------------------- | --------- | ---------------------------------------------------- |
| **Synergy z analyzer-engine** | 🔥 High   | `getSuggestedTags()` zwraca tagi powiązane synergią  |
| **Combo names z tags-data**   | 🔥 High   | Znane pary tagów (np. "deep drone" = deep + drone)   |
| **AI (LM Studio / OpenAI)**   | ✨ Medium | Jeśli dostępne — generuje kreatywne kombinacje       |
| **Popularne pary**            | 📊 Medium | Statystyki najczęściej wybieranych par tagów         |
| **Losowa kombinacja**         | 🎲 Low    | "Szczęśliwy traf" — losowa kombinacja z dopasowanych |

### 8.2 Format Sugestii w Detail Window

```
Sugerowane tagi:
┌────────────────────────────────────────┐
│ ◆ deep drone       dark + drone        │
│   "Głęboki, mroczny, ciągły dron"      │
│   [➕ Dodaj combo]                     │
├────────────────────────────────────────┤
│ ◆ dark ambient     dark + ambient      │
│   "Mroczna, przestrzenna atmosfera"    │
│   [➕ Dodaj combo]                     │
├────────────────────────────────────────┤
│ [🔮 Losuj kombinację]                  │
└────────────────────────────────────────┘

Kliknięcie `[➕ Dodaj combo]` → dodaje WSZYSTKIE tagi z kombinacji do workbencha.
Pojedyncze tagi można dodać przez kliknięcie `[+tag]` w sekcji "Powiązane tagi".
```

### 8.3 "Losuj Kombinację" — Mechanika

Przycisk generuje losową kombinację 2-3 tagów z puli:

1. Wybierz losowy tag z obecnego batcha
2. Znajdź jego synergy (getSuggestedTags)
3. Wybierz 1-2 losowe z synergy
4. Jeśli kombo ma nazwę → pokaż nazwę
5. Jeśli nie → "Custom combo: tagA + tagB"

Każde kliknięcie losuje nową kombinację i wyświetla ją jako pierwszy wpis w sekcji "Sugerowane tagi" w Detail Window.

**UX Flow:**

1. Kliknięcie "Losuj" → nowa kombinacja pojawia się na górze listy sugerowanych tagów
2. Kliknięcie kombinacji → dodaje WSZYSTKIE tagi z combo na workbench jednocześnie
3. Po 5 losowaniach: przycisk zmienia się na wyłączony z tooltipem "Osiągnięto limit losowań"
4. Limit resetuje się przy nowym batchu

---

## 9. Flow Końcowy — Od Kart do Promptu

### 9.1 Sekwencja Kompletna

```
1. START
   → Batch 1: 10 kart pojawia się w przestrzeni (staggered)
   → Workbench: pusty
   → CTA: "dalej" (disabled)

2. SELEKCJA
   → Użytkownik klika kartę → DISSOLVING → TOKEN na stole
   → Sugestie w detail window pomagają wybrać więcej
   → "dalej" → enabled (gdy ≥1 tag wybrany)

3. DALEJ (koniec batcha)
   → Niewybrane karty → DISSOLVING (staggered)
   → Pauza 500ms
   → Batch 2: 5 kart → ENTERING
   → (powtarza się)

4. PROMPT PREVIEW (≥10 tagów na stole)
   → Workbench rozszerza się (jak w istniejącej spec: `prompt_preview`)
   → Nad tokenami pojawia się podgląd promptu
   → CTA: "generuj"

5. GENERUJ
   → Eksplozja cząsteczek (istniejący `completion` state)
   → Prompt gotowy do skopiowania
```

### 9.2 Maksymalna Liczba Tagów

| Limit            | Wartość                    | Uzasadnienie                              |
| ---------------- | -------------------------- | ----------------------------------------- |
| Min do "dalej"   | 1                          | Przynajmniej jeden wybrany                |
| Min do "generuj" | 3                          | Sensowny prompt                           |
| Maks na stole    | 12-15                      | Nie więcej — tokeny stają się nieczytelne |
| Maks batch       | 10 (pierwszy), 5 (kolejne) | Nie przytłaczać użytkownika               |

---

## 10. Integracja z Istniejącym Systemem

### 10.1 Co się Zmienia

| Element            | Zmiana                                                             |
| ------------------ | ------------------------------------------------------------------ |
| `ember_container`  | Zastąpiony przez `tarot_container`                                 |
| `floating_embers`  | Usunięty (zastąpiony przez karty)                                  |
| `workbench_tokens` | BEZ ZMIAN — tokeny na stole pozostają takie same                   |
| `atmosphere_layer` | BEZ ZMIAN — tło, scanliny, vigneta pozostają                       |
| `flow_states`      | `tarot_selection` ZASTĘPUJE zarówno `selection` jak i `suggestion` |
| `suggestion_logic` | BEZ ZMIAN — logika sugerowania tagów pozostaje                     |

**Mapowanie flow_states w trybie tarot:**

```
initial → tarot_selection → prompt_preview → completion
                │
                ├─ batch 1: 10 kart (odpowiednik dawnego selection)
                ├─ batch 2: 5 kart (odpowiednik dawnego suggestion)
                ├─ batch 3+: 5 kart
                │
                └─ po ≥10 tagach → prompt_preview (przerywa batch)
```

### 10.2 Nowe Moduły

| Moduł                    | Odpowiedzialność                         |
| ------------------------ | ---------------------------------------- |
| `tarot-deck.js`          | Renderowanie kart, stany, animacje       |
| `tarot-particle.js`      | Particle system dla dissolve/assemble    |
| `tarot-detail-window.js` | Detail window na hover                   |
| `tarot-convergence.js`   | Logika zbieżności tagów i sugestii combo |

### 10.3 Zmiany w Istniejących Modułach

| Moduł                | Zmiana                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| `app-logic.js`       | Nowy stan `SunoApp.state.tarotMode` + metody `showNextBatch()`, `dissolveCard()`                     |
| `app-logic.js`       | W trybie tarot: wyłączyć `showTooltip()`/`hideTooltip()` — Detail Window zastępuje tooltip w całości |
| `analyzer-engine.js` | Nowa metoda: `generateComboName(tagA, tagB)` — **patrz specyfikacja poniżej**                        |

**Specyfikacja `generateComboName(tagA, tagB)`:**

```js
/**
 * Generuje nazwę kombinacji dwóch tagów.
 * @param {Object} tagA - Tag z tags-data.js
 * @param {Object} tagB - Tag z tags-data.js
 * @returns {string|null} Nazwa combo lub null jeśli nie znaleziono
 *
 * Algorytm:
 *   1. const key = [tagA.id, tagB.id].sort().join('+')
 *      → np. "drone+ambient" (zawsze alfabetycznie)
 *   2. Szukaj w comboNames[key] (nowa sekcja w tags-data.js)
 *   3. Jeśli znaleziono → return nazwa (np. "ambient drone")
 *   4. Jeśli nie znaleziono → spróbuj odwróconą kolejność
 *      → comboNames['ambient+drone'] || comboNames['drone+ambient']
 *   5. Jeśli nadal nie → return null
 *      → UI wyświetli fallback: "tagA + tagB"
 *
 * Wsparcie dla 3 tagów:
 *   generateComboName3(tagA, tagB, tagC):
 *     // Szukaj wszystkich 3 permutacji w comboNames
 *     // Jeśli nie znaleziono → sprawdź pary (najsilniejsza synergia)
 *     // Ostatecznie: return null
 */
```

| `tags-data.js` | Nowe pole `comboNames: { "deep+drone": "deep drone" }` |

---

## 11. Responsywność

| Breakpoint                | Karty w gridzie                | Batch size | Particle level |
| ------------------------- | ------------------------------ | ---------- | -------------- |
| **Mobile** (< 600px)      | 2 kolumny, 3 wiersze = 6 kart  | 6          | `low`          |
| **Tablet** (600-1024px)   | 3 kolumny, 3 wiersze = 9 kart  | 6-8        | `medium`       |
| **Desktop** (1024-1920px) | 4 kolumny, 3 wiersze = 12 kart | 10         | `high`         |
| **Ultrawide** (> 1920px)  | 5 kolumn, 2 wiersze = 10 kart  | 10         | `high`         |

Detail window na mobile: zamiast tooltipa — **bottom sheet** lub overlay `position: fixed; bottom: 0; width: 100%`.

---

## 12. Dostępność

| Wymóg                   | Implementacja                                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Keyboard navigation** | Tab przez karty → Enter wybiera → Escape zamyka detail window                                                                                                                     |
| **Screen reader**       | `role="button"` + `aria-label="Tag: {name}, kategoria: {cat}"`                                                                                                                    |
| **Reduced motion**      | `prefers-reduced-motion: reduce` → brak particle, fade zamiast dissolve, brak float                                                                                               |
| **Focus indicator**     | `outline: 2px solid #ff8800` (amber_glow) + `outline-offset: 2px` na `:focus-visible` — złoto na złocie ma niski kontrast, amber_glow (#ff8800) jest widoczny na ciemnozłotym tle |
| **Kolor**               | Nie polegamy wyłącznie na kolorze — symbole i tekst są wystarczające same w sobie                                                                                                 |

---

## 13. Stany Specjalne

### 13.0 Stany Systemowe

**LOADING — inicjalizacja decku:**

```
→ Komunikat: "Tasowanie kart..." z animacją migotania
→ Czas: do momentu załadowania TAG_DATA i inicjalizacji SunoAnalyzer
→ Particle: wyłączone (oszczędność CPU podczas ładowania)
→ Jeśli trwa >3s: pokaż pasek postępu
→ Automatyczne przejście do Batch 1 gdy gotowe
```

**ERROR — awaria inicjalizacji:**

```
→ Komunikat: "Nie udało się załadować kart"
→ Przycisk: "Spróbuj ponownie" (retry)
→ Jeśli SunoAnalyzer niedostępny: "Silnik analizy tagów nie odpowiada"
→ Jeśli Canvas/WebGL niedostępny: przełącz na fallback (clip-path)
→ Particle: degradacja do CSS-only (brak Canvas)
```

### 13.1 Pusty Batch (brak kart do pokazania)

```
→ Komunikat: "Karty się wyczerpały — czas ułożyć prompt"
→ Workbench od razu przechodzi do prompt_preview
→ Ewentualnie: przycisk "Pokaż jeszcze raz" — pokazuje batch z już wybranymi tagami
```

### 13.2 Wszystkie Karty Wybrane (batch pusty przed timeoutem)

```
→ Automatyczny koniec batcha (nie czeka na timer)
→ Krótka celebracja (glow wave)
→ Jeśli workbench ma ≥10 tagów → prompt_preview (pomija Batch 2+)
→ Jeśli workbench ma <10 tagów → następny batch
```

**Reguła: ≥10 tagów → prompt_preview. Niezależnie od batcha.**
Batch 2+ służy WYŁĄCZNIE do osiągnięcia minimum 3 tagów (jeśli user wybrał mało).
Jeśli user wybrał 10/10 w Batchu 1 → pomiń Batch 2+ → prompt_preview.
Maksymalnie 15 tagów na stole — dalsze karty nie są oferowane.

### 13.3 Przywracanie Karty z Workbencha

```
→ Kliknięcie tokena na stole → token się rozświetla
→ Opcja: "usuń" (token znika) vs "cofnij do kart"
→ Cofnięcie: token → particle unoszą się → karta assemblowana w przestrzeni
```

**Zasady przywracania:**

- Karta wraca na SWOJĄ ORYGINALNĄ POZYCJĘ w gridzie (zapisaną w `data-position`)
- Dołącza do AKTUALNEGO batcha (nie tworzy nowego)
- Timer FADING: reset do pełnego czasu pozostałego w batchu
- Może być ponownie wybrana (1-click cycle — wybierz → odrzuć → wybierz)
- Jeśli batch już zakończony → karta dołącza do NASTĘPNEGO batcha
- Jeśli workbench osiągnął 15 tagów → opcja "usuń" jest niedostępna (trzeba usunąć inny token)

---

## 14. Przepływy Animacyjne — Pełna Mapa

```
[Pojawienie się batcha]
       │
       ├─ karta #1: particle assemble (0.8s) → scale(1) + glow (0.2s) → IDLE
       ├─ karta #2: (0.2s stagger) ...
       │
       ▼
[IDLE — karty unoszą się]
       │
       ├─ mouseenter → 3D lift + glow (0.2s) → HOVER
       │     ├─ detail window slide in (0.15s)
       │     ├─ opóźnienie przy pierwszym batchu (system "uczy się")
       │     └─ sugestie są renderowane dynamicznie (analyzer-engine)
       │
       ├─ click → burst glow (0.2s) → scale(1.15) (0.1s)
       │     └─ DISSOLVING
       │           ├─ particle explode (0-200ms)
       │           ├─ particle float (200-800ms)
       │           └─ particle fade (800-1200ms)
       │                 └─ TOKEN na stole (drop + bounce, 0.4s)
       │
       └─ timer / "dalej" → FADING (0.4s)
             └─ DISSOLVING (staggered per karta)
                   └─ pauza 0.5s → następny batch

[Batch N zakończony, ≥10 tagów na stole]
       │
       └─ prompt_preview (workbench rozszerza się)
             └─ "generuj" → completion (celebracja, istniejący flow)
```

---

## 15. Zmiany w spec-kafelki.json — Mapa Aktualizacji

| Klucz                        | Zmiana                                                     |
| ---------------------------- | ---------------------------------------------------------- |
| `zones[0].children`          | `ember_container` → `tarot_container`                      |
| `tag_specs.floating_embers`  | → **Usunięty** (zastąpiony przez `tarot_cards`)            |
| `tag_specs.tarot_cards`      | → **Dodany** (nowa sekcja)                                 |
| `tag_specs.workbench_tokens` | Bez zmian                                                  |
| `flow_states`                | Nowy stan `tarot_selection` między `initial` a `selection` |
| `ui_elements`                | + `tarot_deck`, `detail_window`, `suggestion_panel`        |
| `suggestion_logic`           | Bez zmian (wykorzystuje istniejący)                        |

---

## 16. Gotowe Kombinacje — Baza Combo Names

W `tags-data.js` dodajemy nową sekcję:

```json
{
  "comboNames": {
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
    "drone+dark": "deep drone"
  }
}
```

Te same nazwy pojawiają się w Detail Window jako "Sugerowane tagi" i mogą być 1-klik dodane.

---

## 17. Podsumowanie — Co Otrzymujemy

| Element                                             | Status                 |
| --------------------------------------------------- | ---------------------- |
| Tarot-style karty z symbolami, numerami i opisami   | ✅ Specyfikacja gotowa |
| Hover → Detail Window z pełnym kontekstem           | ✅ Specyfikacja gotowa |
| Particle dissolve (rozpad w pył) przy selekcji      | ✅ Specyfikacja gotowa |
| Particle assemble (składanie z iskier) przy wejściu | ✅ Specyfikacja gotowa |
| Batch flow (partie kart, staggered entry/exit)      | ✅ Specyfikacja gotowa |
| Zbieżność tagów (convergence bars)                  | ✅ Specyfikacja gotowa |
| Sugestie kombinacji tagów (+ przymiotniki)          | ✅ Specyfikacja gotowa |
| Przywracanie karty z workbencha                     | ✅ Specyfikacja gotowa |
| Responsywność + accessibility                       | ✅ Specyfikacja gotowa |
| Integracja z istniejącym systemem                   | ✅ Mapa zmian gotowa   |
