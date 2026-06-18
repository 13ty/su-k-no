var VOCAL_TRIGGERS = [
  {
    id: "whispered",
    tag: "[Whispered]",
    name: "Szept",
    desc: "Bardzo cichy, intymny przekaz. Szept — jakbyś mówił komuś do ucha. Działa najlepiej w zwrotkach i bridge'ach.",
    energy: "niska",
    placement: "Verse, Bridge",
    reliability: "wysoka",
    example: "[Verse 1 - Whispered]\nQuiet intimate opening\nBarely above a breath"
  },
  {
    id: "belted",
    tag: "[Belted]",
    name: "Potężny wokal",
    desc: "Pełna moc wokalu — jak w musicalu lub popowej balladzie. Wszystkie siły na refren.",
    energy: "bardzo wysoka",
    placement: "Chorus, Final Chorus",
    reliability: "wysoka",
    example: "[Chorus - Belted]\nI WILL STAND TALL\nFull voice, no holding back"
  },
  {
    id: "spoken-word",
    tag: "[Spoken Word]",
    name: "Mówiony wokal",
    desc: "Rytmiczne mówienie, nie śpiewanie. Działa w większości gatunków. Poezja, narracja.",
    energy: "niska-średnia",
    placement: "Verse, Bridge, Intro",
    reliability: "bardzo wysoka",
    example: "[Verse 2 - Spoken Word]\nAlmost talking, rhythmic\nPoetic delivery style"
  },
  {
    id: "soft",
    tag: "[Soft]",
    name: "Delikatnie",
    desc: "Ciche, łagodne wokale. Osobno przed sekcją uspokaja wokal bez zmiany tekstu.",
    energy: "niska",
    placement: "Verse, Bridge",
    reliability: "wysoka",
    example: "[Soft Verse]\nGentle like morning rain\nSoft and quiet"
  },
  {
    id: "raspy",
    tag: "[Raspy]",
    name: "Chropowaty",
    desc: "Szorstki, przetarty wokal. Daje rockowego charakteru. Działa w rocku, bluesie, country.",
    energy: "średnia-wysoka",
    placement: "Verse, Chorus",
    reliability: "średnia",
    example: "[Raspy]\nI've been screaming at the moon\nRaw and gritty"
  },
  {
    id: "harmonies",
    tag: "[Harmonies]",
    name: "Harmonie wokalne",
    desc: "Wielowarstwowe harmonie — drugi, trzeci głos. Dla bogatego brzmienia.",
    energy: "zależy",
    placement: "Chorus, Bridge",
    reliability: "wysoka",
    example: "[Chorus]\n(main vocal) We are the fire\n(harmonies) We are the fire"
  },
  {
    id: "falsetto",
    tag: "[Falsetto]",
    name: "Falset",
    desc: "Wysoki, lekki rejestr wokalny. Charakterystyczny dla R&B, indie, popu.",
    energy: "średnia",
    placement: "Bridge, Chorus",
    reliability: "średnia",
    example: "[Bridge - Falsetto]\nReaching for the highest notes\nFloating in the air"
  },
  {
    id: "group-vocals",
    tag: "[Group Vocals]",
    name: "Wokal grupowy",
    desc: "Wiele głosów śpiewających razem. Chóralne brzmienie, antyfona.",
    energy: "wysoka",
    placement: "Chorus, Outro",
    reliability: "wysoka",
    example: "[Chorus - Group Vocals]\nEVERYONE SING IT LOUD!\nWe are united"
  },
  {
    id: "female-vocal",
    tag: "[Female Vocal]",
    name: "Wokal żeński",
    desc: "Kieruje Suno, aby użyło żeńskiego wokalu dla danej sekcji.",
    energy: "zależy",
    placement: "dowolny",
    reliability: "średnia",
    example: "[Verse - Female voice]\nShe walks alone at midnight"
  },
  {
    id: "male-vocal",
    tag: "[Male Vocal]",
    name: "Wokal męski",
    desc: "Kieruje Suno, aby użyło męskiego wokalu dla danej sekcji.",
    energy: "zależy",
    placement: "dowolny",
    reliability: "średnia",
    example: "[Verse - Male voice]\nHe stands in the pouring rain"
  },
  {
    id: "adlibs",
    tag: "[Ad-libs]",
    name: "Ad-liby",
    desc: "Krótkie, improwizowane wstawki wokalne. Charakterystyczne dla rapu i R&B.",
    energy: "średnia",
    placement: "Verse, Chorus, Outro",
    reliability: "wysoka",
    example: "I'm on top (yeah)\nCan't stop (uh)\n(ad-lib) let's go"
  },
  {
    id: "vocalfry",
    tag: "[Vocal Fry]",
    name: "Vocal Fry",
    desc: "Chropowaty, trzeszczący dźwięk wokalu. Modne w popie i indie.",
    energy: "niska",
    placement: "Verse, Bridge",
    reliability: "niska-średnia",
    example: "[Vocal Fry]\nI don't really care... (crack)"
  },
  {
    id: "rap",
    tag: "[Rap]",
    name: "Rap",
    desc: "Rytmiczny, rapowany wokal. Nie śpiewany. Dla hip-hopu i trapu.",
    energy: "średnia-wysoka",
    placement: "Verse",
    reliability: "wysoka",
    example: "[Rap Verse]\nSpitting fire on the beat\nFlow so sick, can't compete"
  },
  {
    id: "screamed",
    tag: "[Screamed]",
    name: "Krzyk",
    desc: "Agresywny krzyk w metalu i hardcore. Wymaga odpowiedniego gatunku w style.",
    energy: "maksymalna",
    placement: "Chorus, Breakdown",
    reliability: "średnia",
    example: "[Screamed]\nTHIS IS NOT A DRILL!\nBREAK THE WALLS DOWN!"
  },
  {
    id: "narrative",
    tag: "[Narrative]",
    name: "Narracja",
    desc: "Czytany tekst — jak audiobook lub voiceover. Różni się od spoken word.",
    energy: "niska",
    placement: "Intro, Bridge",
    reliability: "wysoka",
    example: "[Narrative]\nIt was a dark and stormy night..."
  },
  {
    id: "humming",
    tag: "[Humming]",
    name: "Nucenie",
    desc: "Melodia bez słów — mmm, mhm. Działa w każdym gatunku.",
    energy: "niska",
    placement: "Intro, Outro, Bridge",
    reliability: "wysoka",
    example: "[Intro]\n(humming) Mmm mmm mmm..."
  },
  {
    id: "scat",
    tag: "[Scat]",
    name: "Scat",
    desc: "Bezsensowne sylaby śpiewane jazzowo. Działa jeśli gatunek wspiera.",
    energy: "średnia",
    placement: "Solo, Bridge",
    reliability: "niska-średnia",
    example: "[Scat]\nDooby doo wap bam boom\nShoo be doo wap"
  },
  {
    id: "spoken-soft",
    tag: "[Spoken, Soft]",
    name: "Mówione cicho",
    desc: "Połączenie spoken word z bardzo cichym przekazem. Intymność.",
    energy: "bardzo niska",
    placement: "Intro, Bridge",
    reliability: "wysoka",
    example: "(spoken, soft)\nI can hear you breathing\nThree, two, one..."
  },
  {
    id: "call-response",
    tag: "[Call and Response]",
    name: "Wezwanie i odpowiedź",
    desc: "Dwa głosy na zmianę. Jeden śpiewa frazę, drugi odpowiada.",
    energy: "średnia-wysoka",
    placement: "Chorus, Verse",
    reliability: "średnia",
    example: "(Lead) Can I get a witness?\n(Response) Witness!\n(Lead) Can I get a amen?\n(Response) Amen!"
  },
  {
    id: "building-intensity",
    tag: "[Building Intensity]",
    name: "Narastająca intensywność",
    desc: "Linijka przed refrenem, która narasta w sile i emocji.",
    energy: "rosnąca",
    placement: "Pre-Chorus, Bridge",
    reliability: "średnia",
    example: "(building intensity)\nAnd I can feel it rising\nIt's taking over me"
  },
  {
    id: "duet",
    tag: "[Duet]",
    name: "Duet",
    desc: "Dwóch wokalistów śpiewających naprzemiennie lub razem.",
    energy: "zależy",
    placement: "dowolny",
    reliability: "niska-średnia",
    example: "[Duet]\n(She) You and I\n(He) We'll fly away"
  },
  {
    id: "choir",
    tag: "[Choir]",
    name: "Chór",
    desc: "Pełny chór — wielu śpiewaków. Dla gospel, epickiego popu, muzyki filmowej.",
    energy: "wysoka-bardzo wysoka",
    placement: "Chorus, Outro",
    reliability: "średnia",
    example: "[Choir]\nHALLELUJAH!\nForever and ever"
  }
];

var VOCAL_DIRECTIONS_PL = {
  "whispered": "szeptem",
  "belted": "pełną mocą",
  "spoken word": "mówione",
  "soft": "delikatnie",
  "raspy": "chropowato",
  "falsetto": "falsetem",
  "harmonies": "harmonie",
  "group vocals": "grupowo",
  "female vocal": "żeński wokal",
  "male vocal": "męski wokal",
  "ad-libs": "wstawki",
  "vocal fry": "trzeszcząco",
  "rap": "rap",
  "screamed": "krzykiem",
  "narrative": "narracja",
  "humming": "nucenie",
  "scat": "scat",
  "call and response": "wezwanie i odpowiedź",
  "building intensity": "narastająco",
  "duet": "duet",
  "choir": "chór"
};
