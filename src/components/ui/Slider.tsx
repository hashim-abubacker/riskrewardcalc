import React, { forwardRef } from 'react';

type SliderProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
    ({ className = '', ...props }, ref) => {
        return (
            <input
                ref={ref}
                type="range"
                className={`w-full cursor-pointer ${className}`}
                {...props}
            />
        );
    }
);

Slider.displayName = 'Slider';
