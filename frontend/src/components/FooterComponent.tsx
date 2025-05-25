import React from "react";
import styles from "../styles/footercomponent.module.css";

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* --- Quick links --- */}
        <div className={styles.quickLinks}>
          <h2 className={styles.title}>Quick links</h2>
          <ul className={styles.linksList}>
            <li>
              <a href="/blogs/sattviko-blogs" className={styles.link}>
                Blogs
              </a>
            </li>
            <li>
              <a href="/pages/our-story" className={styles.link}>
                Our Story
              </a>
            </li>
            <li>
              <a href="/pages/what-is-makhana" className={styles.link}>
                What is Makhana?
              </a>
            </li>
            <li>
              <a href="/pages/contact-us" className={styles.link}>
                Contact Us
              </a>
            </li>
            <li>
              <a href="/pages/sattviko-factory" className={styles.link}>
                Our Factory
              </a>
            </li>
          </ul>
        </div>

        {/* --- Newsletter & Social row --- */}
        <div className={styles.newsletterSocial}>
          <div className={styles.newsletter}>
            <h2 className={styles.title}>For Latest Offers &amp; Updates</h2>
            <form
              method="post"
              action="/contact#ContactFooter"
              id="ContactFooter"
              className={styles.newsletterForm}
            >
              <input type="hidden" name="form_type" value="customer" />
              <input type="hidden" name="utf8" value="✓" />
              <input type="hidden" name="contact[tags]" value="newsletter" />

              <input
                type="email"
                name="contact[email]"
                placeholder="Email"
                required
                className={styles.fieldInput}
              />
              <button
                type="submit"
                className={styles.fieldButton}
                aria-label="Subscribe"
              >
                →
              </button>
            </form>
          </div>

          <ul className={styles.socialList}>
            <li>
              <a
                href="https://facebook.com/sattviko"
                className={styles.socialLink}
                rel="nofollow noreferrer noopener"
              >
                <svg
                  aria-hidden="true"
                  focusable="false"
                  className={styles.icon}
                  viewBox="0 0 18 18"
                >
                  <path
                    fill="currentColor"
                    d="M16.42.61c.27 0 .5.1.69.28.19.2.28.42.28.7v15.44c0 .27-.1.5-.28.69a.94.94 0 01-.7.28h-4.39v-6.7h2.25l.31-2.65h-2.56v-1.7c0-.4.1-.72.28-.93.18-.2.5-.32 1-.32h1.37V3.35c-.6-.06-1.27-.1-2.01-.1-1.01 0-1.83.3-2.45.9-.62.6-.93 1.44-.93 2.53v1.97H7.04v2.65h2.24V18H.98c-.28 0-.5-.1-.7-.28a.94.94 0 01-.28-.7V1.59c0-.27.1-.5.28-.69a.94.94 0 01.7-.28h15.44z"
                  />
                </svg>
              </a>
            </li>
            <li>
              <a
                href="http://instagram.com/sattviko"
                className={styles.socialLink}
                rel="nofollow noreferrer noopener"
              >
                <svg
                  aria-hidden="true"
                  focusable="false"
                  className={styles.icon}
                  viewBox="0 0 18 18"
                >
                  <path
                    fill="currentColor"
                    d="M8.77 1.58c2.34 0 2.62.01 3.54.05.86.04 1.32.18 1.63.3.41.17.7.35 1.01.66.3.3.5.6.65 1 .12.32.27.78.3 1.64.05.92.06 1.2.06 3.54s-.01 2.62-.05 3.54a4.79 4.79 0 01-.3 1.63c-.17.41-.35.7-.66 1.01-.3.3-.6.5-1.01.66-.31.12-.77.26-1.63.3-.92.04-1.2.05-3.54.05s-2.62 0-3.55-.05a4.79 4.79 0 01-1.62-.3c-.42-.16-.7-.35-1.01-.66-.31-.3-.5-.6-.66-1a4.87 4.87 0 01-.3-1.64c-.04-.92-.05-1.2-.05-3.54s0-2.62.05-3.54c.04-.86.18-1.32.3-1.63.16-.41.35-.7.66-1.01.3-.3.6-.5 1-.65.32-.12.78-.27 1.63-.3.93-.05 1.2-.06 3.55-.06zm0-1.58C6.39 0 6.09.01 5.15.05c-.93.04-1.57.2-2.13.4-.57.23-1.06.54-1.55 1.02C1 1.96.7 2.45.46 3.02c-.22.56-.37 1.2-.4 2.13C0 6.1 0 6.4 0 8.77s.01 2.68.05 3.61c.04.94.2 1.57.4 2.13.23.58.54 1.07 1.02 1.56.49.48.98.78 1.55 1.01.56.22 1.2.37 2.13.4.94.05 1.24.06 3.62.06 2.39 0 2.68-.01 3.62-.05.93-.04 1.57-.2 2.13-.41a4.27 4.27 0 001.55-1.01c.49-.49.79-.98 1.01-1.56.22-.55.37-1.19.41-2.13.04-.93.05-1.23.05-3.61 0-2.39 0-2.68-.05-3.62a6.47 6.47 0 00-.4-2.13 4.27 4.27 0 00-1.02-1.55A4.35 4.35 0 0014.52.46a6.43 6.43 0 00-2.13-.41A69 69 0 008.77 0z"
                  />
                  <path
                    fill="currentColor"
                    d="M8.8 4a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm0 7.43a2.92 2.92 0 110-5.85 2.92 2.92 0 010 5.85zM13.43 5a1.05 1.05 0 100-2.1 1.05 1.05 0 000 2.1z"
                  />
                </svg>
              </a>
            </li>
            <li>
              <a
                href="https://www.youtube.com/@sattviko_off"
                className={styles.socialLink}
                rel="nofollow noreferrer noopener"
              >
                <svg
                  aria-hidden="true"
                  focusable="false"
                  className={styles.icon}
                  viewBox="0 0 100 70"
                >
                  <path
                    d="M98 11c2 7.7 2 24 2 24s0 16.3-2 24a12.5 12.5 0 01-9 9c-7.7 2-39 2-39 2s-31.3 0-39-2a12.5 12.5 0 01-9-9c-2-7.7-2-24-2-24s0-16.3 2-24c1.2-4.4 4.6-7.8 9-9 7.7-2 39-2 39-2s31.3 0 39 2c4.4 1.2 7.8 4.6 9 9zM40 50l26-15-26-15v30z"
                    fill="currentColor"
                  />
                </svg>
              </a>
            </li>
            <li>
              <a
                href="https://x.com/sattviko?lang=en&mx=2"
                className={styles.socialLink}
                rel="nofollow noreferrer noopener"
              >
                <svg
                  aria-hidden="true"
                  focusable="false"
                  className={styles.icon}
                  viewBox="0 0 18 15"
                >
                  <path
                    fill="currentColor"
                    d="M17.64 2.6a7.33 7.33 0 01-1.75 1.82c0 .05 0 .13.02.23l.02.23a9.97 9.97 0 01-1.69 5.54c-.57.85-1.24 1.62-2.02 2.28a9.09 9.09 0 01-2.82 1.6 10.23 10.23 0 01-8.9-.98c.34.02.61.04.83.04 1.64 0 3.1-.5 4.38-1.5a3.6 3.6 0 01-3.3-2.45A2.91 2.91 0 004 9.35a3.47 3.47 0 01-2.02-1.21 3.37 3.37 0 01-.8-2.22v-.03c.46.24.98.37 1.58.4a3.45 3.45 0 01-1.54-2.9c0-.61.14-1.2.45-1.79a9.68 9.68 0 003.2 2.6 10 10 0 004.08 1.07 3 3 0 01-.13-.8c0-.97.34-1.8 1.03-2.48A3.45 3.45 0 0112.4.96a3.49 3.49 0 012.54 1.1c.8-.15 1.54-.44 2.23-.85a3.4 3.4 0 01-1.54 1.94c.74-.1 1.4-.28 2.01-.54z"
                  />
                </svg>
              </a>
            </li>
          </ul>
        </div>

        {/* --- Divider --- */}
        <hr className={styles.divider} />

        {/* --- Bottom row --- */}
        <div className={styles.bottom}>
          <small>
            © 2025,&nbsp;
            <a href="/" className={styles.copyLink}>
              Sattviko
            </a>
          </small>
          <ul className={styles.policies}>
            <li>
              <a href="/policies/refund-policy" className={styles.policyLink}>
                Refund policy
              </a>
            </li>
            <li>
              <a href="/policies/privacy-policy" className={styles.policyLink}>
                Privacy policy
              </a>
            </li>
            <li>
              <a
                href="/policies/terms-of-service"
                className={styles.policyLink}
              >
                Terms of service
              </a>
            </li>
            <li>
              <a href="/policies/shipping-policy" className={styles.policyLink}>
                Shipping policy
              </a>
            </li>
            <li>
              <a
                href="/policies/contact-information"
                className={styles.policyLink}
              >
                Contact information
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
