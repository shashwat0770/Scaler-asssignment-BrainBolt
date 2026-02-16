import React from 'react';
import styles from './Spinner.module.css';

interface SpinnerProps {
    fullScreen?: boolean;
    text?: string;
    inline?: boolean;
}

export default function Spinner({ fullScreen, text, inline }: SpinnerProps) {
    if (inline) {
        return <span className={styles.spinnerInline} />;
    }
    if (fullScreen) {
        return (
            <div className={styles.overlay}>
                <div className={styles.spinnerContainer}>
                    <div className={styles.spinner} />
                    {text && <p className={styles.text}>{text}</p>}
                </div>
            </div>
        );
    }
    return (
        <div className={styles.spinnerContainer}>
            <div className={styles.spinner} />
            {text && <p className={styles.text}>{text}</p>}
        </div>
    );
}
