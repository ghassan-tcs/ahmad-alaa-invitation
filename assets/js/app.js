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

  /* ---------- العدّاد ---------- */

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
      setText('cdD', Math.floor(sec / 86400));
      setText('cdH', Math.floor(sec % 86400 / 3600));
      setText('cdM', Math.floor(sec % 3600 / 60));
      setText('cdS', sec % 60);

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
