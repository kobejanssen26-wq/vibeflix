import type { ReactNode } from 'react'

/**
 * Hand-drawn icon set. Everything sits on a 24px grid with square ends and mitred
 * corners, so mood glyphs, interface icons and people share one angular line style.
 */

/** A standing figure: round head, rounded-shoulder torso. h = total height. */
function figure(cx: number, base: number, h: number, key: string): ReactNode {
  const r = h * 0.17
  const w = h * 0.3
  const top = base - h * 0.62
  return (
    <g key={key}>
      <circle cx={cx} cy={base - h + r} r={r} />
      <path d={`M${cx - w} ${base}V${top + w}a${w} ${w} 0 0 1 ${2 * w} 0V${base}z`} />
    </g>
  )
}

const dot = (cx: number, cy: number, r = 0.9, key?: string) => <circle key={key} cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />

const ICONS = {
  // ── moods ──
  'mood-funny': <><path d="M8 7.500v2M16 7.500v2" /><path d="M4.500 12.500h15a7.500 7.500 0 0 1-15 0z" /><path d="M8.500 12.500v2.500M12 12.500v3M15.500 12.500v2.500" /></>,
  'mood-romantic': <><circle cx="8.500" cy="12" r="5.500" /><circle cx="15.500" cy="12" r="5.500" /></>,
  'mood-thrilling': <><path d="M12 3.500a4.500 4.500 0 0 1 2 8.500L15.500 21h-7L10 12a4.500 4.500 0 0 1 2-8.500z" />{dot(12, 8, 1.1)}</>,
  'mood-mindblowing': <path d="M12 13v-2h2.500v4H9.500V9H17v8H7V7h12v12H4.500" />,
  'mood-emotional': <><path d="M12 3c3.500 4.500 5.500 7.500 5.500 10.500a5.500 5.500 0 0 1-11 0C6.500 10.500 8.500 7.500 12 3z" /><path d="M9.500 14.500a2.500 2.500 0 0 0 2.500 2.500" /></>,
  'mood-adventurous': <><path d="M2.500 20.500 9.500 8l4.500 8 2.500-4 5 8.500z" /><path d="M9.500 8V3h4.500l-1.500 1.800L14 6.500H9.500" /></>,
  'mood-relaxed': <path d="M19.500 14.500A8 8 0 1 1 9.500 4.500a6.500 6.500 0 0 0 10 10z" />,
  'mood-scary': <><path d="M5.500 21V11a6.500 6.500 0 0 1 13 0v10l-2.170-2L14.170 21 12 19l-2.170 2L7.670 19z" /><path d="M9.500 10.500v2M14.500 10.500v2" /></>,
  'mood-curious': <><circle cx="12" cy="12" r="4.500" /><ellipse cx="12" cy="12" rx="10" ry="3.400" transform="rotate(-24 12 12)" /></>,
  'mood-surprise': <><path d="M4 4h16v16H4z" />{dot(8.500, 8.500, 1.200, 'a')}{dot(15.500, 8.500, 1.200, 'b')}{dot(12, 12, 1.200, 'c')}{dot(8.500, 15.500, 1.200, 'd')}{dot(15.500, 15.500, 1.200, 'e')}</>,
  // ── people ──
  'who-solo': figure(12, 20, 16, 'a'),
  'who-partner': <>{figure(7.600, 20, 14, 'a')}{figure(16.400, 20, 14, 'b')}</>,
  'who-friends': <>{figure(5.500, 20, 11, 'a')}{figure(12, 20, 13, 'b')}{figure(18.500, 20, 11, 'c')}</>,
  'who-family': <>{figure(8.500, 20, 16, 'a')}{figure(17, 20, 9, 'b')}</>,
  'who-group': <>{[[6, 7], [12, 7], [18, 7], [9, 13], [15, 13], [6, 19], [12, 19], [18, 19]].map(([x, y]) => dot(x, y, 1.600, `${x}-${y}`))}</>,
  'age-children': figure(12, 20, 9, 'a'),
  'age-teens': figure(12, 20, 13, 'a'),
  'age-adults': figure(12, 20, 17, 'a'),
  'age-mixed': <>{figure(6, 20, 16, 'a')}{figure(13.500, 20, 12, 'b')}{figure(19.500, 20, 8, 'c')}</>,
  // ── interface ──
  home: <path d="M3 11 12 3l9 8M5.500 9.500V21h13V9.500M10 21v-6h4v6" />,
  ticket: <path d="M3 7h18v3.200a1.800 1.800 0 0 0 0 3.600V17H3v-3.200a1.800 1.800 0 0 0 0-3.600zM14.500 7v2M14.500 11v2M14.500 15v2" />,
  film: <path d="M4 4h16v16H4zM8 4v16M16 4v16M4 8h4M4 12h4M4 16h4M16 8h4M16 12h4M16 16h4" />,
  bookmark: <path d="M6 3h12v18l-6-4.500L6 21z" />,
  sliders: <path d="M4 7h8M16 7h4M4 17h4M12 17h8M14 4v6M10 14v6" />,
  back: <path d="M15 4 7 12l8 8" />,
  next: <path d="M4 12h15M13 6l6 6-6 6" />,
  check: <path d="m4 12.500 5 5L20 6.500" />,
  close: <path d="m5 5 14 14M19 5 5 19" />,
  clock: <><circle cx="12" cy="12" r="8.500" /><path d="M12 7v5.500l3.500 2" /></>,
  eye: <><path d="M2 12c3-5 6-7 10-7s7 2 10 7c-3 5-6 7-10 7s-7-2-10-7z" /><circle cx="12" cy="12" r="3" /></>,
  swap: <path d="M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4" />,
  refresh: <path d="M19.500 12A7.500 7.500 0 1 1 17 6.400M17.500 3v4h-4" />,
  search: <><circle cx="10.500" cy="10.500" r="6.500" /><path d="m15.500 15.500 5.500 5.500" /></>,
  info: <><circle cx="12" cy="12" r="8.500" /><path d="M12 11v6" />{dot(12, 7.800)}</>,
  warn: <><path d="M12 3 22 20.500H2z" /><path d="M12 10v5" />{dot(12, 17.600)}</>,
} as const

export type IconName = keyof typeof ICONS
export type MoodIconName = Extract<IconName, `mood-${string}`>

const SOLID: IconName[] = ['who-solo', 'who-partner', 'who-friends', 'who-family', 'age-children', 'age-teens', 'age-adults', 'age-mixed']

export function Icon({ name, size = 20, filled = false, className }: { name: IconName; size?: number; filled?: boolean; className?: string }) {
  const fill = filled || SOLID.includes(name) ? 'currentColor' : 'none'
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill={fill} fillOpacity={SOLID.includes(name) && !filled ? 0.18 : 1}
      stroke="currentColor" strokeWidth="1.700" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      {ICONS[name]}
    </svg>
  )
}
