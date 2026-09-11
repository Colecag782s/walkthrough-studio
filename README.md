# Walkthrough Studio — website

A small marketing site. Plain HTML, CSS and JavaScript — **no build step, no npm, no
framework, nothing to install**. Double-click `index.html` and it runs.

```
website/
├── index.html          the main page
├── book.html           the booking page  (yoursite.com/book)
├── testimonials.html   the testimonials page
├── css/site.css        all styling
├── js/config.js        ← THE ONLY FILE YOU EDIT
├── js/site.js          the engine that renders config.js (leave alone)
├── videos/             your .mp4 files
├── img/                thumbnails and comparison stills
└── README.md           this file
```

**Everything you change is in `js/config.js`.** Adding a walkthrough, removing one,
changing the booking link, editing the FAQ — all one file, no layout code, no components.

---

## 1. The booking link — already set up

**This is done.** The site is wired to your GoHighLevel calendar
*Walkthrough Studio – Discovery Call* (15 minutes), and it is embedded live on both the
main page and `/book`.

Every booking button on the site — nav bar, hero, mobile menu, footer, and the calendar
itself — reads from one block in `js/config.js`:

```js
booking: {
  calendarUrl:   'https://api.leadconnectorhq.com/widget/booking/gcKyKwA4n1nRvlifmsoj',
  calendarEmbed: true,
  ctaLabel:      'Schedule Your Discovery Call',   // every button except the nav
  ctaLabelShort: 'Book a Call',                    // the nav bar only
  duration:      '15 minutes',
},
```

**`ctaLabel`** is the wording on every booking button. Change it in that one line and it
changes in the hero, the mobile menu, the footer and the `/book` page at once.

**`ctaLabelShort`** exists because the nav bar has room for about three words before the
button wraps onto two lines and crowds the menu icon on a phone. Only the nav uses it.

**`duration`** is printed next to the buttons. The GHL calendar is set to 15 minutes — if
you change it in GHL, change it here too so they agree.

**`leadTime`** is the gap you need between someone sending a property and the call, so the
sample is finished before you get on it. It is set to `'48 hours'` and it is printed in
four places on the site — the booking section headline, the highlighted line in step 02,
the timeline, and the FAQ. Change it in this one line and all of them move together.

### If you ever need to swap the calendar

GHL is your CRM of record, so the booking link has to be a GHL calendar. A booking made
anywhere else never reaches the pipeline — **do not use Calendly here.**

1. In GHL, go to **Calendars** and open the calendar you want people to book
2. Click **Share / Embed**
3. Copy either one:
   - **Permanent link** — a plain URL like
     `https://api.leadconnectorhq.com/widget/booking/AbC123xyz`
   - **Embed code** — the whole block starting `<iframe src="...">`

### Paste it in

Open `js/config.js` and replace the `calendarUrl` line.

If you copied the **embed code** instead of the plain link, paste it between **backticks**
(the ` character, top-left of the keyboard) rather than quotes, because the code has quotes
of its own inside it:

```js
calendarUrl: `<iframe src="https://api.leadconnectorhq.com/widget/booking/AbC123xyz"></iframe>`,
```

Either way works. The site pulls the address out and builds its own clean embed.

Save the file, refresh the page. The calendar appears in section 07 of the main page and
fills the `/book` page.

**The calendar sizes itself.** GoHighLevel's widget needs about 830px on a desktop and
about 940px on a phone, and it grows again on the step where the contact form appears. The
site listens for the height the widget broadcasts and resizes the box to match, so the
form can never end up half cut off. There is no third-party script involved.

### If the calendar won't load

Some GHL sub-accounts only allow their calendar to be embedded on approved domains. If you
see an empty box or a "refused to connect" message, either allow your domain inside GHL, or
switch the site to link-out mode:

```js
calendarEmbed: false,
```

Every "Book a Call" button then opens the GHL booking page in a new tab instead of
embedding it. Nothing else changes.

> **If you ever blank out `calendarUrl`, nothing looks broken.** Every booking button falls
> back to a call-or-text card with your real phone number in it, rather than showing an
> empty box.

---

## 2. Add or remove a walkthrough

**File to edit: `js/config.js`. Section 4, the list called `walkthroughs`.**
That is the only file. You never touch HTML, CSS or `site.js` for this.

### To remove one

Find its block and delete it, from its opening `{` to its closing `},` inclusive. Save,
refresh. Gone from the grid and gone from the click-to-play lightbox.

### To add one

**Step 1 — get the video in.** Either drop the `.mp4` into `videos/`, or skip this
entirely and use a YouTube / Vimeo / Loom link (see the `video` field below).

**Step 2 — if it's a local file, make it web-sized.** A raw render is 40–60 MB, far too
heavy for a web page. ffmpeg is already installed on this machine:

```bash
ffmpeg -i "raw-render.mp4" -an -vf "scale=1280:-2" -c:v libx264 -crf 26 -preset slow -movflags +faststart "videos/my-property.mp4"
```

- `-crf 26` is the quality dial. **Lower = better quality, bigger file.** 22 is very high
  quality, 30 is small and noticeably softer. 26 is a good middle.
- `-movflags +faststart` matters — without it the video will not start playing until the
  whole file has downloaded.
- `-an` strips audio. Drop it if there is music you want to keep.

Aim for **under 8 MB per video.**

**Step 3 — grab a thumbnail** (the frame people see before it plays):

```bash
ffmpeg -i "videos/my-property.mp4" -ss 1.2 -frames:v 1 -q:v 4 "img/my-property.jpg"
```

`-ss 1.2` is which second to grab. Pick a good-looking moment.

**Step 4 — add the entry.** Open `js/config.js`, scroll to `walkthroughs:`, and paste a
block in above the closing `]`:

```js
{
  title:    'Riverside Loft',
  location: 'Austin, TX',
  type:     'Condo - 2 bed',
  video:    'videos/my-property.mp4',
  thumb:    'img/my-property.jpg',
  duration: '0:28',
  status:   'sample',
  feature:  false,
},
```

Save. Refresh. Done.

### What each line means

| Field | What it does |
|---|---|
| `title` | The name on the card. **Required.** |
| `location` | `'Austin, TX'`. Optional. |
| `type` | `'Condo - 2 bed'`. Optional. Prints after the location. |
| `video` | **Required.** Either a file — `'videos/my-property.mp4'` — or a hosted link. YouTube, Vimeo and Loom share links all work as-is: `'https://youtu.be/dQw4w9WgXcQ'`. |
| `thumb` | The still shown before it plays. Optional — leave it out and you get a plain dark tile. |
| `duration` | `'0:28'`. Printed on the thumbnail. Optional. |
| `status` | The badge in the corner. See below. |
| `label` | Your own wording instead of the badge, e.g. `'Free build'`. |
| `feature` | `true` makes the card twice as wide. Use it on your best one, and only once you have three or more. |

### The status badge — read this one

```js
status: 'sample',   //  ->  SAMPLE          the default
status: 'client',   //  ->  CLIENT PROJECT  amber, stands out
status: 'none',     //  ->  no badge at all
```

**Leave `status` out entirely and you get SAMPLE.** That is on purpose. A new entry can
never accidentally present itself as paid client work, or as a before-and-after of a real
job — you have to type `'client'` yourself for that to happen. Only mark an entry
`'client'` when it is a completed, paid job you actually delivered.

### How many

The grid looks best with **3, 6 or 9** entries. It stacks to a single column on a phone
automatically — no horizontal scrolling, nothing to configure.

---

## 3. Add or remove a comparison slider

**Same file, `js/config.js`, section 5, the list called `beforeAfter`.**

These fill the **Better walkthroughs** section — the drag-to-compare sliders. Each needs the **original listing photo** and the
**video clip made from that exact photo**. They have to be the same shot or the comparison
falls apart.

```bash
ffmpeg -i "original-photo.jpg" -vf "scale=960:-2" -q:v 4 "img/ba-livingroom-still.jpg"
ffmpeg -i "that-clip.mp4" -an -vf "scale=960:-2" -c:v libx264 -crf 28 -movflags +faststart "videos/ba-livingroom.mp4"
```

Then add the entry:

```js
beforeAfter: [
  { room: 'Living room', still: 'img/ba-livingroom-still.jpg', video: 'videos/ba-livingroom.mp4', status: 'sample' },
],
```

Keep these clips short (2–4 seconds) and small — they autoplay silently as soon as they
scroll into view. They take the same `status` and `label` badges as the walkthroughs above,
and they must be local files (a hosted link cannot play inside a slider).

**Delete every entry and the whole comparison section removes itself** from the page. It
does not leave a hole.

---

## 4. Change a price

**`js/config.js`, section 8, the block called `pricing`.**

Every value there is a plain number — no dollar signs, no text. The page adds the `$` and
works out the per-video figures itself, so the maths on the site can never drift out of
step with the prices:

```js
pricing: {
  oneOff: [
    { videos: 1,  price: 95  },
    { videos: 3,  price: 255 },
    { videos: 5,  price: 400 },
    { videos: 10, price: 750, best: true },
  ],
  retainers: [
    { name: 'Starter', monthly: 499, videos: 6,  extra: 90 },
    { name: 'Pro',     monthly: 699, videos: 9,  extra: 85, feature: true },
    { name: 'Scale',   monthly: 999, videos: 14, extra: 75 },
    { name: 'Custom',  custom: true, blurb: '...' },
  ],
},
```

- **To change a price**, change the number. The "$85 each" and "works out at $77.67 a
  video" lines recalculate on their own.
- **`best: true`** puts the *Best value* marker on one of the packs.
- **`feature: true`** highlights one retainer as the recommended plan.
- **`custom: true`** turns a card into a "let's talk" card with no price.
- **To remove a plan**, delete its block. Empty both lists and the whole pricing section
  removes itself from the page and from the nav.

---

## 5. Everything else you can change

All of it is in `js/config.js`, commented line by line:

| Section | What it controls |
|---|---|
| `contact` | Your name, phone, email, where you're based. Used in the nav, booking cards and footer. |
| `booking` | The GHL calendar link, the button wording, and the photo-upload URL. Section 1 above. |
| `hero` | The two fullscreen videos behind the opening headline — one wide, one vertical. See below. |
| `walkthroughs` | The work grid. Section 2 above. |
| `beforeAfter` | The drag-to-compare sliders in the "Better walkthroughs" section. Section 3 above. |
| `problemGrid` | The nine photos in the "same eight photos" grid. |
| `testimonials` | The quotes on `testimonials.html`. **Empty right now** — see below. |
| `pricing` | Every price on the site. Section 4 above. |
| `faq` | The questions and answers at the bottom. |
| `marquee` | The scrolling strip under the hero. |

Headline and body copy live directly in `index.html` — search for the text you want to
change. Colours and fonts are the `--void` / `--amber` / `--bone` variables at the very top
of `css/site.css`.

### Swap the hero video

The hero has **two** files, because a phone screen is tall and a laptop screen is wide:

```js
hero: {
  video:  'videos/hero-estate.mp4',            // wide screens, 16:9
  poster: 'img/hero-estate.jpg',
  videoPortrait:  'videos/hero-estate-portrait.mp4',   // phones, 9:16
  posterPortrait: 'img/hero-estate-portrait.jpg',
},
```

The page picks by screen shape, so a phone gets the full vertical frame instead of a
narrow slice out of the middle of a wide one. Set only `video` and it is used everywhere.

Both are built from the same vertical master. If you shoot a new one vertically:

```bash
# wide version - crop a 16:9 band out of the vertical frame.
# the last number (620) is how far down the crop sits; raise it to show
# more ground, lower it to show more sky.
ffmpeg -i master.mov -an -vf "crop=1080:608:0:620,scale=1280:720"   -c:v libx264 -crf 26 -preset slow -movflags +faststart videos/hero-estate.mp4

# vertical version - just scale it down.
ffmpeg -i master.mov -an -vf "scale=720:1280"   -c:v libx264 -crf 27 -preset slow -movflags +faststart videos/hero-estate-portrait.mp4

# a poster frame for each
ffmpeg -ss 1.4 -i master.mov -vf "crop=1080:608:0:620,scale=1280:-2" -frames:v 1 -q:v 4 img/hero-estate.jpg
ffmpeg -ss 1.4 -i master.mov -vf "scale=720:-2" -frames:v 1 -q:v 4 img/hero-estate-portrait.jpg
```

Keep each under about 4 MB — they autoplay on every visit, including on phone data.

### Where their photos land — **this one still needs you** (~4 min)

The site tells people the fastest option is to **paste a listing link**, because if the
property is published anywhere you can pull the full-size photos yourself. Most people will
do that and upload nothing. `uploadUrl` is for everyone else.

A **Google Form** with a *File upload* question is easiest — files land straight in your
Drive. Make one at [forms.new](https://forms.new) signed in as
`admin.walkthroughstudio@gmail.com`, ask for name / email / address / listing link / photos
/ anything not to show / pacing, then **Send → 🔗 → Copy** and paste it into `uploadUrl`.

> Google requires anyone using a **File upload** question to be signed into a Google
> account. That is Google's rule. It is why `uploadEmbed` is `false` by default — a sign-in
> prompt looks alarming inside an embedded box and completely normal on its own tab.

**Alternatives with no Google sign-in:** a
[Dropbox File Request](https://www.dropbox.com/requests), or a WeTransfer/Jumpshare upload
page. Any of them goes in `uploadUrl` and the site treats it the same way.

**`uploadUrl` is still blank.** Until you fill it in, the "send your property" button is
an email link with the intake questions pre-written — which works, but every submission
lands in your inbox rather than in one folder you can build from.

Once you paste a Form or File Request URL into `uploadUrl`, the button points at it and
the site adds a line telling people their files land straight in the folder you work from.
That line only appears when the URL is actually set, so the site never promises a folder
that does not exist.

### Add a testimonial

`testimonials.html` builds itself from the `testimonials` list in `js/config.js`, so you
never touch the HTML. **While the list is empty the page still works** — it shows an honest
"nothing here yet — on purpose" panel and sends people to the work instead.

```js
testimonials: [
  {
    quote:    'Posted it the same afternoon and it did more numbers than anything else ' +
              'on the account that month.',
    name:     'Jane Doe',
    role:     'Owner',                 // optional
    company:  'Cascade Stays',         // optional
    location: 'Bend, OR',              // optional — shows as a small tag
    feature:  false,                   // true = double-width card
  },
],
```

Two things worth holding to: use their words rather than tidying them into marketing copy,
and always get the name and company. An anonymous "great service!" reads as invented, which
costs you more than having no testimonials at all.

---

## 6. Preview it properly

Double-clicking `index.html` works for most things, but browsers restrict a few features on
local files — video seeking, and any embedded calendar. To see it exactly as visitors will:

```bash
cd "c:\Users\noahi\lead generation\website"
npx serve
```

Then open the `localhost` address it prints. Press `Ctrl+C` to stop.

> **Test the calendar on a real address, not locally.** Booking embeds are usually blocked
> on `file://` addresses. That is not a bug in the site — use `npx serve`, or just check it
> after you deploy.

---

## 7. Put it online

The whole `website` folder is the site. Any static host works.

**Netlify Drop — easiest, no account needed to test**
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the `website` folder onto the page
3. It's live in about ten seconds on a temporary address
4. Make a free account to keep it and connect a custom domain

**Cloudflare Pages** — free, fast, good for video. Create a project, choose *Direct
Upload*, drag the folder in.

**GitHub Pages** — free, but you need a repo and it's the fiddliest of the three.

Both Netlify and Cloudflare serve `book.html` at `/book` automatically, so you can hand out
`walkthroughstudio.com/book` as a clean booking link in emails and DMs.

### After it's live

Update the outreach apps so your emails link to it. In each console's Settings, set the
**calendar link** field to your `/book` URL — `outreach/` (port 4300),
`shortform-outreach/` (4303), `fb-outreach/` (4302) and `x-outreach/` (4301) all have that
field and all of them are currently blank, which is why no email you've sent has had a
booking link in it.

---

## 8. Notes on what's deliberately absent

- **No analytics or tracking pixels.** There are none on the site at all — no Google
  Analytics, no Meta pixel, nothing. If you add one, put it in the `<head>` of each of the
  three HTML files.
- **No pricing.** Your call scripts say not to quote before the prospect has seen what it
  does for their own listing, so the FAQ points that question at the call instead.
- **No invented testimonials or client logos.** There are no real ones yet, and making them
  up on a site aimed at professional operators isn't worth the risk.
- **No performance statistics.** No "3x more bookings", no watch-through percentages.
- **Nothing is labelled as client work by default.** Every entry says SAMPLE unless you
  explicitly mark it `status: 'client'`.
- **The site never says you shoot on location.** It says you work from photos the client
  already has, which is what actually happens.

---

## 9. Troubleshooting

**The hero video doesn't play.**
Phones and some browsers only autoplay videos that are muted — it already is. If it still
won't play, the file is probably too big; re-compress with a higher `-crf`.

**A video card is blank.**
The path in `config.js` doesn't match the real filename. Check spelling and capitalisation
— `MyVideo.mp4` and `myvideo.mp4` are different files on a web server even though Windows
treats them as the same.

**The booking box is empty, or says "refused to connect".**
Either `calendarUrl` is still blank, you're viewing the page as a local `file://` address,
or GHL is restricting which domains may embed that calendar. See section 1.

**A card says CLIENT PROJECT and shouldn't.**
Change its `status` to `'sample'`, or delete the `status` line entirely — the default is
SAMPLE.

**The whole grid disappeared and shows placeholder tiles.**
`config.js` has a syntax error, usually a missing comma after a `}` or a stray apostrophe.
Open the browser console (F12) — it prints the line number.

**Something looks stuck or half-faded-in.**
Hard-refresh with `Ctrl+Shift+R` to clear the cached CSS.

**The page feels heavy on mobile data.**
Re-compress your videos at a higher `-crf` (28–30). The portfolio videos only download when
someone actually clicks one, so the hero loop is the file that matters most.
