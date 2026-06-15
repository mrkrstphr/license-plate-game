import usFlagSvg from "~/lib/icon-us-flag.svg?raw";

const encoded = `data:image/svg+xml;base64,${btoa(usFlagSvg)}`;

interface USFlagProps {
  className?: string;
  style?: React.CSSProperties;
}

export function USFlag({ className, style }: USFlagProps) {
  return (
    <img
      src={encoded}
      alt="United States"
      className={className}
      style={{ display: "inline-block", ...style }}
    />
  );
}
