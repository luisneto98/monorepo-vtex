
export const Avatar = ({ children, className }: any) => (
  <div className={`relative inline-block rounded-full overflow-hidden bg-gray-200 ${className || 'h-10 w-10'}`}>
    {children}
  </div>
);

export const AvatarImage = ({ src, alt }: any) => {
  if (!src) return null;
  return <img src={src} alt={alt} className="w-full h-full object-cover" />;
};

export const AvatarFallback = ({ children, className }: any) => (
  <div className={`flex items-center justify-center w-full h-full bg-gray-300 text-gray-700 ${className || ''}`}>
    {children}
  </div>
);