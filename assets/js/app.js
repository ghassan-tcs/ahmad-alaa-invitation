/* ============================================================
   دعوة عقد قران — أحمد وآلاء
   بلا قاعدة بيانات وبلا بناء: JSON ثابت + query string.
   الرابط الشخصي:  index.html?g=<id>
   وللاسم المباشر: index.html?name=<الاسم>
   ============================================================ */

(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  /* الاسم قد يصل من المستخدم — يُكتب دائماً كنصّ لا كـHTML. */
  var setText = function (id, value) {
    var el = $(id);
    if (el) { el.textContent = value == null ? '' : String(value); }
  };

  var params = new URLSearchParams(window.location.search);

  var showHint = function (html) {
    var hint = $('hint');
    if (!hint) { return; }
    hint.innerHTML = html;
    hint.hidden = false;
  };

  var loadJson = function (path) {
    return fetch(path, { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) { throw new Error(path + ' → ' + res.status); }
      return res.json();
    });
  };

  /* ---------- اسم الضيف ---------- */

  function composeGuest(guest) {
    return [guest.prefix, guest.name, guest.suffix]
      .map(function (part) { return (part || '').trim(); })
      .filter(Boolean)
      .join(' ');
  }

  function resolveGuest(guestsFile, fallback) {
    // ‏?name= يفوز: يسمح بدعوة عاجلة لاسم ليس في الملف.
    var direct = (params.get('name') || '').trim();
    if (direct) { return direct; }

    var id = (params.get('g') || params.get('guest') || '').trim();
    if (!id) { return fallback; }

    var list = (guestsFile && guestsFile['الضيوف']) || [];
    var match = list.find(function (guest) {
      return String(guest.id) === id;
    });

    if (!match) {
      showHint('لم يُعثر على ضيف بالمعرّف <b>' + id.replace(/[<>&]/g, '') + '</b> في ملف الضيوف.');
      return fallback;
    }

    return composeGuest(match) || fallback;
  }

  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- تساقط الورد ----------
     ثلاثة أشكال بألوان اللوحة نفسها. العمق يُصنع بثلاثة أمور معاً:
     الحجم، والضبابية، والطبقة (خلف البطاقة أم أمامها) — فالصغيرة
     الباهتة تبدو بعيدة والكبيرة الحادّة قريبة.                     */

  var PETAL_SHAPES = [
    // بتلة مدبّبة
    'M12 .8 C19.5 6 22.6 14.4 15.8 24.6 C13.6 28 10.4 28 8.2 24.6 C1.4 14.4 4.5 6 12 .8 Z' +
      'M12 4.2 C9.6 9.4 9.2 16.4 12 24.2',
    // بتلة عريضة
    'M12 1.6 C21 4.4 24.4 13 18.6 22 C15.4 27 8.6 27 5.4 22 C-.4 13 3 4.4 12 1.6 Z' +
      'M12 5 C14.4 11 14 18 12 23',
    // بتلة ملتوية
    'M13.6 1 C21.4 5.6 22.8 15 15 24 C12 27.4 8 26.4 6.6 22 C4 13.6 6.4 5.6 13.6 1 Z' +
      'M12.4 5 C11 11.4 11.6 18 13.4 22.6'
  ];

  var PETAL_TINTS = [
    { fill: '#F2C8D5', line: '#DE9DB1' },  // rose-200
    { fill: '#FAE2E9', line: '#EBB6C6' },  // rose-100
    { fill: '#E5A3B7', line: '#C87F97' },  // rose-300
    { fill: '#F7D9CB', line: '#DEB49E' },  // شمبانيا وردية
    { fill: '#FBEFF2', line: '#E9C4D0' }   // أفتحها — للطبقة البعيدة
  ];

  function makePetal(i, total, near) {
    var lane = (i + 0.5) / total;                       // توزيع متساوٍ لا تكتّل
    var jitter = (Math.random() - 0.5) * (0.8 / total);
    var depth = near ? 0.72 + Math.random() * 0.45      // قريبة: أكبر وأوضح
                     : 0.34 + Math.random() * 0.34;     // بعيدة: أصغر وأبهت

    var el = document.createElement('span');
    el.className = 'petal';
    el.style.insetInlineStart = ((lane + jitter) * 100).toFixed(2) + '%';
    el.style.width = Math.round((near ? 32 : 27) * depth) + 'px';
    el.style.animationDuration = (near ? 17 : 26) + Math.random() * 11 + 's';
    el.style.animationDelay = '-' + (Math.random() * 26).toFixed(1) + 's';  // سالب = السماء ممتلئة فوراً
    el.style.setProperty('--dx', Math.round((Math.random() - 0.45) * 150) + 'px');
    el.style.setProperty('--o', (near ? 0.9 : 0.62) * (0.75 + depth * 0.3));
    if (!near) { el.style.filter = 'blur(' + (1.4 - depth).toFixed(2) + 'px)'; }

    var inner = document.createElement('i');
    inner.style.animationDuration = (2.6 + Math.random() * 3.4).toFixed(1) + 's';
    inner.style.animationDelay = '-' + (Math.random() * 4).toFixed(1) + 's';
    inner.style.setProperty('--r0', Math.round(-40 + Math.random() * 25) + 'deg');
    inner.style.setProperty('--r1', Math.round(15 + Math.random() * 40) + 'deg');

    var tint = PETAL_TINTS[Math.floor(Math.random() * PETAL_TINTS.length)];
    var path = PETAL_SHAPES[Math.floor(Math.random() * PETAL_SHAPES.length)];
    var cut = path.indexOf('M', 1);

    inner.innerHTML =
      '<svg viewBox="0 0 24 28" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="' + path.slice(0, cut) + '" fill="' + tint.fill + '"/>' +
        '<path d="' + path.slice(cut) + '" fill="none" stroke="' + tint.line +
          '" stroke-width=".7" stroke-linecap="round" opacity=".55"/>' +
      '</svg>';

    el.appendChild(inner);
    return el;
  }

  function sowPetals() {
    var host = $('petals');
    if (!host || calm) { return; }

    // طبقة خلف البطاقة وأخرى أمامها — العمق يُرى حين تمرّ بتلةٌ فوق الورق.
    var far = host;
    far.classList.add('p-far');

    var near = document.createElement('div');
    near.className = 'petals p-near';
    near.setAttribute('aria-hidden', 'true');
    document.body.appendChild(near);

    // الشاشة الصغيرة تأخذ عدداً أقلّ — الأداء قبل الزينة.
    var wide = window.innerWidth >= 620;
    var farCount = wide ? 19 : 14;
    var nearCount = wide ? 9 : 6;

    var i;
    for (i = 0; i < farCount; i++) { far.appendChild(makePetal(i, farCount, false)); }
    for (i = 0; i < nearCount; i++) { near.appendChild(makePetal(i, nearCount, true)); }
  }

  /* ---------- الاسمان يُكتبان بالورد ----------
     الكشف متدرّج من اليمين لليسار على النصّ كاملاً — ولا يُقسَّم إلى
     حروف أبداً: تقسيم العربية إلى عناصر يكسر اتّصال الخطّ فتنفصل
     «أحمد» إلى أ ح م د. ووردةٌ تسير على طرف الكشف، ووردات صغيرة
     تتفتّح في أثرها.                                                */

  var ROSE_SVG =
    '<svg viewBox="0 0 20 24" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M10 23 C10 18 9 15 6.5 12.5" stroke="#B98C6E" stroke-width="1.1" fill="none" stroke-linecap="round"/>' +
      '<path d="M6.6 13.4 C3.6 13 2 11 2.2 8.6 C5 8.8 6.8 10.6 6.6 13.4 Z" fill="#CDA98C" opacity=".85"/>' +
      '<path d="M10 1.6 C14.6 1.6 17.6 4.8 17.6 8.6 C17.6 12.6 14.2 15.4 10 15.4 C5.8 15.4 2.4 12.6 2.4 8.6 C2.4 4.8 5.4 1.6 10 1.6 Z" fill="#E5A3B7"/>' +
      '<path d="M10 3.4 C13.2 3.4 15.4 5.6 15.4 8.4 C15.4 11.2 13 13.4 10 13.4 C7 13.4 4.6 11.2 4.6 8.4 C4.6 5.6 6.8 3.4 10 3.4 Z" fill="#D67D97"/>' +
      '<path d="M10 5.6 C12 5.6 13.4 7 13.4 8.6 C13.4 10.4 12 11.6 10 11.6 C8 11.6 6.6 10.4 6.6 8.6 C6.6 7 8 5.6 10 5.6 Z" fill="#C25A78"/>' +
      '<path d="M10 7.4 C11.1 7.6 11.8 8.4 11.6 9.4 C10.4 9.6 9.4 9 9.2 8.2 Z" fill="#A54460"/>' +
    '</svg>';

  var BUD_SVG =
    '<svg viewBox="0 0 12 14" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M6 13.6 C6 10.6 5.4 9 4 7.8" stroke="#B98C6E" stroke-width=".9" fill="none" stroke-linecap="round"/>' +
      '<path d="M6 .8 C8.9 .8 10.8 2.8 10.8 5.2 C10.8 7.7 8.7 9.4 6 9.4 C3.3 9.4 1.2 7.7 1.2 5.2 C1.2 2.8 3.1 .8 6 .8 Z" fill="#F2C8D5"/>' +
      '<path d="M6 2.4 C7.9 2.4 9.2 3.8 9.2 5.3 C9.2 7 7.7 8 6 8 C4.3 8 2.8 7 2.8 5.3 C2.8 3.8 4.1 2.4 6 2.4 Z" fill="#E5A3B7"/>' +
      '<path d="M6 4.2 C6.9 4.3 7.4 4.9 7.3 5.6 C6.5 5.7 5.9 5.3 5.8 4.8 Z" fill="#C25A78"/>' +
    '</svg>';

  function writeOne(id, startSec, durSec) {
    var name = $(id);
    if (!name || !name.parentNode) { return; }

    // غلافٌ يحتضن عرض النصّ وحده — فالكشف يبدأ من أول حرف لا من حافة البطاقة.
    var ink = document.createElement('div');
    ink.className = 'ink';
    ink.style.setProperty('--start', startSec + 's');
    ink.style.setProperty('--dur', durSec + 's');
    name.parentNode.insertBefore(ink, name);
    ink.appendChild(name);

    if (calm) { return; }

    var pen = document.createElement('span');
    pen.className = 'pen';
    pen.setAttribute('aria-hidden', 'true');
    pen.innerHTML = ROSE_SVG;
    ink.appendChild(pen);

    // كل وردة تتفتّح لحظة مرور القلم بها: القلم يمشي يميناً⟵يساراً،
    // فالوردة عند 84% من اليسار يمرّ بها أوّلاً.
    [84, 66, 48, 30, 14].forEach(function (leftPct) {
      var bud = document.createElement('span');
      bud.className = 'bloom';
      bud.setAttribute('aria-hidden', 'true');
      bud.style.left = leftPct + '%';
      bud.style.setProperty('--at', (startSec + durSec * (1 - leftPct / 100) * 0.94).toFixed(2) + 's');
      bud.innerHTML = BUD_SVG;
      ink.appendChild(bud);
    });

    ink.classList.add('writing');
  }

  function writeNames() {
    // الثاني يبدأ بعد أن يفرغ الأول — كسطرين يُكتبان بالتتابع.
    writeOne('groom', 1.0, 2.4);
    writeOne('bride', 3.6, 2.4);
  }

  /* ---------- العدّاد ---------- */

  /* الرقم يتدحرج فقط حين يتغيّر فعلاً — لا كل ثانية على الأربعة. */
  var setDigit = function (id, value, roll) {
    var el = $(id);
    if (!el) { return; }

    var next = String(value);
    if (el.textContent === next) { return; }

    el.textContent = next;

    // الثواني تتغيّر كل ثانية، ومطلعُ الدوران شفافيةٌ صفر — فلو تدحرجت
    // لومَضت الخانة بلا انقطاع وبدت فارغة في كل لقطة.
    if (calm || roll === false) { return; }
    el.classList.remove('roll');
    void el.offsetWidth;          // إعادة تشغيل الحركة
    el.classList.add('roll');
  };

  function startCountdown(isoDate) {
    var target = new Date(isoDate);
    if (isNaN(target.getTime())) {
      showHint('🔴 قيمة <b>التاريخ_والوقت</b> في <code>data/config.json</code> غير صالحة.');
      return;
    }

    var box = $('countdown');
    var arrived = $('arrived');

    var tick = function () {
      var left = target.getTime() - Date.now();

      if (left <= 0) {
        if (box) { box.hidden = true; }
        if (arrived) { arrived.hidden = false; }
        return false;
      }

      var sec = Math.floor(left / 1000);
      setDigit('cdD', Math.floor(sec / 86400));
      setDigit('cdH', Math.floor(sec % 86400 / 3600));
      setDigit('cdM', Math.floor(sec % 3600 / 60));
      setDigit('cdS', sec % 60, false);

      if (box) { box.hidden = false; }
      return true;
    };

    if (tick()) {
      var timer = setInterval(function () {
        if (!tick()) { clearInterval(timer); }
      }, 1000);
    }
  }

  /* ---------- ملف تقويم (.ics) يُولَّد في المتصفح ---------- */

  function buildIcs(cfg) {
    var start = new Date(cfg['التاريخ_والوقت']);
    if (isNaN(start.getTime())) { return null; }

    var end = new Date(start.getTime() + 4 * 60 * 60 * 1000);

    var stamp = function (date) {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    // ‏RFC 5545: الأسطر تُفصل بـCRLF، والفواصل والفواصل المنقوطة تُهرَّب.
    var esc = function (text) {
      return String(text || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
    };

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ahmad-alaa-invitation//AR',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:' + stamp(start) + '-ahmad-alaa@invitation',
      'DTSTAMP:' + stamp(new Date()),
      'DTSTART:' + stamp(start),
      'DTEND:' + stamp(end),
      'SUMMARY:' + esc(cfg['المناسبة'] + ' — ' + cfg['العريس'] + ' و' + cfg['العروس']),
      'LOCATION:' + esc([cfg['المكان'], cfg['العنوان']].filter(Boolean).join(' — ')),
      'DESCRIPTION:' + esc(cfg['كلمة_ختامية'] || ''),
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  function wireCalendar(cfg) {
    var btn = $('icsBtn');
    if (!btn) { return; }

    btn.addEventListener('click', function () {
      var ics = buildIcs(cfg);
      if (!ics) {
        showHint('🔴 لا يمكن توليد ملف التقويم — التاريخ غير صالح.');
        return;
      }

      var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'ahmad-alaa.ics';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    });
  }

  /* ---------- الرسم ---------- */

  function render(cfg, guestsFile) {
    document.title = 'دعوة ' + cfg['المناسبة'] + ' — ' + cfg['العريس'].split(' ')[0] + ' و' + cfg['العروس'].split(' ')[0];

    setText('verse', cfg['الآية']);
    setText('verseSource', cfg['مصدر_الآية']);
    setText('occasion', cfg['المناسبة']);
    setText('groom', cfg['العريس']);
    setText('bride', cfg['العروس']);
    setText('dateText', cfg['التاريخ_المعروض']);
    setText('timeText', cfg['الوقت_المعروض']);
    setText('venue', cfg['المكان']);
    setText('address', cfg['العنوان']);
    setText('closing', cfg['كلمة_ختامية']);

    setText('guestName', resolveGuest(guestsFile, cfg['التحية_الافتراضية'] || 'ضيفنا الكريم'));

    // الختم: حرفا الاسمين. يسقط إلى أول حرف من كل اسم إن لم يُضبَطا.
    setText('initialGroom', cfg['حرف_العريس'] || (cfg['العريس'] || '').charAt(0));
    setText('initialBride', cfg['حرف_العروس'] || (cfg['العروس'] || '').charAt(0));

    writeNames();

    var map = $('mapBtn');
    if (map) {
      if (cfg['رابط_الخريطة']) {
        map.href = cfg['رابط_الخريطة'];
      } else {
        map.remove();
      }
    }

    startCountdown(cfg['التاريخ_والوقت']);
    wireCalendar(cfg);
    sowPetals();
  }

  /* ---------- الإقلاع ---------- */

  Promise.all([loadJson('data/config.json'), loadJson('data/guests.json')])
    .then(function (files) { render(files[0], files[1]); })
    .catch(function (err) {
      // السبب الأشيع: فتح الملف بنقرة مزدوجة (file://) — والمتصفح يمنع
      // قراءة JSON من القرص. على GitHub Pages لا يحدث هذا إطلاقاً.
      if (window.location.protocol === 'file:') {
        showHint(
          'هذه الصفحة تقرأ ملفَّي JSON، والمتصفح يمنع ذلك عند فتحها من القرص مباشرةً.<br>' +
          'افتحها عبر خادم: <code>http://localhost/ahmad-alaa-invitation/</code> — أو من رابط الموقع المنشور.'
        );
      } else {
        showHint('تعذّرت قراءة ملفات البيانات: ' + String(err.message || err));
      }
    });
})();
