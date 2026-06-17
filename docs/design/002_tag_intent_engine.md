# ADR-002: Tag Intent Engine

## Status: Proposed
## Data: 2026-05-26

## Kontekst
User ma 249 tagów do ręcznego przeglądania. Nie ma możliwości opisania intencji ("chcę zrobić mroczny ambient") i otrzymania gotowej listy tagów.

## Decyzja

### Architektura hybrydowa: Rule-based + AI fallback

```
User Input → Tokenizer → Rule Matcher → Conflict Resolver → Tag Set
                 ↓ (if < 3 tags found)
            AI Provider → Tag Set
```

### Rule-based Matcher

Plik `tag-intent-engine.js`:

```
INTENT_MAP = {
  // PL keywords
  "mroczny":    ["dark", "gothic", "minor", "industrial", "tense"],
  "smutny":     ["melancholic", "bittersweet", "slow", "minor", "soft"],
  "szybki":     ["fast", "very-fast", "energetic", "driving", "pounding"],
  "wolny":      ["slow", "very-slow", "ambient", "calm", "serene"],
  "ciepły":     ["warm", "soft", "acoustic-guitar", "piano", "folk"],
  "zimny":      ["cold", "dark", "industrial", "minimal", "glitch"],
  "delikatny":  ["soft", "gentle", "whisper", "acoustic-guitar", "piano"],
  "agresywny":  ["aggressive", "scream", "distortion", "heavy", "pounding"],
  "elektroniczny": ["electronic", "synth", "drum-machine", "edm", "techno"],
  "akustyczny": ["acoustic-guitar", "piano", "folk", "soft", "organic"],
  "orkiestrowy": ["orchestra", "strings", "cinematic", "epic", "brass"],
  "wokal":      ["female-vocal", "male-vocal", "choir", "vocal-harmonies"],
  "żeński":     ["female-vocal", "ethereal", "falsetto"],
  "męski":      ["male-vocal", "baritone", "deep"],

  // EN keywords
  "dark":       ["dark", "gothic", "minor", "industrial", "tense"],
  "sad":        ["melancholic", "bittersweet", "slow", "minor", "soft"],
  "fast":       ["fast", "very-fast", "energetic", "driving"],
  "slow":       ["slow", "very-slow", "ambient", "calm"],
  "warm":       ["warm", "soft", "acoustic-guitar", "piano", "folk"],
  "cold":       ["cold", "dark", "industrial", "minimal"],
  "gentle":     ["soft", "gentle", "whisper", "acoustic"],
  "aggressive": ["aggressive", "scream", "distortion", "heavy"],
  "electronic": ["electronic", "synth", "drum-machine", "edm"],
  "acoustic":   ["acoustic-guitar", "piano", "folk", "soft"],
  "orchestral": ["orchestra", "strings", "cinematic", "epic"],
  "vocal":      ["female-vocal", "male-vocal", "choir", "vocal-harmonies"],
  "female":     ["female-vocal", "ethereal"],
  "male":       ["male-vocal", "baritone"],
  "instrumental": ["instrumental", "solo", "ambient", "electronic"],

  // mood synonims
  "spokojny":   ["calm", "serene", "soft", "ambient", "meditative"],
  "energiczny": ["energetic", "uplifting", "joyful", "fast"],
  "refleksyjny": ["melancholic", "bittersweet", "slow", "piano"],
  "nostalgiczny": ["nostalgic", "bittersweet", "warm", "lo-fi"],
  "tajemniczy": ["mysterious", "dark", "tense", "ethereal"],
  "epicki":     ["epic", "cinematic", "orchestra", "triumphant"],
  "senny":      ["dreamy", "ethereal", "ambient", "soft", "reverb"],
  "radosny":    ["joyful", "uplifting", "bright", "hopeful"],
  "seksowny":   ["sexy", "r&b", "groovy", "slow"],
};

// Gatunki (direct mapping)
INTENT_GENRE_MAP = {
  "ambient":    ["ambient", "drone", "minimal", "ethereal"],
  "metal":      ["metal", "distortion", "scream", "heavy", "aggressive"],
  "pop":        ["pop", "catchy", "uplifting", "synth"],
  "jazz":       ["jazz", "saxophone", "piano", "swinging"],
  "hiphop":     ["hip-hop", "rap", "808-bass", "trap"],
  "elektronika": ["electronic", "synth", "edm", "techno", "house"],
  "klasyczny":  ["classical", "orchestra", "strings", "piano"],
  // ... pełna mapa dla każdego gatunku
};
```

### Logika działania
1. Tokenizacja inputu (split po spacjach, przecinkach)
2. Dla każdego tokena: szukaj w INTENT_MAP → zbierz tagi
3. Jeśli token pasuje do gatunku → dodaj gatunek + sugerowane instrumenty
4. Deduplikacja tagów
5. Rozwiązywanie konfliktów (usuń kolidujące tagi, zostaw pierwszy)
6. Jeśli < 3 tagów → AI mode (jeśli online)
7. Zwróć `{ tags: [], conflicts_resolved: [], source: 'rule'|'ai' }`

### Conflict Resolution podczas intent
Gdy user wpisze "agresywny" i dostanie `scream` + `whisper` (oba vocal_style) → usuń `whisper`.
Gdy user wpisze "żeński wokal" i "męski wokal" → usuń to z mniejszą wagą.

### AI mode
Ten sam system prompt co w lyrics creator, ale z tag-data jako context:
```
Dostępne tagi (id: nazwa):
dark: Dark, ambient: Ambient, female-vocal: Female Vocal, ...
---
Użytkownik chce: "{input}"
Zwróć JASON: {{ "tags": ["id1", "id2", ...], "reasoning": "krótki opis" }}
Wybierz max 8 tagów. Unikaj konfliktów (vocal_style, energy, speed).
```

### UI Integration
```
┌─────────────────────────────────────┐
│ [🔍 Opisz czego szukasz...        ] │
│ ["ciemny elektroniczny z wokalem"] │
│ [🔮 Dobierz tagi]                  │
├─────────────────────────────────────┤
│ Sugerowane tagi (AI):               │
│ [dark] [electronic] [female-vocal]   │
│ [synth] [reverb] [ethereal]          │
│ [✓ Akceptuj wszystkie] [✕ Odrzuć]   │
├─────────────────────────────────────┤
│ (normalny grid tagów poniżej)        │
└─────────────────────────────────────┘
```
