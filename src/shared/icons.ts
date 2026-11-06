const paths = {
  play: '<path d="m9 5 11 7-11 7V5Z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke-width="3"/>',
  step: '<path d="m6 5 9 7-9 7V5Z" fill="currentColor" stroke="none"/><path d="M18 5v14"/>',
  reset: '<path d="M4 4v6h6"/><path d="M5.5 15a7.5 7.5 0 1 0 .5-7.5L4 10"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  arrowUpRight: '<path d="M7 17 17 7M7 7h10v10"/>',
  chevronRight: '<path d="m9 5 7 7-7 7"/>',
  chevronLeft: '<path d="m15 5-7 7 7 7"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  flask: '<path d="M9 3h6M10 3v6l-5 9c-.5 1.1.3 2 1.5 2h11c1.2 0 2-.9 1.5-2l-5-9V3"/><path d="M7.5 15h9"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H11v18H6.5A2.5 2.5 0 0 0 4 22V4.5ZM20 4.5A2.5 2.5 0 0 0 17.5 2H13v18h4.5A2.5 2.5 0 0 1 20 22V4.5Z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  cube: '<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z"/><path d="m3 7 9 5 9-5M12 12v10"/>',
  home: '<path d="m3 11 9-8 9 8M5 9v12h14V9M9 21v-7h6v7"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 4V1M12 23v-3M4 12H1M23 12h-3"/>',
  camera: '<path d="M4 7h3l2-3h6l2 3h3v13H4V7Z"/><circle cx="12" cy="13" r="4"/>',
  expand: '<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8l10-5Z"/><path d="m2 12 10 5 10-5M2 16l10 5 10-5"/>',
  route: '<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h5a3 3 0 0 1 0 6h0a3 3 0 0 0 0 6h5"/>',
  spark: '<path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/>',
  brain: '<path d="M9.5 4A3.5 3.5 0 0 0 6 7.5c0 .3 0 .5.1.7A4 4 0 0 0 5 16a4 4 0 0 0 4.5 4V4ZM14.5 4A3.5 3.5 0 0 1 18 7.5c0 .3 0 .5-.1.7A4 4 0 0 1 19 16a4 4 0 0 1-4.5 4V4Z"/><path d="M6 9h3.5M6 15h3.5M18 9h-3.5M18 15h-3.5"/>',
  keyboard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M10 13h.01M14 13h.01M18 13h.01M8 16h8"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h3M11 17h9"/><circle cx="16" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  map: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
  isoView: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
  topView: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16M15 14l3 3-3 3M18 17h-6"/>',
  sideView: '<path d="M3 18h18M5 15l5-7 4 4 5-8M5 21h18"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
  monitor: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 22h8M12 18v4M7 9l2 2-2 2M11 14h5"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"/>',
  trash: '<path d="M4 7h16M9 3h6l1 4H8l1-4ZM6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="m3 3 18 18M10 6.2A11 11 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3 3.5M6.2 6.2C3.4 8.2 2 12 2 12s3.5 6 10 6a10 10 0 0 0 4-.8M10 10a3 3 0 0 0 4 4"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3"/>',
};

export function icon(name: keyof typeof paths, size = 20, className = '') {
  return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.cube}</svg>`;
}

export const brandMark = `<svg viewBox="0 0 68 52" fill="none" aria-hidden="true"><path d="M8 7h17c14 0 23 7 23 19S39 45 25 45H8V7Z" stroke="currentColor" stroke-width="3.4"/><path d="M18 17h7c7 0 12 3 12 9s-5 9-12 9h-7V17Z" fill="currentColor"/><circle cx="54" cy="10" r="7" fill="#1aa3a1"/><circle cx="54" cy="10" r="11" stroke="#1aa3a1" stroke-opacity=".25"/></svg>`;

export function lessonArt(id: string) {
  const art: Record<string, string> = {
    interact: '<path d="M14 20h30v18H14zM52 12h30v18H52zM52 42h30v18H52zM90 24h20v20H90z" class="cells"/><path d="M28 52 43 29h24l28 8" class="path-real"/><circle cx="28" cy="52" r="5" class="agent"/><circle cx="99" cy="34" r="5" class="goal"/>',
    explore: '<path d="M20 56 46 40 72 48 98 22M46 40 48 17M72 48 91 62" class="path-real"/><path d="M20 56 36 66M46 40 70 18M72 48 105 51" class="path-model"/><circle cx="20" cy="56" r="5" class="agent"/><circle cx="48" cy="17" r="4" class="node"/><circle cx="98" cy="22" r="5" class="goal"/><circle cx="91" cy="62" r="4" class="node"/>',
    imagine: '<path d="M17 50h25l16-25h27" class="path-real"/><path d="M17 62h42c31 0 37-42 7-42H39" class="path-model"/><path d="m44 15-7 5 7 5" class="path-model"/><rect x="48" y="17" width="18" height="14" class="cells"/><circle cx="17" cy="50" r="5" class="agent"/><circle cx="90" cy="25" r="5" class="goal"/>',
    mismatch: '<path d="M15 55h29l18-28" class="path-real"/><path d="M62 27h25" class="path-model"/><path d="m79 18 9 9-9 9" class="path-model"/><circle cx="15" cy="55" r="5" class="agent"/><circle cx="62" cy="27" r="7" class="old-goal"/><circle cx="99" cy="27" r="6" class="goal"/><path d="M52 57h20v13H52zM82 49h20v13H82z" class="cells"/>',
  };
  return `<svg class="lesson-art" viewBox="0 0 120 80" fill="none" aria-hidden="true">${art[id] || art.interact}</svg>`;
}
