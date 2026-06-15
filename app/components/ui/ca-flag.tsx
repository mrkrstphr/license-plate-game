import caFlagSvg from "~/lib/icon-ca-flag.svg?raw";

// Inline SVG Canada flag as an img tag via data URI
const encoded = typeof btoa !== "undefined"
  ? `data:image/svg+xml;base64,${btoa(caFlagSvg)}`
  : "";

interface CAFlagProps {
  className?: string;
  style?: React.CSSProperties;
}

export function CAFlag({ className, style }: CAFlagProps) {
  return (
    <img
      src={encoded}
      alt="Canada"
      className={className}
      style={{ display: "inline-block", ...style }}
    />
  );
}
