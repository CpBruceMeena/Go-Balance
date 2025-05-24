import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';

const FEATURES = [
  {
    icon: '⚖️',
    title: 'Smart Load Distribution',
    desc: 'Intelligent traffic routing with round-robin, weighted, least-connections, and IP-hash algorithms. Automatically adapts to server capacity.'
  },
  {
    icon: '💓',
    title: 'Zero-Downtime Monitoring',
    desc: 'Continuous health checks with automatic failover in under 2 seconds. Custom health check endpoints and thresholds.'
  },
  {
    icon: '🔒',
    title: 'Enterprise Security',
    desc: 'End-to-end SSL/TLS termination, certificate management, and advanced security policies. SOC2 compliant.'
  },
  {
    icon: '🎛️',
    title: 'Beautiful Dashboard',
    desc: 'Modern web interface with real-time metrics, one-click configuration, and mobile-responsive design.'
  },
  {
    icon: '🚀',
    title: 'Performance First',
    desc: 'Built-in rate limiting, request caching, compression, and performance optimization tools. Handle millions of requests.'
  },
  {
    icon: '📊',
    title: 'Advanced Analytics',
    desc: 'Comprehensive monitoring with custom alerts, detailed logs, performance insights, and historical data.'
  },
];

const CUSTOMER_LOGOS = [
  '/logo1.svg', '/logo2.svg', '/logo3.svg', '/logo4.svg', '/logo5.svg'
];

const TYPED_WORDS = [
  'The Future of Load Balancing',
  'Enterprise-Grade Reliability',
  'Real-Time Monitoring',
  'Zero-Downtime Deployments',
];

const VERSION = 'v2.1.0';

function useTypewriter(words: string[], speed = 80, pause = 1200) {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState('');
  const [typing, setTyping] = useState(true);
  const timeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typing) {
      if (display.length < words[index].length) {
        timeout.current = setTimeout(() => setDisplay(words[index].slice(0, display.length + 1)), speed);
      } else {
        setTyping(false);
        timeout.current = setTimeout(() => setTyping(true), pause);
      }
    } else {
      timeout.current = setTimeout(() => {
        setDisplay('');
        setIndex((index + 1) % words.length);
      }, pause);
    }
    return () => { if (timeout.current) clearTimeout(timeout.current); };
  }, [display, typing, index, words, speed, pause]);

  return display;
}

const Home = () => {
  const navigate = useNavigate();
  const subtitle = useTypewriter(TYPED_WORDS);

  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: 'linear-gradient(120deg, #f8fafc 0%, #e0e7ef 100%)' }}>
      <div className={styles['hero-bg']} />
      <div style={{ position: 'relative', zIndex: 1, paddingTop: 80, paddingBottom: 40 }}>
        {/* Hero Section */}
        <div>
          <h1 className={styles['hero-title']}>
            Go-Balance
            <span className={styles['version-badge']}>{VERSION}</span>
          </h1>
          <div className={styles['hero-subtitle']}>
            {subtitle}
          </div>
          <div className={styles['hero-description']}>
            Deploy enterprise-grade load balancing in minutes, not hours. Built for modern applications with real-time monitoring, automatic failover, and beautiful management interface.
          </div>
          <div className={styles['cta-container']}>
            <button type="button" className={styles['cta-primary']} onClick={() => navigate('/clusters')}>
              <span role="img" aria-label="rocket">🚀</span> Start Free Trial
            </button>
            <button type="button" className={styles['cta-secondary']} onClick={() => navigate('/clusters')}>
              Live Demo
            </button>
          </div>
          <div className={styles['trust-indicators']}>
            <span>99.99% Uptime</span>
            <span>10,000+ Users</span>
            <span>1B+ Requests Served</span>
          </div>
          <div className={styles['customer-logos']}>
            {CUSTOMER_LOGOS.map((logo, i) => (
              <img src={logo} alt={`Customer ${i + 1}`} className={styles['customer-logo']} key={logo} />
            ))}
          </div>
        </div>
        {/* Features Section */}
        <section className={styles['features-section']}>
          <div className={styles['features-title']}>Features</div>
          <div className={styles['features-grid']}>
            {FEATURES.map(f => (
              <div className={styles['feature-card']} key={f.title}>
                <div className={styles['feature-icon']}>{f.icon}</div>
                <div className={styles['feature-title']}>{f.title}</div>
                <div className={styles['feature-desc']}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>
        <div style={{ marginTop: 60, textAlign: 'center', color: 'var(--text-secondary)', opacity: 0.7, fontSize: 16 }}>
          &copy; {new Date().getFullYear()} Go-Balance &mdash; Modern Load Balancer
        </div>
      </div>
    </div>
  );
};

export default Home; 