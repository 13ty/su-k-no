var DB_NAME = 'SunoStudioDB';
var DB_VERSION = 1;

var ProjectStore = {
  db: null,
  ready: false,
  _queue: [],

  init: function(callback) {
    var self = this;
    if (typeof Dexie === 'undefined') {
      if (callback) callback(new Error('Dexie.js not loaded'));
      return;
    }
    try {
      this.db = new Dexie(DB_NAME);
      this.db.version(DB_VERSION).stores({
        projects: '++id, &name, updatedAt'
      });
      this.db.open().then(function() {
        self.ready = true;
        self._flush();
        if (callback) callback(null);
      }).catch(function(err) {
        if (callback) callback(err);
      });
    } catch(e) {
      if (callback) callback(e);
    }
  },

  _flush: function() {
    var q;
    while ((q = this._queue.shift())) {
      try { q.fn.apply(this, q.args); } catch(e) {}
    }
  },

  _ensure: function(fn, args) {
    if (this.ready) {
      fn.apply(this, args);
    } else {
      this._queue.push({ fn: fn, args: args });
    }
  },

  list: function(callback) {
    this._ensure(function(cb) {
      this.db.projects.orderBy('updatedAt').reverse().toArray().then(function(list) {
        if (cb) cb(null, list);
      }).catch(function(err) {
        if (cb) cb(err, []);
      });
    }, [callback]);
  },

  save: function(project, callback) {
    this._ensure(function(proj, cb) {
      proj.updatedAt = new Date();
      if (!proj.createdAt) proj.createdAt = new Date();
      this.db.projects.put(proj).then(function(id) {
        if (cb) cb(null, id);
      }).catch(function(err) {
        if (cb) cb(err);
      });
    }, [project, callback]);
  },

  get: function(id, callback) {
    this._ensure(function(i, cb) {
      this.db.projects.get(i).then(function(proj) {
        if (cb) cb(null, proj);
      }).catch(function(err) {
        if (cb) cb(err);
      });
    }, [id, callback]);
  },

  remove: function(id, callback) {
    this._ensure(function(i, cb) {
      this.db.projects.delete(i).then(function() {
        if (cb) cb(null);
      }).catch(function(err) {
        if (cb) cb(err);
      });
    }, [id, callback]);
  },

  gatherState: function() {
    var nameEl = document.getElementById('projectName');
    var editorEl = document.getElementById('editor');
    var styleEl = document.getElementById('stylePrompt');
    return {
      name: nameEl ? nameEl.value : 'Nowy Utwór',
      tags: window.SunoApp && SunoApp.state ? SunoApp.state.selectedTags.slice() : [],
      lyrics: editorEl ? editorEl.value : '',
      stylePrompt: styleEl && !styleEl.classList.contains('placeholder') ? styleEl.textContent : ''
    };
  },

  applyState: function(project) {
    var nameEl = document.getElementById('projectName');
    if (nameEl) nameEl.value = project.name || 'Nowy Utwór';
    if (project.tags && window.SunoApp) {
      SunoApp.state.selectedTags = [];
      if (SunoApp.clearTagBoard) SunoApp.clearTagBoard();
      for (var i = 0; i < project.tags.length; i++) {
        SunoApp.toggleTag(project.tags[i]);
      }
    }
    var editorEl = document.getElementById('editor');
    if (project.lyrics && editorEl) {
      editorEl.value = project.lyrics;
      var evt = new Event('input', { bubbles: true });
      editorEl.dispatchEvent(evt);
    }
    var styleEl = document.getElementById('stylePrompt');
    if (project.stylePrompt && styleEl) {
      styleEl.textContent = project.stylePrompt;
      styleEl.className = 'prompt-text';
    }
  },

  exportJSON: function(project) {
    var data = JSON.stringify(project, null, 2);
    var blob = new Blob([data], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (project.name || 'project').replace(/[^a-z0-9]/gi, '_') + '.suno.json';
    a.click();
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
  },

  importJSON: function(file, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var project = JSON.parse(e.target.result);
        if (project && typeof project === 'object') {
          ProjectStore.save(project, function(err, id) {
            if (callback) callback(err, project);
          });
        } else {
          if (callback) callback(new Error('Nieprawidłowy format pliku'));
        }
      } catch(err) {
        if (callback) callback(err);
      }
    };
    reader.readAsText(file);
  }
};
