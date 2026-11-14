/** Original 24px line icons. Decorative: the adjacent text always carries the meaning. */
const paths = {
  bolt: 'M13 2 5 14h6l-1 8 8-12h-6z',
  leaf: 'M5 19c0-9 5-14 15-14 0 10-5 15-14 14zm0 0 9-9',
  sample: 'M9 3h6v5l3 9a3 3 0 0 1-3 4H9a3 3 0 0 1-3-4l3-9zM7.5 14h9',
  shield: 'M12 3 4.5 6v6c0 4.5 3 7.7 7.5 9 4.500-1.300 7.500-4.500 7.500-9V6z',
  crew: 'M12 4a3.500 3.500 0 1 0 0 7 3.500 3.500 0 0 0 0-7zM5 21c0-4 3-7 7-7s7 3 7 7',
  sun: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1v3M12 20v3M1 12h3M20 12h3M4.200 4.200l2.100 2.100M17.700 17.700l2.100 2.100M4.200 19.800l2.100-2.100M17.700 6.300l2.100-2.100',
  lock: 'M6 11h12v10H6zM8.500 11V7.500a3.500 3.500 0 0 1 7 0V11',
  warning: 'M12 3 2 20h20zM12 10v5M12 17.500v.5',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  book: 'M4 5c3-1 5-1 8 1 3-2 5-2 8-1v14c-3-1-5-1-8 1-3-2-5-2-8-1zM12 6v14',
  gear: 'M12 8.500a3.500 3.500 0 1 0 0 7 3.500 3.500 0 0 0 0-7zM12 2v3M12 19v3M2 12h3M19 12h3M4.900 4.900 7 7M17 17l2.100 2.100M4.900 19.100 7 17M17 7l2.100-2.100',
  model: 'M4 18 9 11l4 4 7-10M4 21h17M15 5h5v5',
  sound: 'M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M18.500 6.500a8 8 0 0 1 0 11',
  mute: 'M4 9v6h4l5 4V5L8 9zM16 9l5 6M21 9l-5 6',
  sources: 'M5 4h11l3 3v13H5zM8 9h8M8 13h8M8 17h5',
  close: 'M5 5l14 14M19 5 5 19',
  check: 'M4 12.500 9.500 18 20 6',
  arrow: 'M4 12h15M13 6l6 6-6 6',
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 11v6M12 7v.500',
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={paths[name]} />
    </svg>
  );
}
