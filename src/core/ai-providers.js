var AI_CONFIG_KEY = 'suno_ai_provider_config';

var AI_DEFAULT_CONFIG = {
  provider: 'lm-studio',
  endpoint: 'http://localhost:1234/v1',
  model: 'llama-3.2-3b-instruct',
  apiKey: ''
};

var AIConfig = {
  load: function() {
    try {
      var raw = localStorage.getItem(AI_CONFIG_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        for (var k in AI_DEFAULT_CONFIG) {
          if (parsed[k] === undefined) parsed[k] = AI_DEFAULT_CONFIG[k];
        }
        return parsed;
      }
    } catch(e) {}
    return JSON.parse(JSON.stringify(AI_DEFAULT_CONFIG));
  },

  save: function(cfg) {
    try {
      localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(cfg));
      return true;
    } catch(e) {
      return false;
    }
  },

  reset: function() {
    try {
      localStorage.removeItem(AI_CONFIG_KEY);
    } catch(e) {}
  },

  getEndpoint: function() {
    var cfg = this.load();
    return cfg.endpoint.replace(/\/+$/, '');
  },

  getHeaders: function() {
    var cfg = this.load();
    var headers = { 'Content-Type': 'application/json' };
    if (cfg.apiKey) {
      headers['Authorization'] = 'Bearer ' + cfg.apiKey;
    }
    return headers;
  }
};

var AI_PROVIDER_INFO = {
  'lm-studio':  { name: 'LM Studio',  endpointLabel: 'http://localhost:1234/v1', needsKey: false, chatSuffix: '/chat/completions' },
  'openai':     { name: 'OpenAI',     endpointLabel: 'https://api.openai.com/v1', needsKey: true,  chatSuffix: '/chat/completions' },
  'anthropic':  { name: 'Anthropic',  endpointLabel: 'https://api.anthropic.com/v1', needsKey: true, chatSuffix: '/messages' },
  'custom-oa':  { name: 'Custom (OpenAI)', endpointLabel: 'https://your-server.com/v1', needsKey: false, chatSuffix: '/chat/completions' }
};

var AI_SYSTEM_PROMPTS = {
  optimizeRhythm: {
    role: 'system',
    content: 'Jesteś profesjonalnym autorem tekstów piosenek i producentem muzycznym AI. Twoim zadaniem jest optymalizacja tekstu piosenki pod kątem rytmu i frazowania dla generatora muzyki Suno AI.\n\nZasady:\n1. Podziel tekst na naturalne frazy muzyczne — każda linijka = jedna myśl.\n2. Dodaj przecinki dla mikro-pauz (oddech) w środku fraz.\n3. Użyj WIELKICH LITER dla kluczowych słów/emocji (max 1-2 na sekcję).\n4. Zachowaj oryginalne tagi struktury [Verse], [Chorus] itd. — NIE zmieniaj ich.\n5. Zachowaj liczbę linijek i ogólną strukturę.\n6. Odpowiedz TYLKO zoptymalizowanym tekstem, bez komentarzy.\n7. Zachowaj oryginalny język tekstu (np. polski).'
  },
  generateAdlibs: {
    role: 'system',
    content: 'Jesteś producentem muzycznym specjalizującym się w wokalnych aranżacjach. Twoim zadaniem jest dodanie chórków, ad-libów i harmonii do tekstu piosenki dla generatora Suno AI.\n\nZasady:\n1. Dodaj w nawiasach okrągłych (ad-liby) w tle — np. (yeah), (ooo), (w tle: ooo).\n2. Dodaj w nawiasach okrągłych (harmonized) przed fragmentami, które mają być śpiewane harmonią.\n3. Dodaj w nawiasach okrągłych (echo) po kluczowych słowach.\n4. Zachowaj oryginalne tagi struktury [Verse], [Chorus] itd.\n5. NIE zmieniaj głównego tekstu — tylko dodaj ad-liby w nawiasach.\n6. Odpowiedz TYLKO wzbogaconym tekstem, bez komentarzy.\n7. Zachowaj oryginalny język tekstu.'
  },
  adaptVocabulary: {
    role: 'system',
    content: 'Jesteś autorem tekstów i kreatywnym copywriterem. Twoim zadaniem jest dostosowanie słownictwa i metafor w tekście piosenki do określonego klimatu.\n\nZasady:\n1. Zachowaj strukturę i tagi [Verse], [Chorus] itd. — NIE zmieniaj ich.\n2. Zachowaj liczbę sylab w linijkach (dla dopasowania melodycznego).\n3. Zmień metafory, przymiotniki i słownictwo zgodnie z wybranym klimatem.\n4. Dla mrocznego/agresywnego: używaj metafor burzy, ognia, cienia, walki.\n5. Dla jasnego/popowego: używaj metafor światła, miłości, nadziei, tańca.\n6. Odpowiedz TYLKO zmienionym tekstem, bez komentarzy.\n7. Zachowaj oryginalny język tekstu.'
  },
  tagIntent: {
    role: 'system',
    content: 'Jesteś ekspertem tagów Suno AI i producentem muzycznym. Na podstawie opisu nastroju, gatunku i klimatu, dobierz optymalny zestaw tagów z dostępnej biblioteki.\n\nZasady:\n1. Zwróć JASON: { "tags": ["id1","id2",...], "stylePrompt": "krótki opis stylu do promptu", "reasoning": "dlaczego te tagi" }\n2. Wybierz max 8 tagów, priorytetowo trafne gatunkowo.\n3. Unikaj tagów konfliktujących (np. nie łącz female-vocal z male-vocal).\n4. Jeśli opis zawiera język polski, dopasuj tagi do polskich słów kluczowych.\n5. Odpowiedz TYLKO JASONem, bez komentarzy.'
  }
};

var AI_PROMPTS_USER = {
  optimizeRhythm: 'Zoptymalizuj rytm i frazowanie poniższego tekstu piosenki pod Suno AI. Dodaj przecinki dla pauz, WIELKIE LITERY dla akcentów, podziel na naturalne frazy. Zachowaj wszystkie tagi struktury.',
  generateAdlibs: 'Wzbogać poniższy tekst piosenki o chórki, ad-liby w nawiasach i harmonie. Dodaj (yeah), (ooo), (echo), (harmonized) w odpowiednich miejscach.',
  adaptVocabulary: 'Zmień słownictwo i metafory w poniższym tekście, aby pasowały do [KLIMAT]. Dostosuj język, zachowując strukturę i rytm.',
  tagIntent: 'Dobierz tagi Suno AI na podstawie opisu: [OPIS].\n\nDostępne kategorie tagów:\n- Gatunek: [GATUNEK]\n- Nastrój: [NASTROJ]\n- Wokal: [WOKAL]\n- Instrumenty/brzmienie: [INSTRUMENTY]\n- Produkcja: [PRODUKCJA]\n\nZwracaj tylko JASON.'
};

var AI_STREAM_TIMEOUT = 60000;

var AIProvider = {
  _activeController: null,

  abort: function() {
    if (this._activeController) {
      this._activeController.abort();
      this._activeController = null;
    }
  },

  send: function(messages, onChunk, onDone, onError) {
    this.abort();

    var cfg = AIConfig.load();
    var provider = cfg.provider;
    var info = AI_PROVIDER_INFO[provider];
    if (!info) {
      if (onError) onError(new Error('Nieznany provider: ' + provider));
      return;
    }

    var baseUrl = cfg.endpoint.replace(/\/+$/, '');
    var url = baseUrl + info.chatSuffix;
    var controller = new AbortController();
    this._activeController = controller;
    var self = this;

    var body, headers = { 'Content-Type': 'application/json' };
    if (cfg.apiKey) {
      headers['Authorization'] = 'Bearer ' + cfg.apiKey;
    }

    if (provider === 'anthropic') {
      var systemMsg = null;
      var chatMessages = [];
      for (var i = 0; i < messages.length; i++) {
        if (messages[i].role === 'system') {
          systemMsg = messages[i].content;
        } else {
          chatMessages.push({
            role: messages[i].role,
            content: messages[i].content
          });
        }
      }
      body = JSON.stringify({
        model: cfg.model || 'claude-3-haiku-20240307',
        max_tokens: 2048,
        system: systemMsg,
        messages: chatMessages,
        stream: true
      });
    } else {
      body = JSON.stringify({
        model: cfg.model,
        messages: messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2048
      });
    }

    var timeoutId = setTimeout(function() {
      controller.abort();
      if (onError) onError(new Error('Timeout - serwer nie odpowiedział w ciagu ' + (AI_STREAM_TIMEOUT/1000) + 's'));
      self._activeController = null;
    }, AI_STREAM_TIMEOUT);

    fetch(url, {
      method: 'POST',
      headers: headers,
      body: body,
      signal: controller.signal
    }).then(function(response) {
      clearTimeout(timeoutId);
      if (!response.ok) {
        return response.text().then(function(errText) {
          var msg = 'HTTP ' + response.status;
          try {
            var errJson = JSON.parse(errText);
            if (errJson.error && errJson.error.message) msg += ': ' + errJson.error.message;
            else if (errJson.error && typeof errJson.error === 'string') msg += ': ' + errJson.error;
          } catch(e) { if (errText) msg += ': ' + errText.substring(0, 200); }
          throw new Error(msg);
        });
      }
      return response.body.getReader();
    }).then(function(reader) {
      var decoder = new TextDecoder();
      var buffer = '';
      var fullText = '';

      function read() {
        reader.read().then(function(result) {
          if (result.done) {
            self._activeController = null;
            if (onDone) onDone(fullText);
            return;
          }

          buffer += decoder.decode(result.value, { stream: true });
          var lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line || line === 'data: [DONE]') continue;
            if (line.indexOf('data: ') === 0) {
              line = line.substring(6);
            }
            try {
              var json = JSON.parse(line);
              var content = null;

              if (provider === 'anthropic') {
                if (json.type === 'content_block_delta' && json.delta && json.delta.text) {
                  content = json.delta.text;
                }
              } else {
                if (json.choices && json.choices[0]) {
                  var delta = json.choices[0].delta;
                  if (delta && delta.content) {
                    content = delta.content;
                  }
                }
              }

              if (content) {
                fullText += content;
                if (onChunk) onChunk(content, fullText);
              }
            } catch(e) {
              // Skip non-JSON SSE lines
            }
          }
          read();
        }).catch(function(err) {
          if (err.name === 'AbortError') {
            self._activeController = null;
            if (onDone) onDone(fullText);
            return;
          }
          self._activeController = null;
          if (onError) onError(err);
        });
      }
      read();
    }).catch(function(err) {
      clearTimeout(timeoutId);
      self._activeController = null;
      if (err.name === 'AbortError') return;
      if (onError) onError(err);
    });
  }
};
