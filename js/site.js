/* ==========================================================================
   WALKTHROUGH STUDIO — SITE ENGINE
   Hand-written vanilla JS. No dependencies, no build step.

   You should not need to edit this file. Everything that changes lives in
   config.js.

   Order matters here: every section that CONFIG builds must be in the DOM
   before the reveal observer starts watching, or those elements sit at
   opacity 0 forever. So the file defines everything first and runs the
   boot sequence at the very bottom.

   Contents
     01  Helpers
     02  Renderers (hero, marquee, problem grid, before/after, booking, contact,
         testimonials)
     03  Work grid + lightbox
     04  Comparison slider drag
     05  FAQ accordion
     06  Nav drawer
     07  Cursor + magnetic buttons
     08  Lazy video playback
     09  Reveal engine
     10  Scroll loop
     11  Preloader
     12  Boot
   ========================================================================== */

(function () {
'use strict';

/* == 01  HELPERS ========================================================= */

var $  = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

/* config.js declares `const CONFIG`, which creates a lexical global rather than
   a property on `window` — so `window.CONFIG` alone is undefined and every
   section would silently render empty. Read the lexical binding first. */
var C = (typeof CONFIG !== 'undefined' && CONFIG) || window.CONFIG || {};

if (!C.contact) {
  // Loud, because the failure mode is a page that looks fine but is blank.
  console.error('[Walkthrough Studio] js/config.js did not load. Check the file exists and has no syntax errors.');
}

var contact = C.contact || {};

/* -- The walkthrough list ------------------------------------------------
   CONFIG.walkthroughs is the list Cole edits. CONFIG.work is the old name
   for the same thing and is still accepted, so an older config.js keeps
   working rather than rendering an empty grid. */

/* A local file we can play in a <video>, versus a hosted page we have to
   put in an <iframe>. Anything ending in a video extension is a file; a
   YouTube / Vimeo / Loom link becomes that player's embed URL. */
var VIDEO_FILE_RE = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

function mediaFor(src) {
  var s = String(src == null ? '' : src).trim();
  if (!s) return { kind: 'none', src: '' };
  var m;

  m = s.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
  if (m) return { kind: 'embed', src: 'https://www.youtube-nocookie.com/embed/' + m[1] + '?rel=0&modestbranding=1&playsinline=1&autoplay=1' };

  m = s.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (m) return { kind: 'embed', src: 'https://player.vimeo.com/video/' + m[1] + '?autoplay=1&playsinline=1' };

  m = s.match(/loom\.com\/(?:share|embed)\/([A-Za-z0-9]+)/i);
  if (m) return { kind: 'embed', src: 'https://www.loom.com/embed/' + m[1] + '?autoplay=1' };

  // Some other hosted player URL we do not recognise: trust it as an embed.
  if (/^https?:\/\//i.test(s) && !VIDEO_FILE_RE.test(s)) return { kind: 'embed', src: s };

  return { kind: 'file', src: s };
}

/* The corner badge. The default is deliberately 'sample': an entry can
   never claim a paid client job unless status:'client' is typed in by
   hand. label:'' or status:'none' removes the badge entirely. */
var STATUS_LABEL = { sample: 'Sample', client: 'Client project', none: '' };

function statusKey(item) {
  var k = item.status == null ? 'sample' : String(item.status).trim().toLowerCase();
  return k || 'sample';
}

function badgeFor(item) {
  if (item.label != null) return String(item.label).trim();
  var k = statusKey(item);
  if (k === 'none') return '';
  return Object.prototype.hasOwnProperty.call(STATUS_LABEL, k)
    ? STATUS_LABEL[k]
    : String(item.status).trim();
}

function normalizeWalkthroughs(list) {
  return list
    .filter(function (w) { return w && String(w.video || '').trim(); })
    .map(function (w) {
      var media = mediaFor(w.video);
      return {
        title:    w.title || '',
        location: w.location || '',
        type:     w.type || '',
        // 'thumb' is the documented name; 'poster' is the old one.
        thumb:    w.thumb || w.poster || '',
        duration: w.duration || '',
        feature:  !!w.feature,
        badge:    badgeFor(w),
        status:   statusKey(w),
        kind:     media.kind,
        playSrc:  media.src
      };
    });
}

var work = normalizeWalkthroughs(
  Array.isArray(C.walkthroughs) ? C.walkthroughs
    : (Array.isArray(C.work) ? C.work : [])
);

var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* Text from config goes through here before it ever touches innerHTML. */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }

/* "904-489-5085" -> "+19044895085" for tel: links */
function telHref(phone) {
  var d = String(phone || '').replace(/[^\d]/g, '');
  if (d.length === 10) d = '1' + d;
  return d ? '+' + d : '';
}

/* Layout listeners that other modules hook into, so we only ever hold one
   scroll listener and one debounced resize listener for the whole page. */
var onResizeFns = [];
function onResize(fn) { onResizeFns.push(fn); }


/* == 02  RENDERERS ======================================================= */

function renderHero() {
  var v = $('#heroVideo');
  var hero = C.hero || {};
  if (!v) return;

  /* The master footage is shot vertical. A wide screen gets a 16:9 crop of
     it; anything taller than it is wide gets the full vertical frame, so a
     phone is not looking at a narrow slice of the middle. If only one file
     is configured, that one is used everywhere. */
  var portrait = window.matchMedia('(max-aspect-ratio: 1/1)').matches;
  var src    = (portrait && hero.videoPortrait)  ? hero.videoPortrait  : hero.video;
  var poster = (portrait && hero.posterPortrait) ? hero.posterPortrait : hero.poster;

  if (poster) v.setAttribute('poster', poster);

  if (!src) {
    // No video configured: fall back to the poster as a still backdrop.
    if (poster) v.insertAdjacentHTML('afterend', '<img src="' + esc(poster) + '" alt="">');
    v.remove();
    return;
  }

  v.src = src;
  if (reduced) { v.removeAttribute('autoplay'); v.pause(); return; }
  play(v);
  v.addEventListener('canplay', function () { play(v); }, { once: true });
}

function renderMarquee() {
  var el = $('#marquee');
  if (!el) return;
  var items = (C.marquee && C.marquee.length)
    ? C.marquee
    : ['Three cuts delivered', 'No shoot required', 'Days, not weeks'];
  var run = items.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
  el.innerHTML = run + run;   // duplicated so the -50% keyframe loops seamlessly
}

function renderProblemGrid() {
  var el = $('#pgrid');
  if (!el) return;
  var imgs = Array.isArray(C.problemGrid) ? C.problemGrid.slice(0, 9) : [];
  if (!imgs.length) {
    var wrap = $('.problem-grid-wrap');
    if (wrap) wrap.style.display = 'none';
    return;
  }

  // The tile that comes alive: the centre one, paired with the first
  // before/after clip so the still and the motion are the same room.
  var aliveIdx = imgs.length >= 5 ? 4 : imgs.length - 1;
  var aliveVid = (C.beforeAfter && C.beforeAfter[0] && C.beforeAfter[0].video) || '';

  el.innerHTML = imgs.map(function (src, i) {
    var alive = (i === aliveIdx && aliveVid);
    return '<figure' + (alive ? ' class="alive"' : '') + '>' +
             '<img src="' + esc(src) + '" alt="" loading="lazy" decoding="async">' +
             (alive
               ? '<video src="' + esc(aliveVid) + '" muted loop playsinline preload="none" data-inview-play></video>' +
                 '<span class="flag">This one moves</span>'
               : '') +
           '</figure>';
  }).join('');
}

function renderBeforeAfter() {
  var el = $('#baGrid');
  if (!el) return;
  var items = Array.isArray(C.beforeAfter) ? C.beforeAfter : [];
  if (!items.length) {
    var s = $('#compare');
    if (s) s.style.display = 'none';
    return;
  }

  el.innerHTML = items.map(function (it, i) {
    var badge = badgeFor(it);
    return '' +
      '<div class="ba" style="--pos:50%" data-ba tabindex="0" role="slider" ' +
           'aria-label="' + esc(it.room || 'Comparison') + ': drag to compare the photo with the video" ' +
           'aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" ' +
           'data-reveal="scale" data-reveal-delay="' + (i * 100) + '">' +
        '<video class="after" src="' + esc(it.video) + '" muted loop playsinline preload="none" data-inview-play></video>' +
        '<img class="before" src="' + esc(it.still) + '" alt="Original listing photo of the ' +
             esc(it.room || 'room') + '" loading="lazy" decoding="async">' +
        (it.room ? '<span class="ba-room">' + esc(it.room) + '</span>' : '') +
        (badge ? '<span class="media-badge' + (statusKey(it) === 'client' ? ' is-client' : '') + '">' +
                 esc(badge) + '</span>' : '') +
        '<span class="ba-tag l">Photo</span>' +
        '<span class="ba-tag r">Walkthrough</span>' +
        '<span class="ba-handle"></span>' +
      '</div>';
  }).join('');
}

/* The intake email, with the questions already written so nobody has to
   guess what to send. Used by every fallback path. */
function intakeMailto() {
  if (!contact.email) return '';
  return 'mailto:' + encodeURIComponent(contact.email) +
    '?subject=' + encodeURIComponent('Free sample walkthrough') +
    '&body=' + encodeURIComponent(
      'Hi Cole,\n\n' +
      'Here is the property I would like the free walkthrough on.\n\n' +
      'Address:\n' +
      'Link to the listing (if it is live anywhere):\n' +
      'Anything you should NOT show:\n' +
      'Pacing I would like (slow and luxury / upbeat and quick):\n' +
      'My company:\n\n' +
      'Photos are attached — or the listing link above has them.\n\n' +
      'Thanks'
    );
}

/* STEP 01 — where their photos go. */
function renderUpload() {
  var el = $('#uploadCta');
  if (!el) return;
  var b = C.booking || {};
  var url = String(b.uploadUrl || '').trim();
  var mail = intakeMailto();

  if (url && b.uploadEmbed) {
    el.innerHTML = '<div class="upload-frame"><iframe src="' + esc(url) +
      '" title="Send your property photos" loading="lazy" frameborder="0"></iframe></div>';
    return;
  }

  if (url) {
    // Opens on its own page — an upload form that asks for a Google sign-in
    // looks alarming inside an embedded box and perfectly normal outside one.
    el.innerHTML = '' +
      '<div class="bstep-cta">' +
        '<a class="btn btn-solid" href="' + esc(url) + '" target="_blank" rel="noopener" data-magnetic>' +
          '<span>Send photos or a link</span><span class="arrow">&rarr;</span></a>' +
        (mail ? '<a class="ulink" href="' + mail + '">Or just email them to me</a>' : '') +
      '</div>';

    // Only claim the submission lands in a folder when one is actually wired up.
    var note = $('#uploadNote');
    if (note) {
      note.innerHTML = esc('Three usable photos is the minimum. Eight to twelve is the sweet spot.') +
        ' <b>Everything you send lands straight in the folder I build from</b>, so nothing ' +
        'gets lost in an inbox.';
    }
    return;
  }

  // Nothing configured yet — email still works, and the questions are pre-written.
  el.innerHTML = '' +
    '<div class="bstep-cta">' +
      (mail
        ? '<a class="btn btn-solid" href="' + mail + '" data-magnetic>' +
          '<span>Email me the property</span><span class="arrow">&rarr;</span></a>'
        : '') +
      (contact.phone
        ? '<a class="ulink" href="sms:' + esc(telHref(contact.phone)) + '">Or text it to ' + esc(contact.phone) + '</a>'
        : '') +
    '</div>' +
    '<p class="bstep-note">The email opens with the questions already filled in — ' +
    'attach the photos, or just paste the listing link and send.</p>';
}

/* STEP 02 — the booking calendar.

   CONFIG.booking.calendarUrl accepts either a plain booking URL or the
   whole <iframe ...> snippet GoHighLevel hands out, because those are the
   two things you can actually copy out of GHL. Anything else pasted in
   there resolves to '' and the page falls back to the call-or-text card
   rather than rendering a broken box. */

var booking = C.booking || {};

function bookingUrl() {
  var raw = String(booking.calendarUrl || '').trim();
  if (!raw) return '';

  // A pasted embed snippet: pull the src out of it.
  if (raw.charAt(0) === '<') {
    var m = raw.match(/src\s*=\s*["']([^"']+)["']/i);
    raw = m ? m[1].trim() : '';
  }

  // Only ever emit an http(s) URL — never a javascript: or data: one.
  return /^https?:\/\//i.test(raw) ? raw : '';
}

/* The src the iframe gets. GHL needs nothing added; a Google Calendar
   appointment page needs ?gv=true before it will render embedded. */
function bookingSrc() {
  var u = bookingUrl();
  if (!u) return '';
  if (/calendar\.google\.com/i.test(u) && !/[?&]gv=/.test(u)) {
    u += (u.indexOf('?') === -1 ? '?' : '&') + 'gv=true';
  }
  return u;
}

function bookingEmbeds() {
  return !!bookingUrl() && booking.calendarEmbed !== false;
}

function ctaLabel() {
  return String(booking.ctaLabel || 'Book a Call').trim() || 'Book a Call';
}

/* The nav bar is the one place too narrow for a long label. Anything
   marked data-book-label="short" gets this instead. */
function ctaLabelShort() {
  return String(booking.ctaLabelShort || '').trim() || ctaLabel();
}

/* Where a "Book a Call" button should point.
     embedding  -> the #book section, which holds the calendar
     not        -> straight out to the booking page in a new tab
     nothing set-> still #book, which shows the call-or-text card */
function bookingTarget() {
  var url = bookingUrl();
  if (url && !bookingEmbeds()) return { href: url, external: true };
  // href:null means "leave the href that is already in the HTML alone" —
  // it is '#book' on the one-pager and 'index.html#book' on the other
  // pages, and only the page itself knows which is right.
  return { href: null, external: false };
}

function renderBooking() {
  var el = $('#calFrame');
  if (!el) return;

  var url = bookingUrl();
  var tel = telHref(contact.phone);
  var mail = intakeMailto();

  if (url && bookingEmbeds()) {
    el.innerHTML = '<iframe id="msgsndr-calendar" src="' + esc(bookingSrc()) + '" title="Book a ' +
                   esc(booking.duration || '15 minute') + ' call with ' +
                   esc(contact.name || 'the studio') + '" ' +
                   'loading="lazy" frameborder="0" scrolling="no"></iframe>' +
                   '<p class="cal-alt">Calendar not loading? ' +
                   '<a href="' + esc(url) + '" target="_blank" rel="noopener">' +
                   'Open the booking page in a new tab</a>.</p>';
    autoSizeCalendar(url);
    return;
  }

  if (url) {
    // Embedding is switched off (or blocked): send them straight to GHL.
    el.innerHTML = '' +
      '<div class="cal-fallback">' +
        '<h3>Pick a time that suits you</h3>' +
        '<p>The booking page opens in a new tab. Choose any ' +
          esc(booking.duration || '15 minute') + ' slot — you will get the ' +
          'confirmation and the link by email straight away.</p>' +
        '<div class="cal-actions">' +
          '<a class="btn btn-solid" href="' + esc(url) + '" target="_blank" rel="noopener" data-magnetic>' +
            '<span>' + esc(ctaLabel()) + '</span><span class="arrow">&rarr;</span></a>' +
          (tel ? '<a class="btn" href="tel:' + esc(tel) + '" data-magnetic>' +
                 '<span>Or call ' + esc(contact.phone) + '</span><span class="arrow">&rarr;</span></a>' : '') +
        '</div>' +
      '</div>';
    return;
  }

  // No calendar configured yet — offer a real way to book, not an empty box.
  el.innerHTML = '' +
    '<div class="cal-fallback">' +
      '<h3>Let\'s pick a time</h3>' +
      '<p>Self-service booking is being switched on right now. Until then, send the property ' +
        'using step 01 and say which days suit you — I will come straight back with an ' +
        'invite. Or call and we can sort it on the spot.</p>' +
      '<div class="cal-actions">' +
        (tel ? '<a class="btn btn-solid" href="tel:' + esc(tel) + '" data-magnetic>' +
               '<span>Call ' + esc(contact.phone) + '</span><span class="arrow">&rarr;</span></a>' : '') +
        (mail ? '<a class="btn" href="' + mail + '" data-magnetic>' +
               '<span>Email me</span><span class="arrow">&rarr;</span></a>' : '') +
      '</div>' +
    '</div>';
}

/* --- Make the embedded calendar size itself ---------------------------

   A booking widget is not a fixed height. GoHighLevel's needs about 830px
   on a desktop and about 940px on a phone (the columns stack), and it grows
   again on step two where the contact form is. A hardcoded height either
   wastes space or — much worse — clips the form people have to fill in.

   The widget already broadcasts what it needs:

       ["highlevel.setHeight", { height: 830, id: "msgsndr-calendar" }]

   so we listen for that and resize to match. This is what GHL's own
   form_embed.js does; doing it here means no third-party script on the
   page. If the message never arrives, the CSS height still applies and
   the calendar is merely a fixed size rather than broken. */

var calendarSized = false;

function autoSizeCalendar(url) {
  if (calendarSized) return;      // one listener for the life of the page
  calendarSized = true;

  var allowed;
  try { allowed = new URL(url).origin; } catch (e) { allowed = ''; }

  window.addEventListener('message', function (e) {
    // Only ever act on a message from the booking widget's own origin.
    if (!allowed || e.origin !== allowed) return;

    var payload = e.data;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch (err) { return; }
    }
    if (!Array.isArray(payload) || payload[0] !== 'highlevel.setHeight') return;

    var body = payload[1] || {};
    var h = parseInt(body.height, 10);
    if (!h || h < 320 || h > 3000) return;   // ignore nonsense

    $$('#calFrame iframe').forEach(function (f) {
      f.style.height = h + 'px';
    });
    var box = $('#calFrame');
    if (box) box.style.minHeight = '0';
  });
}

/* Every "Book a Call" button on the page — nav, hero, mobile drawer,
   footer, offer section — is stamped [data-book]. They all take their
   words and their destination from CONFIG.booking, so there is one place
   to change either. */
function renderBookCtas() {
  var t = bookingTarget();
  var label = ctaLabel();

  $$('[data-book]').forEach(function (a) {
    if (t.href) a.setAttribute('href', t.href);

    if (t.external) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    } else {
      a.removeAttribute('target');
      a.removeAttribute('rel');
    }

    // data-book="keep" means the button has its own wording to preserve.
    if (a.getAttribute('data-book') === 'keep') return;

    var slot = $('[data-book-label]', a);
    var words = (slot && slot.getAttribute('data-book-label') === 'short')
      ? ctaLabelShort()
      : label;

    if (slot) slot.textContent = words;
    else a.textContent = words;
  });

  $$('[data-book-duration]').forEach(function (el) {
    el.textContent = booking.duration || '15 minutes';
  });

  // "book at least 48 hours out", from one setting in config.js
  $$('[data-lead-time]').forEach(function (el) {
    el.textContent = booking.leadTime || '48 hours';
  });
}

function renderContact() {
  var tel = telHref(contact.phone);

  var ICON = {
    phone: '<path d="M4 4h4l2 5-2.5 1.5a11 11 0 006 6L15 14l5 2v4a1 1 0 01-1 1A16 16 0 013 5a1 1 0 011-1z"/>',
    mail:  '<path d="M3 5h18v14H3z"/><path d="M3 6l9 7 9-7"/>',
    user:  '<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0115 0"/>'
  };

  function row(icon, label, value, href) {
    var inner =
      '<span class="contact-ico"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[icon] + '</svg></span>' +
      '<span class="contact-txt"><small>' + esc(label) + '</small><b>' + esc(value) + '</b></span>';
    return href
      ? '<a class="contact-row" href="' + esc(href) + '">' + inner + '</a>'
      : '<div class="contact-row">' + inner + '</div>';
  }

  var rows = $('#contactRows');
  if (rows) {
    rows.innerHTML =
      row('user', 'Who you are talking to', (contact.name || '') + (contact.role ? ' — ' + contact.role : ''), '') +
      (contact.phone ? row('phone', 'Call or text', contact.phone, tel ? 'tel:' + tel : '') : '') +
      (contact.email ? row('mail', 'Email', contact.email, 'mailto:' + contact.email) : '');
  }

  var foot = $('#footerContact');
  if (foot) {
    foot.innerHTML =
      (contact.phone ? '<a href="tel:' + esc(tel) + '">' + esc(contact.phone) + '</a>' : '') +
      (contact.email ? '<a href="mailto:' + esc(contact.email) + '">' + esc(contact.email) + '</a>' : '') +
      (contact.name  ? '<p>' + esc(contact.name) + (contact.role ? ', ' + esc(contact.role) : '') + '</p>' : '');
  }

  var drawer = $('#drawerContact');
  if (drawer) {
    drawer.innerHTML =
      (contact.phone ? '<a href="tel:' + esc(tel) + '">' + esc(contact.phone) + '</a><br>' : '') +
      (contact.email ? '<a href="mailto:' + esc(contact.email) + '">' + esc(contact.email) + '</a>' : '');
  }

  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  var based = $('#basedIn'); if (based) based.textContent = contact.based || '';
}

/* --- Pricing ----------------------------------------------------------

   CONFIG.pricing holds plain numbers, never formatted strings, so the
   per-video figures below are always derived from the price actually on
   the page. Change a price in config.js and the "each" line moves with it
   instead of quietly disagreeing. */

function money(n) {
  // Whole dollars where possible: $95, not $95.00.
  var r = Math.round(n * 100) / 100;
  return '$' + (r % 1 === 0 ? String(r) : r.toFixed(2));
}

function renderPricing() {
  var sec = $('#pricing');
  if (!sec) return;

  var pr = C.pricing || {};
  var oneOff    = Array.isArray(pr.oneOff)    ? pr.oneOff    : [];
  var retainers = Array.isArray(pr.retainers) ? pr.retainers : [];

  // Nothing priced: take the whole section out rather than show an empty one.
  if (!oneOff.length && !retainers.length) {
    sec.style.display = 'none';
    $$('a[href="#pricing"]').forEach(function (a) { a.style.display = 'none'; });
    return;
  }

  var packs = $('#pricePacks');
  if (packs) {
    packs.innerHTML = oneOff.map(function (o, i) {
      var each = o.videos > 1 ? money(o.price / o.videos) + ' each' : 'One walkthrough';
      return '' +
        '<div class="pack' + (o.best ? ' is-best' : '') + '" data-reveal data-reveal-delay="' + (i * 80) + '">' +
          (o.best ? '<span class="pack-flag">Best value</span>' : '') +
          '<div class="pack-qty">' + esc(o.videos) + '</div>' +
          '<div class="pack-unit">' + (o.videos === 1 ? 'walkthrough' : 'walkthroughs') + '</div>' +
          '<div class="pack-price">' + esc(money(o.price)) + '</div>' +
          '<div class="pack-each">' + esc(each) + '</div>' +
        '</div>';
    }).join('');
  }

  var noteEl = $('#priceNote');
  if (noteEl) {
    if (pr.note) noteEl.textContent = pr.note;
    else noteEl.style.display = 'none';
  }

  var plans = $('#pricePlans');
  if (plans) {
    plans.innerHTML = retainers.map(function (r, i) {
      if (r.custom) {
        return '' +
          '<div class="plan is-custom" data-reveal data-reveal-delay="' + (i * 90) + '">' +
            '<h3 class="plan-name">' + esc(r.name || 'Custom') + '</h3>' +
            '<div class="plan-price"><b>Let\'s talk</b></div>' +
            '<p class="plan-blurb">' + esc(r.blurb || '') + '</p>' +
            '<a class="btn plan-cta" href="#book" data-book><span data-book-label>Book a Call</span></a>' +
          '</div>';
      }
      var each = (r.videos ? money(r.monthly / r.videos) + ' a video' : '');
      return '' +
        '<div class="plan' + (r.feature ? ' is-feature' : '') + '" data-reveal data-reveal-delay="' + (i * 90) + '">' +
          (r.feature ? '<span class="plan-flag">Most take this one</span>' : '') +
          '<h3 class="plan-name">' + esc(r.name) + '</h3>' +
          '<div class="plan-price"><b>' + esc(money(r.monthly)) + '</b><span>/month</span></div>' +
          '<ul class="plan-list">' +
            '<li><b>' + esc(r.videos) + '</b> walkthrough videos a month</li>' +
            (each ? '<li>Works out at <b>' + esc(each) + '</b></li>' : '') +
            (r.extra ? '<li>Extra videos <b>' + esc(money(r.extra)) + '</b> each</li>' : '') +
          '</ul>' +
          '<a class="btn plan-cta" href="#book" data-book><span data-book-label>Book a Call</span></a>' +
        '</div>';
    }).join('');
  }
}


/* --- Testimonials (testimonials.html) ---------------------------------
   Only runs on the testimonials page; every other page has no #tGrid and
   this returns immediately. The page is deliberately shippable while
   CONFIG.testimonials is empty — it shows an honest panel rather than a
   blank column or an invented quote. */

/* 'Jane Doe' -> 'JD'. Falls back to the company, then to a quote mark. */
function initials(t) {
  var parts = String(t.name || t.company || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '“';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function renderTestimonials() {
  var el = $('#tGrid');
  if (!el) return;

  var items = (Array.isArray(C.testimonials) ? C.testimonials : [])
    .filter(function (t) { return t && String(t.quote || '').trim(); });

  var count = $('#tCount');

  if (!items.length) {
    el.classList.add('is-empty');
    if (count) count.textContent = 'None published yet';
    el.innerHTML = '' +
      '<div class="t-empty" data-reveal>' +
        '<h2>Nothing here yet<br>&mdash; on purpose.</h2>' +
        '<p>I would rather this page stayed empty than fill it with quotes I wrote ' +
          'myself. The first real ones go up the moment a client sends them, with their ' +
          'name, their company and their listing attached.</p>' +
        '<p>Until then the work is the argument. Watch a walkthrough, or send me one of ' +
          'your own listings and judge it on your own property.</p>' +
        '<a class="btn btn-solid" href="index.html#work" data-magnetic>' +
          '<span>Watch the work instead</span><span class="arrow">&rarr;</span></a>' +
        '<p class="t-empty-note">Been a client? Send a line to ' +
          (contact.email
            ? '<a href="mailto:' + esc(contact.email) + '?subject=' +
              encodeURIComponent('A word about the walkthrough') + '">' +
              esc(contact.email) + '</a>'
            : 'the studio') +
          ' and it goes up here.</p>' +
      '</div>';
    return;
  }

  el.classList.remove('is-empty');
  if (count) {
    count.textContent = (items.length < 10 ? '0' : '') + items.length +
                        (items.length === 1 ? ' testimonial' : ' testimonials');
  }

  // A wide card only earns its space once the grid has enough cards to fill
  // the row it leaves behind. Same rule the work grid uses.
  var wide = items.length >= 3;

  el.innerHTML = items.map(function (t, i) {
    var who = [t.role, t.company].filter(Boolean).join(', ');
    return '' +
      '<figure class="tcard' + (t.feature && wide ? ' feature' : '') + '" ' +
              'data-reveal data-reveal-delay="' + (i % 3) * 110 + '">' +
        '<span class="t-mark" aria-hidden="true">&ldquo;</span>' +
        (t.location ? '<figcaption class="t-tag">' + esc(t.location) + '</figcaption>' : '') +
        '<blockquote class="t-quote">' + esc(t.quote) + '</blockquote>' +
        '<div class="t-by">' +
          '<span class="t-ini" aria-hidden="true">' + esc(initials(t)) + '</span>' +
          '<span class="t-who">' +
            '<b>' + esc(t.name || t.company || 'Client') + '</b>' +
            (who ? '<small>' + esc(who) + '</small>' : '') +
          '</span>' +
        '</div>' +
      '</figure>';
  }).join('');
}


/* == 03  WORK GRID + LIGHTBOX ============================================ */

function renderWork() {
  var grid = $('#workGrid');
  if (!grid) return;

  if (!work.length) {
    grid.innerHTML =
      '<div class="work-empty">No samples loaded yet<br>Add them in js/config.js</div>' +
      '<div class="work-empty">Drop .mp4 files into /videos</div>' +
      '<div class="work-empty">See README.md</div>';
    return;
  }

  // The grid is auto-fill, so a short list leaves empty columns and a wide
  // "feature" card leaves a hole beside it. Match the layout to the count.
  var wide = work.length >= 3;
  grid.classList.remove('count-1', 'count-2');
  if (work.length === 1) grid.classList.add('count-1');
  else if (work.length === 2) grid.classList.add('count-2');

  grid.innerHTML = work.map(function (w, i) {
    var thumb = w.thumb
      ? '<img src="' + esc(w.thumb) + '" alt="' + esc(w.title || 'Walkthrough') + '" loading="lazy" decoding="async">'
      : '<img alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==">';

    // The silent hover preview only works for a file we can put in a
    // <video>. A hosted YouTube/Vimeo/Loom entry shows its thumbnail.
    var preview = (finePointer && w.kind === 'file')
      ? '<video src="' + esc(w.playSrc) + '" muted loop playsinline preload="none"></video>'
      : '';

    return '' +
      '<button class="work-card' + (w.feature && wide ? ' feature' : '') + '" data-i="' + i + '" ' +
              'aria-label="Play the ' + esc(w.title || 'walkthrough') + ' walkthrough" ' +
              'data-reveal data-reveal-delay="' + (i % 3) * 110 + '" data-cursor="play">' +
        '<span class="work-thumb">' +
          thumb +
          preview +
          (w.badge ? '<span class="media-badge' + (w.status === 'client' ? ' is-client' : '') + '">' +
                     esc(w.badge) + '</span>' : '') +
          (w.duration ? '<span class="work-dur">' + esc(w.duration) + '</span>' : '') +
        '</span>' +
        '<span class="work-body">' +
          '<span>' +
            '<span class="work-title">' + esc(w.title || 'Untitled') + '</span>' +
            '<span class="work-sub">' + esc([w.location, w.type].filter(Boolean).join(' · ')) + '</span>' +
          '</span>' +
          '<span class="work-play"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1 L11 6 L2 11 Z"/></svg></span>' +
        '</span>' +
      '</button>';
  }).join('');

  // Hover preview, fine pointers only, so phones never fetch these files.
  if (finePointer) {
    $$('.work-card', grid).forEach(function (card) {
      var v = $('video', card);
      if (!v) return;
      card.addEventListener('mouseenter', function () { play(v); });
      card.addEventListener('mouseleave', function () { v.pause(); v.currentTime = 0; });
    });
  }
}

function initLightbox() {
  var lb = $('#lbox');
  var grid = $('#workGrid');
  if (!lb || !grid || !work.length) return;

  var lbVid  = $('#lboxVideo');
  var lbT    = $('#lboxTitle');
  var lbS    = $('#lboxSub');
  var lbN    = $('#lboxCount');
  var prevB  = $('#lboxPrev');
  var nextB  = $('#lboxNext');
  var closeB = $('#lboxClose');

  var lbFrame = $('.lbox-frame', lb);
  var lbEmbed = null;          // built the first time a hosted entry plays

  var idx = 0;
  var opener = null;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isOpen() { return lb.classList.contains('open'); }

  function embedEl() {
    if (lbEmbed) return lbEmbed;
    lbEmbed = document.createElement('iframe');
    lbEmbed.className = 'lbox-embed';
    lbEmbed.title = 'Walkthrough video';
    lbEmbed.setAttribute('frameborder', '0');
    lbEmbed.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    lbEmbed.setAttribute('allowfullscreen', '');
    if (lbFrame) lbFrame.appendChild(lbEmbed);
    return lbEmbed;
  }

  function stopEmbed() {
    // Blanking the src is the only reliable way to stop a third-party
    // player; hiding the iframe leaves the audio running.
    if (lbEmbed) { lbEmbed.src = 'about:blank'; lbEmbed.hidden = true; }
  }

  function stopFile() {
    lbVid.pause();
    lbVid.removeAttribute('src');
    lbVid.load();
  }

  function load(i) {
    idx = (i + work.length) % work.length;
    var w = work[idx];

    if (w.kind === 'embed') {
      stopFile();
      lbVid.hidden = true;
      var f = embedEl();
      f.hidden = false;
      f.src = w.playSrc;
    } else {
      stopEmbed();
      lbVid.hidden = false;
      lbVid.pause();
      lbVid.src = w.playSrc || '';
      if (w.thumb) lbVid.poster = w.thumb; else lbVid.removeAttribute('poster');
      play(lbVid);
    }

    lbT.textContent = w.title || 'Walkthrough';
    lbS.textContent = [w.location, w.type, w.badge].filter(Boolean).join(' · ');
    lbN.textContent = pad(idx + 1) + ' / ' + pad(work.length);
    prevB.disabled = nextB.disabled = (work.length < 2);
  }

  function open(i, from) {
    opener = from || null;
    load(i);
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    closeB.focus();
  }

  function close() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    lbVid.pause();
    stopEmbed();
    // Drop the source so a large file stops buffering in the background.
    window.setTimeout(function () {
      if (isOpen()) return;
      stopFile();
    }, 520);
    if (opener) opener.focus();
  }

  $$('.work-card', grid).forEach(function (card) {
    card.addEventListener('click', function () {
      open(parseInt(card.getAttribute('data-i'), 10), card);
    });
  });

  prevB.addEventListener('click', function () { load(idx - 1); });
  nextB.addEventListener('click', function () { load(idx + 1); });
  closeB.addEventListener('click', close);

  // Click the backdrop (but never the player itself) to close.
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.classList.contains('lbox-stage')) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!isOpen()) return;
    if (e.key === 'Escape')     { close(); return; }
    if (e.key === 'ArrowLeft')  { load(idx - 1); return; }
    if (e.key === 'ArrowRight') { load(idx + 1); return; }

    // Keep tab focus inside the dialog while it is open.
    if (e.key === 'Tab') {
      var f = [closeB, lbVid, prevB, nextB].filter(function (el) { return el && !el.disabled; });
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}


/* == 04  COMPARISON SLIDER DRAG ========================================== */

function initCompare() {
  $$('[data-ba]').forEach(function (el) {
    var dragging = false;

    function set(clientX) {
      var r = el.getBoundingClientRect();
      var pct = clamp(((clientX - r.left) / r.width) * 100, 0, 100);
      el.style.setProperty('--pos', pct + '%');
      el.setAttribute('aria-valuenow', Math.round(pct));
    }

    el.addEventListener('pointerdown', function (e) {
      dragging = true;
      el.setPointerCapture(e.pointerId);
      set(e.clientX);
      e.preventDefault();               // stop the image being dragged off
    });

    el.addEventListener('pointermove', function (e) { if (dragging) set(e.clientX); });

    ['pointerup', 'pointercancel'].forEach(function (evt) {
      el.addEventListener(evt, function (e) {
        dragging = false;
        if (el.hasPointerCapture && el.hasPointerCapture(e.pointerId)) {
          el.releasePointerCapture(e.pointerId);
        }
      });
    });

    // The slider is focusable, so arrow keys have to work too.
    el.addEventListener('keydown', function (e) {
      var now = parseFloat(el.getAttribute('aria-valuenow')) || 50;
      var step = e.shiftKey ? 10 : 4;
      var next = null;
      if (e.key === 'ArrowLeft')  next = now - step;
      if (e.key === 'ArrowRight') next = now + step;
      if (e.key === 'Home')       next = 0;
      if (e.key === 'End')        next = 100;
      if (next === null) return;
      e.preventDefault();
      next = clamp(next, 0, 100);
      el.style.setProperty('--pos', next + '%');
      el.setAttribute('aria-valuenow', Math.round(next));
    });
  });
}


/* == 05  FAQ ============================================================= */

function initFaq() {
  var wrap = $('#faqList');
  if (!wrap) return;
  var items = Array.isArray(C.faq) ? C.faq : [];
  if (!items.length) {
    var s = $('#faq');
    if (s) s.style.display = 'none';
    return;
  }

  wrap.innerHTML = items.map(function (f, i) {
    return '' +
      '<div class="faq-item" data-reveal="fade" data-reveal-delay="' + Math.min(i * 55, 330) + '">' +
        '<button class="faq-q" aria-expanded="false" aria-controls="fa' + i + '" id="fq' + i + '">' +
          '<span>' + esc(f.q) + '</span><span class="faq-sign" aria-hidden="true"></span>' +
        '</button>' +
        '<div class="faq-a" id="fa' + i + '" role="region" aria-labelledby="fq' + i + '">' +
          '<div class="faq-a-in">' + esc(f.a) + '</div>' +
        '</div>' +
      '</div>';
  }).join('');

  $$('.faq-q', wrap).forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.parentElement;
      var panel = $('.faq-a', item);
      var wasOpen = item.classList.contains('open');

      // Accordion: only one answer open at a time.
      $$('.faq-item.open', wrap).forEach(function (other) {
        other.classList.remove('open');
        $('.faq-a', other).style.height = '0px';
        $('.faq-q', other).setAttribute('aria-expanded', 'false');
      });

      if (!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        panel.style.height = $('.faq-a-in', panel).offsetHeight + 'px';
      }
    });
  });

  // Keep an open answer correctly sized when the window changes width.
  onResize(function () {
    var open = $('.faq-item.open', wrap);
    if (open) $('.faq-a', open).style.height = $('.faq-a-in', open).offsetHeight + 'px';
  });
}


/* == 06  NAV DRAWER ====================================================== */

function initDrawer() {
  var btn = $('#navToggle');
  var dr  = $('#drawer');
  if (!btn || !dr) return;

  function shut() {
    btn.classList.remove('open');
    dr.classList.remove('show');
    btn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
  }

  btn.addEventListener('click', function () {
    var open = !dr.classList.contains('show');
    btn.classList.toggle('open', open);
    dr.classList.toggle('show', open);
    btn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
  });

  $$('a', dr).forEach(function (a) { a.addEventListener('click', shut); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && dr.classList.contains('show')) shut();
  });
}


/* == 07  CURSOR + MAGNETIC =============================================== */

function initPointerFlourish() {
  if (!finePointer || reduced) return;

  var cur = $('#cursor');
  if (!cur) return;

  var x = 0, y = 0, cx = 0, cy = 0, running = false;

  function loop() {
    // Trails slightly behind the real pointer — it reads as weight, not lag.
    cx += (x - cx) * 0.22;
    cy += (y - cy) * 0.22;
    cur.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
    if (running) window.requestAnimationFrame(loop);
  }

  document.addEventListener('pointermove', function (e) {
    x = e.clientX; y = e.clientY;
    if (!running) {
      running = true; cx = x; cy = y;
      cur.classList.add('on');
      window.requestAnimationFrame(loop);
    }
  }, { passive: true });

  document.addEventListener('pointerleave', function () { cur.classList.remove('on'); });

  // Delegated, so anything rendered later still gets the treatment.
  document.addEventListener('pointerover', function (e) {
    if (!e.target.closest) return;
    var isPlay = !!e.target.closest('[data-cursor="play"]');
    var isLink = !!e.target.closest('a, button, [data-ba]');
    cur.classList.toggle('play', isPlay);
    cur.classList.toggle('link', isLink && !isPlay);
  });

  // Magnetic buttons
  $$('[data-magnetic]').forEach(function (el) {
    var raf = null;
    el.addEventListener('pointermove', function (e) {
      if (raf) return;
      raf = window.requestAnimationFrame(function () {
        raf = null;
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.32;
        el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      });
    });
    el.addEventListener('pointerleave', function () { el.style.transform = ''; });
  });
}


/* == 08  LAZY VIDEO PLAYBACK ============================================= */

/* Clips marked data-inview-play only download and run while on screen. */
function initInviewVideos() {
  var vids = $$('[data-inview-play]');
  if (!vids.length) return;

  if (reduced || !('IntersectionObserver' in window)) {
    // Still show the first frame, just never animate it.
    vids.forEach(function (v) { v.preload = 'metadata'; v.load(); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) {
        if (v.preload !== 'auto') { v.preload = 'auto'; v.load(); }
        play(v);
      } else {
        v.pause();
      }
    });
  }, { threshold: 0.25 });

  vids.forEach(function (v) { io.observe(v); });
}


/* == 09  REVEAL ENGINE =================================================== */

function initReveals() {
  var els = $$('[data-reveal], .draw');
  if (!els.length) return;

  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  // One observer for the whole page, not one per element.
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var d = parseInt(e.target.getAttribute('data-reveal-delay') || '0', 10);
      if (d) e.target.style.transitionDelay = d + 'ms';
      e.target.classList.add('is-visible');
      io.unobserve(e.target);             // reveal once, then stop watching
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

  els.forEach(function (el) { io.observe(el); });
}


/* == 10  SCROLL LOOP ===================================================== */

function initScroll() {
  var nav      = $('#nav');
  var progress = $('#progress');
  var heroMed  = $('#heroMedia');
  var pin      = $('#pin');
  var track    = $('#pinTrack');
  var pinBar   = $('#pinBar');
  var links    = $$('#navLinks a');

  /* Each nav link paired with the section it points at. Links that leave the
     page (testimonials.html) have no section here, so they are simply left out
     of the spy rather than shifting everyone else's index by one. */
  var spy = links.map(function (a) {
    var el = null;
    try { el = a.hash ? $(a.hash) : null; } catch (err) { el = null; }
    return el ? { link: a, el: el } : null;
  }).filter(Boolean);

  var lastY = window.scrollY;
  var ticking = false;
  var vw = window.innerWidth;
  var vh = window.innerHeight;

  // Cached layout, recomputed on resize rather than every frame.
  var pinTop = 0, pinH = 0, trackOver = 0;

  function measure() {
    vw = window.innerWidth;
    vh = window.innerHeight;

    var horizontal = pin && track && vw > 900 && !reduced;
    if (horizontal) {
      pinTop = pin.getBoundingClientRect().top + window.scrollY;
      pinH = pin.offsetHeight;
      var pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      trackOver = Math.max(0, track.scrollWidth - vw + pad);
    } else {
      trackOver = 0;
      if (track) {
        track.style.transform = '';
        // Stacked vertically, every card reads as active.
        $$('.step', track).forEach(function (s) { s.classList.add('lit'); });
      }
    }
  }

  function frame() {
    ticking = false;
    var y = window.scrollY;
    var docH = document.documentElement.scrollHeight - vh;

    if (progress) {
      progress.style.transform = 'scaleX(' + (docH > 0 ? clamp(y / docH, 0, 1) : 0) + ')';
    }

    if (nav) {
      nav.classList.toggle('solid', y > 40);
      var goingDown = y > lastY && y > 400;
      nav.classList.toggle('tucked', goingDown && !document.body.classList.contains('is-locked'));
    }
    lastY = y;

    // Hero parallax — the video drifts slower than the page.
    if (heroMed && !reduced && y < vh * 1.4) {
      heroMed.style.transform = 'translate3d(0,' + (y * 0.22) + 'px,0)';
    }

    // Pinned process track.
    if (trackOver > 0 && track) {
      var p = clamp((y - pinTop) / Math.max(1, pinH - vh), 0, 1);
      track.style.transform = 'translate3d(' + (-p * trackOver) + 'px,0,0)';
      if (pinBar) pinBar.style.transform = 'scaleX(' + p + ')';

      $$('.step', track).forEach(function (s) {
        var r = s.getBoundingClientRect();
        s.classList.toggle('lit', r.left < vw * 0.55 && r.right > vw * 0.12);
      });
    }

    // Scroll-spy.
    if (spy.length) {
      var mark = y + vh * 0.35;
      var active = -1;
      for (var i = 0; i < spy.length; i++) {
        if (spy[i].el.offsetTop <= mark) active = i;
      }
      spy.forEach(function (s, i) { s.link.classList.toggle('active', i === active); });
    }
  }

  function tick() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(frame); }
  }

  onResize(function () { measure(); frame(); });

  measure();
  frame();

  window.addEventListener('scroll', tick, { passive: true });

  // Lazy images and video metadata change the page height after first paint,
  // which moves the pinned section. Re-measure once everything has settled.
  window.addEventListener('load', function () {
    measure(); frame();
    window.setTimeout(function () { measure(); frame(); }, 600);
  });

  var rt;
  window.addEventListener('resize', function () {
    window.clearTimeout(rt);
    rt = window.setTimeout(function () {
      onResizeFns.forEach(function (fn) { fn(); });
    }, 140);
  });
}


/* == 11  PRELOADER ======================================================= */

function initPreloader() {
  var pre = $('#preload');
  var pct = $('#preloadPct');
  var body = document.body;

  function reveal() {
    body.classList.add('ready');
    if (!pre) return;
    pre.classList.add('gone');
    window.setTimeout(function () { pre.hidden = true; }, 1100);
  }

  // Reduced motion, or already seen this session: go straight in.
  var seen = false;
  try { seen = sessionStorage.getItem('ws-seen') === '1'; } catch (e) {}

  if (reduced || seen) {
    if (pre) pre.hidden = true;
    body.classList.add('ready');
    return;
  }
  try { sessionStorage.setItem('ws-seen', '1'); } catch (e) {}

  var n = 0;
  var timer = window.setInterval(function () {
    n = Math.min(100, n + Math.random() * 13 + 4);
    if (pct) pct.textContent = (n < 10 ? '0' : '') + Math.floor(n);
    if (n >= 100) {
      window.clearInterval(timer);
      window.setTimeout(reveal, 320);
    }
  }, 90);

  // Never let a slow asset trap someone behind the curtain.
  window.setTimeout(function () {
    window.clearInterval(timer);
    if (!body.classList.contains('ready')) reveal();
  }, 4200);
}


/* == 12  BOOT ============================================================ */

/* Render everything CONFIG drives first... */
renderHero();
renderMarquee();
renderProblemGrid();
renderBeforeAfter();
renderUpload();
renderBooking();
renderContact();
renderWork();
renderPricing();
renderTestimonials();

/* ...then stamp the booking buttons. This has to run AFTER every renderer
   above, because several of them (pricing especially) create [data-book]
   buttons of their own, and a button built after this ran would keep its
   placeholder wording and its placeholder href. */
renderBookCtas();

/* ...then wire behaviour to the finished DOM... */
initLightbox();
initCompare();
initFaq();
initDrawer();
initPointerFlourish();
initInviewVideos();

/* ...and only now start watching for reveals, so nothing rendered above is
   left stuck at opacity 0. */
initReveals();
initScroll();
initPreloader();

})();
