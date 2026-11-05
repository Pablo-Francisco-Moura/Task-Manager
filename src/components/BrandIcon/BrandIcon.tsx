interface IProps {
  size?: number;
  className?: string;
}

export function BrandIcon({ size = 40, className }: IProps) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "block",
        width: size,
        height: size,
        backgroundImage: "var(--brand-icon-image, url('/icon.png'))",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "contain",
      }}
    />
  );
}
