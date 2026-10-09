const PATHS = {
  heart: 'M12 21s-7.5-4.6-9.6-9.1C1 8.7 2.7 5 6.2 5c2 0 3.3 1 3.8 2 .5-1 1.8-2 3.8-2 3.5 0 5.2 3.700 3.800 6.900C19.500 16.400 12 21 12 21z',
  check: 'M5 12.500l4.500 4.500L19 7.500',
  back: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
  home: 'M4 11l8-7 8 7v8a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1v-8z',
  film: 'M4 5h16v14H4zM8 5v14M16 5v14M4 9h4M4 15h4M16 9h4M16 15h4',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4',
  settings: 'M12 9a3 3 0 100 6 3 3 0 000-6zM19.400 15a1.700 1.700 0 00.300 1.800l.1.100a2 2 0 11-2.800 2.800l-.1-.1a1.700 1.700 0 00-1.800-.3 1.700 1.700 0 00-1 1.500V21a2 2 0 11-4 0v-.1a1.700 1.700 0 00-1.100-1.500 1.700 1.700 0 00-1.800.3l-.1.100a2 2 0 11-2.800-2.800l.1-.1a1.700 1.700 0 00.3-1.800 1.700 1.700 0 00-1.500-1H3a2 2 0 110-4h.1a1.700 1.700 0 001.500-1.100 1.700 1.700 0 00-.3-1.800l-.1-.1a2 2 0 112.800-2.800l.1.100a1.700 1.700 0 001.800.3H9a1.700 1.700 0 001-1.500V3a2 2 0 114 0v.1a1.700 1.700 0 001 1.500 1.700 1.700 0 001.800-.3l.1-.1a2 2 0 112.800 2.800l-.1.100a1.700 1.700 0 00-.3 1.800V9a1.700 1.700 0 001.500 1H21a2 2 0 110 4h-.1a1.700 1.700 0 00-1.500 1z',
  star: 'M12 3.500l2.600 5.300 5.800.8-4.200 4.100 1 5.800L12 16.800 6.800 19.500l1-5.800-4.200-4.100 5.800-.8z',
  clock: 'M12 4a8 8 0 100 16 8 8 0 000-16zM12 8v4.500l3 1.500',
  play: 'M8 5.500v13l11-6.500z',
  close: 'M6 6l12 12M18 6L6 18',
  refresh: 'M20 12a8 8 0 11-2.400-5.700M20 4v5h-5',
  sparkle: 'M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z',
  eye: 'M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z',
  info: 'M12 4a8 8 0 100 16 8 8 0 000-16zM12 11v5M12 8v.1',
  warn: 'M12 4l9 16H3zM12 10v4M12 17v.1',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 20, filled = false, className }: { name: IconName; size?: number; filled?: boolean; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  )
}
