# Visual Refinement Audit — The Signal Archive

## 1. Strengths to preserve

- **The Signal Archive identity**: obsidian / bone / signal orange, Archivo + Instrument Serif + JetBrains Mono, mono metadata, and ruled editorial layouts.
- **The cinematic opening**: the custom shader monolith, orbital shards, name reveal, and the transition into chapter 01. This remains the strongest authored moment on the site.
- **The domain universe**: the 3D map is meaningful navigation, not decoration. Keep the raycasting, drag-to-orbit, accessible domain controls, and the linked content panel.
- **The horizontal work reel**: the pinned, snapping six-project film is a distinctive structural idea. Keep it.
- **The venture worlds**: five full-bleed identities with real interactions. The colour separation and type scale work.
- **Technical transparency**: the illustrations are labelled as illustrative / schematic, and the site explicitly distinguishes authored 3D objects from photography. This should remain.

## 2. Sections that feel flat, empty, or repetitive

- **Operator / manifesto**: the typographic statement is strong, but the right/lower half is a large empty field with no physical anchor.
- **Selected Work**: the project scenes are visually different in colour but all use the same abstract diagram/console grammar. The human and material context of the work is missing.
- **Artefacts**: the three Blender objects are technically impressive, but the section reads as a generic 3D viewer. The huge cropped camera is the focal point; there is no real-world reference point.
- **Worlds cover**: the large type is excellent; the chapter is slightly abstract before the first venture arrives.

## 3. Sections lacking human or physical context

- **Sejenak** is represented by an abstract photobooth strip and a 3D kiosk, with no event, guests, print or camera context.
- **Tinta Visuals** is represented by abstract red gradients, not a set, camera, crew or edit suite.
- **BVRCODE** is represented by a flat jersey illustration and pattern swatches, not fabric, printing, stitching or a product shot.
- **DevXMedia** is represented by a terminal only, with no workspace or human craft.
- **HistoScan, Duits, Agents, Invoicing**: the technical diagrams are useful, but there is no laboratory, receipt, desk, or paperwork image to ground them.

## 4. 3D assets: retain / improve / remove

| Asset | Verdict | Reasoning |
| --- | --- | --- |
| **Monolith intro** | **Retain** | It is the site's signature; custom shader and interaction justify its place. |
| **Universe map** | **Retain** | It functions as navigation; remove only if it breaks performance or accessibility. |
| **Photobooth kiosk GLB** | **Retain, contextualise** | It is the most relevant object; pair it with real event photography so it does not float in a vacuum. |
| **Mirrorless camera GLB** | **Retain, demote** | Well authored, but generic and redundant as a giant hero. It is now the second tab behind the more specific Sejenak kiosk, and the section includes a real gear reference. |
| **BVRCODE jersey GLB** | **Retain, do not lead with it** | The model reads as a plain shirt rather than a sublimated jersey. Keep the interactive viewer as an appendix, but lead BVRCODE with real fabric/printing/jersey imagery. |
| **New 3D** | **Do not add** | The site already has enough WebGL. The upgrade should be photography, layout, and material context. |

## 5. Opportunities

1. Build an **editorial photography layer**: local, licensed Pexels images used as context—never as documentation of actual clients, teams or events.
2. Add **layered compositions** to Operator, Sejenak, Tinta, BVRCODE, DevXMedia, Artefacts and selected project scenes.
3. Introduce **clipped masks, overlapping captions, and small physical artefacts** (a receipt, a jersey, a camera rig) to make the work feel handled rather than rendered.
4. Use **parallax only on vertical chapters**; keep the horizontal reel fast and stable.
5. Reduce the Artefacts camera dominance and add a real workshop reference image.
6. Make every photograph carry a clear **"context / licensed stock" caption** and add a credits file. No ambiguity.

## Implementation direction

Preserve the complete chapter architecture and all existing interactions. Add one local photo library, one `photos.css`, and small markup/JS enhancements. Keep the 3D sections; do not add new 3D.

## Implemented changes

- Added a locally hosted, licensed Pexels photo library (`assets/photos/`) with credits and explicit stock-context captions.
- Operator now has a layered studio collage instead of an empty right field.
- HistoScan, Duits and Agent Systems now carry small physical-context photo cards.
- DevXMedia pairs its terminal with a workspace photograph and an operations-paperwork detail.
- Sejenak leads with a representative event-photobooth photograph and a neon-sign detail, while keeping the working shutter demo.
- Tinta's filmstrip now plays three real production stills inside the existing interactive player.
- BVRCODE now leads with sublimation production and jersey reference photography; the pattern customiser is retained as a floating physical sample card.
- The Worlds cover gained a photographic index of all six identities.
- Artefacts now includes a real workshop-gear reference beside the authored object viewer, and the exhibit copy frames the 3D as object study rather than spectacle.
- No new 3D was added. All existing interactions remain intact.
