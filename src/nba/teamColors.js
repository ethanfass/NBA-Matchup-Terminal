export const TEAM_COLORS = {
  ATL: ['#e03a3e', '#c1d32f', '#551b8c'],
  BOS: ['#007a33', '#ba9653', '#111111'],
  BKN: ['#111111', '#ffffff', '#777777'],
  CHA: ['#1d1160', '#00788c', '#a1a1a4'],
  CHI: ['#ce1141', '#111111', '#f6f6f6'],
  CLE: ['#6f263d', '#ffb81c', '#041e42'],
  DAL: ['#00538c', '#b8c4ca', '#002b5e'],
  DEN: ['#0e2240', '#fec524', '#8b2131'],
  DET: ['#c8102e', '#1d42ba', '#bec0c2'],
  GSW: ['#1d428a', '#ffc72c', '#26282a'],
  HOU: ['#ce1141', '#111111', '#c4ced4'],
  IND: ['#002d62', '#fdbb30', '#bec0c2'],
  LAC: ['#C8102E', '#1D428A', '#000000'],
  LAL: ['#552583', '#fdb927', '#111111'],
  MEM: ['#5d76a9', '#12173f', '#f5b112'],
  MIA: ['#98002e', '#f9a01b', '#111111'],
  MIL: ['#00471b', '#eee1c6', '#0077c0'],
  MIN: ['#0c2340', '#78be20', '#236192'],
  NOP: ['#0c2340', '#c8102e', '#85714d'],
  NYK: ['#006bb6', '#f58426', '#bec0c2'],
  OKC: ['#007ac1', '#ef3b24', '#fdbb30'],
  ORL: ['#0077c0', '#c4ced4', '#111111'],
  PHI: ['#006bb6', '#ed174c', '#002b5c'],
  PHX: ['#1d1160', '#e56020', '#63727a'],
  POR: ['#e03a3e', '#111111', '#c4ced4'],
  SAC: ['#5a2d81', '#63727a', '#111111'],
  SAS: ['#c4ced4', '#111111', '#8a8d8f'],
  TOR: ['#ce1141', '#111111', '#a1a1a4'],
  UTA: ['#002b5c', '#f9a01b', '#00471b'],
  WAS: ['#002b5c', '#e31837', '#c4ced4'],
  SEA: ['#00653a', '#ffc200', '#111111'],
  NJN: ['#002a60', '#c8102e', '#c4ced4'],
  NOH: ['#00848e', '#fdb927', '#6c2a6a'],
  CHH: ['#00788c', '#1d1160', '#a1a1a4'],
  VAN: ['#00a9c5', '#ed1b2f', '#111111'],
  NBA: ['#C8102E', '#1D428A', '#000000']
};

export function getTeamColorSet(abbreviation = 'NBA') {
  const [primary, secondary, dark] = TEAM_COLORS[abbreviation] || TEAM_COLORS.NBA;

  return {
    primary,
    secondary,
    dark,
    secondaryDark: dark === secondary ? '#111111' : secondary
  };
}

export function hexToRgb(hex = '') {
  const clean = hex.replace('#', '').trim();
  if (!/^[0-9a-f]{6}$/i.test(clean)) return null;

  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  };
}

export function colorDistance(a, b) {
  const first = hexToRgb(a);
  const second = hexToRgb(b);
  if (!first || !second) return 999;

  return Math.sqrt(
    (first.r - second.r) ** 2 +
      (first.g - second.g) ** 2 +
      (first.b - second.b) ** 2
  );
}

export function bestContrastColor(reference, candidates) {
  return candidates
    .filter(Boolean)
    .filter((color) => colorDistance(color, '#000000') > 42)
    .filter((color) => colorDistance(color, '#ffffff') > 22)
    .map((color) => ({ color, distance: colorDistance(reference, color) }))
    .sort((a, b) => b.distance - a.distance)[0]?.color;
}

export function getSlotColors(slots, index, season) {
  const currentTeam = season?.TEAM_ABBREVIATION || slots[index]?.player?.team || 'NBA';
  const otherIndex = index === 0 ? 1 : 0;
  const otherTeam = slots[otherIndex]?.player?.team;
  const colors = getTeamColorSet(currentTeam);

  if (currentTeam === otherTeam) {
    return index === 0
      ? colors
      : {
          ...colors,
          primary: colors.secondary,
          secondary: colors.primary,
          dark: colors.secondaryDark || colors.dark
        };
  }

  return colors;
}

export function differentiateSelectedColors(selected) {
  if (selected.length < 2) return selected;

  const [first, second] = selected;
  if (!first?.colors || !second?.colors) return selected;

  const tooClose = colorDistance(first.colors.primary, second.colors.primary) < 115;
  if (!tooClose) return selected;

  const secondPalette = [
    second.colors.secondary,
    second.colors.dark,
    getTeamColorSet(second.season?.TEAM_ABBREVIATION || second.player?.team).secondary,
    getTeamColorSet(second.season?.TEAM_ABBREVIATION || second.player?.team).dark
  ];

  const firstPalette = [
    first.colors.secondary,
    first.colors.dark,
    getTeamColorSet(first.season?.TEAM_ABBREVIATION || first.player?.team).secondary,
    getTeamColorSet(first.season?.TEAM_ABBREVIATION || first.player?.team).dark
  ];

  const secondAlternate = bestContrastColor(first.colors.primary, secondPalette);
  if (secondAlternate) {
    return [first, { ...second, colors: { ...second.colors, primary: secondAlternate } }];
  }

  const firstAlternate = bestContrastColor(second.colors.primary, firstPalette);
  if (firstAlternate) {
    return [{ ...first, colors: { ...first.colors, primary: firstAlternate } }, second];
  }

  return selected;
}
