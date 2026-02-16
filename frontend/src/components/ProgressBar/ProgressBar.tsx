import React from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
    value: number; // 0-100
    variant?: 'default' | 'success' | 'danger';
    className?: string;
}

export default function ProgressBar({ value, variant = 'default', className = '' }: ProgressBarProps) {
    const clamped = Math.max(0, Math.min(100, value));
    return (
        <div className={`${styles.bar} ${variant !== 'default' ? styles[variant] : ''} ${className}`}>
            <div className={styles.fill} style={{ width: `${clamped}%` }} />
        </div>
    );
}
