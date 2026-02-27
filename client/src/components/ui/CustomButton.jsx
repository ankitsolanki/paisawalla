const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  className = '',
  ...props
}) => {
  const variantClasses = {
    primary: 'text-white',
    secondary: 'bg-transparent border border-primary text-primary',
    outline: 'bg-transparent border border-border text-foreground',
    danger: 'bg-destructive text-destructive-foreground',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-8 py-3 text-base',
    lg: 'px-10 py-4 text-lg',
  };

  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-300 cursor-pointer';
  const disabledClasses = disabled || loading ? 'opacity-60 cursor-not-allowed' : '';
  const widthClass = fullWidth ? 'w-full' : '';

  const handleClick = (e) => {
    if (onClick && !disabled && !loading) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      style={variant === 'primary' ? { background: 'linear-gradient(90deg, #160E7A 0%, #4A40EB 100%)' } : undefined}
      className={`${baseClasses} ${variantClasses[variant] || ''} ${sizeClasses[size] || ''} ${disabledClasses} ${widthClass} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
