var VP_CFG_PREFIX = 'vp_';

var VideoPlanner = {
  state: null,
  _running: false,
  _aborted: false,
  _callbacks: null,
  _iteration: 0,

  /* ── CONFIG ── */
  defaultConfig: {
    useStemSeparation: false,
    enableComfyUI: false,
    maxSceneLength: 5,
    criticIterations: 3,
    estimatedDuration: 180
  },

  loadConfig: function() {
    var cfg = {};
    for (var k in this.defaultConfig) {
      var key = VP_CFG_PREFIX + k;
      try {
        var raw = localStorage.getItem(key);
        if (raw !== null) {
          cfg[k] = JSON.parse(raw);
        } else {
          cfg[k] = this.defaultConfig[k];
        }
      } catch(e) {
        cfg[k] = this.defaultConfig[k];
      }
    }
    return cfg;
  },

  saveConfig: function(cfg) {
    for (var k in this.defaultConfig) {
      if (cfg[k] !== undefined) {
        try { localStorage.setItem(VP_CFG_PREFIX + k, JSON.stringify(cfg[k])); } catch(e) {}
      }
    }
  },

  resetConfig: function() {
    for (var k in this.defaultConfig) {
      try { localStorage.removeItem(VP_CFG_PREFIX + k); } catch(e) {}
    }
  },

  /* ── PIPELINE ── */
  start: function(directorsVision, lyrics, tags, callbacks) {
    if (this._running) return;
    this._running = true;
    this._aborted = false;
    this._callbacks = callbacks || {};
    this._iteration = 0;

    var cfg = this.loadConfig();

    this.state = {
      project_status: 'initialized',
      critic_iterations_used: 0,
      critic_max_iterations: cfg.criticIterations,
      config: {
        max_scene_length_sec: cfg.maxSceneLength,
        estimated_duration_sec: cfg.estimatedDuration,
        user_base_prompt: directorsVision || ''
      },
      audio_analysis: {
        bpm: null,
        stems_detected: [],
        duration_sec: cfg.estimatedDuration,
        key_moments: [],
        energy_curve: []
      },
      emotional_analysis: {
        emotional_arc: [],
        overall_mood: ''
      },
      global_visual_rules: {
        character_reference: '',
        color_palette: [],
        visual_style: '',
        lighting_notes: ''
      },
      timeline_slices: [],
      critic_feedback: [],
      lyrics: lyrics,
      tags: tags || []
    };

    this._emit('status', 'initialized');
    this._runStep(0);
  },

  stop: function() {
    this._aborted = true;
    this._running = false;
    if (this._callbacks.onStatus) {
      this._callbacks.onStatus('aborted', { step: 'aborted' });
    }
  },

  _runStep: function(step) {
    if (this._aborted) return;

    var steps = [
      { name: 'Pre-processing', fn: '_step0_preprocess' },
      { name: 'Analiza Audio', fn: '_step1_analyzeAudio' },
      { name: 'Mapa Emocji', fn: '_step2_analyzeEmotions' },
      { name: 'Koncepcja Wizualna', fn: '_step3_generateConcept' },
      { name: 'Storyline & Time-Slicing', fn: '_step4_createStoryline' },
      { name: 'Krytyk', fn: '_step5_runCritic' },
      { name: 'Gotowe', fn: '_step6_export' }
    ];

    if (step >= steps.length) {
      this._running = false;
      if (this._callbacks.onComplete) this._callbacks.onComplete(this.state);
      return;
    }

    var self = this;
    this._emit('progress', { current: step + 1, total: steps.length, label: steps[step].name });

    if (this._callbacks.onStepStart) this._callbacks.onStepStart(step, steps[step].name);

    try {
      var result = this[steps[step].fn]();
      var nextStep = step + 1;

      // Handle critic loop redirect
      if (step === 5 && result === 'rejected') {
        this.state.project_status = 'critic_loop_in_progress';
        this._emit('status', 'critic_rejected', { iteration: this.state.critic_iterations_used, feedback: this.state.critic_feedback });
        if (this._callbacks.onStepEnd) this._callbacks.onStepEnd(step, 'rejected');
        nextStep = 4; // Go back to storyline
      } else {
        if (this._callbacks.onStepEnd) this._callbacks.onStepEnd(step, 'completed');
      }

      this._emit('state_update', this.state);
      setTimeout(function() { self._runStep(nextStep); }, 50);
    } catch(e) {
      this._running = false;
      this._emit('error', e.message);
      if (this._callbacks.onError) this._callbacks.onError(e);
    }
  },

  _emit: function(type, data, extra) {
    if (this._callbacks && this._callbacks.onEvent) {
      this._callbacks.onEvent(type, data, extra);
    }
  },

  /* ── STEP 0: PRE-PROCESSING ── */
  _step0_preprocess: function() {
    this.state.project_status = 'preprocessing';

    if (!this.state.config.user_base_prompt || !this.state.config.user_base_prompt.trim()) {
      this.state.config.user_base_prompt = this._generateDirectorsVision(
        this.state.lyrics, this.state.tags
      );
    }

    // Estimate duration from lyrics if not set
    if (!this.state.config.estimated_duration_sec || this.state.config.estimated_duration_sec <= 0) {
      var lyricsLen = this.state.lyrics ? this.state.lyrics.length : 0;
      // Very rough: ~100 chars = ~5 sec of singing, plus 60 sec padding
      this.state.config.estimated_duration_sec = Math.max(60, Math.round(lyricsLen / 100 * 5) + 60);
    }
    return 'ok';
  },

  _generateDirectorsVision: function(lyrics, tags) {
    var vision = 'Music video featuring ';

    if (tags && tags.length > 0) {
      // Extract genre and mood from tags
      var genreTags = [];
      var moodTags = [];
      var otherTags = [];
      for (var i = 0; i < tags.length; i++) {
        var tag = (typeof tags[i] === 'string') ? SunoAnalyzer.getTagById(tags[i]) : tags[i];
        if (!tag) continue;
        if (tag.category === 'Genres' || tag.category === 'Subgenres') genreTags.push(tag.name);
        else if (tag.category === 'Moods' || tag.category === 'Atmosphere') moodTags.push(tag.name);
        else otherTags.push(tag.name);
      }

      if (genreTags.length > 0) vision += genreTags.slice(0, 3).join('-') + ' aesthetic';
      if (moodTags.length > 0) vision += ' with ' + moodTags.slice(0, 3).join(', ') + ' atmosphere';
      if (otherTags.length > 0) vision += ', inspired by ' + otherTags.slice(0, 2).join(', ');
    }

    // Extract themes from lyrics
    if (lyrics && lyrics.trim()) {
      var themes = this._extractLyricThemes(lyrics);
      if (themes.length > 0) vision += '. Visual narrative: ' + themes.join(', ');
    }

    return vision || 'Cinematic music video with atmospheric visuals, slow pacing, and emotional storytelling.';
  },

  _extractLyricThemes: function(lyrics) {
    var themes = [];
    var text = lyrics.toLowerCase();

    var themePatterns = [
      { words: ['night','dark','shadow','moon','stars','darkness'], theme: 'nocturnal journey' },
      { words: ['love','heart','kiss','embrace','hold','together'], theme: 'romance and connection' },
      { words: ['rain','storm','wind','thunder','lightning'], theme: 'nature and elements' },
      { words: ['ocean','sea','river','wave','water','deep'], theme: 'water and depth' },
      { words: ['fire','burn','flame','light','glow'], theme: 'fire and light' },
      { words: ['dream','dreaming','sleep','nightmare','vision'], theme: 'dreams and subconscious' },
      { words: ['city','street','urban','lights','neon'], theme: 'urban landscape' },
      { words: ['forest','tree','wood','wild','garden'], theme: 'nature and wilderness' },
      { words: ['war','fight','battle','warrior','strength'], theme: 'conflict and struggle' },
      { words: ['dance','move','rhythm','beat','flow'], theme: 'movement and dance' },
      { words: ['lonely','alone','empty','void','silence'], theme: 'solitude and emptiness' },
      { words: ['hope','rise','shine','new','begin'], theme: 'hope and renewal' },
      { words: ['cold','ice','snow','frost','winter'], theme: 'cold and isolation' },
      { words: ['fly','sky','wing','bird','cloud'], theme: 'flight and freedom' },
      { words: ['memory','remember','past','time','old'], theme: 'memory and time' }
    ];

    for (var i = 0; i < themePatterns.length; i++) {
      var p = themePatterns[i];
      for (var w = 0; w < p.words.length; w++) {
        if (text.indexOf(p.words[w]) >= 0) {
          themes.push(p.theme);
          break;
        }
      }
      if (themes.length >= 3) break;
    }

    return themes;
  },

  /* ── STEP 1: AUDIO ANALYSIS ── */
  _step1_analyzeAudio: function() {
    this.state.project_status = 'audio_analyzed';

    // Estimate BPM from genre tags
    this.state.audio_analysis.bpm = this._estimateBPM(this.state.tags);

    // Detect stems from tag keywords
    var stems = [];
    var tagNames = [];
    var tags = this.state.tags || [];
    for (var i = 0; i < tags.length; i++) {
      var tag = (typeof tags[i] === 'string') ? SunoAnalyzer.getTagById(tags[i]) : tags[i];
      if (tag) tagNames.push(tag.name.toLowerCase());
    }
    var stemMap = {
      'handpan': ['handpan'], 'guitar': ['guitar','acoustic','electric guitar'],
      'strings': ['orchestral','strings','violin','cello'],
      'synth': ['synth','electronic','ambient','pad'],
      'drums': ['percussion','drums','beat','rhythmic','punchy'],
      'bass': ['bass','808','deep'],
      'vocal': ['vocal','voice','choir','falsetto','rap'],
      'piano': ['piano','keys','keyboard'],
      'brass': ['brass','saxophone','trumpet','horn'],
      'flute': ['flute','wind','woodwind']
    };
    for (var s in stemMap) {
      for (var k = 0; k < stemMap[s].length; k++) {
        if (tagNames.indexOf(stemMap[s][k]) >= 0) {
          stems.push(s);
          break;
        }
      }
    }
    if (stems.length === 0) stems = ['synth', 'drums', 'vocal'];
    this.state.audio_analysis.stems_detected = stems;

    // Key moments based on lyrics structure
    this.state.audio_analysis.key_moments = this._detectKeyMoments(
      this.state.lyrics, this.state.audio_analysis.bpm,
      this.state.config.estimated_duration_sec
    );

    // Energy curve
    this.state.audio_analysis.energy_curve = this._buildEnergyCurve(
      this.state.lyrics, this.state.tags
    );

    return 'ok';
  },

  _estimateBPM: function(tags) {
    var bpmMap = {
      'ambient': 70, 'lo-fi': 80, 'drone': 60, 'chill': 75,
      'classical': 90, 'folk': 100, 'jazz': 110, 'soul': 85,
      'pop': 120, 'r&b': 90, 'funk': 110, 'disco': 120,
      'rock': 130, 'punk': 180, 'metal': 160, 'grunge': 110,
      'hip-hop': 95, 'trap': 140, 'drill': 140,
      'house': 128, 'techno': 135, 'trance': 140, 'dubstep': 140,
      'dnb': 170, 'drum-and-bass': 170, 'breakcore': 180,
      'reggae': 80, 'latin': 110, 'country': 100, 'blues': 80
    };
    for (var i = 0; i < tags.length; i++) {
      var tag = (typeof tags[i] === 'string') ? SunoAnalyzer.getTagById(tags[i]) : tags[i];
      if (tag && bpmMap[tag.id]) return bpmMap[tag.id];
      if (tag && bpmMap[tag.name && tag.name.toLowerCase()]) return bpmMap[tag.name.toLowerCase()];
    }
    return 120;
  },

  _detectKeyMoments: function(lyrics, bpm, durationSec) {
    var moments = [];
    if (!lyrics || !lyrics.trim()) return moments;

    var sections = lyrics.match(/(\[(Intro|Verse\s*\d*|Pre-Chorus|Chorus|Bridge|Solo|Build|Drop|Break|Outro|Interlude|Climax|Refrain|Hook|End|Big\s+Finish|Post-Chorus|Pre-Drop|Coda|Vamp|Transition)\])/gi) || [];
    if (sections.length === 0) return moments;

    var totalSections = sections.length;
    var sectionDuration = durationSec / totalSections;

    for (var i = 0; i < sections.length; i++) {
      var section = sections[i].replace(/[\[\]]/g, '').toLowerCase();
      var startSec = Math.round(i * sectionDuration);
      var endSec = Math.round((i + 1) * sectionDuration);
      var energy = 'medium';
      if (['chorus', 'drop', 'climax', 'hook', 'big finish', 'solo'].indexOf(section) >= 0) energy = 'high';
      if (['intro', 'break', 'interlude', 'outro'].indexOf(section) >= 0) energy = 'low';

      moments.push({
        section: section,
        start_sec: startSec,
        end_sec: endSec,
        energy: energy,
        label: '[' + sections[i] + ']'
      });
    }

    return moments;
  },

  _buildEnergyCurve: function(lyrics, tags) {
    var curve = [];
    var moments = this.state.audio_analysis.key_moments;
    if (moments.length === 0) {
      // Flat default curve
      for (var i = 0; i < 10; i++) {
        curve.push({ t: (i / 10) * this.state.config.estimated_duration_sec, value: 50 });
      }
      return curve;
    }

    for (var i = 0; i < moments.length; i++) {
      var val = 50;
      if (moments[i].energy === 'high') val = 85;
      if (moments[i].energy === 'low') val = 25;
      curve.push({ t: moments[i].start_sec, value: val });
    }
    return curve;
  },

  /* ── STEP 2: EMOTIONAL ANALYSIS ── */
  _step2_analyzeEmotions: function() {
    this.state.project_status = 'emotion_mapped';

    var lyrics = this.state.lyrics || '';
    var text = lyrics.toLowerCase();
    var sections = this.state.audio_analysis.key_moments;

    // Emotional arc across sections
    var emotionalMap = {
      'intro': 'mysterious', 'verse': 'narrative', 'pre-chorus': 'anticipation',
      'chorus': 'euphoric', 'bridge': 'reflective', 'solo': 'expressive',
      'build': 'tense', 'drop': 'explosive', 'break': 'calm',
      'breakdown': 'vulnerable', 'outro': 'resolving', 'interlude': 'dreamy',
      'climax': 'triumphant', 'hook': 'catchy', 'end': 'peaceful',
      'refrain': 'nostalgic', 'post-chorus': 'sustained', 'pre-drop': 'anticipation',
      'big finish': 'grand', 'coda': 'conclusive', 'transition': 'flowing'
    };

    // Detect overall mood from lyrics + tags
    var mood = this._detectOverallMood(text, this.state.tags);

    this.state.emotional_analysis.overall_mood = mood;

    if (sections.length > 0) {
      for (var i = 0; i < sections.length; i++) {
        var sec = sections[i].section;
        this.state.emotional_analysis.emotional_arc.push({
          section: sec,
          emotion: emotionalMap[sec] || 'neutral',
          intensity: sections[i].energy === 'high' ? 0.8 : sections[i].energy === 'low' ? 0.3 : 0.5
        });
      }
    } else {
      // Default arc: build-up → peak → resolution
      this.state.emotional_analysis.emotional_arc = [
        { section: 'intro', emotion: 'calm', intensity: 0.2 },
        { section: 'development', emotion: 'building', intensity: 0.5 },
        { section: 'climax', emotion: 'powerful', intensity: 0.9 },
        { section: 'resolution', emotion: 'peaceful', intensity: 0.3 }
      ];
    }

    return 'ok';
  },

  _detectOverallMood: function(text, tags) {
    var moodScores = { dark: 0, joyful: 0, melancholic: 0, energetic: 0, calm: 0, mysterious: 0 };

    var moodKeywords = {
      dark: ['dark', 'night', 'shadow', 'void', 'black', 'gloomy', 'ciemny', 'mrok', 'cień'],
      joyful: ['joy', 'happy', 'sun', 'bright', 'smile', 'love', 'light', 'szczęście', 'radość'],
      melancholic: ['sad', 'tear', 'lonely', 'miss', 'gone', 'farewell', 'smutek', 'tęsknota'],
      energetic: ['fire', 'burn', 'power', 'strong', 'rise', 'fight', 'energy', 'moc', 'ogień'],
      calm: ['calm', 'peace', 'quiet', 'gentle', 'soft', 'flow', 'spokój', 'cisza'],
      mysterious: ['mystery', 'secret', 'unknown', 'dream', 'fog', 'enigma', 'tajemnica']
    };

    for (var word in moodKeywords) {
      var words = moodKeywords[word];
      for (var i = 0; i < words.length; i++) {
        if (text.indexOf(words[i]) >= 0) {
          moodScores[word]++;
        }
      }
    }

    // Tag-based mood hints
    var tagIds = [];
    for (var i = 0; i < tags.length; i++) {
      var t = (typeof tags[i] === 'string') ? tags[i] : tags[i].id;
      tagIds.push(t);
    }
    var tagMoodMap = {
      'dark': ['dark', 'mysterious'], 'ambient': ['calm', 'mysterious'],
      'aggressive': ['dark', 'energetic'], 'melancholic': ['melancholic'],
      'ethereal': ['mysterious', 'calm'], 'upbeat': ['joyful', 'energetic'],
      'sad': ['melancholic'], 'happy': ['joyful'],
      'dreamy': ['mysterious', 'calm'], 'powerful': ['energetic']
    };
    for (var i = 0; i < tagIds.length; i++) {
      if (tagMoodMap[tagIds[i]]) {
        for (var m = 0; m < tagMoodMap[tagIds[i]].length; m++) {
          moodScores[tagMoodMap[tagIds[i]][m]] += 2;
        }
      }
    }

    // Find dominant mood
    var topMood = 'calm';
    var topScore = 0;
    for (var mood in moodScores) {
      if (moodScores[mood] > topScore) {
        topScore = moodScores[mood];
        topMood = mood;
      }
    }

    var moodLabels = {
      dark: 'Mroczny i nastrojowy', joyful: 'Radosny i optymistyczny',
      melancholic: 'Melancholijny i refleksyjny', energetic: 'Energetyczny i dynamiczny',
      calm: 'Spokojny i kojący', mysterious: 'Tajemniczy i hipnotyzujący'
    };

    return moodLabels[topMood] || 'Neutralny';
  },

  /* ── STEP 3: VISUAL CONCEPT ── */
  _step3_generateConcept: function() {
    this.state.project_status = 'concept_ready';

    var vision = this.state.config.user_base_prompt || '';
    var mood = this.state.emotional_analysis.overall_mood || '';
    var tags = this.state.tags || [];

    // Character reference from vision
    this.state.global_visual_rules.character_reference = this._generateCharacterRef(vision, mood, tags);

    // Color palette
    this.state.global_visual_rules.color_palette = this._generateColorPalette(vision, mood, tags);

    // Visual style
    this.state.global_visual_rules.visual_style = this._generateVisualStyle(mood, vision, tags);

    // Lighting notes
    this.state.global_visual_rules.lighting_notes = this._generateLightingNotes(mood, vision);

    return 'ok';
  },

  _generateCharacterRef: function(vision, mood, tags) {
    if (vision && vision.length > 5) {
      // Try to extract character reference from vision
      if (vision.match(/(character|person|woman|man|figure|hero|girl|boy|soul|spirit)/i)) {
        return vision;
      }
    }

    var refs = {
      'Mroczny': 'Enigmatic figure draped in shadow, flowing dark fabrics, partially obscured face.',
      'Radosny': 'Energetic dancer in colorful flowing clothes, expressive movements, bright smile.',
      'Melancholijny': 'Solitary figure in muted tones, contemplative pose, wind-swept hair.',
      'Energetyczny': 'Dynamic performer with sharp movements, edgy style, intense gaze.',
      'Spokojny': 'Serene figure in flowing natural fabrics, peaceful expression, graceful movements.',
      'Tajemniczy': 'Ethereal presence with shimmering outlines, fluid movements between light and shadow.'
    };

    for (var m in refs) {
      if (mood.indexOf(m) >= 0) return refs[m];
    }
    return 'Abstract visual narrative without specific character, focusing on atmospheric shapes and light.';
  },

  _generateColorPalette: function(vision, mood, tags) {
    var palettes = {
      'Mroczny': ['#0a0a12', '#1a1a2e', '#2d2d44', '#16213e', '#4a4a6a'],
      'Radosny': ['#ffd700', '#ff6b6b', '#ffa502', '#fff3e0', '#ff9ff3'],
      'Melancholijny': ['#e0e5e5', '#a3b1b6', '#4a5d6b', '#2c3e50', '#bdc3c7'],
      'Energetyczny': ['#ff4757', '#ff6348', '#ffa502', '#2ed573', '#1e90ff'],
      'Spokojny': ['#c8d6e5', '#55efc4', '#81ecec', '#dfe6e9', '#b2bec3'],
      'Tajemniczy': ['#2d3436', '#6c5ce7', '#a29bfe', '#fd79a8', '#636e72']
    };

    for (var m in palettes) {
      if (mood.indexOf(m) >= 0) return palettes[m];
    }
    return ['#1a1a2e', '#16213e', '#0f3460', '#e94560', '#533483'];
  },

  _generateVisualStyle: function(mood, vision, tags) {
    var tagIds = [];
    for (var i = 0; i < (this.state.tags || []).length; i++) {
      var t = (typeof this.state.tags[i] === 'string') ? this.state.tags[i] : this.state.tags[i].id;
      tagIds.push(t);
    }

    var styleMap = {
      'ambient': 'Atmospheric, soft focus, slow motion, volumetric lighting, floating particles',
      'dark': 'High contrast, low key lighting, deep shadows, dramatic chiaroscuro',
      'ethereal': 'Dreamy haze, lens flare, soft glow, translucent overlays, double exposure',
      'cinematic': 'Anamorphic, shallow depth of field, tracking shots, film grain, 24fps',
      'vintage': 'Warm color grade, film grain, light leaks, vignette, 16mm aesthetic',
      'neon': 'Neon lighting, cyberpunk, reflections on wet surfaces, chromatic aberration',
      'nature': 'Natural lighting, earth tones, organic textures, wide angle landscapes',
      'abstract': 'Geometric shapes, color fields, liquid light shows, kaleidoscopic patterns'
    };

    var styles = [];
    for (var s in styleMap) {
      if (tagIds.indexOf(s) >= 0) styles.push(styleMap[s]);
    }

    return styles.length > 0 ? styles.join('; ') : 'Cinematic, photorealistic, carefully composed frames with atmospheric depth.';
  },

  _generateLightingNotes: function(mood, vision) {
    var lighting = {
      'Mroczny': 'Low-key lighting with strong directional sources, rim light on subject, deep shadows, moonlight or single practical source.',
      'Radosny': 'Bright, high-key natural lighting, golden hour warmth, soft diffused fill, lens flares.',
      'Melancholijny': 'Soft diffused overcast lighting, cool color temperature, hazy atmosphere, window light.',
      'Energetyczny': 'High contrast dynamic lighting, colored gels, strobe effects, hard shadows from multiple sources.',
      'Spokojny': 'Soft natural lighting, dawn/magic hour, gentle gradients, cloud-diffused sunlight.',
      'Tajemniczy': 'Volumetric lighting through fog/smoke, underwater light caustics, bioluminescent sources, practical neon.'
    };

    for (var m in lighting) {
      if (mood.indexOf(m) >= 0) return lighting[m];
    }
    return 'Mixed lighting with emphasis on mood and atmosphere, combining natural and artificial sources.';
  },

  /* ── STEP 4: STORYLINE & TIME-SLICING ── */
  _step4_createStoryline: function() {
    this.state.project_status = 'storyline_cut';

    var maxLen = this.state.config.max_scene_length_sec;
    var duration = this.state.config.estimated_duration_sec;
    var moments = this.state.audio_analysis.key_moments;
    var mood = this.state.emotional_analysis.overall_mood || '';
    var visualStyle = this.state.global_visual_rules.visual_style || '';
    var characterRef = this.state.global_visual_rules.character_reference || '';
    var palette = this.state.global_visual_rules.color_palette || [];
    var lighting = this.state.global_visual_rules.lighting_notes || '';

    var slices = [];

    if (moments.length > 0) {
      for (var i = 0; i < moments.length; i++) {
        var m = moments[i];
        var sliceDuration = Math.min(m.end_sec - m.start_sec, maxLen);
        var subSlices = Math.ceil((m.end_sec - m.start_sec) / maxLen);

        for (var s = 0; s < subSlices; s++) {
          var sliceStart = m.start_sec + s * maxLen;
          var sliceEnd = Math.min(sliceStart + maxLen, m.end_sec);
          if (sliceEnd - sliceStart < 2) continue; // Skip <2s slices

          slices.push(this._generateSlice(
            slices.length + 1, sliceStart, sliceEnd, m, i, subSlices, s,
            mood, visualStyle, characterRef, palette, lighting
          ));
        }
      }
    } else {
      // No structure detected — create even slices
      var numSlices = Math.max(3, Math.floor(duration / maxLen));
      for (var i = 0; i < numSlices; i++) {
        var start = i * maxLen;
        var end = Math.min(start + maxLen, duration);
        slices.push(this._generateSlice(
          i + 1, start, end, null, i, numSlices, i,
          mood, visualStyle, characterRef, palette, lighting
        ));
      }
    }

    this.state.timeline_slices = slices;
    return 'ok';
  },

  _generateSlice: function(id, startSec, endSec, moment, momentIdx, totalSub, subIdx,
                            mood, visualStyle, characterRef, palette, lighting) {
    var fmt = function(s) {
      var m = Math.floor(s / 60);
      var sec = s % 60;
      return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
    };

    var timestamp = fmt(startSec) + ' - ' + fmt(endSec);
    var sectionName = moment ? moment.label : 'Scene';
    var energyDesc = moment ? (moment.energy === 'high' ? 'intense' : moment.energy === 'low' ? 'calm' : 'building') : 'neutral';

    // Audio cue
    var stems = this.state.audio_analysis.stems_detected || [];
    var audioCue = this._generateAudioCue(sectionName, energyDesc, stems, subIdx, totalSub);

    // Action description
    var action = this._generateAction(sectionName, energyDesc, mood, characterRef, subIdx, totalSub, momentIdx);

    // Image keyframe prompt
    var imagePrompt = this._generateImagePrompt(timestamp, sectionName, energyDesc, mood, visualStyle, characterRef, palette, lighting, subIdx, totalSub);

    // Video motion prompt
    var videoPrompt = this._generateVideoPrompt(energyDesc, mood, subIdx, totalSub);

    return {
      slice_id: id,
      timestamp: timestamp,
      section: sectionName,
      energy: energyDesc,
      audio_cue: audioCue,
      action: action,
      prompts: {
        image_keyframe: imagePrompt,
        video_motion: videoPrompt
      }
    };
  },

  _generateAudioCue: function(section, energy, stems, subIdx, totalSub) {
    var stemText = stems.length > 0 ? stems.join(', ') : 'instrumental layers';
    var cues = {
      'high': ['Powerful ' + stemText + ' section, full arrangement, driving rhythm'],
      'low': ['Gentle ' + stemText + ' textures, sparse arrangement, atmospheric pads'],
      'building': ['Layered ' + stemText + ' building tension, rhythmic elements gradually intensifying'],
      'neutral': [stemText + ' section with balanced energy, steady groove']
    };
    var c = cues[energy] || cues['neutral'];
    if (totalSub > 1) {
      return c[0] + ' (part ' + (subIdx + 1) + ' of ' + totalSub + ')';
    }
    return c[0];
  },

  _generateAction: function(section, energy, mood, characterRef, subIdx, totalSub, momentIdx) {
    var actions = [];
    var useCharacter = characterRef && characterRef.length > 10 && !characterRef.match(/abstract/i);

    var sceneType = energy === 'high' ? 'dynamic' : energy === 'low' ? 'calm' : 'narrative';
    var actionTemplates = {
      'dynamic': useCharacter ?
        'Character moves through the frame with increasing intensity, dramatic gestures echoing the music\'s energy' :
        'Dynamic camera movement through abstract shapes and light, intensity building with the rhythm',
      'calm': useCharacter ?
        'Character in contemplative stillness, subtle micro-movements (breathing, gentle sway), atmospheric immersion' :
        'Slow drift through atmospheric space, light particles floating, sense of vast emptiness',
      'narrative': useCharacter ?
        'Character performs narrative action, intentional movement expressing the story of this section' :
        'Visual storytelling through symbolic imagery, objects and environments conveying narrative'
    };

    actions.push(actionTemplates[sceneType] || actionTemplates.narrative);

    var sectionActions = {
      'intro': 'Opening shot establishes the visual world, slow reveal of the environment.',
      'chorus': 'Energy peaks — wider framing, more movement, character fully engaged.',
      'bridge': 'Shift in perspective — intimate framing, change in lighting or color tone.',
      'outro': 'Gradual resolution — movement slows, frame widens or narrows toward conclusion.',
      'drop': 'Explosive release — fast cuts or sudden camera movement matching the beat.',
      'build': 'Tension builds — slow zoom or push-in, elements adding with each bar.'
    };
    var secClean = section.replace(/[\[\]]/g, '').toLowerCase();
    if (sectionActions[secClean]) {
      actions.push(sectionActions[secClean]);
    }

    if (totalSub > 1 && subIdx === 0) {
      actions.push('Establishes the scene.');
    } else if (totalSub > 1 && subIdx === totalSub - 1) {
      actions.push('Transitions to next scene.');
    }

    return actions.join(' ');
  },

  _generateImagePrompt: function(timestamp, section, energy, mood, style, character, palette, lighting, subIdx, totalSub) {
    var fmtPalette = palette.length > 0 ? palette.join(', ') : 'muted cool tones';
    var energyDesc = energy === 'high' ? 'dynamic' : energy === 'low' ? 'peaceful' : 'atmospheric';

    var prompt = 'Cinematic ' + energyDesc + ' frame, ';

    if (character && !character.match(/abstract/i)) {
      var charShort = character.split('.')[0].substring(0, 100);
      prompt += charShort + ', ';
    }

    prompt += style.substring(0, 80) + ', ';
    prompt += 'Color palette: ' + fmtPalette.substring(0, 60) + '. ';
    prompt += lighting.substring(0, 80) + ' ';
    prompt += 'Photorealistic, highly detailed, 8k, cinematic lighting --ar 16:9';

    return prompt;
  },

  _generateVideoPrompt: function(energy, mood, subIdx, totalSub) {
    var motions = {
      'high': [
        'Dynamic camera movement, fast push-in with slight Dutch angle, dramatic parallax, 24fps',
        'Rapid dolly zoom effect, whip pan, intense motion blur on movement, cinematic shake'
      ],
      'low': [
        'Slow drone push-in, gentle float, subtle parallax, smooth 24fps motion',
        'Ethereal slow-motion drift, soft focus pull, barely perceptible camera sway'
      ],
      'building': [
        'Gradual camera push-in accelerating, slight orbit around subject, rising tension',
        'Slow forward tracking shot with increasing speed, subtle tilt-up revealing scale'
      ],
      'neutral': [
        'Smooth gimbal tracking shot, gentle pan, depth-layered parallax, cinematic flow',
        'Steady medium tracking, slow reveal, naturalistic camera movement'
      ]
    };

    var pool = motions[energy] || motions['neutral'];
    return pool[subIdx % pool.length];
  },

  /* ── STEP 5: CRITIC (LLM-as-a-Judge) ── */
  _step5_runCritic: function() {
    this.state.project_status = 'critic_loop_in_progress';
    this._iteration++;
    this.state.critic_iterations_used = this._iteration;

    var slices = this.state.timeline_slices;
    var feedback = [];

    // 1. Character consistency
    var charIssues = this._checkCharacterConsistency(slices);
    for (var i = 0; i < charIssues.length; i++) feedback.push(charIssues[i]);

    // 2. Lighting continuity
    var lightIssues = this._checkLightingContinuity(slices);
    for (var i = 0; i < lightIssues.length; i++) feedback.push(lightIssues[i]);

    // 3. Color palette consistency
    var colorIssues = this._checkColorConsistency(slices);
    for (var i = 0; i < colorIssues.length; i++) feedback.push(colorIssues[i]);

    // 4. Camera motion realism
    var motionIssues = this._checkMotionRealism(slices);
    for (var i = 0; i < motionIssues.length; i++) feedback.push(motionIssues[i]);

    // 5. Temporal flow
    var flowIssues = this._checkTemporalFlow(slices);
    for (var i = 0; i < flowIssues.length; i++) feedback.push(flowIssues[i]);

    // 6. Style consistency
    var styleIssues = this._checkStyleConsistency(slices);
    for (var i = 0; i < styleIssues.length; i++) feedback.push(styleIssues[i]);

    this.state.critic_feedback = feedback;

    var maxIter = this.state.critic_max_iterations || 3;
    if (feedback.length > 0 && this._iteration < maxIter) {
      // Try to fix issues by regenerating affected slices
      this._applyCriticFixes(feedback);
      return 'rejected';
    }

    this.state.project_status = 'critic_loop_completed';
    return 'accepted';
  },

  _checkCharacterConsistency: function(slices) {
    var issues = [];
    var descriptions = [];
    for (var i = 0; i < slices.length; i++) {
      var action = slices[i].action || '';
      descriptions.push(action);
    }

    var hasCharacter = false;
    var charReferences = [];
    for (var i = 0; i < descriptions.length; i++) {
      if (descriptions[i].match(/(character|woman|man|figure|hero|she|he|her|his)/i)) {
        hasCharacter = true;
        charReferences.push(i);
      }
    }

    if (!hasCharacter && this.state.global_visual_rules.character_reference &&
        !this.state.global_visual_rules.character_reference.match(/abstract/i)) {
      // All slices lacking character reference
    }

    if (charReferences.length === 0 && descriptions.length > 0 &&
        !this.state.global_visual_rules.character_reference.match(/abstract/i)) {
      issues.push({
        type: 'character',
        severity: 'info',
        message: 'No character appears in any scene description — abstract or environmental approach assumed.',
        affected_slices: []
      });
    }

    return issues;
  },

  _checkLightingContinuity: function(slices) {
    var issues = [];
    var lightingClues = [];
    for (var i = 0; i < slices.length; i++) {
      var img = slices[i].prompts.image_keyframe || '';
      var clues = [];
      if (img.match(/(dark|shadow|night|low.key)/i)) clues.push('low-key');
      if (img.match(/(bright|sunny|golden.hour|high.key)/i)) clues.push('high-key');
      if (img.match(/(neon|color.light|gel)/i)) clues.push('colored');
      lightingClues.push(clues);
    }

    // Check for abrupt lighting shifts
    for (var i = 1; i < lightingClues.length; i++) {
      var prev = lightingClues[i - 1];
      var curr = lightingClues[i];
      if (prev.length > 0 && curr.length > 0) {
        var mismatch = false;
        for (var p = 0; p < prev.length; p++) {
          if (curr.indexOf(prev[p]) < 0) mismatch = true;
        }
        if (mismatch) {
          issues.push({
            type: 'lighting',
            severity: 'warning',
            message: 'Abrupt lighting change between slices ' + i + ' and ' + (i + 1) + ' — consider gradual transition.',
            affected_slices: [i - 1, i]
          });
        }
      }
    }

    return issues;
  },

  _checkColorConsistency: function(slices) {
    var issues = [];
    var paletteRef = this.state.global_visual_rules.color_palette || [];

    if (paletteRef.length > 0) {
      var hexPattern = /#[0-9a-f]{6}/gi;
      for (var i = 0; i < slices.length; i++) {
        var prompts = (slices[i].prompts.image_keyframe || '') + ' ' + (slices[i].action || '');
        var foundColors = prompts.match(hexPattern);
        if (foundColors && foundColors.length > 0) {
          for (var c = 0; c < foundColors.length; c++) {
            if (paletteRef.indexOf(foundColors[c].toLowerCase()) < 0) {
              issues.push({
                type: 'color',
                severity: 'info',
                message: 'Color ' + foundColors[c] + ' in slice ' + (i + 1) + ' not in global palette.',
                affected_slices: [i]
              });
            }
          }
        }
      }
    }

    return issues;
  },

  _checkMotionRealism: function(slices) {
    var issues = [];
    var unrealisticPatterns = [
      { pattern: /impossible/i, label: 'impossible motion' },
      { pattern: /360.*(flip|roll)/i, label: '360° flip/roll'},
      { pattern: /instant.*cut/i, label: 'instant cut, no transition' }
    ];

    for (var i = 0; i < slices.length; i++) {
      var motion = slices[i].prompts.video_motion || '';
      for (var p = 0; p < unrealisticPatterns.length; p++) {
        if (unrealisticPatterns[p].pattern.test(motion)) {
          issues.push({
            type: 'motion',
            severity: 'warning',
            label: unrealisticPatterns[p].label,
            message: 'Unrealistic camera motion in slice ' + (i + 1) + ': "' + unrealisticPatterns[p].label + '"',
            affected_slices: [i]
          });
        }
      }
    }

    return issues;
  },

  _checkTemporalFlow: function(slices) {
    var issues = [];
    for (var i = 1; i < slices.length; i++) {
      var prevAction = slices[i - 1].action || '';
      var currAction = slices[i].action || '';
      var prevSection = slices[i - 1].section || '';
      var currSection = slices[i].section || '';

      // Check for same-named adjacent slices with identical actions
      if (prevSection === currSection && prevAction === currAction && prevAction.length > 10) {
        issues.push({
          type: 'temporal',
          severity: 'warning',
          message: 'Slices ' + i + ' and ' + (i + 1) + ' (' + prevSection + ') have identical actions — add variation.',
          affected_slices: [i - 1, i]
        });
      }
    }

    return issues;
  },

  _checkStyleConsistency: function(slices) {
    var issues = [];
    var stylesFound = [];

    for (var i = 0; i < slices.length; i++) {
      var img = slices[i].prompts.image_keyframe || '';
      if (img.match(/anime|cartoon|illustration|3d render|pixel/i)) stylesFound.push('non-photorealistic');
      else if (img.match(/photorealistic|cinematic|realistic/i)) stylesFound.push('photorealistic');
    }

    if (stylesFound.length > 1 && new Set(stylesFound).size > 1) {
      issues.push({
        type: 'style',
        severity: 'error',
        message: 'Inconsistent visual style across slices — mixing photorealistic with ' + stylesFound.filter(function(s){return s !== 'photorealistic';}).join(', '),
        affected_slices: []
      });
    }

    return issues;
  },

  _applyCriticFixes: function(feedback) {
    var affectedMap = {};
    for (var i = 0; i < feedback.length; i++) {
      var slices = feedback[i].affected_slices || [];
      for (var s = 0; s < slices.length; s++) {
        affectedMap[slices[s]] = (affectedMap[slices[s]] || 0) + 1;
      }
    }

    var affectedIndices = Object.keys(affectedMap).map(Number).sort(function(a,b){return a-b;});
    var duration = this.state.config.estimated_duration_sec;
    var maxLen = this.state.config.max_scene_length_sec;
    var mood = this.state.emotional_analysis.overall_mood || '';
    var visualStyle = this.state.global_visual_rules.visual_style || '';
    var characterRef = this.state.global_visual_rules.character_reference || '';
    var palette = this.state.global_visual_rules.color_palette || [];
    var lighting = this.state.global_visual_rules.lighting_notes || '';

    // Regenerate affected slices with variations
    for (var i = 0; i < affectedIndices.length; i++) {
      var idx = affectedIndices[i];
      if (idx < this.state.timeline_slices.length) {
        var original = this.state.timeline_slices[idx];
        // Swap motion variant to fix repetitive issues
        var existingMotion = original.prompts.video_motion;
        var motions = {
          'high': ['Dynamic handheld camera, intense push-in, dramatic parallax layers, 24fps'],
          'low': ['Ethereal slow-motion float, gentle orbit around subject, atmospheric drift'],
          'building': ['Slow tracking shot with gradual speed increase, rising tension in frame'],
          'neutral': ['Smooth gimbal tracking, balanced parallax, cinematic steady movement']
        };
        var energy = original.energy || 'neutral';
        var pool = motions[energy] || motions['neutral'];
        var variant = pool[0];
        if (variant === existingMotion) variant = pool[0];
        original.prompts.video_motion = variant + ' (revised)';
        original.action = original.action + ' [adjusted for continuity]';
      }
    }
  },

  /* ── STEP 6: EXPORT ── */
  _step6_export: function() {
    this.state.project_status = 'ready_for_export';
    return 'ok';
  },

  generateMarkdown: function() {
    var s = this.state;
    if (!s || s.project_status !== 'ready_for_export') return null;

    var md = '# Music Video Storyboard\n\n';
    md += '## Director\'s Vision\n';
    md += '> ' + (s.config.user_base_prompt || 'Auto-generated from lyrics') + '\n\n';

    md += '## Audio Analysis\n';
    md += '- **BPM:** ' + (s.audio_analysis.bpm || '—') + '\n';
    md += '- **Duration:** ' + s.config.estimated_duration_sec + 's\n';
    md += '- **Stems:** ' + (s.audio_analysis.stems_detected || []).join(', ') + '\n';
    md += '- **Overall Mood:** ' + s.emotional_analysis.overall_mood + '\n\n';

    md += '## Global Visual Rules\n';
    md += '### Character Reference\n' + (s.global_visual_rules.character_reference || '—') + '\n\n';
    md += '### Color Palette\n';
    for (var c = 0; c < (s.global_visual_rules.color_palette || []).length; c++) {
      md += '- ' + s.global_visual_rules.color_palette[c] + '\n';
    }
    md += '\n### Visual Style\n' + (s.global_visual_rules.visual_style || '—') + '\n\n';
    md += '### Lighting\n' + (s.global_visual_rules.lighting_notes || '—') + '\n\n';

    md += '## Timeline\n\n';
    for (var i = 0; i < (s.timeline_slices || []).length; i++) {
      var slice = s.timeline_slices[i];
      md += '### Scene ' + slice.slice_id + ': ' + slice.timestamp + '\n';
      md += '- **Section:** ' + (slice.section || '—') + '\n';
      md += '- **Energy:** ' + (slice.energy || '—') + '\n';
      md += '- **Audio:** ' + (slice.audio_cue || '—') + '\n';
      md += '- **Action:** ' + (slice.action || '—') + '\n\n';
      md += '#### Image Keyframe\n```\n' + (slice.prompts.image_keyframe || '—') + '\n```\n\n';
      md += '#### Video Motion\n```\n' + (slice.prompts.video_motion || '—') + '\n```\n\n';
      md += '---\n\n';
    }

    md += '## Critic Feedback\n';
    if (s.critic_feedback && s.critic_feedback.length > 0) {
      for (var f = 0; f < s.critic_feedback.length; f++) {
        md += '- [' + s.critic_feedback[f].severity + '] ' + s.critic_feedback[f].message + '\n';
      }
    } else {
      md += '- No issues found.\n';
    }
    md += '\n*Iterations used: ' + s.critic_iterations_used + '/' + s.critic_max_iterations + '*\n';

    return md;
  },

  generateComfyUI: function() {
    if (!this.state || this.state.project_status !== 'ready_for_export') return null;
    var slices = this.state.timeline_slices || [];
    var nodes = [];
    var edges = [];
    var nodeId = 1;

    for (var i = 0; i < slices.length; i++) {
      var slice = slices[i];
      nodes.push({
        id: nodeId,
        type: 'TextEncode',
        title: 'Scene ' + slice.slice_id + ' Image',
        inputs: { text: slice.prompts.image_keyframe },
        position: [100, i * 200]
      });
      nodeId++;
      nodes.push({
        id: nodeId,
        type: 'TextEncode',
        title: 'Scene ' + slice.slice_id + ' Motion',
        inputs: { text: slice.prompts.video_motion },
        position: [400, i * 200]
      });
      edges.push({ from: nodeId - 1, to: nodeId, label: 'scene_' + slice.slice_id });
      nodeId++;
    }

    return JSON.stringify({ nodes: nodes, edges: edges, metadata: { generator: 'Suno Video Planner v1', exported: new Date().toISOString() } }, null, 2);
  }
};
