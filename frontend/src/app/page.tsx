'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import Spinner from '@/components/Spinner/Spinner';
import styles from './page.module.css';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect
  React.useEffect(() => {
    if (!loading && user) {
      router.replace('/quiz');
    }
  }, [user, loading, router]);

  if (loading) {
    return <Spinner fullScreen text="Loading..." />;
  }

  if (user) {
    return <Spinner fullScreen text="Redirecting..." />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = username.trim();
    if (!trimmed) {
      setError('Please enter a username');
      return;
    }
    if (trimmed.length > 30) {
      setError('Username must be 30 characters or less');
      return;
    }

    setSubmitting(true);
    try {
      await login(trimmed);
      router.push('/quiz');
    } catch (err: any) {
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <span className={styles.logo}>🧠</span>
          <h1 className={styles.title}>BrainBolt</h1>
          <p className={styles.subtitle}>Adaptive Infinite Quiz Platform</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.errorMsg}>{error}</div>}
          <Input
            label="Choose your username"
            placeholder="Enter username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={30}
            autoFocus
            id="username-input"
          />
          <Button
            type="submit"
            fullWidth
            loading={submitting}
            size="lg"
            id="start-btn"
          >
            Start Playing ⚡
          </Button>
        </form>

        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🎯</span>
            <span>Adaptive difficulty</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🔥</span>
            <span>Streak multipliers</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🏆</span>
            <span>Live leaderboards</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>📊</span>
            <span>Performance stats</span>
          </div>
        </div>
      </div>
    </div>
  );
}
