const iconPaths = {
  oil: (
    <>
      <path d="M7 7h9l2 3v7H6V9h1z" />
      <path d="M9 7V4h5v3M18 11h3M9 12h5" />
    </>
  ),
  brake: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  tire: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="m8 5 2 4M16 5l-2 4M8 19l2-4M16 19l-2-4" />
    </>
  ),
  battery: (
    <>
      <rect x="4" y="7" width="16" height="12" rx="2" />
      <path d="M8 7V5h3v2M15 7V5h3v2M8 13h4M10 11v4M15 13h3" />
    </>
  ),
  inspection: (
    <>
      <rect x="5" y="5" width="14" height="16" rx="2" />
      <path d="M9 5V3h6v2M8 10h1M12 10h4M8 14h1M12 14h4M8 18h1M12 18h4" />
    </>
  ),
  air: (
    <>
      <path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11" />
      <circle cx="12" cy="12" r="2" />
      <path d="m12 2-2 2M12 2l2 2M4.5 6.5l.5 3M4.5 6.5l3 .5M19.5 6.5l-3 .5M19.5 6.5l-.5 3" />
    </>
  ),
  service: (
    <>
      <path d="m14 5 5 5-9 9H5v-5z" />
      <path d="m13 6 2-2 5 5-2 2M7 16l1 1" />
    </>
  ),
};

function ServiceIcon({ name, className = "h-6 w-6" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {iconPaths[name] || iconPaths.service}
    </svg>
  );
}

export default ServiceIcon;
