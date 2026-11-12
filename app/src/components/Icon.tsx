import type { ReactNode, SVGProps } from 'react'

export type IconName =
  | 'library'
  | 'notebook'
  | 'review'
  | 'settings'
  | 'plus'
  | 'back'
  | 'close'
  | 'search'
  | 'more'
  | 'check'
  | 'trash'

const paths: Record<IconName, ReactNode> = {
  library: (
    <>
      <path d="M5 4.5h10.5A3.5 3.5 0 0 1 19 8v11.5H8.5A3.5 3.5 0 0 1 5 16V4.5Z" />
      <path d="M8.5 7.5H19M8.5 11H19M8.5 14.5H19" />
    </>
  ),
  notebook: (
    <>
      <path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h3" />
      <path d="M4.5 7H6M4.5 12H6M4.5 17H6" />
    </>
  ),
  review: (
    <>
      <path d="M5 6h14v12H5zM8 3.5v5M16 3.5v5M5 10h14" />
      <path d="m9 14 2 2 4-4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  back: <path d="m15 5-7 7 7 7" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4 4" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  trash: <path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
}

export function Icon({
  name,
  size = 22,
  ...props
}: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}

