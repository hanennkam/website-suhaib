# Redesign Concepts — Ahmad Suhaib

## Audit of the current build

The current site is a single `index.html` (≈99 KB, inline CSS/JS) using Three.js r128, GSAP 3.12 + ScrollTrigger, Lenis, and Google Fonts. Its content is strong, but its experience is conventional:

- Hero with a floating torus-knot sculpture + particles (generic "creative dev" signifier).
- Sections stacked as About → Ventures → Work → Experience → Contact, all using the same card/reveal grammar.
- WebGL is decorative; it does not carry meaning or lead anywhere.
- Project cards are uniform in layout even though the projects are wildly different.
- The four ventures are visually identical cards with different accent colours.
- No reduced-motion or no-WebGL alternative beyond hiding the canvas.

The rebuild should keep the factual content and replace the architecture with an authored sequence of visual chapters.

---

## Concept 01 — THE SIGNAL ARCHIVE (selected)

**Visual direction**
Obsidian black, bone paper, signal orange and ice cyan. Chrome/glass monolith, editorial grotesque type, serif italic counterpoint, mono metadata. The page reads like an archive of a person's transmissions rather than a CV.

**Interaction design**
- A cinematic boot sequence calibrates, then a crystalline monolith assembles from shards while the name is revealed.
- The intro is a real stage: cursor parallax, draggable orbit, particles that react to the pointer.
- A pinned word-by-word manifesto turns scroll into a spoken statement.
- "The Universe" is a genuine 3D domain map: Code, AI, Creative, Enterprise. Selecting a domain moves the camera, opens a content panel, and links to the exact projects or ventures.
- Selected Work becomes a pinned horizontal film: six full-screen project scenes, each with a different layout, palette, and interactive technical diagram.
- Ventures become five immersive "worlds", each with its own art direction and one real interaction (terminal, photobooth shutter, film strip, apparel pattern customizer, ecosystem map).
- The record is an editorial ledger; contact is a typographic finale.

**Section structure**
1. Arrival — cinematic intro + monolith
2. Operator — pinned manifesto + capability ledger
3. Universe — interactive 3D domain map
4. Selected Work — horizontal project film
5. Worlds — five venture environments
6. Record — honours, education, availability
7. Transmit — contact finale

**3D strategy**
- Three.js r128 + custom shaders for the intro monolith, shard field, orbital rings, and particle atmosphere.
- A second Three.js scene for the Universe: a central core, four distinct node sculptures, orbit lines, raycasting, drag-to-orbit, DOM-accessible node controls.
- Render loops pause off-screen; DPR capped; particle/instance counts reduced on mobile.
- Reduced-motion: static CSS monolith, non-WebGL universe cards, vertical project stack, no autoplay motion.

**Animation references**
Bruno Simon's spatial playfulness, Active Theory's cinematic pacing, Apple's product choreography, Resn's editorial weirdness, Awwwards-winning horizontal project reels.

**Why it wins**
It is the strongest balance of ambition and legibility. The WebGL is meaningful (the monolith is the identity; the universe is the navigation), the content stays factual and readable, and every signature scene has a clear fallback. It also fits a static single-page deployment without requiring a build pipeline.

---

## Concept 02 — THE CARTOGRAPHER

**Visual direction**
A living topographic world: cream terrain, survey lines, coordinate typography, sun-bleached colour, and one deep teal accent. The portfolio is a landscape to fly over.

**Interaction design**
Scroll becomes altitude: the camera flies over a WebGL heightfield; each project is a landmark with a beacon. Selecting a beacon opens a field note. Ventures are climate zones with their own weather.

**Section structure**
Departure → Terrain → Landmarks → Climates → Field Notes → Basecamp.

**3D strategy**
Three.js heightfield with vertex displacement, fog, instanced trees/beacons, camera spline tied to scroll. Heavy on mobile; requires aggressive LOD and a 2D map fallback.

**Why not selected**
Beautiful and spatial, but the metaphor makes dense technical content harder to read, and the camera-on-rails approach reduces user agency. Higher performance risk for little gain in content clarity.

---

## Concept 03 — THE PRINT ROOM

**Visual direction**
Monochrome editorial gallery: paper, ink, crop marks, oversized serif/grotesque mixes, red registration accents. Motion behaves like ink, cropping, and print registration.

**Interaction design**
The page is a sequence of kinetic posters. Projects are spreads; hovering pulls a print proof; ventures are issue covers; contact is a colophon. A single WebGL letterform sculpture anchors the opening.

**Section structure**
Cover → Manifesto spread → Portfolio inserts → Venture issues → Colophon.

**3D strategy**
One sculptural typographic object (extruded/refracted "AS" mark) plus DOM-driven print transitions. Minimal WebGL, maximum typography.

**Why not selected**
It has exceptional taste and performance, but it is less of a "digital world" and more of an editorial site. The brief explicitly asks for immersive environments and explorable 3D, which Concept 01 delivers more completely.

---

## Selection

**Concept 01 — THE SIGNAL ARCHIVE.** It treats the portfolio as a navigable system: an identity artefact at the entrance, a domain map that is also the navigation, a horizontal film for the work, and separate visual worlds for the businesses. It provides the strongest canvas for both visual ambition and factual storytelling while remaining shippable as a static site with robust fallbacks.
