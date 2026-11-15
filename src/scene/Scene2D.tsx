import type { SceneModel } from './sceneModel';

/**
 * Hand-drawn SVG diorama of the outpost (no image generator, no NASA insignia).
 * Every state-driven change is a data attribute on the root; scene.css turns those into light, colour and motion.
 * All words stay in HTML outside the SVG. This is the complete scene, not a placeholder for WebGL.
 */

// Deterministic starfield so screenshots are stable.
function stars(count: number): { x: number; y: number; r: number; o: number }[] {
  let seed = 20240511;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  return Array.from({ length: count }, () => ({ x: Math.round(next() * 1600), y: Math.round(next() * 260), r: 0.6 + next() * 1.4, o: 0.35 + next() * 0.65 }));
}
const STARS = stars(150);

const STREAKS = Array.from({ length: 34 }, (_, index) => ({
  x: -80 + index * 52 + ((index * 37) % 23),
  y: 20 + ((index * 61) % 330),
  length: 90 + ((index * 29) % 110),
  tier: index % 3, // 0: shown from "watch", 1 and 2: storm only
}));

const WINDOWS = [0, 1, 2, 3, 4];
const PLANTS = [0, 1, 2, 3, 4, 5];

export function Scene2D({ model, frame = 'wide' }: { model: SceneModel; frame?: 'wide' | 'base' }) {
  const rack = Array.from({ length: Math.max(model.goalSamples, model.samples) }, (_, index) => index < model.samples);
  // Phone shows the outpost band: solar, habitat, greenhouse and the drill. Sky and empty foreground stay out of frame.
  const viewBox = frame === 'base' ? '40 450 1200 530' : '0 0 1600 900';
  return (
    <svg
      className="scene"
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={model.description}
      data-power={model.power}
      data-oxygen={model.oxygen}
      data-crew={model.crew}
      data-stocked={model.shelterStocked}
      data-weather={model.weather}
      data-outcome={model.outcome}
      data-pulse={model.pulse ?? 'none'}
      data-resolving={model.resolving}
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#03050c" />
          <stop offset="0.7" stopColor="#0a1226" />
          <stop offset="1" stopColor="#1a2140" />
        </linearGradient>
        <radialGradient id="sunGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff6dd" stopOpacity="1" />
          <stop offset="0.12" stopColor="#ffe2b0" stopOpacity="0.9" />
          <stop offset="0.4" stopColor="#ffb86b" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ffb86b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0" stopColor="#e4d3b4" />
          <stop offset="0.28" stopColor="#b7a894" />
          <stop offset="0.62" stopColor="#6d7286" />
          <stop offset="1" stopColor="#2c334c" />
        </linearGradient>
        <linearGradient id="farRidge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8ea4c8" />
          <stop offset="0.45" stopColor="#3d4a68" />
          <stop offset="1" stopColor="#1a2238" />
        </linearGradient>
        <linearGradient id="nearGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c4b49a" />
          <stop offset="1" stopColor="#2a241c" />
        </linearGradient>
        <pattern id="cells" width="16" height="20" patternUnits="userSpaceOnUse">
          <rect width="16" height="20" fill="#0c3278" />
          <rect x="1" y="1" width="14" height="8" fill="#4aa3ff" />
          <rect x="1" y="11" width="14" height="8" fill="#1d6ec4" />
          <path d="M 0 0 H 16 M 0 10 H 16 M 0 0 V 20 M 8 0 V 20" stroke="#d7f4ff" strokeOpacity="0.55" strokeWidth="0.7" />
        </pattern>
        <pattern id="dust" width="90" height="54" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="16" r="1.5" fill="#1a1816" />
          <circle cx="40" cy="34" r="2.1" fill="#12141c" />
          <circle cx="68" cy="14" r="1.1" fill="#efe2cc" />
          <circle cx="78" cy="40" r="1.4" fill="#2c2a28" />
          <circle cx="24" cy="42" r="0.9" fill="#d9cbb4" />
        </pattern>
        <linearGradient id="groundDepth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#02030a" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="farWall" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6f6a6b" />
          <stop offset="0.5" stopColor="#3a3d4e" />
          <stop offset="1" stopColor="#1c2033" />
        </linearGradient>
        <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3ead8" />
          <stop offset="0.35" stopColor="#b9bcc8" />
          <stop offset="1" stopColor="#4d5368" />
        </linearGradient>
        <linearGradient id="metalDark" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8f93a3" />
          <stop offset="1" stopColor="#2c3145" />
        </linearGradient>
        <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9fe9ff" />
          <stop offset="0.5" stopColor="#2b6f9e" />
          <stop offset="1" stopColor="#152a52" />
        </linearGradient>
        <radialGradient id="domeGlow" cx="0.5" cy="1" r="1">
          <stop offset="0" stopColor="#b8ffcf" stopOpacity="0.85" />
          <stop offset="0.55" stopColor="#ac91ff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ac91ff" stopOpacity="0.06" />
        </radialGradient>
        <linearGradient id="berm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b5ab9b" />
          <stop offset="0.5" stopColor="#6b6a72" />
          <stop offset="1" stopColor="#2d3043" />
        </linearGradient>
        <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.72">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </radialGradient>
        <linearGradient id="horizonCool" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7ea6d8" stopOpacity="0" />
          <stop offset="1" stopColor="#7ea6d8" stopOpacity="0.28" />
        </linearGradient>
        <pattern id="stormHatch" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
          <rect width="18" height="18" fill="#ffd166" fillOpacity="0.06" />
          <rect width="5" height="18" fill="#ffd166" fillOpacity="0.5" />
        </pattern>
        <clipPath id="earthLit">
          <rect x="1214" y="100" width="40" height="90" />
        </clipPath>
        <clipPath id="domeClip">
          <path d="M 868 668 A 112 112 0 0 1 1092 668 Z" />
        </clipPath>
      </defs>

      {/* Sky */}
      <rect width="1600" height="900" fill="#000" />
      <g className="scene-stars">
        {STARS.map((star, index) => (
          <circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#edf4ff" opacity={star.o} />
        ))}
      </g>

      {/* Earth is a small phased disk: ocean, land and cloud. It is not a map of a real site. */}
      <g className="scene-earth" transform="translate(1410 168)">
        <circle className="scene-earth-ocean" cx="0" cy="0" r="34" fill="#1d4e89" />
        <path className="scene-earth-land" d="M -6 -20 C 8 -26 18 -8 8 2 C 16 10 2 18 -10 12 C -20 4 -18 -8 -6 -20 Z" fill="#6e8f45" />
        <path className="scene-earth-land" d="M 8 6 C 16 4 18 14 8 18 C 2 12 4 8 8 6 Z" fill="#c4a15a" />
        <path className="scene-earth-cloud" d="M -18 -4 q 8 -8 14 -1 q 6 -6 12 1 q -8 3 -12 0 q -6 5 -14 0 z" fill="#f7f4ee" />
        <path d="M 0 -34 A 34 34 0 0 0 0 34 A 18 34 0 0 1 0 -34 Z" fill="#05070c" />
        <circle cx="0" cy="0" r="34" fill="none" stroke="#f7f4ee" strokeWidth="1.5" />
      </g>

      {/* Space weather: streaks from the Sun side. Density is the cue, not colour alone. */}
      <g className="scene-weather" aria-hidden="true">
        {STREAKS.map((streak, index) => (
          <line
            key={index}
            className={`streak streak-${streak.tier}`}
            x1={streak.x}
            y1={streak.y}
            x2={streak.x + streak.length}
            y2={streak.y + streak.length * 0.42}
            style={{ animationDelay: `${(index % 7) * -0.6}s` }}
          />
        ))}
      </g>

      {/* Low polar Sun behind the left ridge. No air glow: the sky stays black. */}
      <circle className="scene-sun-glow" cx="150" cy="500" r="170" fill="url(#sunGlow)" opacity="0.9" />
      <circle className="scene-sun" cx="150" cy="500" r="26" fill="#fff8e6" />
      <path className="scene-rays" d="M 150 500 L 460 430 L 470 448 Z M 150 500 L 420 560 L 408 574 Z" fill="#ffe2b0" opacity="0.32" />

      {/* Far crater wall: small, cool, and behind the outpost. */}
      <g className="scene-background scene-far">
        <path d="M 0 520 L 0 300 L 90 250 L 160 310 L 250 210 L 340 280 L 470 180 L 560 270 L 700 220 L 820 300 L 980 190 L 1120 280 L 1280 210 L 1420 300 L 1600 240 L 1600 520 Z" fill="url(#farRidge)" />
        <path className="scene-rim crater-rim" d="M 0 300 L 90 250 L 160 310 L 250 210 L 340 280 L 470 180 L 560 270 L 700 220 L 820 300 L 980 190 L 1120 280 L 1280 210 L 1420 300 L 1600 240" fill="none" stroke="#f6e2c4" strokeWidth="3" />
      </g>
      <path className="scene-midground" d="M 0 548 L 140 492 L 280 528 L 460 500 L 640 534 L 860 508 L 1080 540 L 1280 516 L 1600 548 L 1600 620 L 0 620 Z" fill="url(#farWall)" />
      <path d="M 0 548 L 140 492 L 280 528 L 460 500 L 640 534" fill="none" stroke="#ffe2b0" strokeOpacity="0.85" strokeWidth="3" />
      <rect className="scene-storm-band" x="0" y="500" width="1600" height="48" fill="url(#stormHatch)" />

      {/* Crater-rim ground, warm on the sun side and cool toward the right. */}
      <path d="M 0 566 C 300 520 620 548 900 560 C 1150 570 1400 600 1600 640 L 1600 900 L 0 900 Z" fill="url(#ground)" />
      <path d="M 0 566 C 300 520 620 548 900 560 C 1150 570 1400 600 1600 640 L 1600 900 L 0 900 Z" fill="url(#dust)" opacity="0.55" />
      <path d="M 0 566 C 300 520 620 548 900 560 C 1150 570 1400 600 1600 640" fill="none" stroke="#fff1d6" strokeOpacity="0.8" strokeWidth="3" />
      <g className="scene-craters">
        <ellipse cx="250" cy="690" rx="86" ry="18" fill="#1a1c28" />
        <ellipse cx="236" cy="684" rx="74" ry="14" fill="#8d877c" />
        <ellipse cx="214" cy="680" rx="36" ry="7" fill="#f0e2c8" />
        <ellipse cx="980" cy="760" rx="120" ry="22" fill="#12141e" />
        <ellipse cx="960" cy="754" rx="104" ry="16" fill="#6a6e7e" />
        <ellipse cx="930" cy="750" rx="48" ry="8" fill="#d9c7aa" />
        <ellipse cx="1428" cy="700" rx="70" ry="14" fill="#10131f" />
        <ellipse cx="1416" cy="696" rx="58" ry="10" fill="#4e556c" />
      </g>

      {/* Long shadows raking right from the low Sun */}
      <g className="scene-shadows" fill="#04050d" opacity="0.82">
        <path d="M 226 628 L 640 664 L 640 676 L 226 642 Z" />
        <path d="M 330 690 L 1220 690 L 1600 742 L 1600 800 L 1180 740 L 360 720 Z" />
        <path d="M 1180 668 L 1600 700 L 1600 716 L 1180 690 Z" />
        <path d="M 1452 636 L 1600 646 L 1600 654 L 1452 644 Z" />
        <path d="M 1190 806 L 1600 846 L 1600 880 L 1190 836 Z" />
        <path d="M 380 858 L 760 884 L 760 900 L 380 880 Z" />
      </g>

      {/* Ground conduits linking the modules */}
      <g className="scene-conduits" fill="none">
        <path className="conduit" d="M 232 632 C 270 676 300 690 330 690" />
        <path className="conduit" d="M 1196 690 C 1300 716 1400 680 1450 638" />
        <path className="conduit" d="M 1010 694 C 1060 760 1130 790 1206 796" />
      </g>

      {/* Solar array on the left ridge */}
      <g className="module module-array" transform="translate(-30 20) translate(260 606) scale(1.25) translate(-260 -606)">
        <rect x="256" y="430" width="8" height="176" fill="url(#metalDark)" />
        {[0, 1, 2].map((row) => (
          <g key={row} transform={`translate(260 ${448 + row * 50})`}>
            <path className="solar-cell" d="M -112 -4 L -8 -18 L -8 14 L -112 26 Z" fill="url(#cells)" stroke="#d8f6ff" strokeOpacity="0.7" />
            <path className="solar-cell" d="M 8 -18 L 112 -4 L 112 26 L 8 14 Z" fill="url(#cells)" stroke="#9fc6ff" strokeOpacity="0.45" />
            <path d="M -112 26 L -8 14 M 8 14 L 112 26" stroke="#8a8172" strokeWidth="3" />
            <path className="panel-glint" d="M -104 0 L -20 -12 L -20 -8 L -104 4 Z" fill="#fff" />
          </g>
        ))}
        <path d="M 150 600 L 230 560 L 300 600 M 180 610 L 250 560" stroke="#8a8172" strokeWidth="4" fill="none" />
        <path className="conduit" d="M 264 606 C 300 640 320 660 360 690" />
        <rect className="module-outline" x="136" y="420" width="248" height="196" rx="10" />
      </g>

      {/* Central cluster, drawn large: shelter, Hab-1 and greenhouse */}
      <g transform="translate(700 676) scale(1.4) translate(-760 -676)">
      <ellipse cx="660" cy="712" rx="200" ry="16" fill="#05060e" />
      <ellipse cx="980" cy="686" rx="150" ry="14" fill="#05060e" />
      {/* Regolith-covered shelter behind the habitat */}
      <g className="module module-shelter">
        <path d="M 620 640 L 620 560 L 820 560 L 820 640 Z" fill="#3a342c" />
        <path d="M 560 640 C 600 500 860 470 940 640 Z" fill="url(#berm)" />
        <path d="M 600 560 C 640 500 820 490 880 570" fill="none" stroke="#efe2cc" strokeWidth="3" />
        <path d="M 690 640 L 690 575 L 738 575 L 738 640 Z" fill="#141a2c" stroke="#aeb3c4" strokeWidth="3" />
        <circle className="shelter-light" cx="714" cy="524" r="6" />
        <g className="shelter-crates">
          <rect x="748" y="572" width="22" height="20" rx="2" fill="#ffd166" stroke="#3a2f12" strokeWidth="2" />
          <rect x="772" y="578" width="18" height="14" rx="2" fill="#66e3ff" stroke="#12303a" strokeWidth="2" />
          <rect x="754" y="556" width="18" height="16" rx="2" fill="#edf4ff" stroke="#2c3145" strokeWidth="2" />
        </g>
        <path className="shelter-shield" d="M 584 600 C 620 470 820 452 934 600" fill="none" />
        <g className="crew crew-sheltered">
          <circle cx="706" cy="572" r="5" />
          <circle cx="722" cy="572" r="5" />
        </g>
        <rect className="module-outline" x="576" y="470" width="372" height="140" rx="10" />
      </g>

      {/* Hab-1: the focal point */}
      <g className="module module-hab">
        <g stroke="#2c3145" strokeWidth="6">
          <line x1="540" y1="668" x2="528" y2="700" />
          <line x1="660" y1="670" x2="660" y2="704" />
          <line x1="780" y1="668" x2="792" y2="700" />
        </g>
        <path className="pressure-shell" d="M 548 592 H 790 C 836 592 836 676 790 676 H 548 C 500 676 500 592 548 592 Z" fill="url(#metal)" />
        <path d="M 548 592 C 500 592 500 676 548 676 C 586 676 586 592 548 592 Z" fill="#f4ecdc" />
        <path d="M 790 592 C 836 592 836 676 790 676 C 754 676 754 592 790 592 Z" fill="#2c3144" />
        <path d="M 548 604 H 790 M 548 664 H 790" stroke="#6d6248" strokeWidth="2" />
        <path d="M 616 592 L 616 676 M 700 592 L 700 676 M 784 592 L 784 676" stroke="#3a4058" strokeWidth="2" />
        <path className="hab-seam" d="M 520 634 L 800 634" fill="none" />
        <path d="M 520 586 H 800" stroke="#8a8172" strokeWidth="4" />
        <path d="M 560 586 L 548 568 M 700 586 L 700 560 M 820 586 L 834 564" stroke="#8a8172" strokeWidth="3" />
        {WINDOWS.map((index) => (
          <rect key={index} className={`hab-window hab-window-${index}`} x={548 + index * 46} y="606" width="26" height="18" rx="5" />
        ))}
        <path className="hab-cool-rim" d="M 808 598 C 836 604 844 640 828 676" fill="none" stroke="#9fc6ff" strokeWidth="4" strokeLinecap="round" />
        <rect x="812" y="606" width="46" height="64" rx="8" fill="url(#metalDark)" stroke="#aeb3c4" strokeWidth="2" />
        <rect className="airlock-light" x="824" y="618" width="22" height="30" rx="4" />
        <circle className="airlock-hatch" cx="835" cy="638" r="16" fill="#141820" stroke="#d5dbe8" strokeWidth="3" />
        <path d="M 835 622 L 835 654 M 819 638 L 851 638" stroke="#d5dbe8" strokeWidth="2" />
        <path d="M 858 606 L 858 670 M 812 600 L 870 600 M 812 676 L 870 676" stroke="#c5ccd8" strokeWidth="3" />
        <rect className="module-outline" x="478" y="580" width="392" height="130" rx="12" />
      </g>
      <ellipse className="hab-glow" cx="660" cy="712" rx="160" ry="16" fill="#ffb15a" />

      {/* Greenhouse dome */}
      <g className="module module-dome">
        <rect x="860" y="664" width="240" height="14" rx="5" fill="url(#metalDark)" />
        <path className="dome-glow" d="M 868 668 A 112 112 0 0 1 1092 668 Z" fill="url(#domeGlow)" />
        <g clipPath="url(#domeClip)">
          <ellipse className="dome-warm" cx="980" cy="640" rx="90" ry="36" fill="#ffe3a8" />
          {PLANTS.map((index) => (
            <g key={index} transform={`translate(${894 + index * 34} 668)`}>
              <rect className="greenhouse-bed" x="-12" y="-8" width="24" height="10" fill="#6a4a32" />
              <g className={`plant plant-${index}`}>
                <path d="M 0 0 L 0 -34" stroke="#2f6b3a" strokeWidth="3" />
                <path d="M 0 -18 q -14 -6 -16 -20 q 14 2 16 20 z M 0 -26 q 14 -6 16 -22 q -14 2 -16 22 z" fill="#3f8f4a" />
              </g>
            </g>
          ))}
        </g>
        <path className="greenhouse-rib" d="M 868 668 A 112 112 0 0 1 1092 668" fill="none" stroke="#d5dbe8" strokeWidth="7" />
        <path className="greenhouse-rib" d="M 980 556 L 980 668 M 924 590 L 924 668 M 1036 590 L 1036 668" stroke="#d5dbe8" strokeWidth="3" />
        <path className="greenhouse-rib" d="M 900 640 A 90 40 0 0 1 1060 640" fill="none" stroke="#d5dbe8" strokeWidth="3" />
        <path d="M 890 620 A 96 78 0 0 1 980 558" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="6" strokeLinecap="round" />
        <rect className="module-outline" x="852" y="544" width="256" height="146" rx="12" />
      </g>
      </g>

      {/* Comms mast */}
      <g className="module-mast" transform="translate(150 -14)">
        <path d="M 1300 650 L 1300 470 M 1286 650 L 1300 560 L 1314 650 M 1292 600 L 1308 600" stroke="url(#metalDark)" strokeWidth="5" fill="none" />
        <path d="M 1300 486 q -34 -6 -44 -40 q 30 6 44 40 z" fill="url(#metal)" />
        <circle className="beacon" cx="1300" cy="464" r="6" />
      </g>

      {/* Drill rig and sample rack in the foreground */}
      <g className="module module-drill" transform="translate(1250 790) scale(1.25) translate(-1160 -790)">
        <path d="M 1080 780 L 1120 660 L 1160 780 M 1094 738 L 1146 738" stroke="url(#metal)" strokeWidth="7" fill="none" strokeLinecap="round" />
        <rect x="1110" y="648" width="20" height="26" rx="4" fill="#ffd166" stroke="#3a2f12" strokeWidth="2" />
        <rect className="drill-bit" x="1116" y="676" width="8" height="108" rx="3" fill="#aeb3c4" />
        <ellipse cx="1120" cy="784" rx="26" ry="6" fill="#0b0d18" />
        <g className="sample-rack">
          <rect x="1176" y="760" width={24 + rack.length * 26} height="26" rx="5" fill="#1b2034" stroke="#8f93a3" strokeWidth="2" />
          {rack.map((filled, index) => (
            <rect key={index} className={filled ? 'sample sample-filled' : 'sample'} x={1188 + index * 26} y="742" width="16" height="36" rx="5" />
          ))}
        </g>
        <g className="crew crew-working">
          <g transform="translate(1056 760)">
            <circle cx="0" cy="-26" r="9" />
            <rect x="-8" y="-17" width="16" height="24" rx="6" />
          </g>
          <g transform="translate(1304 806)">
            <circle cx="0" cy="-26" r="9" />
            <rect x="-8" y="-17" width="16" height="24" rx="6" />
          </g>
        </g>
        <rect className="module-outline" x="1032" y="636" width="270" height="180" rx="12" />
      </g>

      {/* Rover for scale */}
      <g className="scene-rover" transform="translate(-1010 26)">
        <rect x="1380" y="796" width="110" height="30" rx="8" fill="url(#metal)" />
        <rect x="1398" y="776" width="52" height="24" rx="6" fill="#141a2c" stroke="#aeb3c4" strokeWidth="2" />
        <circle cx="1400" cy="832" r="15" fill="#10121d" stroke="#6b7086" strokeWidth="4" />
        <circle cx="1470" cy="832" r="15" fill="#10121d" stroke="#6b7086" strokeWidth="4" />
        <circle className="rover-light" cx="1494" cy="806" r="4" />
      </g>

      {/* Foreground lip and rocks. Warm faces point at the Sun; cool faces fall away from it. */}
      <path d="M 0 860 C 280 820 620 840 900 868 C 1180 896 1400 850 1600 880 L 1600 900 L 0 900 Z" fill="url(#nearGround)" />
      <g className="scene-foreground foreground-rocks">
        <ellipse cx="150" cy="892" rx="92" ry="16" fill="#07080f" />
        <path d="M 48 900 L 86 828 L 132 812 L 168 836 L 210 900 Z" fill="#3e465c" />
        <path d="M 86 828 L 132 812 L 168 836 L 120 868 Z" fill="#e7d3b0" />
        <path d="M 132 812 L 210 900 L 168 836 Z" fill="#1c2233" />
        <ellipse cx="1488" cy="894" rx="78" ry="14" fill="#07080f" />
        <path d="M 1428 900 L 1464 846 L 1516 834 L 1564 862 L 1600 900 Z" fill="#2a3148" />
        <path d="M 1464 846 L 1516 834 L 1540 870 L 1488 878 Z" fill="#cbb89a" />
        <path d="M 1516 834 L 1600 900 L 1564 862 Z" fill="#151a2a" />
      </g>
      <path d="M 86 828 L 132 812 L 168 836" fill="none" stroke="#fff1d6" strokeWidth="2" />

      <rect className="scene-dim" width="1600" height="900" fill="#03050c" pointerEvents="none" />
    </svg>
  );
}
