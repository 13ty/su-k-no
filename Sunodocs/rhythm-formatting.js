var RHYTHM_FORMATTING = {
  title: "Rytmika i Formatowanie w Suno AI",
  description: "Jak interpunkcja, kapitalizacja i podział na linijki wpływają na rytm, tempo i ekspresję wokalu w Suno.",
  
  principles: [
    {
      name: "Podział na linijki",
      desc: "Każda nowa linijka to naturalna fraza melodyczna. Suno traktuje linię jako jedną myśl muzyczną. Krótsze linijki = szybszy rytm. Dłuższe linijki = wolniejszy, bardziej płynny rytm.",
      rule: "Jedna myśl = jedna linijka. Nie łącz zdań w jednej linii.",
      good_example: "Walking through the rain at midnight\nEvery streetlight tells a story",
      bad_example: "Walking through the rain at midnight, every streetlight tells a story",
      impact: "sylaby/linijkę → szybkość śpiewania"
    },
    {
      name: "Puste linie (przerwy)",
      desc: "Pusta linia między sekcjami = naturalna pauza, oddech, przerwa w muzyce. Suno interpretuje to jako koniec frazy i chwilę ciszy.",
      rule: "Zawsze zostawiaj pustą linię między tagami struktury a tekstem.",
      good_example: "[Chorus]\n\nThis is the hook\nSing it loud\n\n[Verse 2]",
      bad_example: "[Chorus]\nThis is the hook\nSing it loud\n[Verse 2]"
    },
    {
      name: "WIELKIE LITERY (krzyk)",
      desc: "TEKST NAPISANY WIELKIMI LITERAMI Suno interpretuje jako KRZYK lub silną EMOCJĘ. Używaj oszczędnie — tylko w momentach największego napięcia.",
      rule: "MAX 1-2 linijek ALL CAPS na sekcję. Za dużo = agresywny wokal w całej piosence.",
      good_example: "I've been waiting all my life\nTHIS IS MY MOMENT NOW",
      bad_example: "I'VE BEEN WAITING ALL MY LIFE\nTHIS IS MY MOMENT NOW",
      impact: "ALL CAPS → agresywność, głośność wokalu"
    },
    {
      name: "Kropka (.)",
      desc: "Kończy frazę. Suno robi naturalną pauzę. Sygnalizuje koniec myśli muzycznej.",
      impact: "Naturalny oddech, koniec frazy",
      example: "I walked alone that night.\nThe moon was nowhere to be seen."
    },
    {
      name: "Przecinek (,)",
      desc: "Krótki oddech w środku frazy. Suno nie kończy melodii, tylko robi mikro-pauzę.",
      impact: "Krótki oddech, płynność",
      example: "I walked alone, beneath the stars, and wondered"
    },
    {
      name: "Wielokropek (...)",
      desc: "Zawieszenie głosu, cisza, niedopowiedzenie. Suno robi pauzę emocjonalną.",
      impact: "Emocjonalna pauza, zawieszenie",
      example: "I thought I saw you... but it wasn't real"
    },
    {
      name: "Wykrzyknik (!)",
      desc: "Energia, głośność. Suno śpiewa tę frazę głośniej i bardziej agresywnie. UWAGA: zbyt wiele wykrzykników = ciągły krzyk.",
      impact: "Głośniej, bardziej agresywnie",
      example: "I will survive tonight!",
      warning: "Usuń wykrzykniki z liryków jeśli Suno ciągle krzyczy"
    },
    {
      name: "Znak zapytania (?)",
      desc: "Sygnalizuje intonację pytającą. Suno podnosi ton na końcu frazy.",
      impact: "Intonacja pytająca, wyższy ton",
      example: "Do you remember me?\nWas it all a dream?"
    },
    {
      name: "Myślnik (—)",
      desc: "Dłuższa pauza, zmiana myśli. Suno robi przerwę jakby coś przerwało tok.",
      impact: "Pauza, zmiana kierunku",
      example: "I was ready to go — but then you called"
    },
    {
      name: "Dyktowanie wokalne (parenteza)",
      desc: "Słowa w nawiasie na osobnej linii przed tekstem kierują delivery. (whispered), (belted), (spoken), (humming), (building intensity). Działają jak tagi wokalne ale subtelniej.",
      rule: "Umieść na osobnej linii przed frazą, której dotyczy.",
      impact: "Kierunek wokalny dla konkretnej linijki",
      example: "(whispered)\nI can hear you breathing\n(belting)\nI WILL FIND MY WAY HOME!"
    },
    {
      name: "Echo (słowa w nawiasie)",
      desc: "Jeśli napiszesz 'I want it all (all), yeah I want it all (all)', Suno często powtórzy słowa w nawiasie innym głosem.",
      impact: "Efekt echa, drugi głos",
      example: "I'm on top (top), yeah I'm never gonna stop (stop)"
    },
    {
      name: "Instrumenty w nawiasie",
      desc: "Jeśli napiszesz (gunshot) lub (vinyl scratch) w tekście, Suno czasami doda ten dźwięk. Szansa wzrasta jeśli dźwięk jest powszechny w danym gatunku.",
      impact: "Efekt dźwiękowy (losowy)",
      example: "Get the (vinyl scratch) out\nDrop the (gunshot) bass"
    },
    {
      name: "Liczba sylab",
      desc: "Suno dopasowuje melodię do liczby sylab w linijce. Jeśli melodia się rozjeżdża, użyj synonimów z mniejszą liczbą sylab lub skróć frazę.",
      impact: "Dopasowanie melodyczne",
      example: "Zamiast: 'I am going to the store'\n      'I'm heading to the store'"
    },
    {
      name: "Rymy i współbrzmienia",
      desc: "Suno nie wymusza rymów, ale rymowane teksty brzmią naturalniej. Asonans (współbrzmienie samogłosek) daje subtelny efekt.",
      impact: "Naturalność, flow",
      keywords: ["assonance", "consonance", "rhyme scheme"]
    },
    {
      name: "Sekcje 3-4 linijek",
      desc: "Refreny najlepiej działają z 3-4 linijkami. Dłuższe refreny rozmywają hook. Zwrotki mogą mieć 4-8 linijek.",
      impact: "Siła hooku, zapamiętywalność",
      rule: "Chorus: 3-4 linie. Verse: 4-8 linii."
    },
    {
      name: "Pierwsza linijka = najważniejsza",
      desc: "Suno daje największy ciężar melodyczny pierwszej linijce każdej sekcji. Najważniejszą linijkę postaw na początku.",
      impact: "Melodyczne napięcie pierwszej linii",
      rule: "Najsilniejsza linijka sekcji zawsze na początku"
    }
  ],

  summary: {
    quick_tips: [
      "Linijka = fraza, nie łącz zdań",
      "Pusta linia między tagami a tekstem = pauza",
      "ALL CAPS tylko na 1-2 linijki max",
      ". = koniec, , = oddech, ... = zawieszenie",
      "! = głośniej, ? = intonacja w górę",
      "(whispered) przed linią = kierunek wokalny",
      "(słowo) w środku linii = echo/drugi głos",
      "Refren max 4 linie, zwrotka max 8 linii",
      "Usuń wykrzykniki jeśli Suno ciągle krzyczy"
    ],
    char_limits: {
      optimal: "1000-1200 znaków na generację",
      max_single: "~3000 znaków limitu Suno",
      too_long: "Powyżej ~1200 znaków = ryzyko ucięcia po ~2 minutach",
      solution: "Podziel na części i użyj 'Extend' po drugim refrenie"
    }
  }
};

var FORMAT_TIPS_PL = [
  "Każda linijka to jedna fraza melodyczna",
  "Pusta linia = pauza między sekcjami",
  "ALL CAPS = krzyk / silna emocja (używaj oszczędnie!)",
  "Kropka (.) = koniec frazy i naturalny oddech",
  "Przecinek (,) = mikro-pauza, płynność",
  "Wielokropek (...) = zawieszenie, cisza",
  "Wykrzyknik (!) = agresywnie, głośniej",
  "Znak zapytania (?) = intonacja w górę",
  "Myślnik (—) = zmiana myśli, pauza",
  "(whispered) przed linią = kierunek delivery",
  "(echo) w środku linii = drugi głos / powtórka",
  "Refren = 3-4 linie maks. Zwrotka = 4-8 linii",
  "Najsilniejszą linijkę postaw na początku sekcji",
  "Unikaj więcej niż 1-2 ALL CAPS linijek na sekcję",
  "+1200 znaków = ryzyko ucięcia generacji"
];
