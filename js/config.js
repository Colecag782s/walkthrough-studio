/* ==========================================================================
   WALKTHROUGH STUDIO — SITE CONFIG
   ==========================================================================

   This is the only file you need to edit. Everything on the site reads from
   here: your contact details, the booking link, every sample video, the
   before/after sliders and the FAQ.

   Nothing here needs a build step. Save the file, refresh the page, done.

   Rules of thumb:
     - Text goes in 'single quotes'. Keep the quotes.
     - Every item in a list ends with a comma.
     - If you want an apostrophe inside single quotes, write it as \'
       e.g. 'the owner\'s listing'
   ========================================================================== */

const CONFIG = {

  /* ------------------------------------------------------------------
     1. CONTACT — appears in the nav, the booking section and the footer
     ------------------------------------------------------------------ */
  contact: {
    name:    'Cole',
    role:    'Founder, Walkthrough Studio',
    phone:   '904-489-5085',
    email:   'admin.walkthroughstudio@gmail.com',
    // Where you're based. Shown in the footer. Leave as '' to hide it.
    based:   'Jacksonville, FL — working with operators nationwide',
  },


  /* ------------------------------------------------------------------
     2. BOOKING + PHOTO INTAKE  (section 07 of the site)
     ------------------------------------------------------------------

     The site runs a two-step flow:
       Step 01  they send you a listing / photos
       Step 02  they book the 15-minute Google Meet

     so that the sample walkthrough is already built by the time you get
     on the call. Both steps have their own URL below.

     Everything works with these left blank — step 01 falls back to an
     email link with the intake questions pre-written, and step 02 falls
     back to a call-or-text card. Nothing ever looks broken. But filling
     them in is what makes the site work without you lifting a finger.

     See README.md section 1 for the click-by-click setup.
     ------------------------------------------------------------------ */
  booking: {

    /* --- THE BOOKING LINK (GoHighLevel) ------------------------------
       GoHighLevel is the CRM of record, so the booking link here must be
       your GHL calendar. Do not swap in a Calendly link - a booking made
       anywhere else never reaches the pipeline.

       Paste EITHER form and the site works the rest out for itself:

         a) the plain booking URL, which looks like
              https://api.leadconnectorhq.com/widget/booking/AbC123xyz
            or
              https://link.msgsndr.com/widget/booking/AbC123xyz

         b) the whole embed snippet GHL hands you - the block that starts
            with <iframe src="..."> . Paste it between BACKTICKS so the
            quotes inside it do not break this file:

              calendarUrl: `<iframe src="https://api.leadconnectorhq.com/widget/booking/AbC123xyz"></iframe>`,

       Where to find it in GHL:
         Calendars -> the calendar you want -> Share / Embed.
         "Permanent link" gives you (a). "Embed code" gives you (b).

       Leave it blank and nothing breaks. Every Book a Call button falls
       back to a call-or-text card, so the page never shows an empty box.
       ---------------------------------------------------------------- */
    calendarUrl: 'https://api.leadconnectorhq.com/widget/booking/gcKyKwA4n1nRvlifmsoj',

    /* true  = the calendar is embedded directly in the page
       false = the buttons open the GHL booking page in a new tab

       Leave this true. Flip it to false only if the embed refuses to
       load: some GHL sub-accounts restrict which domains may embed a
       calendar. The real fix is to allow your domain inside GHL, but
       false gets you a working booking button in the meantime. */
    calendarEmbed: true,

    /* The words on every booking button - hero, mobile menu, footer, the
       booking section and the /book page. Change it here and it changes in
       all of them. This should match what the GHL calendar is called, so
       the button and the page they land on say the same thing. */
    ctaLabel: 'Schedule Your Discovery Call',

    /* The nav bar at the top has room for about 3 words before the button
       wraps onto two lines and starts crowding the menu icon on a phone.
       So the nav uses this shorter version instead. Everywhere else uses
       the full ctaLabel above. Set it to '' to use the full label there
       too. */
    ctaLabelShort: 'Book a Call',

    /* How long the call is. Printed next to the buttons.
       The GHL calendar 'Walkthrough Studio - Discovery Call' is set to
       15 minutes, so keep these two in agreement. */
    duration:  '15 minutes',

    /* How long you need between someone sending a property and the call,
       so the sample walkthrough is finished before you get on it. This
       number is printed everywhere the site tells people when to book.
       Change it here and it changes in all of them. */
    leadTime:  '48 hours',

    /* --- STEP 01: where their photos go ------------------------------
       A Google Form with a "File upload" question is the easiest way -
       the files land straight in your Drive. Make one, hit Send, click
       the link icon, copy the URL, paste it here.

       A Dropbox File Request link works too, as does any upload page.

       Leave blank and the button becomes an email link instead, with
       the intake questions already written into the message.
       ---------------------------------------------------------------- */
    uploadUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfBCIjlOsfWk6BXG_t-glJWdy7ubTEU0c0I6s7m6-KIfK_Ykg/viewform',

    /* Set true to show the upload form inline in the page instead of
       opening it in a new tab. Off by default: a Google Form with a file
       upload question forces a Google sign-in, which looks alarming in
       an embedded box but is perfectly normal on its own page. */
    uploadEmbed: false,
  },


  /* ------------------------------------------------------------------
     3. HERO — the fullscreen video behind the opening headline
     ------------------------------------------------------------------
     Keep these files small (under ~4 MB each). They autoplay on every
     visit, including on phone data. See README.md for the commands.

     There are two, because a phone screen is tall and a laptop screen is
     wide. Give the page one of each and it picks; give it only `video`
     and that one is used everywhere.
     ------------------------------------------------------------------ */
  hero: {
    /* Wide screens. Cropped to 16:9 out of the vertical master. */
    video:  'videos/hero-estate.mp4',
    poster: 'img/hero-estate.jpg',

    /* Phones and anything taller than it is wide. The full vertical frame,
       so nothing important is cropped away on the screen most people will
       actually see this on. */
    videoPortrait:  'videos/hero-estate-portrait.mp4',
    posterPortrait: 'img/hero-estate-portrait.jpg',
  },


  /* ==================================================================
     4. THE WALKTHROUGHS  -  the one list that fills the work grid
     ==================================================================

     This is the list you edit. Add a walkthrough by pasting one { ... }
     block in. Remove one by deleting its block. You never touch the
     HTML, the CSS or site.js to do either.

     THE FIELDS
       title     what the card says.               REQUIRED
       location  'Portland, OR'                    optional
       type      'Single-family - 4 bed'           optional
                 location and type print together under the title.
       video     the walkthrough itself.           REQUIRED
                 Either a file you dropped in videos/ :
                     video: 'videos/my-property.mp4'
                 or a link to one already hosted - YouTube, Vimeo and
                 Loom all work, paste the ordinary share link:
                     video: 'https://youtu.be/dQw4w9WgXcQ'
                     video: 'https://vimeo.com/123456789'
                     video: 'https://www.loom.com/share/abc123'
       thumb     the still shown before it plays.  optional
                 'img/my-property.jpg'. Leave it out and the card falls
                 back to a plain dark tile - nothing breaks.
       duration  '0:28'. Printed on the thumbnail. optional
       status    the badge in the corner of the card. One of:
                     'sample'  ->  SAMPLE          (the default)
                     'client'  ->  CLIENT PROJECT
                     'none'    ->  no badge at all
                 LEAVE IT OUT AND YOU GET "SAMPLE". Nothing is ever
                 labelled as client work unless you type 'client'
                 yourself, so a new entry can never accidentally claim
                 a paid job you have not done.
       label     your own wording instead of the badge above, e.g.
                 label: 'Free build'. Overrides status.
       feature   true makes the card twice as wide. Use it on your best
                 one, and only once the list has three or more.

     TO ADD ONE
       1. Drop the .mp4 into  videos/   (or skip this for a hosted link)
       2. Drop a still frame into  img/
       3. Copy the commented block at the bottom of this list, paste it
          above the closing ], and fill it in.
       4. Save. Refresh the page. That is the whole job.

     The grid looks best with 3, 6 or 9 entries.
     ================================================================== */
  walkthroughs: [
    {
      title:    'Dusk Estate',
      location: 'Florida',
      type:     'Luxury home - pool & deck',
      video:    'videos/dusk-estate.mp4',
      thumb:    'img/dusk-estate.jpg',
      duration: '0:17',
      status:   'sample',
      feature:  true,
    },
    {
      title:    'Mountain View',
      location: 'Yosemite National Park',
      type:     'Cabin - bunk room & hot tub',
      video:    'videos/cabin.mp4',
      thumb:    'img/cabin.jpg',
      duration: '0:15',
      status:   'sample',
      feature:  false,
    },

    // ---- COPY FROM HERE ----------------------------------------------
    // {
    //   title:    'Property name',
    //   location: 'City, ST',
    //   type:     'Condo - 2 bed',
    //   video:    'videos/your-file.mp4',
    //   thumb:    'img/your-poster.jpg',
    //   duration: '0:30',
    //   status:   'sample',
    //   feature:  false,
    // },
    // ---- TO HERE -----------------------------------------------------
  ],


  /* ==================================================================
     5. THE COMPARISONS  -  the drag-to-compare sliders
     ==================================================================

     Same idea as the list above: one block per comparison, edited only
     here. Each one pairs a flat listing photo with the clip built from
     that exact photo. They must be the same shot, or the comparison
     falls apart.

       room      'Kitchen'. Printed on the slider.   REQUIRED
       still     the flat listing photo.             REQUIRED
       video     the clip made from that photo.      REQUIRED
                 A local file in videos/ . A hosted link cannot be used
                 here - the slider has to play the clip inline, silently.
       location  'Portland, OR'                      optional
       status    same badge rules as the walkthroughs above:
                 'sample' (the default), 'client', or 'none'.
       label     your own wording instead of the badge.

     Keep these clips short (2-4 seconds) and small - they autoplay
     silently as soon as they scroll into view.

     Delete every block and the whole section removes itself from the
     page and from the nav. Nothing is left half-empty.
     ================================================================== */
  beforeAfter: [
    { room: 'The approach', still: 'img/ba-front-still.jpg',  video: 'videos/ba-front.mp4',  status: 'sample' },
    { room: 'Dining room',  still: 'img/ba-dining-still.jpg', video: 'videos/ba-dining.mp4', status: 'sample' },
    { room: 'Pool at dusk', still: 'img/ba-pool-still.jpg',   video: 'videos/ba-pool.mp4',   status: 'sample' },

    // ---- COPY FROM HERE ----------------------------------------------
    // { room: 'Living room', still: 'img/ba-living-still.jpg', video: 'videos/ba-living.mp4', status: 'sample' },
    // ---- TO HERE -----------------------------------------------------
  ],


  /* ------------------------------------------------------------------
     6. THE PROBLEM GRID — real listing photos used in section 03
     ------------------------------------------------------------------
     These get desaturated on purpose, to make the "every listing looks
     the same" point. Nine images fills the grid neatly.
     ------------------------------------------------------------------ */
  problemGrid: [
    'img/grid-01_exterior_approach.jpg',
    'img/grid-02_living_front.jpg',
    'img/grid-03_living_hub.jpg',
    'img/grid-04_living_peek_kitchen.jpg',
    'img/grid-05_kitchen_wide.jpg',
    'img/grid-06_kitchen_counter.jpg',
    'img/grid-07_bedroom.jpg',
    'img/grid-08_deck.jpg',
    'img/grid-09_exterior_orbit.jpg',
  ],


  /* ------------------------------------------------------------------
     7. TESTIMONIALS  ->  testimonials.html
     ------------------------------------------------------------------

     This list fills the Testimonials page. It is deliberately empty for
     now: a made-up quote on a site aimed at professional operators is not
     worth the risk. While it is empty the page still works — it shows an
     honest "nothing here yet, on purpose" panel and points people at the
     work instead. Nothing looks broken.

     TO ADD ONE: copy the block below, paste it inside the [ ], fill it in.
     Save, refresh testimonials.html. That is the whole job.

       quote    what they actually said. Their words, not tidied up.
       name     who said it
       role     their job title            (optional)
       company  where they work            (optional)
       location the property or the city   (optional, shows as a small tag)
       feature  true makes the card twice as wide. Use it on your best
                one, and only once you have three or more.
     ------------------------------------------------------------------ */
  testimonials: [
    // ---- copy from here ----
    // {
    //   quote:    'Posted it the same afternoon and it did more numbers than anything ' +
    //             'else on the account that month.',
    //   name:     'Jane Doe',
    //   role:     'Owner',
    //   company:  'Cascade Stays',
    //   location: 'Bend, OR',
    //   feature:  false,
    // },
    // ---- to here ----
  ],


  /* ==================================================================
     8. PRICING
     ==================================================================

     Everything here is a plain number - no dollar signs, no text. The page
     formats them and works out the per-video figures for you, so the maths
     shown on the site can never drift out of step with the prices.

     ONE-OFF
       videos   how many walkthroughs in the pack
       price    what the whole pack costs
       best     true puts the "best value" marker on one row

     RETAINERS
       name     what the plan is called
       monthly  the monthly price
       videos   how many walkthroughs are included each month
       extra    the price of one additional video that month
       feature  true highlights one plan as the recommended one
       custom   true turns the card into a "contact for pricing" card

     To change a price, change the number. To remove a plan, delete its
     block. Delete every block in both lists and the whole pricing section
     removes itself from the page and from the nav.
     ================================================================== */
  pricing: {

    /* Small print under the one-off table. Leave as '' to hide it. */
    note: 'Every walkthrough comes as three cuts \u2014 vertical, horizontal and a ' +
          'short teaser. The files are yours to keep and post.',

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
      {
        name:   'Custom',
        custom: true,
        blurb:  'More than fourteen a month, or a whole portfolio to work ' +
                'through. Tell me the volume and I will price it.',
      },
    ],
  },


  /* ------------------------------------------------------------------
     9. FAQ
     ------------------------------------------------------------------ */
  faq: [
    {
      q: 'When should I book the call?',
      a: 'Send the property first, then book any slot at least 48 hours later. That gap is ' +
         'what lets me have your walkthrough finished and ready to play before we speak. ' +
         'Book sooner than that and I may not have it done, so we would spend the call ' +
         'talking about the work instead of watching it.',
    },
    {
      q: 'Do I have to send photos before I book?',
      a: 'It is much better if you do. I build your sample walkthrough from those photos ' +
         'before the call, so instead of watching somebody else\'s demo reel you spend the ' +
         'fifteen minutes watching your own property. If you book first and send photos ' +
         'after, that is fine too — I will just build it between the booking and the call ' +
         'if there is time, or we use the Meet to pick the property and I send the finished ' +
         'video straight after.',
    },
    {
      q: 'What is the fastest way to send a property?',
      a: 'Send the listing link. If the property is live on a listing site, your own website, ' +
         'or a booking platform, I can pull the full-size photos from it myself and you do ' +
         'not have to upload anything at all. Photos are only necessary when nothing is ' +
         'published yet.',
    },
    {
      q: 'Do you come out and film the property?',
      a: 'No, and that is the point. I work from the listing photos you already have. ' +
         'Nobody has to be let into the unit, nothing has to be staged, and you do not ' +
         'have to find a window when the property is empty. You send photos and an address, ' +
         'you get video back.',
    },
    {
      q: 'How many photos do you need?',
      a: 'Three good ones is the floor. Below that there is not enough of the property to ' +
         'build a walkthrough that feels real. Eight to twelve is the sweet spot, and more ' +
         'rooms covered means a stronger tour. If you have a full listing gallery, send the ' +
         'whole thing and I will pick.',
    },
    {
      q: 'What if my photos are low resolution?',
      a: 'Tell me where the listing is live and I will usually pull the full-size originals ' +
         'myself. Listing sites serve small thumbnails by default, and those are too small to ' +
         'drive good video. If nothing high-res exists anywhere, I will say so up front rather ' +
         'than deliver something soft.',
    },
    {
      q: 'What do I get back?',
      a: 'Three cuts of the same walkthrough: a vertical one for Reels and TikTok, a ' +
         'horizontal one for the listing and your website, and a short teaser for stories. ' +
         'Delivered as files. You own them and you post them on your own terms.',
    },
    {
      q: 'How long does it take?',
      a: 'Days, not weeks. The exact number depends on how many properties are in the batch, ' +
         'and I will give you a real date on the call rather than a vague promise here.',
    },
    {
      q: 'Does it look like AI?',
      a: 'That is the thing I spend the most effort on. Every shot is one slow continuous ' +
         'camera move, never two combined, with the movement scaled to the size of the room. ' +
         'No warping walls, no melting furniture, no objects that were not in your photo. ' +
         'Every clip gets checked frame by frame against the original photo before it goes ' +
         'into the edit, and anything that drifts gets re-run. Watch the samples and judge it ' +
         'yourself.',
    },
    {
      q: 'Can you match my branding?',
      a: 'Yes. Logo, colours, an end card, and the pacing and music vibe are all yours to ' +
         'choose. Tell me slow and luxury or upbeat and quick, and whether you want calm ' +
         'piano, something with a pulse, or no music at all.',
    },
    {
      q: 'What does it cost?',
      a: 'Every price is on this page — scroll up to the pricing section. One-off walkthroughs ' +
         'start at $95 and the per-video price drops as the batch gets bigger. If properties ' +
         'turn over regularly, a monthly retainer works out cheaper again. Nothing is hidden ' +
         'and there is no quote to wait for. The first one is still free, so you can see what ' +
         'it does for one of your own listings before you spend anything.',
    },
    {
      q: 'What is the catch on the free one?',
      a: 'There isn\'t one. I make a walkthrough from one of your real listings, you keep the ' +
         'file whether or not you ever pay me anything, and you can post it the same day. ' +
         'I would rather show you than talk you into it.',
    },
  ],


  /* ------------------------------------------------------------------
     10. MARQUEE — the scrolling strip under the hero
     ------------------------------------------------------------------ */
  marquee: [
    'Three cuts delivered',
    'No shoot required',
    'No crew in the unit',
    'Nothing to schedule',
    'Days, not weeks',
    'Built from photos you already have',
    'The first one is free',
  ],
};
