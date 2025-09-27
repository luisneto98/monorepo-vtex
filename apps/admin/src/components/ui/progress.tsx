interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
}

export const Progress = ({ value = 0, max = 100, className = '' }: ProgressProps) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};