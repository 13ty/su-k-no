var SunoTarotParticle = (function () {
  "use strict";

  var VERSION = "1.0.0";
  var _cid = 0;

  function _sampleColor(el) {
    var s = window.getComputedStyle(el),
      c = s.backgroundColor;
    if (!c || c === "transparent" || c.indexOf("rgba(0,0,0,0)") > -1)
      c = s.borderColor;
    if (!c || c === "transparent" || c.indexOf("rgba(0,0,0,0)") > -1)
      c = s.color;
    return c || "#FFD700";
  }

  function _rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function _mkP(x, y, color, size, life) {
    var a = Math.random() * Math.PI * 2,
      s = _rand(60, 120);
    return {
      x: x,
      y: y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      size: size || _rand(2, 6),
      color: color,
      opacity: 1,
      rotation: Math.random() * 360,
      rotSpeed: _rand(-3, 3),
      phase: "exploding",
      phaseProgress: 0,
      life: 0,
      maxLife: life || 1200,
      swayOffset: Math.random() * Math.PI * 2,
      alive: true,
      element: null,
      effectId: null,
    };
  }

  function _ctrl(self, eid) {
    var killed = false;
    return {
      destroy: function () {
        if (killed) return;
        killed = true;
        for (var i = self._particles.length - 1; i >= 0; i--) {
          if (self._particles[i].effectId === eid) {
            if (
              self._particles[i].element &&
              self._particles[i].element.parentNode
            )
              self._particles[i].element.parentNode.removeChild(
                self._particles[i].element,
              );
            self._particles.splice(i, 1);
          }
        }
        delete self._remain[eid];
        delete self._callbacks[eid];
      },
      stop: function () {
        if (killed) return;
        killed = true;
        delete self._remain[eid];
        delete self._callbacks[eid];
      },
    };
  }

  function ParticleEngine(options) {
    options = options || {};
    this._particles = [];
    this._animId = null;
    this._canvas = null;
    this._ctx = null;
    this._mode = options.mode || "auto";
    this._remain = {};
    this._callbacks = {};
  }

  ParticleEngine.prototype._cssEl = function (p) {
    var el = document.createElement("div");
    el.className = "tarot-particle tarot-particle--exploding";
    el.style.position = "fixed";
    el.style.width = p.size + "px";
    el.style.height = p.size + "px";
    el.style.background = p.color;
    el.style.borderRadius = "50%";
    el.style.pointerEvents = "none";
    el.style.zIndex = "9999";
    el.style.willChange = "transform, opacity";
    el.style.boxShadow = "0 0 " + p.size / 2 + "px " + p.color;
    el.style.left = p.x + "px";
    el.style.top = p.y + "px";
    el.style.opacity = "1";
    document.body.appendChild(el);
    return el;
  };

  ParticleEngine.prototype._applyCSS = function (p) {
    var el = p.element;
    if (!el) return;
    el.style.left = p.x + "px";
    el.style.top = p.y + "px";
    el.style.opacity = p.opacity;
    el.style.transform = "rotate(" + p.rotation + "deg)";
    var cls = "tarot-particle tarot-particle--" + p.phase;
    if (el.className !== cls) el.className = cls;
  };

  ParticleEngine.prototype._ensureCanvas = function () {
    if (this._canvas) return;
    this._canvas = document.createElement("canvas");
    this._canvas.style.cssText =
      "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999";
    this._canvas.width = window.innerWidth * window.devicePixelRatio;
    this._canvas.height = window.innerHeight * window.devicePixelRatio;
    document.body.appendChild(this._canvas);
    this._ctx = this._canvas.getContext("2d");
    var self = this;
    window.addEventListener("resize", function () {
      self._canvas.width = window.innerWidth * window.devicePixelRatio;
      self._canvas.height = window.innerHeight * window.devicePixelRatio;
    });
  };

  ParticleEngine.prototype._drawCanvas = function (p) {
    var ctx = this._ctx;
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = p.size * 2;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  };

  ParticleEngine.prototype._tick = function (p, dt) {
    p.life += dt;
    if (p.life >= p.maxLife) {
      p.alive = false;
      return;
    }
    var el = p.life;
    if (el < 200) {
      p.phase = "exploding";
      p.phaseProgress = el / 200;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.x += (p.vx * dt) / 1000;
      p.y += (p.vy * dt) / 1000;
    } else if (el < 800) {
      p.phase = "floating";
      p.phaseProgress = (el - 200) / 600;
      p.vy -= (1.5 * dt) / 16;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.x += (p.vx * dt) / 1000 + Math.sin(p.life * 0.005 + p.swayOffset) * 0.5;
      p.y += (p.vy * dt) / 1000 - 0.5;
    } else {
      p.phase = "fading";
      p.phaseProgress = (el - 800) / 400;
      p.vy += (0.3 * dt) / 16;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.x += (p.vx * dt) / 1000;
      p.y += (p.vy * dt) / 1000;
      p.opacity = Math.max(0, 1 - p.phaseProgress);
    }
    p.rotation += (p.rotSpeed * dt) / 16;
  };

  ParticleEngine.prototype._loop = function () {
    this._animId = requestAnimationFrame(this._loop.bind(this));
    var dt = 16,
      hasCanvas = false;

    for (var i = 0; i < this._particles.length; i++) {
      if (!this._particles[i].element) {
        hasCanvas = true;
        break;
      }
    }

    if (hasCanvas && this._ctx)
      this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    for (var j = this._particles.length - 1; j >= 0; j--) {
      var p = this._particles[j];
      this._tick(p, dt);
      if (!p.alive) {
        if (p.element && p.element.parentNode)
          p.element.parentNode.removeChild(p.element);
        var eid = p.effectId;
        this._particles.splice(j, 1);
        if (eid !== null && this._remain[eid] !== undefined) {
          this._remain[eid]--;
          if (this._remain[eid] <= 0 && this._callbacks[eid]) {
            this._callbacks[eid]();
            delete this._callbacks[eid];
            delete this._remain[eid];
          }
        }
        continue;
      }
      if (p.element) this._applyCSS(p);
      else if (hasCanvas) this._drawCanvas(p);
    }

    if (this._particles.length === 0) {
      if (this._animId) {
        cancelAnimationFrame(this._animId);
        this._animId = null;
      }
      if (hasCanvas && this._ctx)
        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }
  };

  ParticleEngine.prototype._start = function () {
    if (!this._animId)
      this._animId = requestAnimationFrame(this._loop.bind(this));
  };

  ParticleEngine.prototype.createDissolveEffect = function (element, options) {
    options = options || {};
    var rect = element.getBoundingClientRect();
    var cx = rect.left + rect.width / 2,
      cy = rect.top + rect.height / 2;
    var count = options.particleCount || _rand(30, 50);
    var color = options.color || _sampleColor(element);
    var useCanvas = this._mode === "canvas" || count > 50;
    var eid = ++_cid;
    var n = Math.min(Math.max(Math.round(count), 10), 80);

    this._remain[eid] = n;
    for (var i = 0; i < n; i++) {
      var p = _mkP(cx, cy, color, null, options.duration);
      p.effectId = eid;
      if (!useCanvas) p.element = this._cssEl(p);
      this._particles.push(p);
    }
    if (useCanvas) this._ensureCanvas();
    this._start();
    if (options.callback) this._callbacks[eid] = options.callback;

    element.style.opacity = "0";
    element.style.transition = "opacity 0.3s ease";
    return _ctrl(this, eid);
  };

  ParticleEngine.prototype.createAssembleEffect = function (
    container,
    targetElement,
    options,
  ) {
    options = options || {};
    var count = options.particleCount || 30;
    var color = options.color || "#FFD700";
    var useCanvas = this._mode === "canvas" || count > 50;
    var eid = ++_cid;
    var n = Math.min(Math.max(Math.round(count), 10), 80);
    targetElement.style.display = "block";
    targetElement.style.opacity = "0";
    var cRect = container.getBoundingClientRect();
    var tRect = targetElement.getBoundingClientRect();
    var tx = tRect.left + tRect.width / 2,
      ty = tRect.top + tRect.height / 2;

    this._remain[eid] = n;
    for (var i = 0; i < n; i++) {
      var edge = Math.floor(Math.random() * 4);
      var x, y;
      if (edge === 0) {
        x = cRect.left;
        y = cRect.top + Math.random() * cRect.height;
      } else if (edge === 1) {
        x = cRect.right;
        y = cRect.top + Math.random() * cRect.height;
      } else if (edge === 2) {
        x = cRect.left + Math.random() * cRect.width;
        y = cRect.top;
      } else {
        x = cRect.left + Math.random() * cRect.width;
        y = cRect.bottom;
      }

      var p = _mkP(x, y, color, _rand(2, 5), options.duration);
      p.effectId = eid;
      var dx = tx - x,
        dy = ty - y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var speed =
        (dist / ((options.duration || 1200) / 1000)) * _rand(0.8, 1.2);
      p.vx = (dx / dist) * speed;
      p.vy = (dy / dist) * speed;
      if (!useCanvas) p.element = this._cssEl(p);
      this._particles.push(p);
    }
    if (useCanvas) this._ensureCanvas();
    this._start();
    this._callbacks[eid] = function () {
      targetElement.style.opacity = "1";
      targetElement.style.transition = "opacity 0.3s ease";
      if (options.callback) options.callback();
    };
    return _ctrl(this, eid);
  };

  ParticleEngine.prototype.createStaggeredWave = function (elements, options) {
    options = options || {};
    var stagger = options.staggerDelay || 200,
      self = this;
    var total = elements.length,
      done = 0;
    return new Promise(function (resolve) {
      if (total === 0) {
        resolve();
        return;
      }
      for (var i = 0; i < total; i++) {
        (function (idx) {
          setTimeout(function () {
            self.createDissolveEffect(elements[idx], {
              particleCount: options.particleCount,
              duration: options.duration,
              color: options.color,
              callback: function () {
                done++;
                if (done >= total) resolve();
              },
            });
          }, idx * stagger);
        })(i);
      }
    });
  };

  ParticleEngine.prototype.destroy = function () {
    if (this._animId) {
      cancelAnimationFrame(this._animId);
      this._animId = null;
    }
    for (var i = 0; i < this._particles.length; i++) {
      var p = this._particles[i];
      if (p.element && p.element.parentNode)
        p.element.parentNode.removeChild(p.element);
    }
    this._particles = [];
    this._remain = {};
    this._callbacks = {};
    if (this._canvas && this._canvas.parentNode) {
      this._canvas.parentNode.removeChild(this._canvas);
      this._canvas = null;
      this._ctx = null;
    }
  };

  ParticleEngine.prototype.stop = function () {
    if (this._animId) {
      cancelAnimationFrame(this._animId);
      this._animId = null;
    }
  };

  return { ParticleEngine: ParticleEngine, VERSION: VERSION };
})();
