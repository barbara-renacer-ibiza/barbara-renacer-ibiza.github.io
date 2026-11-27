type RenacerEmblemProps = {
  className?: string;
  label?: string;
};

export default function RenacerEmblem({ className = "nutrition-hero__mark", label = "Renacer Ibiza · Rituales de cuidados" }: RenacerEmblemProps) {
  return (
    <div className={className} role="img" aria-label={label}>
      <svg className="nutrition-hero__emblem" viewBox="0 0 84 84" aria-hidden="true">
        <circle cx="42" cy="42" r="37" fill="none" stroke="currentColor" strokeWidth="1.1" />
        <circle cx="42" cy="42" r="32" fill="none" stroke="currentColor" strokeWidth=".55" strokeDasharray="1 4" />
        <path d="M40 63c1-11 2-22 5-39" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M44 47c-11-.2-18-5.2-20-15.2 11.6.2 18.7 5.3 20 15.2Z" fill="#87977f" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
        <path d="M46 39c1.5-10.5 7.4-17.2 17.8-20.1.5 10.9-5.4 17.7-17.8 20.1Z" fill="#b9c2a7" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
        <path d="M42 56c-8.6-.1-14.2-4-16-11.7 9.2.2 14.9 4.1 16 11.7Z" fill="#d7c8a6" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
        <circle cx="62" cy="56" r="3.2" fill="#bf7657" />
        <path d="M31 66h22" stroke="currentColor" strokeWidth=".8" strokeLinecap="round" opacity=".7" />
      </svg>
      <span className="nutrition-hero__wordmark">Renacer<small>IBIZA</small></span>
    </div>
  );
}
