import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export const NAV_ICONS: Record<string, (props: IconProps) => ReactNode> = {
  "/": (props) => (
    <Icon {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Icon>
  ),
  "/documents": (props) => (
    <Icon {...props}>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </Icon>
  ),
  "/classification": (props) => (
    <Icon {...props}>
      <path d="M4 7h16M4 12h10M4 17h7" />
      <path d="M16 14l2 2 4-4" />
    </Icon>
  ),
  "/preprocessing": (props) => (
    <Icon {...props}>
      <rect x="3" y="5" width="7" height="14" rx="1" />
      <path d="M12 12h9M18 9l3 3-3 3" />
      <rect x="14" y="5" width="7" height="14" rx="1" opacity="0.7" />
    </Icon>
  ),
  "/extraction": (props) => (
    <Icon {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 9h8M8 12h5M8 15h6" />
    </Icon>
  ),
  "/ocr": (props) => (
    <Icon {...props}>
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M8 12h.01M12 12h.01M16 12h.01" strokeWidth="2" />
    </Icon>
  ),
  "/structured-record": (props) => (
    <Icon {...props}>
      <path d="M8 4h8a2 2 0 0 1 2 2v14H6V6a2 2 0 0 1 2-2z" />
      <path d="M9 9h6M9 13h6M9 17h4" />
    </Icon>
  ),
  "/validation": (props) => (
    <Icon {...props}>
      <path d="M12 3l8 4v6c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V7l8-4z" />
      <path d="M9 12l2 2 4-4" />
    </Icon>
  ),
  "/reconciliation": (props) => (
    <Icon {...props}>
      <path d="M8 7H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h6" />
      <path d="M16 17h3a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-6" />
      <path d="M9 12h6M12 9v6" />
    </Icon>
  ),
  "/conflicts": (props) => (
    <Icon {...props}>
      <path d="M12 3l9 16H3L12 3z" />
      <path d="M12 9v5M12 16.5h.01" />
    </Icon>
  ),
  "/verification": (props) => (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M4 19c.6-3 2.6-4.5 5-4.5s4.4 1.5 5 4.5" />
      <path d="M16 11l2 2 4-4" />
    </Icon>
  ),
  "/land-records": (props) => (
    <Icon {...props}>
      <path d="M4 6h16v14H4z" />
      <path d="M4 10h16M9 6v14M4 14h16" />
    </Icon>
  ),
  "/gis-map": (props) => (
    <Icon {...props}>
      <path d="M9 4l6 2 5-2v16l-5 2-6-2-5 2V6l5-2z" />
      <path d="M9 4v16M15 6v16" />
    </Icon>
  ),
  "/audit-logs": (props) => (
    <Icon {...props}>
      <path d="M8 4h8a2 2 0 0 1 2 2v14l-6-3-6 3V6a2 2 0 0 1 2-2z" />
      <path d="M10 9h4M10 13h2" />
    </Icon>
  ),
  "/settings": (props) => (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.7.9 1.2 1.6 1.3H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1z" />
    </Icon>
  ),
};
