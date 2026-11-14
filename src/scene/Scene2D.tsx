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
  return Array.from({ length: count }, () => ({ x: Math.round(next() * 1600), y: Math.round(next() * 500), r: 0.6 + next() * 1.5, o: 0.35 + next() * 0.65 }));
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

export function Scene2D({ model }: { model: SceneModel }) {
  const rack = Array.from({ length: Math.max(model.goalSamples, model.samples) }, (_, index) => index < model.samples);
  return (
    <svg
      className="scene"
      viewBox="0 0 1600 900"
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
          <stop offset="0" stopColor="#d8cdb9" />
          <stop offset="0.3" stopColor="#a39f9f" />
          <stop offset="0.7" stopColor="#6a6c7c" />
          <stop offset="1" stopColor="#3a3e56" />
        </linearGradient>
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
        <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.6" />
        </radialGradient>
        <pattern id="stormHatch" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
          <rect width="18" height="18" fill="#ffd166" fillOpacity="0.06" />
          <rect width="5" height="18" fill="#ffd166" fillOpacity="0.5" />
        </pattern>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <clipPath id="earthLit">
          <rect x="1214" y="100" width="40" height="90" />
        </clipPath>
        <clipPath id="domeClip">
          <path d="M 868 668 A 112 112 0 0 1 1092 668 Z" />
        </clipPath>
      </defs>

      {/* Sky */}
      <rect width="1600" height="900" fill="url(#sky)" />
      <g className="scene-stars">
        {STARS.map((star, index) => (
          <circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#edf4ff" opacity={star.o} />
        ))}
      </g>

      {/* Earth, half lit by the same Sun */}
      <g className="scene-earth" transform="translate(1248 144) scale(1.5) translate(-1248 -144) translate(40 12)">
        <circle cx="1248" cy="144" r="34" fill="#0d1730" />
        <circle cx="1248" cy="144" r="34" fill="#4f8fd8" clipPath="url(#earthLit)" />
        <path d="M 1226 126 q 10 -8 20 2 q -4 12 -16 10 z M 1222 150 q 14 2 20 14 q -12 8 -20 -4 z" fill="#d9f0ff" opacity="0.75" clipPath="url(#earthLit)" />
        <circle cx="1248" cy="144" r="34" fill="none" stroke="#9fc6ff" strokeOpacity="0.35" strokeWidth="2" />
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

      {/* Low polar Sun behind the left ridge */}
      <circle className="scene-sun-glow" cx="96" cy="500" r="520" fill="url(#sunGlow)" />
      <circle className="scene-sun" cx="96" cy="500" r="34" fill="#fff8e6" />
      <path className="scene-rays" d="M 96 500 L 700 380 L 700 400 Z M 96 500 L 620 560 L 610 574 Z M 96 500 L 520 250 L 532 268 Z" fill="#ffe2b0" opacity="0.07" />

      {/* Far crater wall */}
      <path d="M 0 530 L 120 470 L 250 505 L 420 478 L 600 512 L 780 492 L 960 520 L 1160 500 L 1340 530 L 1600 512 L 1600 600 L 0 600 Z" fill="url(#farWall)" />
      <path d="M 0 530 L 120 470 L 250 505 L 420 478 L 600 512 L 780 492" fill="none" stroke="#ffe2b0" strokeOpacity="0.75" strokeWidth="2.5" />
      <rect className="scene-storm-band" x="0" y="486" width="1600" height="54" fill="url(#stormHatch)" />

      {/* Crater-rim ground, lit from the left */}
      <path d="M 0 566 C 300 520 620 548 900 560 C 1150 570 1400 600 1600 640 L 1600 900 L 0 900 Z" fill="url(#ground)" />
      <path d="M 0 566 C 300 520 620 548 900 560 C 1150 570 1400 600 1600 640" fill="none" stroke="#fff1d6" strokeOpacity="0.55" strokeWidth="2" />
      <g opacity="0.5">
        <ellipse cx="330" cy="760" rx="120" ry="20" fill="#1a1c2b" />
        <ellipse cx="318" cy="756" rx="118" ry="17" fill="#8a8687" />
        <ellipse cx="760" cy="830" rx="170" ry="24" fill="#14162280" />
        <ellipse cx="748" cy="826" rx="166" ry="20" fill="#5d5c66" />
        <ellipse cx="1420" cy="720" rx="80" ry="11" fill="#12131f" />
      </g>

      {/* Long shadows raking right from the low Sun */}
      <g className="scene-shadows" fill="#04050d" opacity="0.66">
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
            <path d="M -112 -4 L -8 -18 L -8 14 L -112 26 Z" fill="url(#panel)" stroke="#d8f6ff" strokeOpacity="0.6" />
            <path d="M 8 -18 L 112 -4 L 112 26 L 8 14 Z" fill="url(#panel)" stroke="#d8f6ff" strokeOpacity="0.35" />
            <path className="panel-glint" d="M -104 0 L -20 -12 L -20 -8 L -104 4 Z" fill="#fff" />
          </g>
        ))}
        <rect className="module-outline" x="136" y="420" width="248" height="196" rx="10" />
      </g>

      {/* Central cluster, drawn large: shelter, Hab-1 and greenhouse */}
      <g transform="translate(700 676) scale(1.4) translate(-760 -676)">
      {/* Regolith-covered shelter behind the habitat */}
      <g className="module module-shelter">
        <path d="M 600 590 C 640 500 800 486 880 560 C 900 580 910 592 916 600 Z" fill="url(#berm)" />
        <path d="M 600 590 C 640 500 800 486 880 560" fill="none" stroke="#ffe9c4" strokeOpacity="0.6" strokeWidth="2" />
        <path d="M 690 592 L 690 556 A 24 24 0 0 1 738 556 L 738 592 Z" fill="#141a2c" stroke="#aeb3c4" strokeWidth="3" />
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
        <rect x="490" y="592" width="330" height="84" rx="42" fill="url(#metal)" />
        <rect x="490" y="640" width="330" height="36" rx="18" fill="#1b2034" opacity="0.45" />
        <path d="M 532 594 A 42 42 0 0 0 492 634" fill="none" stroke="#fff3d6" strokeWidth="4" strokeLinecap="round" />
        <path d="M 540 594 L 800 594" fill="none" stroke="#fff3d6" strokeOpacity="0.55" strokeWidth="2" />
        <path d="M 532 592 L 532 676 M 616 592 L 616 676 M 700 592 L 700 676 M 784 592 L 784 676" stroke="#3a4058" strokeWidth="2" opacity="0.7" />
        <path className="hab-seam" d="M 512 634 L 800 634" fill="none" />
        {WINDOWS.map((index) => (
          <rect key={index} className={`hab-window hab-window-${index}`} x={548 + index * 46} y="606" width="26" height="18" rx="5" />
        ))}
        <rect x="812" y="606" width="46" height="64" rx="8" fill="url(#metalDark)" stroke="#aeb3c4" strokeWidth="2" />
        <rect className="airlock-light" x="824" y="618" width="22" height="30" rx="4" />
        <rect className="module-outline" x="478" y="580" width="392" height="130" rx="12" />
      </g>

      {/* Greenhouse dome */}
      <g className="module module-dome">
        <rect x="860" y="664" width="240" height="14" rx="5" fill="url(#metalDark)" />
        <path className="dome-glow" d="M 868 668 A 112 112 0 0 1 1092 668 Z" fill="url(#domeGlow)" />
        <g clipPath="url(#domeClip)">
          {PLANTS.map((index) => (
            <g key={index} transform={`translate(${894 + index * 34} 668)`}>
              <g className={`plant plant-${index}`}>
                <path d="M 0 0 L 0 -34" stroke="#7cf2b0" strokeWidth="3" />
                <path d="M 0 -18 q -14 -6 -16 -20 q 14 2 16 20 z M 0 -26 q 14 -6 16 -22 q -14 2 -16 22 z" fill="#7cf2b0" />
              </g>
            </g>
          ))}
        </g>
        <path d="M 868 668 A 112 112 0 0 1 1092 668" fill="none" stroke="#e8f6ff" strokeOpacity="0.8" strokeWidth="3" />
        <path d="M 980 556 L 980 668 M 924 574 L 924 668 M 1036 574 L 1036 668" stroke="#e8f6ff" strokeOpacity="0.25" strokeWidth="2" />
        <path d="M 890 610 A 100 100 0 0 1 950 566" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" />
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

      {/* Foreground rocks */}
      <g fill="#0c0e19">
        <path d="M 60 900 L 90 842 L 150 826 L 210 860 L 236 900 Z" />
        <path d="M 1500 900 L 1524 868 L 1570 858 L 1600 876 L 1600 900 Z" />
      </g>
      <path d="M 90 842 L 150 826 L 210 860" fill="none" stroke="#ffe2b0" strokeOpacity="0.5" strokeWidth="2" />

      <rect width="1600" height="900" fill="url(#groundDepth)" pointerEvents="none" />
      <rect className="scene-dim" width="1600" height="900" fill="#03050c" pointerEvents="none" />
      <rect width="1600" height="900" fill="url(#vignette)" pointerEvents="none" />
    </svg>
  );
}
