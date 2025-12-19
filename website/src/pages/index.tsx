import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/next/introduction">
            Next.js
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/astro/introduction">
            Astro
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/react/introduction">
            React
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} Documentation`}
      description="Tiny i18n library for modern frameworks">
      <main style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - var(--ifm-navbar-height) - var(--ifm-footer-height))',
      }}>
        <HomepageHeader />
      </main>
    </Layout>
  );
}
