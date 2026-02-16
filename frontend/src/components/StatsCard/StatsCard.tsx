import React from 'react';
import styles from './StatsCard.module.css';

interface StatsCardProps {
    label: string;
    value: string | number;
    icon?: string;
    className?: string;
}

export default function StatsCard({ label, value, icon, className = '' }: StatsCardProps) {
    return (
        <div className={`${styles.statsCard} ${className}`}>
            <div className={styles.header}>
                <span className={styles.label}>{label}</span>
                {icon && <span className={styles.icon}>{icon}</span>}
            </div>
            <span className={styles.value}>{value}</span>
        </div>
    );
}
