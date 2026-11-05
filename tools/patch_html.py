"""One-shot, assertion-guarded integration of the artefacts exhibit into index.html."""

import re

P = "index.html"
s = open(P, encoding="utf-8").read()
orig_len = len(s)


def sub_once(old, new, label):
    global s
    assert s.count(old) == 1, "anchor %r found %d times" % (label, s.count(old))
    s = s.replace(old, new)
    print("ok:", label)


# 1) stylesheet
sub_once('<link rel="stylesheet" href="styles.css">',
         '<link rel="stylesheet" href="styles.css">\n<link rel="stylesheet" href="artefacts.css">',
         "artefacts.css link")

# 2) model loaders + viewer (defer keeps execution order after three.min.js)
sub_once('<script src="main.js" defer></script>',
         '<script src="https://unpkg.com/three@0.128.0/examples/js/loaders/GLTFLoader.js" defer></script>\n'
         '<script src="https://unpkg.com/three@0.128.0/examples/js/controls/OrbitControls.js" defer></script>\n'
         '<script src="main.js" defer></script>\n<script src="artefacts.js" defer></script>',
         "viewer scripts")

# 3) cross-links from the three relevant ventures
sub_once('''              <a class="world-link world-link-muted" href="https://github.com/hanennkam" target="_blank" rel="noopener" data-cursor="GITHUB">Terabooth recognition <span>↗</span></a>''',
         '''              <a class="world-link world-link-muted" href="https://github.com/hanennkam" target="_blank" rel="noopener" data-cursor="GITHUB">Terabooth recognition <span>↗</span></a>
              <button type="button" class="world-link" data-artefact-jump="photobooth" data-cursor="INSPECT">Inspect the kiosk in 3D <span>↗</span></button>''',
         "sejenak 3D link")

sub_once('''              <a class="world-link" href="#contact" data-cursor="INQUIRE">Inquire about coverage <span>↗</span></a>''',
         '''              <a class="world-link" href="#contact" data-cursor="INQUIRE">Inquire about coverage <span>↗</span></a>
              <button type="button" class="world-link" data-artefact-jump="camera" data-cursor="INSPECT">Inspect the camera in 3D <span>↗</span></button>''',
         "tinta 3D link")

sub_once('''              <a class="world-link world-link-muted" href="#contact" data-cursor="ORDER">Place an order <span>↗</span></a>''',
         '''              <a class="world-link world-link-muted" href="#contact" data-cursor="ORDER">Place an order <span>↗</span></a>
              <button type="button" class="world-link" data-artefact-jump="jersey" data-cursor="INSPECT">Inspect the jersey in 3D <span>↗</span></button>''',
         "bvrcode 3D link")

ARTEFACTS = '''
    <!-- 04 / ARTEFACTS — studio objects modelled + lit in Blender, exported as glTF -->
    <div class="artefacts" id="artefacts" aria-labelledby="artefactsTitle">
      <div class="artefacts-kicker">
        <span>04 / ARTEFACTS</span>
        <span>BLENDER &rarr; GLTF · REAL GEOMETRY · PBR</span>
      </div>
      <div class="artefacts-head">
        <div>
          <span class="eyebrow">STUDIO OBJECTS</span>
          <h2 id="artefactsTitle">Objects from<br><em>the workshop.</em></h2>
        </div>
        <p>The kit behind the five worlds &mdash; a mirrorless body, the Sejenak kiosk and a BVRCODE jersey. Each one is <b>modelled geometry</b>, not a photograph: built in Blender, lit with a three-point rig, exported as glTF. <b>Drag to orbit. Scroll to zoom.</b></p>
      </div>

      <div class="artefacts-stage is-loading" id="artefactStage">
        <canvas id="artefactCanvas" role="img" aria-label="Interactive 3D model viewer"></canvas>
        <div class="artefacts-fallback" id="artefactFallback" hidden>
          <img id="artefactFallbackImg" src="assets/models/camera.jpg" alt="Blender render of the mirrorless camera" width="760" height="760">
          <span>AUTHORED RENDER / 3D UNAVAILABLE</span>
        </div>
        <div class="artefacts-loader" id="artefactLoader"><span>LOADING GEOMETRY</span><i></i></div>
        <span class="artefacts-corner">REALTIME / WEBGL</span>
        <div class="artefacts-hud">
          <span id="artefactIndex">01 / 03</span>
          <span id="artefactSpec">CAMERA · 41.9K TRIS · 8 PBR MATERIALS</span>
          <span>DRAG TO ORBIT</span>
        </div>
      </div>

      <div class="artefacts-tabs" role="tablist" aria-label="Studio objects">
        <button type="button" class="artefacts-tab" role="tab" data-artefact="camera" aria-selected="true" tabindex="0">
          <span class="tab-num">01</span>
          <span class="tab-name">Mirrorless camera</span>
          <span class="tab-sub">Body &amp; 35 mm prime</span>
        </button>
        <button type="button" class="artefacts-tab" role="tab" data-artefact="photobooth" aria-selected="false" tabindex="-1">
          <span class="tab-num">02</span>
          <span class="tab-name">Photobooth kiosk</span>
          <span class="tab-sub">Sejenak / Terabooth</span>
        </button>
        <button type="button" class="artefacts-tab" role="tab" data-artefact="jersey" aria-selected="false" tabindex="-1">
          <span class="tab-num">03</span>
          <span class="tab-name">Sports jersey</span>
          <span class="tab-sub">BVRCODE sublimation</span>
        </button>
      </div>

      <dl class="artefacts-specs">
        <div><dt>Object</dt><dd data-spec="object">Mirrorless camera + 35 mm prime</dd></div>
        <div><dt>Build</dt><dd data-spec="build">Modelled in Blender 5.2</dd></div>
        <div><dt>Geometry</dt><dd data-spec="geometry">41,966 triangles · 1.2 MB glTF</dd></div>
        <div><dt>Materials</dt><dd data-spec="materials">Anodised alloy, rubber, chrome, coated glass</dd></div>
      </dl>

      <p class="artefacts-note">ORIGINAL 3D ARTEFACTS /&nbsp; These models were generated for this site. They are not photographs of equipment, premises, clients or events, and they do not depict real people.</p>
    </div>
  </section>'''

sub_once('''        <div class="world-index"><span>05 — 05</span><span>TEXTILE / MANUFACTURE</span></div>
      </div>
    </article>
  </section>''',
         '''        <div class="world-index"><span>05 — 05</span><span>TEXTILE / MANUFACTURE</span></div>
      </div>
    </article>
''' + ARTEFACTS,
         "artefacts section")

open(P, "w", encoding="utf-8").write(s)
print("index.html %d -> %d chars" % (orig_len, len(s)))
