import React from 'react';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
}

export const GlassPanel = ({ children, className = '', ...props }: GlassPanelProps) => {
    return (
        <div className={`glass-panel-grid ${className}`} {...props}>
            {children}
        </div>
    );
};
