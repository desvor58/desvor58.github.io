/* ============================================================
   micro — landing page behaviour
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------
     1. Theme
     --------------------------------------------------------- */
  var root = document.documentElement;
  var toggle = $('#theme-toggle');

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.dataset.theme === 'light' ? 'dark' : 'light';
      root.dataset.theme = next;
      try { localStorage.setItem('micro-theme', next); } catch (e) {}
    });
  }

  /* ---------------------------------------------------------
     2. Syntax highlighting
     --------------------------------------------------------- */
  var KW = {
    micro: ['fun', 'tramp', 'set', 'call', 'ret', 'goto', 'if', 'else', 'while', 'start', 'end'],
    c:     ['int', 'char', 'void', 'return', 'if', 'else', 'while', 'for', 'const', 'static',
             'unsigned', 'signed', 'long', 'short', 'float', 'double', 'struct', 'typedef',
             'size_t', 'break', 'continue', 'sizeof', 'enum'],
    asm:   ['mov', 'lea', 'add', 'sub', 'imul', 'idiv', 'div', 'mul', 'cmp', 'test', 'jmp',
             'je', 'jne', 'jg', 'jl', 'jge', 'jle', 'ja', 'jb', 'call', 'ret', 'push', 'pop',
             'inc', 'dec', 'and', 'or', 'xor', 'shl', 'shr', 'neg', 'not', 'leave', 'nop',
             'prelude', 'epilogue']
  };
  var TYPES = {
    micro: ['i8', 'u8', 'i16', 'u16', 'i32', 'u32', 'f32', 'ptr'],
    c:     ['int8_t', 'uint8_t', 'int16_t', 'uint16_t', 'int32_t', 'uint32_t', 'size_t', 'float']
  };
  var REGS = ['eax', 'ebx', 'ecx', 'edx', 'esi', 'edi', 'esp', 'ebp', 'ax', 'bx', 'cx', 'dx', 'al'];
  var ASM_MNEMONIC = /^(mov|lea|add|sub|imul|idiv|div|mul|cmp|test|jmp|je|jne|jg|jl|jge|jle|ja|jb|call|ret|push|pop|inc|dec|and|or|xor|shl|shr|neg|not|leave|prelude|epilogue)[A-Za-z0-9]*$/;

  var RULES = {
    micro: {
      re: /(\\[\s\S]*?\\)|("(?:[^"\\]|\\.)*")|(-?\b\d+(?:\.\d+)?)|([A-Za-z_][A-Za-z0-9_]*)|(\S)/g,
      render: function (m, src) {
        if (m[1]) return '<span class="t-com">' + esc(m[1]) + '</span>';
        if (m[2]) return '<span class="t-str">' + esc(m[2]) + '</span>';
        if (m[3]) return '<span class="t-num">' + esc(m[3]) + '</span>';
        if (m[4]) {
          var w = m[4];
          if (src.charAt(m.index + w.length) === ':') return '<span class="t-lbl">' + esc(w) + '</span>';
          if (KW.micro.indexOf(w) >= 0) return '<span class="t-kw">' + esc(w) + '</span>';
          if (TYPES.micro.indexOf(w) >= 0) return '<span class="t-type">' + esc(w) + '</span>';
          return esc(w);
        }
        return '<span class="t-op">' + esc(m[5]) + '</span>';
      }
    },
    c: {
      re: /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?[uf]?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\S)/g,
      render: function (m, src) {
        if (m[1]) return '<span class="t-com">' + esc(m[1]) + '</span>';
        if (m[2]) return '<span class="t-str">' + esc(m[2]) + '</span>';
        if (m[3]) return '<span class="t-num">' + esc(m[3]) + '</span>';
        if (m[4]) {
          var w = m[4];
          if (KW.c.indexOf(w) >= 0) return '<span class="t-kw">' + esc(w) + '</span>';
          if (TYPES.c.indexOf(w) >= 0) return '<span class="t-type">' + esc(w) + '</span>';
          if (/^\s*\(/.test(src.slice(m.index + w.length))) return '<span class="t-fn">' + esc(w) + '</span>';
          return esc(w);
        }
        return '<span class="t-op">' + esc(m[5]) + '</span>';
      }
    },
    asm: {
      re: /(#[^\n]*)|("(?:[^"\\]|\\.)*")|(-?\b\d+(?:\.\d+)?)|([A-Za-z_][A-Za-z0-9_.]*)|(\S)/g,
      render: function (m, src) {
        if (m[1]) return '<span class="t-cmt">' + esc(m[1]) + '</span>';
        if (m[2]) return '<span class="t-str">' + esc(m[2]) + '</span>';
        if (m[3]) return '<span class="t-num">' + esc(m[3]) + '</span>';
        if (m[4]) {
          var w = m[4];
          if (src.charAt(m.index + w.length) === ':') return '<span class="t-lbl">' + esc(w) + '</span>';
          if (REGS.indexOf(w) >= 0) return '<span class="t-reg">' + esc(w) + '</span>';
          if (ASM_MNEMONIC.test(w)) return '<span class="t-kw">' + esc(w) + '</span>';
          return esc(w);
        }
        return '<span class="t-op">' + esc(m[5]) + '</span>';
      }
    },
    bash: {
      re: /(#[^\n]*)|("[^"]*")|(https?:\/\/\S+)|(-{1,2}[\w-]+)|((?:[.\/~][\w.\/~-]*)?[A-Za-z_][\w.\/-]*)|(.)/gm,
      render: function (m) {
        if (m[1]) return '<span class="t-cmt">' + esc(m[1]) + '</span>';
        if (m[2]) return '<span class="t-str">' + esc(m[2]) + '</span>';
        if (m[3]) return '<span class="t-url">' + esc(m[3]) + '</span>';
        if (m[4]) return '<span class="t-flag">' + esc(m[4]) + '</span>';
        if (m[5]) {
          var w = m[5];
          if (/^(git|cd|make|mkdir|cp|rm|python3?|gcc|clang|sh|bash|echo|cat|ls|microc)$/.test(w) || /^[.\/~]/.test(w))
            return '<span class="t-cmd">' + esc(w) + '</span>';
          return esc(w);
        }
        return m[6] === ' ' ? ' ' : esc(m[6]);
      }
    }
  };

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlight() {
    $$('code[data-lang]').forEach(function (code) {
      var rule = RULES[code.dataset.lang];
      if (!rule || code.dataset.done) return;
      var src = code.textContent;
      var re = new RegExp(rule.re.source, rule.re.flags);
      var out = '', last = 0, m;
      while ((m = re.exec(src)) !== null) {
        if (m[0] === '') { re.lastIndex++; continue; }
        out += esc(src.slice(last, m.index));
        out += rule.render(m, src);
        last = m.index + m[0].length;
      }
      out += esc(src.slice(last));
      code.innerHTML = out;
      code.dataset.done = '1';
    });
  }
  highlight();

  /* ---------------------------------------------------------
     3. Reveal on scroll
     --------------------------------------------------------- */
  var revealTargets = $$('.sec-head, .cards, .card, .notation, .compare, .compare-cap, .tabs, ' +
                         '.pipeline, .pipe-detail, .split, .folds, .fineprint, .bench, .bench-note, ' +
                         '.status-col, .start-grid, .docs-row')
    .filter(function (el) { return !el.closest('[hidden]'); });

  if (revealTargets.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      revealTargets.forEach(function (el) { el.classList.add('reveal', 'is-in'); });
    } else {
      revealTargets.forEach(function (el) { el.classList.add('reveal'); });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var sibs = Array.prototype.slice.call(entry.target.parentNode.children)
            .filter(function (el) { return el.classList.contains('reveal'); });
          var delay = Math.min(sibs.indexOf(entry.target), 5) * 55;
          setTimeout(function () { entry.target.classList.add('is-in'); }, delay);
          io.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -70px 0px', threshold: 0.01 });
      revealTargets.forEach(function (el) { io.observe(el); });

      // failsafe: whatever is already on screen when the page settles is shown,
      // whether the observer got there first or not
      window.addEventListener('load', function () {
        setTimeout(function () {
          revealTargets.forEach(function (el) {
            if (el.classList.contains('is-in')) return;
            if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-in');
          });
        }, 350);
      });
    }
  }

  /* ---------------------------------------------------------
     4. Sticky nav shadow + scroll spy
     --------------------------------------------------------- */
  var nav = $('#nav');
  var sections = ['language', 'pipeline', 'codegen', 'bench', 'status']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var navLinks = $$('.nav-links a');

  function onScroll() {
    if (nav) nav.classList.toggle('is-stuck', window.scrollY > 8);

    var y = window.scrollY + Math.round(window.innerHeight * 0.3), current = null;
    sections.forEach(function (s) { if (s.offsetTop <= y) current = s.id; });
    navLinks.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + current);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     5. Tabs
     --------------------------------------------------------- */
  $$('[data-tabs]').forEach(function (root) {
    var tabs = $$('.tab', root);
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });

    function select(i) {
      tabs.forEach(function (t, j) {
        var on = i === j;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (panels[j]) panels[j].hidden = !on;
      });
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i); });
      tab.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = (i + d + tabs.length) % tabs.length;
        select(n);
        tabs[n].focus();
      });
    });
  });

  /* ---------------------------------------------------------
     6. Pipeline
     --------------------------------------------------------- */
  var TRACKS = {
    compiler: [
      { n: 'Source text',      d: 'A <code>.micro</code> file, read as bytes. Nothing is interpreted, nothing is expanded.' },
      { n: 'Lexer',            d: 'Comments, literals, names and operators become tokens. Each one keeps its line and column.' },
      { n: 'Tokens',           d: '<code>mc_token_t</code>: a type, a value in a fixed size buffer, and the position it started at.' },
      { n: 'Instruction generator', d: 'The token list becomes one instruction per <code>fun</code>, <code>set</code>, <code>call</code>, <code>ret</code>, <code>goto</code>, <code>if</code> and label — with lifetime hints attached.' },
      { n: 'Instruction infos',d: 'A plain struct. This is the seam: a host program can build the same list by hand and skip everything above.' },
      { n: 'IR optimizer',     d: 'One pass today: inlining of small calls, priced into 64 buckets and taken cheapest first. Off by default, <code>-Oi</code> turns it on.', opt: true },
      { n: 'Code generator',   d: 'Lowers instructions to 32-bit x86. Six machine registers are allocatable, <code>esp</code> and <code>ebp</code> are reserved for the frame.' },
      { n: 'Asm instructions', d: 'The <code>lea</code> code selection pass and a peephole run over this list before anything is encoded.' },
      { n: 'Assembler',        d: 'Encodes each instruction and resolves the labels. The result has no header and no section table.' },
      { n: 'Raw binary',       d: 'Bytes you can copy into executable memory and call. That is exactly what the examples do.' }
    ],
    library: [
      { n: 'Instruction infos',d: 'Build them with the <code>micro_instr_gen_*</code> functions, or by hand. No lexer required — the compiler itself is a client of this API.' },
      { n: 'IR optimizer',     d: 'Optional. <code>micro_iropter_init</code>, the pass, then <code>micro_iropter_deinit</code> after the code generator is done with the list.', opt: true },
      { n: 'Code generator',   d: '<code>micro_codegen386_init</code> plus <code>emit</code>. The trampoline map goes in here.', entry: true },
      { n: 'Asm instructions', d: 'Everything the lowering produced, before encoding: peephole, then emit.', },
      { n: 'Assembler',        d: '<code>micro_asm386_emit</code> encodes and resolves labels into an output buffer.', },
      { n: 'Raw binary',       d: 'The arena has to outlive the assembler, because label names live in it until the labels are resolved.' }
    ]
  };

  var pipeline = $('#pipe-stages');
  var detail = $('#pipe-detail');
  var currentTrack = 'compiler';

  function renderTrack(name) {
    var stages = TRACKS[name];
    pipeline.innerHTML = '';
    pipeline.dataset.cols = stages.length % 5 === 0 ? '5' : '3';
    stages.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pnode' + (s.opt ? ' is-optional' : '') + (s.entry ? ' is-entry' : '');
      b.innerHTML =
        '<span class="pnode-step">' + String(i + 1).padStart(2, '0') + (s.entry ? ' · API' : '') + '</span>' +
        '<span class="pnode-name">' + s.n + '</span>';
      b.addEventListener('click', function () { select(i, true); });
      b.addEventListener('mouseenter', function () { select(i, false); });
      pipeline.appendChild(b);
    });
    select(0, false);
  }

  function select(i, focus) {
    var nodes = $$('.pnode', pipeline);
    nodes.forEach(function (n, j) { n.classList.toggle('is-on', j === i); });
    if (focus && nodes[i]) nodes[i].focus();
    var s = TRACKS[currentTrack][i];
    detail.innerHTML =
      '<h4><span>' + String(i + 1).padStart(2, '0') + '</span>' + s.n + '</h4><p>' + s.d + '</p>';
  }

  if (pipeline) {
    renderTrack('compiler');
    $$('[data-track]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('[data-track]').forEach(function (b) { b.classList.remove('is-on'); });
        btn.classList.add('is-on');
        currentTrack = btn.dataset.track;
        renderTrack(currentTrack);
      });
    });
  }

  /* ---------------------------------------------------------
     7. Benchmarks
     --------------------------------------------------------- */
  var BENCH = {
    compile: {
      unit: 'µs',
      note: 'From IR or source to finished machine code. <b>micro is about 68× faster than the LLVM MCJIT path and 22× faster than MIR</b> — a straight pipeline with no tree to allocate is the whole reason.',
      rows: [
        { name: 'micro',    note: 'public IR API → i386',        v: 11.7,  c: 'var(--c-micro)' },
        { name: 'MIR',      note: 'API, optimisation level 2',   v: 255.4, c: 'var(--c-mir)' },
        { name: 'LLVM',     note: 'MCJIT, default',              v: 795.7, c: 'var(--c-llvm)' }
      ]
    },
    ready: {
      unit: 'µs',
      note: 'Time until a callable native function exists. For micro that includes allocating executable memory and copying the bytes in, so micro pays a cost the other two never see.',
      rows: [
        { name: 'micro',    note: 'code gen + mmap + copy',      v: 21.0,  c: 'var(--c-micro)' },
        { name: 'MIR',      note: 'API, optimisation level 2',   v: 246.1, c: 'var(--c-mir)' },
        { name: 'LLVM',     note: 'MCJIT, default',              v: 698.8, c: 'var(--c-llvm)' }
      ]
    },
    steady: {
      unit: 'µs',
      note: 'Warmed calls through a function pointer. micro is a <b>32-bit</b> backend measured against 64-bit peers, so this is the one number where the ISA mismatch shows up plainly: the generated code is fine, the ISA is not.',
      rows: [
        { name: 'micro',    note: 'x86-32',                      v: 0.9, c: 'var(--c-micro)' },
        { name: 'MIR',      note: 'API, optimisation level 2',   v: 0.1, c: 'var(--c-mir)' },
        { name: 'LLVM',     note: 'MCJIT, default',              v: 0.7, c: 'var(--c-llvm)' }
      ]
    }
  };

  var bench = $('#bench-chart');
  var benchNote = $('#bench-note');

  function fmt(v) { return v < 1000 ? v.toFixed(1) : Math.round(v).toLocaleString('en-US'); }

  function renderBench(key) {
    var data = BENCH[key];
    if (!bench) return;
    var max = Math.max.apply(null, data.rows.map(function (r) { return r.v; }));
    bench.innerHTML = data.rows.map(function (r) {
      return '<div class="bench-row">' +
        '<div class="bench-top">' +
          '<span class="bench-name"><span class="bench-swatch" style="background:' + r.c + '"></span>' +
            r.name + '<span style="color:var(--fg-3);font-size:.8rem">' + r.note + '</span></span>' +
          '<span class="bench-val">' + fmt(r.v) + ' ' + data.unit + '</span>' +
        '</div>' +
        '<div class="bench-track"><div class="bench-fill" style="background:' + r.c + '"></div></div>' +
      '</div>';
    }).join('');

    if (benchNote) benchNote.innerHTML = data.note;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        $$('.bench-fill', bench).forEach(function (f, i) {
          var w = Math.max(1.5, (data.rows[i].v / max) * 100);
          f.style.width = w + '%';
        });
      });
    });
  }

  if (bench) {
    renderBench('compile');
    $$('#bench-seg [data-metric]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('#bench-seg [data-metric]').forEach(function (b) { b.classList.remove('is-on'); });
        btn.classList.add('is-on');
        renderBench(btn.dataset.metric);
      });
    });
  }

  /* ---------------------------------------------------------
     8. Copy buttons
     --------------------------------------------------------- */
  $$('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var pre = btn.closest('.term').querySelector('pre');
      if (!pre) return;
      var text = pre.innerText.replace(/\u00a0/g, ' ').replace(/[ \t]+$/gm, '');
      var done = function () {
        var old = btn.textContent;
        btn.textContent = 'Copied';
        btn.classList.add('is-done');
        setTimeout(function () { btn.textContent = old; btn.classList.remove('is-done'); }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallback(text, done); });
      } else {
        fallback(text, done);
      }
    });
  });

  function fallback(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    document.body.removeChild(ta);
  }
})();