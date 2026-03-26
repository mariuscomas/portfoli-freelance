export default function LogoSmall({ className = "" }: { className?: string }) {
  return (
    <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`h-6 w-auto ${className}`}>
      <path d="M10.0127 18.1055L15.2227 3.02148H20V17.0215H16V11.4766L12 23.0215H8L4 11.4766V23.0215H0V3.02148H4.80371L10.0127 18.1055ZM20 19.0215V23.0215H16V19.0215H20Z" fill="currentColor"/>
    </svg>
  );
}
