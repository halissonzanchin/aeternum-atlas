const paths = {
  home: "M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5Z",
  undo: "M9 7H4v5m0 0 5-5M4 12h9a6 6 0 1 1-4.24 10.24",
  search: "m21 21-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z",
  tools: "m14.7 6.3 3 3M3 21l6.4-6.4m0 0 2.1 2.1M9.4 14.6 18.8 5.2a2 2 0 1 0-2.8-2.8L6.6 11.8",
  library: "M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2V5Zm4 2h8M8 11h8",
  shop: "M6 7h12l-1 14H7L6 7Zm0 0 1.5-4h9L18 7M9 11a3 3 0 0 0 6 0",
  settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-12v2m0 13v2m8.49-15-1.42 1.42M4.93 19.07l-1.42 1.42m18-8.49h-2M5.5 12h-2m16.99 6.49-1.42-1.42M4.93 4.93 3.51 3.51",
  camera: "M4 7h3l1.5-2h7L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm8 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  help: "M9.1 9a3 3 0 1 1 4.9 2.3c-1.1.67-2 1.26-2 2.7m0 4h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
  lock: "M7 11V8a5 5 0 0 1 10 0v3m-11 0h12v10H6V11Zm6 5v2m-3-7V8a3 3 0 0 1 6 0v3",
  close: "M6 6l12 12M18 6 6 18",
  chevron: "m9 18 6-6-6-6",
  layers: "m12 3 9 5-9 5-9-5 9-5Zm-7 9 7 4 7-4M5 17l7 4 7-4",
  note: "M6 3h9l3 3v15H6V3Zm8 0v4h4M9 11h6M9 15h6M9 19h4",
  isolate: "M4 4h6v6H4V4Zm10 10h6v6h-6v-6Zm1-9h5v5m0-5-6 6M9 20H4v-5m0 5 6-6",
  eye: "M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  spark: "M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2Zm7 14 .9 2.6L22 19l-2.1.4L19 22l-.9-2.6L16 19l2.1-.4L19 16Z",
  fullscreen: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
  reset: "M4 4v6h6M20 20v-6h-6M5 10a8 8 0 0 1 13.7-3.7M19 14a8 8 0 0 1-13.7 3.7",
  favorite: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z",
  check: "M20 6 9 17l-5-5",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-15v5l3 2",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-4a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0-4a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  timer: "M10 2h4m-2 5v5l3 2m5-2a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-1.5-5.5 1.5-1.5",
  clipboardCheck: "M9 5h6M9 3h6v4H9V3ZM7 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2m-1 8-4 4-2-2",
  fileQuestion: "M6 3h9l3 3v15H6V3Zm8 0v4h4M10 11a2 2 0 1 1 3.3 1.5c-.8.5-1.3.95-1.3 1.8m0 3h.01",
  menu: "M4 7h16M4 12h16M4 17h16"
};

export default function LineIcon({ name, className = "h-5 w-5", strokeWidth = 1.8, filled = false }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} aria-hidden="true">
      <path d={paths[name] || paths.layers} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
