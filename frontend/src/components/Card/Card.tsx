import React from 'react';
import styles from './Card.module.css';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hoverable?: boolean;
    glow?: boolean;
    noPadding?: boolean;
    onClick?: () => void;
}

export default function Card({ children, className = '', hoverable, glow, noPadding, onClick }: CardProps) {
    const cls = [
        styles.card,
        hoverable ? styles.hoverable : '',
        glow ? styles.glow : '',
        noPadding ? styles.noPadding : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={cls} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
            {children}
        </div>
    );
}
