import { createPortal } from "react-dom";
import LineIcon from "../../components/icons/LineIcon";

const defaultInfoCards = [];

const particleSeeds = Array.from({ length: 34 }, (_, index) => ({
  id: index,
  x: (index * 29 + 11) % 100,
  y: (index * 47 + 17) % 100,
  size: 2 + (index % 4),
  delay: (index % 9) * -0.58,
  duration: 8 + (index % 7),
  tone: index % 3
}));

const vascularPaths = [
  ["artery main trunk", "M812 950 C806 856 784 802 806 720 C834 616 792 556 808 468 C826 366 792 300 810 212 C824 142 792 82 820 18"],
  ["vein main trunk", "M718 950 C748 852 712 790 742 700 C774 608 732 548 744 456 C756 360 704 292 718 206 C730 132 704 78 718 18"],
  ["artery root heart", "M788 604 C838 548 920 560 958 622 C1002 694 946 780 864 800 C782 820 708 770 696 696 C688 648 724 614 788 604"],
  ["vein root heart", "M724 624 C674 562 590 586 556 650 C524 714 570 778 642 792 C714 806 772 760 764 694 C760 662 746 640 724 624"],
  ["artery coronary", "M808 664 C878 626 936 642 992 700 C1050 760 1130 790 1228 780"],
  ["artery coronary", "M790 640 C710 612 646 638 584 700 C516 768 428 800 318 786"],
  ["vein coronary", "M736 672 C806 714 852 764 898 846 C930 904 982 934 1058 946"],
  ["vein coronary", "M706 654 C646 710 590 752 500 804 C414 852 342 902 262 944"],
  ["artery branch", "M808 470 C942 446 1046 386 1156 300 C1284 200 1398 152 1580 122"],
  ["artery branch", "M802 530 C938 538 1040 600 1164 690 C1280 774 1396 824 1574 858"],
  ["artery branch", "M786 494 C646 462 538 394 422 316 C296 232 178 204 42 186"],
  ["artery branch", "M796 586 C660 622 552 704 438 790 C314 884 200 914 38 892"],
  ["vein branch", "M744 456 C878 406 970 324 1084 228 C1198 132 1320 86 1560 70"],
  ["vein branch", "M744 586 C884 624 982 708 1098 802 C1210 894 1328 930 1556 914"],
  ["vein branch", "M728 438 C590 390 496 304 386 218 C276 132 170 98 42 78"],
  ["vein branch", "M736 652 C600 692 498 772 390 840 C274 914 158 932 42 918"],
  ["artery branch", "M818 340 C918 322 1018 270 1112 204 C1208 136 1312 112 1460 132"],
  ["artery branch", "M774 346 C650 314 558 254 486 184 C402 104 304 84 176 114"],
  ["vein branch", "M764 294 C860 252 922 190 990 126 C1062 58 1148 40 1280 54"],
  ["vein branch", "M706 304 C600 266 532 206 458 138 C386 70 304 50 184 64"],
  ["artery capillary", "M1156 300 C1226 286 1264 244 1318 192"],
  ["artery capillary", "M1156 300 C1228 328 1284 370 1360 392"],
  ["artery capillary", "M1318 192 C1372 188 1420 162 1494 116"],
  ["artery capillary", "M1360 392 C1426 408 1482 384 1568 340"],
  ["artery capillary", "M1164 690 C1242 698 1296 742 1372 802"],
  ["artery capillary", "M1164 690 C1244 748 1316 816 1426 890"],
  ["artery capillary", "M1372 802 C1438 812 1498 846 1580 910"],
  ["artery capillary", "M422 316 C346 294 292 244 230 184"],
  ["artery capillary", "M422 316 C346 350 284 402 204 440"],
  ["artery capillary", "M230 184 C168 160 116 128 42 94"],
  ["artery capillary", "M438 790 C360 804 300 850 226 904"],
  ["artery capillary", "M438 790 C350 750 286 700 202 636"],
  ["artery capillary", "M226 904 C166 922 104 910 38 864"],
  ["vein capillary", "M1084 228 C1158 218 1212 176 1282 122"],
  ["vein capillary", "M1084 228 C1160 260 1228 294 1322 310"],
  ["vein capillary", "M1282 122 C1362 110 1440 82 1562 36"],
  ["vein capillary", "M1098 802 C1176 818 1238 862 1312 922"],
  ["vein capillary", "M1098 802 C1186 774 1262 730 1360 708"],
  ["vein capillary", "M386 218 C312 202 250 158 184 102"],
  ["vein capillary", "M386 218 C308 250 244 292 160 312"],
  ["vein capillary", "M390 840 C318 858 254 902 184 944"],
  ["vein capillary", "M390 840 C306 812 244 766 158 714"],
  ["artery thread", "M1318 192 C1356 154 1366 126 1378 76"],
  ["artery thread", "M1360 392 C1424 426 1458 476 1498 536"],
  ["artery thread", "M204 440 C146 464 96 502 38 552"],
  ["artery thread", "M202 636 C142 624 88 588 34 538"],
  ["vein thread", "M1282 122 C1338 146 1388 146 1456 122"],
  ["vein thread", "M1360 708 C1426 680 1490 668 1564 672"],
  ["vein thread", "M184 102 C130 100 84 76 36 38"],
  ["vein thread", "M158 714 C106 704 74 672 36 626"],
  ["artery capillary", "M810 212 C910 194 970 146 1032 84"],
  ["vein capillary", "M718 206 C626 184 572 128 512 58"],
  ["artery capillary", "M806 720 C884 770 922 838 992 936"],
  ["vein capillary", "M742 700 C664 754 606 834 548 936"]
];

const vascularNodes = [
  [820, 18, 5.4],
  [718, 18, 5],
  [808, 468, 5.6],
  [744, 456, 5.2],
  [806, 720, 5],
  [742, 700, 4.8],
  [788, 604, 4.6],
  [724, 624, 4.4],
  [958, 622, 4],
  [556, 650, 4],
  [1156, 300, 3.4],
  [1164, 690, 3.4],
  [422, 316, 3.4],
  [438, 790, 3.4],
  [1084, 228, 3.2],
  [1098, 802, 3.2],
  [386, 218, 3],
  [390, 840, 3],
  [1318, 192, 2.8],
  [1360, 392, 2.8],
  [1372, 802, 2.8],
  [230, 184, 2.8],
  [226, 904, 2.8],
  [1282, 122, 2.6],
  [1360, 708, 2.6],
  [184, 102, 2.6],
  [158, 714, 2.6],
  [1580, 122, 2.2],
  [1560, 70, 2.2],
  [42, 186, 2.2],
  [42, 78, 2.2]
];

function navigateSafely(navigate, path) {
  if (typeof navigate === "function") {
    navigate(path);
  }
}

export function CinematicBackground() {
  return (
    <div className="cinematic-home-bg" aria-hidden="true">
      <div className="cinematic-orb cinematic-orb-one" />
      <div className="cinematic-orb cinematic-orb-two" />
      <div className="cinematic-orb cinematic-orb-three" />
      <BiomedicalNetwork />
      <VascularBranchNetwork />
      <div className="cinematic-particles">
        {particleSeeds.map((particle) => (
          <span
            key={particle.id}
            className={`cinematic-particle cinematic-particle-${particle.tone}`}
            style={{
              "--particle-x": `${particle.x}%`,
              "--particle-y": `${particle.y}%`,
              "--particle-size": `${particle.size}px`,
              "--particle-delay": `${particle.delay}s`,
              "--particle-duration": `${particle.duration}s`
            }}
          />
        ))}
      </div>
      <div className="cinematic-grid-lines" />
      <div className="cinematic-noise" />
    </div>
  );
}

function VascularBranchNetwork() {
  return (
    <svg className="cinematic-vascular-network" viewBox="0 0 1600 950" role="presentation" focusable="false">
      <defs>
        <linearGradient id="vascularArteryStroke" x1="8%" y1="88%" x2="92%" y2="12%">
          <stop offset="0%" stopColor="#5c0b13" stopOpacity="0.34" />
          <stop offset="34%" stopColor="#b91c1c" stopOpacity="0.78" />
          <stop offset="66%" stopColor="#ff4d3d" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#f8c45f" stopOpacity="0.38" />
        </linearGradient>
        <linearGradient id="vascularVeinStroke" x1="0%" y1="92%" x2="100%" y2="8%">
          <stop offset="0%" stopColor="#052a5f" stopOpacity="0.36" />
          <stop offset="42%" stopColor="#2563eb" stopOpacity="0.7" />
          <stop offset="72%" stopColor="#2fb8f2" stopOpacity="0.84" />
          <stop offset="100%" stopColor="#8be8df" stopOpacity="0.36" />
        </linearGradient>
        <linearGradient id="vascularArteryFlow" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff2d20" stopOpacity="0" />
          <stop offset="42%" stopColor="#ff4d3d" stopOpacity="0.82" />
          <stop offset="68%" stopColor="#ffd27a" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ff2d20" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="vascularVeinFlow" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0b6fc8" stopOpacity="0" />
          <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.86" />
          <stop offset="70%" stopColor="#9ff7ff" stopOpacity="0.96" />
          <stop offset="100%" stopColor="#0b6fc8" stopOpacity="0" />
        </linearGradient>
        <filter id="vascularGlow" x="-18%" y="-18%" width="136%" height="136%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g className="cinematic-vascular-paths" filter="url(#vascularGlow)">
        {vascularPaths.map(([tone, d], index) => (
          <g key={`${tone}-${index}`} style={{ "--vascular-delay": `${index * -0.42}s` }}>
            <path
              className={`vascular-path ${tone.split(" ").map((part) => `vascular-${part}`).join(" ")}`}
              d={d}
            />
            {!tone.includes("thread") && (
              <path
                className={`vascular-flow ${tone.split(" ").map((part) => `vascular-${part}`).join(" ")}`}
                d={d}
              />
            )}
          </g>
        ))}
      </g>
      <g className="cinematic-vascular-nodes">
        {vascularNodes.map(([cx, cy, r], index) => (
          <circle
            key={`${cx}-${cy}`}
            className={`vascular-node vascular-node-${index % 3}`}
            cx={cx}
            cy={cy}
            r={r}
            style={{ "--vascular-delay": `${index * -0.36}s` }}
          />
        ))}
      </g>
    </svg>
  );
}

function BiomedicalNetwork() {
  return (
    <svg className="cinematic-network" viewBox="0 0 1200 820" role="presentation" focusable="false">
      <defs>
        <linearGradient id="networkStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2fb8b5" stopOpacity="0.1" />
          <stop offset="52%" stopColor="#8be8df" stopOpacity="0.44" />
          <stop offset="100%" stopColor="#c6a85c" stopOpacity="0.22" />
        </linearGradient>
      </defs>
      <path d="M40 530 C180 430 240 260 390 310 S650 610 790 440 S980 130 1160 230" />
      <path d="M80 190 C260 250 310 120 460 190 S640 450 760 330 S970 270 1130 500" />
      <path d="M160 720 C300 560 390 600 520 480 S690 210 830 260 S1040 520 1180 410" />
      <path d="M240 80 C360 210 440 180 560 270 S710 560 900 610 S1030 520 1170 650" />
      {[120, 255, 390, 540, 690, 840, 990, 1115].map((cx, index) => (
        <circle key={cx} cx={cx} cy={index % 2 ? 300 + index * 26 : 176 + index * 48} r={index % 3 === 0 ? 4 : 3} />
      ))}
    </svg>
  );
}

export function FloatingInfoCards({ navigate, cards = defaultInfoCards, label = "Featured Aeternum Atlas resources" }) {
  return (
    <div className="cinematic-floating-cards" aria-label={label}>
      {cards.map(([label, icon, path], index) => (
        <button
          type="button"
          key={label}
          className="cinematic-info-card"
          onClick={() => navigateSafely(navigate, path)}
          style={{ "--card-index": index }}
        >
          <span className="cinematic-info-icon">
            <LineIcon name={icon} />
          </span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

export function LetterReveal({ text }) {
  return (
    <span className="cinematic-letter-reveal" aria-label={text}>
      {text.split("").map((letter, index) => (
        <span key={`${letter}-${index}`} aria-hidden="true" style={{ "--letter-index": index }}>
          {letter === " " ? "\u00A0" : letter}
        </span>
      ))}
    </span>
  );
}

export function CinematicScrollIndicator({ label = "Atlas", progress = 0, onOpen }) {
  const progressValue = progress <= 1 ? progress * 100 : progress;
  const progressPercent = Math.round(Math.min(100, Math.max(0, progressValue)));
  const progressLabel = `${String(progressPercent).padStart(2, "0")}%`;
  const progressHeight = `${progressPercent}%`;
  const progressRatio = progressPercent / 100;

  const indicator = (
    <div
      className="scroll-atlas-control cinematic-scroll-indicator"
      aria-label={`${label}: ${progressLabel}`}
      style={{ "--indicator-progress": progressRatio, "--scroll-progress-percent": progressHeight }}
    >
      <span className="scroll-percent" aria-hidden="true">{progressLabel}</span>

      <div className="scroll-track">
        <div className="scroll-fill" style={{ height: progressHeight }} />
      </div>

      <button className="atlas-open-button" type="button" onClick={onOpen} aria-label={label}>
        <span>{label}</span>
      </button>
    </div>
  );

  if (typeof document === "undefined") {
    return indicator;
  }

  return createPortal(indicator, document.body);
}
