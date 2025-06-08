import React from "react";
import styles from "../styles/availablebanner.module.css";

const AvailableBanner: React.FC = () => (
  <div className={styles.banner}>
    <div className={styles.media}>
      <img
        src="//sattviko.com/cdn/shop/files/Available_On_1.gif?v=1742885475&width=3840"
        alt="Available on platforms"
        loading="lazy"
        className={styles.image}
      />
    </div>
    <div className={styles.content}>
      {/* Empty overlay box; can drop children here later */}
      <div className={styles.box} />
    </div>
  </div>
);

export default AvailableBanner;
