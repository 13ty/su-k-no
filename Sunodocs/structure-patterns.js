var STRUCTURE_PATTERNS = [
  {
    id: "pop-standard",
    name: "Standard Pop",
    genre: "Pop / Rock",
    desc: "Klasyczna struktura popowa — zwrotka, narastanie, refren, kontrast. Sprawdza się w 90% gatunków.",
    sections: [
      { tag: "[Intro]", len: "4-8 barów", energy: "niska", tip: "Często instrumentalny, może zawierać (atmospheric synth build)" },
      { tag: "[Verse 1]", len: "8-16 barów", energy: "niska-średnia", tip: "Główna narracja, niższa energia" },
      { tag: "[Pre-Chorus]", len: "4-8 barów", energy: "rosnąca", tip: "Krótki buildup — napięcie przed refrenem" },
      { tag: "[Chorus]", len: "8 barów", energy: "wysoka", tip: "Hook — najwyższa energia, proste chwytliwe teksty" },
      { tag: "[Verse 2]", len: "8-16 barów", energy: "niska-średnia", tip: "Nowa perspektywa, rozwinięcie historii" },
      { tag: "[Chorus]", len: "8 barów", energy: "wysoka" },
      { tag: "[Bridge]", len: "4-8 barów", energy: "średnia", tip: "Kontrast — spokojniejszy lub bardziej emocjonalny" },
      { tag: "[Chorus]", len: "8-16 barów", energy: "najwyższa", tip: "Finałowy refren — największa energia" },
      { tag: "[Outro]", len: "4-8 barów", energy: "opadająca", tip: "Zamknięcie — fade out lub big finish" }
    ],
    template: "[Intro]\n\n[Verse 1]\n\n[Pre-Chorus]\n\n[Chorus]\n\n[Verse 2]\n\n[Chorus]\n\n[Bridge]\n\n[Chorus]\n\n[Outro]"
  },
  {
    id: "edm-drop",
    name: "Electronic / EDM Flow",
    genre: "EDM / House / Techno",
    desc: "Struktura nastawiona na build i drop. Idealna do muzyki klubowej i festiwalowej.",
    sections: [
      { tag: "[Intro]", len: "4-8 barów", energy: "niska", tip: "Często beat i atmosfera bez melodii" },
      { tag: "[Build]", len: "4-8 barów", energy: "rosnąca", tip: "Narastające napięcie — riser, snare rolls" },
      { tag: "[Drop]", len: "8-16 barów", energy: "najwyższa", tip: "Pełna energia — heaviest beat" },
      { tag: "[Verse 1]", len: "8 barów", energy: "średnia" },
      { tag: "[Build]", len: "4 barów", energy: "rosnąca" },
      { tag: "[Drop]", len: "8-16 barów", energy: "najwyższa" },
      { tag: "[Bridge]", len: "4-8 barów", energy: "niska", tip: "Odpoczynek, oczyszczenie" },
      { tag: "[Final Drop]", len: "16 barów", energy: "najwyższa", tip: "Ostatni drop — najdłuższy" },
      { tag: "[Outro]", len: "4-8 barów", energy: "opadająca", tip: "Fade out" }
    ],
    template: "[Intro]\n\n[Build]\n\n[Drop]\n\n[Verse 1]\n\n[Build]\n\n[Drop]\n\n[Bridge]\n\n[Final Drop]\n\n[Outro]"
  },
  {
    id: "metal-heavy",
    name: "Heavy Metal Build",
    genre: "Metal / Rock / Hardcore",
    desc: "Agresywna struktura z breakdownami i solówkami. Dla ciężkich gatunków.",
    sections: [
      { tag: "[Intro]", len: "4 barów", energy: "średnia", tip: "Często ciężki riff" },
      { tag: "[Verse 1]", len: "8 barów", energy: "wysoka", tip: "Agresywny wokal" },
      { tag: "[Chorus]", len: "8 barów", energy: "bardzo wysoka", tip: "Catchy riff, melodyjny hook" },
      { tag: "[Verse 2]", len: "8 barów", energy: "wysoka" },
      { tag: "[Chorus]", len: "8 barów", energy: "bardzo wysoka" },
      { tag: "[Guitar Solo]", len: "8-16 barów", energy: "wysoka", tip: "Popisz się — solówka" },
      { tag: "[Breakdown]", len: "4-8 barów", energy: "maksymalna", tip: "Najcięższy moment — zwolnione tempo" },
      { tag: "[Chorus]", len: "8 barów", energy: "bardzo wysoka" },
      { tag: "[Outro]", len: "4 barów", energy: "opadająca" }
    ],
    template: "[Intro]\n\n[Verse 1]\n\n[Chorus]\n\n[Verse 2]\n\n[Chorus]\n\n[Guitar Solo]\n\n[Breakdown]\n\n[Chorus]\n\n[Outro]"
  },
  {
    id: "hiphop-rap",
    name: "Hip-Hop / Rap Flow",
    genre: "Hip-Hop / Rap / Trap",
    desc: "Struktura rapowa z wieloma zwrotkami i powtarzalnym hookiem.",
    sections: [
      { tag: "[Intro]", len: "4 barów", energy: "niska", tip: "Beat intro lub tease hooku" },
      { tag: "[Hook]", len: "8 barów", energy: "średnia-wysoka", tip: "Catchy, powtarzalna fraza" },
      { tag: "[Verse 1]", len: "16 barów", energy: "średnia", tip: "Główna zwrotka — flow i rymy" },
      { tag: "[Hook]", len: "8 barów", energy: "średnia-wysoka" },
      { tag: "[Verse 2]", len: "16 barów", energy: "średnia" },
      { tag: "[Hook]", len: "8 barów", energy: "średnia-wysoka" },
      { tag: "[Bridge]", len: "4-8 barów", energy: "średnia", tip: "Zmiana flow lub ad-liby" },
      { tag: "[Verse 3]", len: "16 barów", energy: "wysoka", tip: "Ostatnia zwrotka — najwięcej energii" },
      { tag: "[Hook]", len: "8-16 barów", energy: "średnia-wysoka" },
      { tag: "[Outro]", len: "4-8 barów", energy: "opadająca", tip: "Ad-liby, fade" }
    ],
    template: "[Intro]\n\n[Hook]\n\n[Verse 1]\n\n[Hook]\n\n[Verse 2]\n\n[Hook]\n\n[Bridge]\n\n[Verse 3]\n\n[Hook]\n\n[Outro]"
  },
  {
    id: "ambient-minimal",
    name: "Minimalist Ambient",
    genre: "Ambient / Drone / Lo-Fi",
    desc: "Wolna, przestrzenna struktura. Nacisk na nastrój i texturę, nie na piosenkę.",
    sections: [
      { tag: "[Intro]", len: "8 barów", energy: "niska", tip: "Powolne wprowadzenie" },
      { tag: "[Verse 1]", len: "8-16 barów", energy: "niska-średnia", tip: "Szeptany lub spokojny wokal" },
      { tag: "[Chorus]", len: "8 barów", energy: "średnia", tip: "Subtelny wzrost" },
      { tag: "[Instrumental]", len: "8 barów", energy: "niska", tip: "Czysta atmosfera" },
      { tag: "[Verse 2]", len: "8-16 barów", energy: "niska-średnia" },
      { tag: "[Chorus]", len: "8 barów", energy: "średnia" },
      { tag: "[Outro]", len: "8-16 barów", energy: "niska", tip: "Długie wybrzmienie, fade" }
    ],
    template: "[Intro]\n\n[Verse 1]\n\n[Chorus]\n\n[Instrumental]\n\n[Verse 2]\n\n[Chorus]\n\n[Outro]"
  },
  {
    id: "rnb-soul",
    name: "R&B / Soul",
    genre: "R&B / Soul / Neo-Soul",
    desc: "Płynna struktura z miejscem na wokalne popisy i harmonie.",
    sections: [
      { tag: "[Intro]", len: "4 barów", energy: "niska", tip: "Często wokalne ad-liby" },
      { tag: "[Verse 1]", len: "8-12 barów", energy: "niska-średnia", tip: "Gładki, melodyjny wokal" },
      { tag: "[Pre-Chorus]", len: "4 barów", energy: "rosnąca" },
      { tag: "[Chorus]", len: "8 barów", energy: "wysoka", tip: "Layered harmonies, belted" },
      { tag: "[Verse 2]", len: "8-12 barów", energy: "niska-średnia" },
      { tag: "[Chorus]", len: "8 barów", energy: "wysoka" },
      { tag: "[Bridge]", len: "4-8 barów", energy: "wysoka", tip: "Ad-liby, melizmaty, vocal runs" },
      { tag: "[Chorus]", len: "8-16 barów", energy: "najwyższa", tip: "Big finish z harmoniami" },
      { tag: "[Outro]", len: "4-8 barów", energy: "opadająca", tip: "Wokalne ad-liby do fade" }
    ],
    template: "[Intro]\n\n[Verse 1]\n\n[Pre-Chorus]\n\n[Chorus]\n\n[Verse 2]\n\n[Chorus]\n\n[Bridge]\n\n[Chorus]\n\n[Outro]"
  },
  {
    id: "country-folk",
    name: "Country / Folk",
    genre: "Country / Folk / Americana",
    desc: "Struktura oparta na storytellingu. Prosta, bezpośrednia, akustyczna.",
    sections: [
      { tag: "[Intro]", len: "4-8 barów", energy: "niska", tip: "Akustyczna gitara" },
      { tag: "[Verse 1]", len: "8 barów", energy: "niska", tip: "Storytelling — wprowadzenie historii" },
      { tag: "[Chorus]", len: "8 barów", energy: "średnia", tip: "Prosty, powtarzalny hook" },
      { tag: "[Verse 2]", len: "8 barów", energy: "niska", tip: "Rozwinięcie historii" },
      { tag: "[Chorus]", len: "8 barów", energy: "średnia" },
      { tag: "[Bridge]", len: "4-8 barów", energy: "średnia", tip: "Refleksja, zmiana perspektywy" },
      { tag: "[Chorus]", len: "8 barów", energy: "średnia-wysoka" },
      { tag: "[Outro]", len: "4-8 barów", energy: "niska", tip: "Instrumentalny fade" }
    ],
    template: "[Intro]\n\n[Verse 1]\n\n[Chorus]\n\n[Verse 2]\n\n[Chorus]\n\n[Bridge]\n\n[Chorus]\n\n[Outro]"
  },
  {
    id: "jazz-blues",
    name: "Jazz / Blues Standard",
    genre: "Jazz / Blues / Swing",
    desc: "Struktura z przestrzenią na improwizację i solówki.",
    sections: [
      { tag: "[Intro]", len: "4 barów", energy: "niska", tip: "Piano lub gitara intro" },
      { tag: "[Verse 1]", len: "12 barów", energy: "niska-średnia", tip: "Temat główny" },
      { tag: "[Chorus]", len: "8 barów", energy: "średnia" },
      { tag: "[Solo]", len: "8-16 barów", energy: "średnia-wysoka", tip: "Improwizacja — piano, sax, gitara" },
      { tag: "[Verse 2]", len: "12 barów", energy: "niska-średnia" },
      { tag: "[Chorus]", len: "8 barów", energy: "średnia" },
      { tag: "[Solo]", len: "8-16 barów", energy: "wysoka" },
      { tag: "[Outro]", len: "4-8 barów", energy: "niska", tip: "Tag ending" }
    ],
    template: "[Intro]\n\n[Verse 1]\n\n[Chorus]\n\n[Solo]\n\n[Verse 2]\n\n[Chorus]\n\n[Solo]\n\n[Outro]"
  },
  {
    id: "indie-alt",
    name: "Indie / Alternative",
    genre: "Indie / Alternative / Dream Pop",
    desc: "Kreatywna struktura z nieszablonowym układem sekcji.",
    sections: [
      { tag: "[Intro]", len: "4-8 barów", energy: "niska", tip: "Atmosferyczny" },
      { tag: "[Verse 1]", len: "8 barów", energy: "niska-średnia", tip: "Intymny wokal" },
      { tag: "[Chorus]", len: "8 barów", energy: "wysoka", tip: "Big hook, dużo przestrzeni" },
      { tag: "[Instrumental]", len: "4-8 barów", energy: "średnia", tip: "Przebicie" },
      { tag: "[Verse 2]", len: "8 barów", energy: "niska-średnia" },
      { tag: "[Chorus]", len: "8 barów", energy: "wysoka" },
      { tag: "[Bridge]", len: "4-8 barów", energy: "średnia", tip: "Kontrast, często whisper" },
      { tag: "[Chorus]", len: "8-16 barów", energy: "najwyższa", tip: "Finał z warstwami" },
      { tag: "[Outro]", len: "4-8 barów", energy: "opadająca", tip: "Dźwięki, feedback, fade" }
    ],
    template: "[Intro]\n\n[Verse 1]\n\n[Chorus]\n\n[Instrumental]\n\n[Verse 2]\n\n[Chorus]\n\n[Bridge]\n\n[Chorus]\n\n[Outro]"
  },
  {
    id: "punk-fast",
    name: "Punk / Szybki Rock",
    genre: "Punk / Hardcore / Garage",
    desc: "Krótka, intensywna struktura. Zero zbędnych sekcji, maksimum energii.",
    sections: [
      { tag: "[Intro]", len: "2-4 barów", energy: "wysoka", tip: "Bardzo krótki, od razu w wir" },
      { tag: "[Verse 1]", len: "8 barów", energy: "wysoka" },
      { tag: "[Chorus]", len: "4-8 barów", energy: "bardzo wysoka" },
      { tag: "[Verse 2]", len: "8 barów", energy: "wysoka" },
      { tag: "[Chorus]", len: "4-8 barów", energy: "bardzo wysoka" },
      { tag: "[Guitar Solo]", len: "4-8 barów", energy: "wysoka", tip: "Szybki, brudny" },
      { tag: "[Chorus]", len: "8 barów", energy: "maksymalna" },
      { tag: "[Outro]", len: "2-4 barów", energy: "wysoka", tip: "Nagłe zakończenie" }
    ],
    template: "[Intro]\n\n[Verse 1]\n\n[Chorus]\n\n[Verse 2]\n\n[Chorus]\n\n[Guitar Solo]\n\n[Chorus]\n\n[Outro]"
  }
];

var SECTION_TAGS_META = {
  "intro": { name: "[Intro]", desc: "Sekcja otwierająca — często instrumentalna, wprowadza nastrój" },
  "verse": { name: "[Verse]", desc: "Główna sekcja narracyjna, niższa energia" },
  "pre-chorus": { name: "[Pre-Chorus]", desc: "Krótki buildup budujący napięcie przed refrenem" },
  "chorus": { name: "[Chorus]", desc: "Hook piosenki — najwyższa energia, zapadająca melodia" },
  "post-chorus": { name: "[Post-Chorus]", desc: "Przedłużenie refrenu, często instrumentalne" },
  "bridge": { name: "[Bridge]", desc: "Kontrastująca sekcja — zmiana melodii, emocji" },
  "outro": { name: "[Outro]", desc: "Sekcja zamykająca — fade out lub finał" },
  "hook": { name: "[Hook]", desc: "Krótka, powtarzalna fraza — alternatywa dla chorus" },
  "build": { name: "[Build]", desc: "Narastające napięcie — dla EDM i elektronicznych gatunków" },
  "drop": { name: "[Drop]", desc: "Moment, w którym beat wraca z pełną siłą po buildzie" },
  "solo": { name: "[Solo]", desc: "Instrumentalna solówka (gitara, synth, sax, etc.)" },
  "break": { name: "[Break]", desc: "Przerwa — instrumenty milkną, napięcie rośnie" },
  "breakdown": { name: "[Breakdown]", desc: "Stripped-down sekcja — często w metalu, zwolnione tempo" },
  "instrumental": { name: "[Instrumental]", desc: "Część bez wokalu — tylko muzyka" },
  "interlude": { name: "[Interlude]", desc: "Krótki przerywnik między sekcjami" },
  "refrain": { name: "[Refrain]", desc: "Powtarzająca się fraza, często na końcu zwrotki" },
  "end": { name: "[End]", desc: "Sygnalizuje Suno, żeby zakończyć utwór" },
  "final chorus": { name: "[Final Chorus]", desc: "Ostatni refren — największa energia, często z variacją" },
  "riff": { name: "[Riff]", desc: "Powtarzający się motyw gitarowy" },
  "chant": { name: "[Chant]", desc: "Skandowanie — tłum, grupa, chór" }
};
