import React from "react";
import styles from "../styles/announcementBar.module.css";

interface AnnouncementBarProps {
  message: string;
  isGradient?: boolean;
  isColorInverse?: boolean;
  centerText?: boolean;
}

const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  message,
  isColorInverse = true,
  centerText = true,
}) => {
  // Generate classes dynamically based on props
  const barClasses = [
    styles.announcementBar,
    isColorInverse ? styles.colorInverse : "",
  ]
    .filter(Boolean)
    .join(" ");

  const messageClasses = [
    styles.announcementBarMessage,
    centerText ? styles.center : "",
    styles.h5,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={barClasses} role="region" aria-label="Announcement">
      <div className={styles.pageWidth}>
        <p className={messageClasses}>
          <span>{message}</span>
        </p>
      </div>
    </div>
  );
};

export default AnnouncementBar;
