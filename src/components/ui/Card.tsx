import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    chamfered?: boolean;
    withScrews?: boolean;
}

export const Card = ({ children, chamfered = false, withScrews = false, className = '', ...props }: CardProps) => {
    return (
        <div
            className={`obsidian-chassis ${chamfered ? 'chamfered-edge' : ''} ${className} relative`}
            {...props}
        >
            {withScrews && (
                <>
                    <div className="absolute top-4 left-4 screw-dot" />
                    <div className="absolute top-4 right-4 screw-dot" />
                    <div className="absolute bottom-4 left-4 screw-dot" />
                    <div className="absolute bottom-4 right-4 screw-dot" />
                </>
            )}
            {children}
        </div>
    );
};
