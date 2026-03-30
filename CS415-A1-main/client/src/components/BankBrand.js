export default function BankBrand({
  title = "Bank of Fiji",
  subtitle = "",
  className = "",
  compact = false,
  eyebrow = "",
}) {
  const rootClassName = [
    "brand-block",
    compact ? "brand-block--compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClassName}>
      <div className="bank-mark" aria-hidden="true">
        <span className="bank-mark__glow" />
        <span className="bank-mark__ring" />
        <span className="bank-mark__sun" />
        <span className="bank-mark__island" />
        <span className="bank-mark__wave bank-mark__wave--top" />
        <span className="bank-mark__wave bank-mark__wave--bottom" />
        <span className="bank-mark__monogram">BF</span>
      </div>
      <div className="brand-block__text">
        {eyebrow && <span className="brand-block__eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    </div>
  );
}