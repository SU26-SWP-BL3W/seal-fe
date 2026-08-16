export function HexagonLoader({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className || ""}`}>
      <svg className="w-12 h-12 animate-pulse" viewBox="0 0 100 100">
        <polygon
          points="50,1 95,25 95,75 50,99 5,75 5,25"
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth="2"
        />
        <polygon
          points="50,10 85,30 85,70 50,90 15,70 15,30"
          fill="rgba(0, 217, 255, 0.1)"
          stroke="var(--accent-primary)"
          strokeWidth="1"
          className="animate-bounce"
        />
      </svg>
    </div>
  );
}
