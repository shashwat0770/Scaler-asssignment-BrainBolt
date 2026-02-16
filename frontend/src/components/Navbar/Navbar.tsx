'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import styles from './Navbar.module.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    if (!user) return null;

    const navLinks = [
        { href: '/quiz', label: '⚡ Quiz', id: 'nav-quiz' },
        { href: '/leaderboard', label: '🏆 Leaderboard', id: 'nav-leaderboard' },
        { href: '/metrics', label: '📊 Metrics', id: 'nav-metrics' },
    ];

    return (
        <nav className={styles.nav} role="navigation" aria-label="Main navigation">
            <Link href="/quiz" className={styles.brand}>
                <span className={styles.logo}>🧠</span>
                <span className={styles.brandName}>BrainBolt</span>
            </Link>

            <div className={styles.links}>
                {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        id={link.id}
                        className={`${styles.link} ${pathname === link.href ? styles.active : ''}`}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>

            <div className={styles.right}>
                <ThemeToggle />
                <div className={styles.userInfo}>
                    <span className={styles.avatar}>
                        {user.username.charAt(0).toUpperCase()}
                    </span>
                    <span>{user.username}</span>
                </div>
                <button
                    onClick={logout}
                    className={styles.link}
                    id="nav-logout"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}
