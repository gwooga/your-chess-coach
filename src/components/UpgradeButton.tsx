import React from 'react';

interface UpgradeButtonProps {
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  useImage?: boolean;
}

const UpgradeButton: React.FC<UpgradeButtonProps> = ({ 
  className = '', 
  onClick,
  children = 'Upgrade to Pro',
  useImage = false
}) => {
  if (useImage) {
    return (
      <button 
        className={`upgrade-button-image ${className}`}
        onClick={onClick}
      >
        <img 
          src="/upgrade-button.svg" 
          alt="Upgrade to Pro" 
          className="w-auto h-12"
          onError={(e) => {
            // Fallback to CSS version if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <svg class="star-icon" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                ${children}
              `;
              parent.className = `upgrade-button ${className}`;
            }
          }}
        />
      </button>
    );
  }

  return (
    <button 
      className={`upgrade-button ${className}`}
      onClick={onClick}
    >
      <svg className="star-icon" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      {children}
    </button>
  );
};

export default UpgradeButton; 