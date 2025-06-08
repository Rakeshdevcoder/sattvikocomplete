import React from "react";
import styles from "../styles/banner.module.css";

const Banner: React.FC = () => {
  return (
    <div className={styles.banner}>
      <div className={styles.media}>
        <img
          src="//sattviko.com/cdn/shop/files/Headlines.gif?v=1724406621&width=3840"
          alt="Sattviko Headlines"
          loading="lazy"
          className={styles.image}
        />
      </div>
      <div className={styles.content}>
        <div className={styles.box} />
      </div>
    </div>
  );
};

export default Banner;
