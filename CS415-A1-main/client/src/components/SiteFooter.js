import BankBrand from "./BankBrand";

export default function SiteFooter({ currentYear }) {
  return (
    <footer className="site-footer">
      <BankBrand className="site-footer-brand" compact title="Bank of Fiji" eyebrow="Secure everyday banking" />
      <p>Support: support@bof.fj | Hotline: +679 7899369</p>
      <p>Copyright {currentYear} Bank of Fiji. All rights reserved.</p>
    </footer>
  );
}
