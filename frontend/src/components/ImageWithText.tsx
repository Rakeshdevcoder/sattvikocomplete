// ImageWithText.tsx
import React from "react";
import styles from "../styles/imagewithtext.module.css";

const ImageWithText: React.FC = () => (
  <section className={`${styles.root} page-width`}>
    <div className={styles.grid}>
      <div className={styles.mediaItem}>
        <div className={styles.media}>
          <img
            src="//sattviko.com/cdn/shop/files/Instant_Meals.webp?v=1723199005&width=1500"
            alt="Instant Meals"
            className={styles.img}
            loading="lazy"
          />
        </div>
      </div>

      <div className={styles.textItem}>
        <div className={styles.content}>
          <h1 className={styles.heading}>Open - Pour - Fire it up 🌶</h1>
          <p className={styles.bodyText}>
            Our Instant meals are pantry shortcuts for a matched Indian taste
            palette. Takes no time to prepare, is rich in protein & fiber and of
            course, delicious.
          </p>
          <a href="/collections/instant-meals" className={styles.button}>
            Shop Meals
          </a>
        </div>
      </div>
    </div>
  </section>
);

export default ImageWithText;
