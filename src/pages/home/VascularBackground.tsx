import type { CSSProperties } from "react";

type VesselPath = {
  className: string;
  d: string;
  delay?: number;
};

type ParticlePath = {
  className: string;
  d: string;
  dur: number;
  begin: number;
  r: number;
};

const convergence = {
  x: 1120,
  y: 456,
};

const arteryTrunks: VesselPath[] = [
  {
    className: "vessel-main vascular-trunk artery-trunk",
    d: "M -160 610 C 120 580, 330 612, 522 574 C 706 538, 846 486, 958 468 C 1040 454, 1090 458, 1120 456",
  },
  {
    className: "vessel-main vessel-secondary vascular-trunk artery-trunk",
    d: "M -150 732 C 126 688, 326 660, 548 600 C 724 552, 870 520, 982 496 C 1050 482, 1094 468, 1120 456",
    delay: 0.12,
  },
  {
    className: "vessel-main vessel-secondary vascular-trunk artery-trunk",
    d: "M -142 220 C 96 232, 282 250, 470 306 C 664 364, 816 398, 946 404 C 1036 408, 1090 426, 1120 456",
    delay: 0.2,
  },
  {
    className: "vessel-main vessel-secondary vascular-trunk artery-trunk",
    d: "M -168 390 C 98 374, 318 402, 520 432 C 708 460, 852 458, 970 444 C 1046 436, 1096 446, 1120 456",
    delay: 0.3,
  },
];

const arteryBranches: VesselPath[] = [
  {
    className: "vessel-branch artery-branch",
    d: "M 328 586 C 240 514, 148 462, 10 426",
  },
  {
    className: "vessel-branch artery-branch",
    d: "M 434 548 C 348 444, 292 340, 214 192",
    delay: 0.1,
  },
  {
    className: "vessel-branch thin artery-branch",
    d: "M 520 586 C 422 658, 310 718, 126 790",
    delay: 0.18,
  },
  {
    className: "vessel-branch thin artery-branch",
    d: "M 642 458 C 560 398, 512 320, 462 220",
    delay: 0.26,
  },
  {
    className: "vessel-branch micro artery-branch",
    d: "M 746 474 C 674 548, 594 646, 502 800",
    delay: 0.32,
  },
  {
    className: "vessel-branch micro artery-branch",
    d: "M 824 450 C 750 388, 686 322, 612 204",
    delay: 0.38,
  },
  {
    className: "vessel-branch micro artery-branch",
    d: "M 910 440 C 846 410, 796 362, 748 286",
    delay: 0.44,
  },
];

const veinTrunks: VesselPath[] = [
  {
    className: "vessel-main vascular-trunk vein-trunk",
    d: "M 1760 420 C 1512 390, 1380 384, 1260 414 C 1198 430, 1152 444, 1120 456",
  },
  {
    className: "vessel-main vessel-secondary vascular-trunk vein-trunk",
    d: "M 1748 640 C 1510 574, 1390 532, 1278 506 C 1208 492, 1156 472, 1120 456",
    delay: 0.1,
  },
  {
    className: "vessel-main vessel-secondary vascular-trunk vein-trunk",
    d: "M 1740 226 C 1506 282, 1396 338, 1272 382 C 1202 406, 1152 430, 1120 456",
    delay: 0.18,
  },
  {
    className: "vessel-main vessel-secondary vascular-trunk vein-trunk",
    d: "M 1756 520 C 1512 512, 1388 492, 1270 468 C 1204 456, 1156 454, 1120 456",
    delay: 0.28,
  },
];

const veinBranches: VesselPath[] = [
  {
    className: "vessel-branch vein-branch",
    d: "M 1304 410 C 1382 332, 1462 258, 1584 202",
  },
  {
    className: "vessel-branch vein-branch",
    d: "M 1264 502 C 1354 572, 1448 640, 1600 732",
    delay: 0.12,
  },
  {
    className: "vessel-branch thin vein-branch",
    d: "M 1212 426 C 1268 326, 1312 246, 1368 128",
    delay: 0.2,
  },
  {
    className: "vessel-branch thin vein-branch",
    d: "M 1214 486 C 1286 552, 1366 626, 1460 792",
    delay: 0.28,
  },
  {
    className: "vessel-branch micro vein-branch",
    d: "M 1168 442 C 1224 386, 1264 334, 1306 252",
    delay: 0.34,
  },
  {
    className: "vessel-branch micro vein-branch",
    d: "M 1168 474 C 1228 526, 1278 592, 1342 704",
    delay: 0.4,
  },
  {
    className: "vessel-branch micro vein-branch",
    d: "M 1194 452 C 1266 420, 1324 376, 1398 296",
    delay: 0.46,
  },
];

const capillaryPaths: VesselPath[] = [
  {
    className: "artery-capillary",
    d: "M 982 424 C 1018 410, 1046 414, 1072 436 C 1090 452, 1104 456, 1120 456",
  },
  {
    className: "artery-capillary thin",
    d: "M 968 498 C 1004 474, 1038 462, 1078 470 C 1096 474, 1108 466, 1120 456",
    delay: 0.12,
  },
  {
    className: "artery-capillary micro",
    d: "M 1010 384 C 1036 406, 1062 430, 1090 444 C 1104 450, 1114 452, 1120 456",
    delay: 0.18,
  },
  {
    className: "vein-capillary",
    d: "M 1256 424 C 1220 408, 1186 412, 1158 436 C 1140 450, 1130 454, 1120 456",
    delay: 0.08,
  },
  {
    className: "vein-capillary thin",
    d: "M 1260 500 C 1224 472, 1188 462, 1154 470 C 1136 474, 1126 464, 1120 456",
    delay: 0.16,
  },
  {
    className: "vein-capillary micro",
    d: "M 1236 384 C 1210 406, 1182 428, 1152 444 C 1138 452, 1128 454, 1120 456",
    delay: 0.24,
  },
  {
    className: "mixed-capillary micro",
    d: "M 1062 410 C 1082 428, 1100 438, 1120 456 C 1142 436, 1164 426, 1188 410",
    delay: 0.34,
  },
  {
    className: "mixed-capillary micro",
    d: "M 1050 510 C 1080 488, 1102 474, 1120 456 C 1140 482, 1168 498, 1202 508",
    delay: 0.42,
  },
];

const depthPaths: VesselPath[] = [
  {
    className: "depth-vessel depth-artery",
    d: "M -180 548 C 280 466, 650 610, 1060 478",
  },
  {
    className: "depth-vessel depth-artery",
    d: "M -150 194 C 290 310, 642 244, 1068 426",
    delay: 0.2,
  },
  {
    className: "depth-vessel depth-vein",
    d: "M 1780 568 C 1460 480, 1282 610, 1160 492",
    delay: 0.1,
  },
  {
    className: "depth-vessel depth-vein",
    d: "M 1760 194 C 1458 300, 1302 252, 1160 424",
    delay: 0.26,
  },
];

const orbitalPaths: VesselPath[] = [
  {
    className: "vascular-orbit-line orbit-gold",
    d: "M 864 456 C 902 256, 1088 180, 1250 268 C 1390 344, 1394 548, 1250 636 C 1084 738, 902 656, 864 456",
  },
  {
    className: "vascular-orbit-line orbit-cyan",
    d: "M 906 456 C 936 304, 1092 228, 1226 304 C 1334 364, 1348 538, 1224 610 C 1082 692, 936 606, 906 456",
    delay: 0.18,
  },
];

const arteryParticlePaths: ParticlePath[] = [
  {
    className: "artery-particle particle-main",
    d: arteryTrunks[0].d,
    dur: 8.6,
    begin: -0.4,
    r: 4,
  },
  {
    className: "artery-particle",
    d: arteryTrunks[1].d,
    dur: 10.4,
    begin: -2.8,
    r: 3.2,
  },
  {
    className: "artery-particle",
    d: arteryTrunks[2].d,
    dur: 9.8,
    begin: -5.2,
    r: 2.8,
  },
  {
    className: "artery-particle particle-capillary",
    d: capillaryPaths[0].d,
    dur: 4.8,
    begin: -1.4,
    r: 2.2,
  },
];

const veinParticlePaths: ParticlePath[] = [
  {
    className: "vein-particle particle-main",
    d: veinTrunks[0].d,
    dur: 9.2,
    begin: -1.2,
    r: 4,
  },
  {
    className: "vein-particle",
    d: veinTrunks[1].d,
    dur: 10.8,
    begin: -3.6,
    r: 3,
  },
  {
    className: "vein-particle",
    d: veinTrunks[2].d,
    dur: 10.2,
    begin: -6.1,
    r: 2.8,
  },
  {
    className: "vein-particle particle-capillary",
    d: capillaryPaths[3].d,
    dur: 5,
    begin: -2.2,
    r: 2.2,
  },
];

const vascularNodes = [
  { x: 1010, y: 424, r: 3.2, type: "artery" },
  { x: 1056, y: 438, r: 2.8, type: "artery" },
  { x: 1088, y: 470, r: 2.4, type: "capillary" },
  { x: convergence.x, y: convergence.y, r: 4, type: "core" },
  { x: 1150, y: 438, r: 2.8, type: "vein" },
  { x: 1188, y: 470, r: 2.4, type: "vein" },
  { x: 1230, y: 424, r: 3.2, type: "vein" },
];

const pathStyle = (delay = 0): CSSProperties =>
  ({
    "--vessel-delay": `${delay}s`,
    "--flow-delay": `${delay}s`,
    "--orbit-delay": `${delay}s`,
  }) as CSSProperties;

function renderVessels(paths: VesselPath[]) {
  return paths.map((path) => (
    <path
      key={`${path.className}-${path.d}`}
      className={`vessel ${path.className}`}
      d={path.d}
      style={pathStyle(path.delay)}
    />
  ));
}

function renderFlow(paths: VesselPath[], className: string) {
  return paths.map((path, index) => (
    <path
      key={`${className}-${path.d}`}
      className={`vessel-flow ${className}`}
      d={path.d}
      style={pathStyle(index * 0.18 + (path.delay ?? 0))}
    />
  ));
}

function renderParticles(paths: ParticlePath[]) {
  return paths.map((path, index) => (
    <circle
      key={`${path.className}-${index}`}
      className={`vascular-particle ${path.className}`}
      r={path.r}
    >
      <animateMotion
        path={path.d}
        dur={`${path.dur}s`}
        begin={`${path.begin}s`}
        repeatCount="indefinite"
      />
    </circle>
  ));
}

export function VascularBackground() {
  return (
    <svg
      className="vascular-svg"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <filter id="aeternumRedGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4.2" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0.34  0 0.48 0 0 0.04  0 0 0.36 0 0.02  0 0 0 0.82 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="aeternumBlueGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4.5" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="0 0 0 0 0.02  0 0.62 0 0 0.28  0 0 1 0 0.42  0 0 0 0.82 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <linearGradient id="aeternumArteryGradient" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#360905" />
          <stop offset="38%" stopColor="#972417" />
          <stop offset="74%" stopColor="#db6a34" />
          <stop offset="100%" stopColor="#d6b76a" />
        </linearGradient>

        <linearGradient id="aeternumVeinGradient" x1="100%" y1="50%" x2="0%" y2="50%">
          <stop offset="0%" stopColor="#061c33" />
          <stop offset="42%" stopColor="#087aae" />
          <stop offset="74%" stopColor="#20d5e0" />
          <stop offset="100%" stopColor="#7ff7f4" />
        </linearGradient>

        <linearGradient id="aeternumCapillaryGradient" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#ff8b55" stopOpacity="0.78" />
          <stop offset="48%" stopColor="#d6b76a" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#7ff7f4" stopOpacity="0.78" />
        </linearGradient>

        <radialGradient id="aeternumVascularNode">
          <stop offset="0%" stopColor="#f7f1d5" stopOpacity="1" />
          <stop offset="48%" stopColor="#d6b76a" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#7ff7f4" stopOpacity="0.22" />
        </radialGradient>

        <radialGradient id="aeternumConvergenceGlow">
          <stop offset="0%" stopColor="#f4e6ad" stopOpacity="0.42" />
          <stop offset="44%" stopColor="#7ff7f4" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#7ff7f4" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g className="vascular-depth" aria-hidden="true">
        {depthPaths.map((path) => (
          <path
            key={path.d}
            className={path.className}
            d={path.d}
            style={pathStyle(path.delay)}
          />
        ))}
      </g>

      <circle
        className="logo-convergence-halo"
        cx={convergence.x}
        cy={convergence.y}
        r="180"
      />
      <circle
        className="logo-convergence-core"
        cx={convergence.x}
        cy={convergence.y}
        r="8"
      />

      <g className="vascular-orbits" aria-hidden="true">
        {orbitalPaths.map((path) => (
          <path
            key={path.d}
            className={path.className}
            d={path.d}
            style={pathStyle(path.delay)}
          />
        ))}
      </g>

      <g className="arteries" filter="url(#aeternumRedGlow)" aria-hidden="true">
        {renderVessels(arteryTrunks)}
        {renderVessels(arteryBranches)}
        {renderFlow(arteryTrunks, "artery-flow")}
      </g>

      <g className="veins" filter="url(#aeternumBlueGlow)" aria-hidden="true">
        {renderVessels(veinTrunks)}
        {renderVessels(veinBranches)}
        {renderFlow(veinTrunks, "vein-flow")}
      </g>

      <g className="vascular-capillary-bed" aria-hidden="true">
        {capillaryPaths.map((path) => (
          <path
            key={path.d}
            className={`capillary ${path.className}`}
            d={path.d}
            style={pathStyle(path.delay)}
          />
        ))}
      </g>

      <g className="vascular-particles" aria-hidden="true">
        {renderParticles(arteryParticlePaths)}
        {renderParticles(veinParticlePaths)}
      </g>

      <g className="vascular-nodes" aria-hidden="true">
        {vascularNodes.map((node) => (
          <circle
            key={`${node.x}-${node.y}-${node.type}`}
            cx={node.x}
            cy={node.y}
            r={node.r}
            className={`vascular-node vascular-node-${node.type}`}
          />
        ))}
      </g>
    </svg>
  );
}
