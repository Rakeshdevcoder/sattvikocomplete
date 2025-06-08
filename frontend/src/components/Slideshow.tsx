import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "../styles/slideshow.module.css";

// Define the interface for slide data
interface SlideData {
  id: number;
  imageSrc: string;
  imageHeight: number;
  imageSrcSet: string;
  contentPosition: "bottom-center" | "bottom-left" | "middle-center";
  textAlignment: "center" | "left";
  mobileTextAlignment: "center" | "right";
}

interface SlideshowProps {
  autoplay?: boolean;
  speed?: number;
  sliderId: string;
}

const Slideshow: React.FC<SlideshowProps> = ({
  autoplay = false,
  speed = 3,
  sliderId,
}) => {
  // Sample slide data (removed buttonLink and buttonText)
  const slides: SlideData[] = [
    {
      id: 1,
      imageSrc:
        "//sattviko.com/cdn/shop/files/New_Combo_Banner.png?v=1746790522&width=3840",
      imageHeight: 640,
      imageSrcSet:
        "//sattviko.com/cdn/shop/files/New_Combo_Banner.png?v=1746790522&width=375 375w, //sattviko.com/cdn/shop/files/New_Combo_Banner.png?v=1746790522&width=550 550w, //sattviko.com/cdn/shop/files/New_Combo_Banner.png?v=1746790522&width=750 750w, //sattviko.com/cdn/shop/files/New_Combo_Banner.png?v=1746790522&width=1100 1100w, //sattviko.com/cdn/shop/files/New_Combo_Banner.png?v=1746790522&width=1500 1500w, //sattviko.com/cdn/shop/files/New_Combo_Banner.png?v=1746790522&width=1780 1780w, //sattviko.com/cdn/shop/files/New_Combo_Banner.png?v=1746790522&width=2000 2000w, //sattviko.com/cdn/shop/files/New_Combo_Banner.png?v=1746790522&width=3000 3000w, //sattviko.com/cdn/shop/files/New_Combo_Banner.png?v=1746790522&width=3840 3840w",
      contentPosition: "bottom-center",
      textAlignment: "center",
      mobileTextAlignment: "right",
    },
    {
      id: 2,
      imageSrc:
        "//sattviko.com/cdn/shop/files/1000096687.webp?v=1735567054&width=3840",
      imageHeight: 640,
      imageSrcSet:
        "//sattviko.com/cdn/shop/files/1000096687.webp?v=1735567054&width=375 375w, //sattviko.com/cdn/shop/files/1000096687.webp?v=1735567054&width=550 550w, //sattviko.com/cdn/shop/files/1000096687.webp?v=1735567054&width=750 750w, //sattviko.com/cdn/shop/files/1000096687.webp?v=1735567054&width=1100 1100w, //sattviko.com/cdn/shop/files/1000096687.webp?v=1735567054&width=1500 1500w, //sattviko.com/cdn/shop/files/1000096687.webp?v=1735567054&width=1780 1780w, //sattviko.com/cdn/shop/files/1000096687.webp?v=1735567054&width=2000 2000w, //sattviko.com/cdn/shop/files/1000096687.webp?v=1735567054&width=3000 3000w, //sattviko.com/cdn/shop/files/1000096687.webp?v=1735567054&width=3840 3840w",
      contentPosition: "bottom-left",
      textAlignment: "left",
      mobileTextAlignment: "center",
    },
    {
      id: 3,
      imageSrc:
        "//sattviko.com/cdn/shop/files/Dry_Fruits.webp?v=1723789519&width=3840",
      imageHeight: 640,
      imageSrcSet:
        "//sattviko.com/cdn/shop/files/Dry_Fruits.webp?v=1723789519&width=375 375w, //sattviko.com/cdn/shop/files/Dry_Fruits.webp?v=1723789519&width=550 550w, //sattviko.com/cdn/shop/files/Dry_Fruits.webp?v=1723789519&width=750 750w, //sattviko.com/cdn/shop/files/Dry_Fruits.webp?v=1723789519&width=1100 1100w, //sattviko.com/cdn/shop/files/Dry_Fruits.webp?v=1723789519&width=1500 1500w, //sattviko.com/cdn/shop/files/Dry_Fruits.webp?v=1723789519&width=1780 1780w, //sattviko.com/cdn/shop/files/Dry_Fruits.webp?v=1723789519&width=2000 2000w, //sattviko.com/cdn/shop/files/Dry_Fruits.webp?v=1723789519&width=3000 3000w, //sattviko.com/cdn/shop/files/Dry_Fruits.webp?v=1723789519&width=3840 3840w",
      contentPosition: "middle-center",
      textAlignment: "center",
      mobileTextAlignment: "center",
    },
    {
      id: 4,
      imageSrc:
        "//sattviko.com/cdn/shop/files/Instant_Meals_b5aa7bc9-7b5c-48bc-b20a-6852f973222e.webp?v=1723789520&width=3840",
      imageHeight: 640,
      imageSrcSet:
        "//sattviko.com/cdn/shop/files/Instant_Meals_b5aa7bc9-7b5c-48bc-b20a-6852f973222e.webp?v=1723789520&width=375 375w, //sattviko.com/cdn/shop/files/Instant_Meals_b5aa7bc9-7b5c-48bc-b20a-6852f973222e.webp?v=1723789520&width=550 550w, //sattviko.com/cdn/shop/files/Instant_Meals_b5aa7bc9-7b5c-48bc-b20a-6852f973222e.webp?v=1723789520&width=750 750w, //sattviko.com/cdn/shop/files/Instant_Meals_b5aa7bc9-7b5c-48bc-b20a-6852f973222e.webp?v=1723789520&width=1100 1100w, //sattviko.com/cdn/shop/files/Instant_Meals_b5aa7bc9-7b5c-48bc-b20a-6852f973222e.webp?v=1723789520&width=1500 1500w, //sattviko.com/cdn/shop/files/Instant_Meals_b5aa7bc9-7b5c-48bc-b20a-6852f973222e.webp?v=1723789520&width=1780 1780w, //sattviko.com/cdn/shop/files/Instant_Meals_b5aa7bc9-7b5c-48bc-b20a-6852f973222e.webp?v=1723789520&width=2000 2000w, //sattviko.com/cdn/shop/files/Instant_Meals_b5aa7bc9-7b5c-48bc-b20a-6852f973222e.webp?v=1723789520&width=3000 3000w, //sattviko.com/cdn/shop/files/Instant_Meals_b5aa7bc9-7b5c-48bc-b20a-6852f973222e.webp?v=1723789520&width=3840 3840w",
      contentPosition: "middle-center",
      textAlignment: "center",
      mobileTextAlignment: "center",
    },
    {
      id: 5,
      imageSrc:
        "//sattviko.com/cdn/shop/files/Makhana.webp?v=1723789519&width=3840",
      imageHeight: 640,
      imageSrcSet:
        "//sattviko.com/cdn/shop/files/Makhana.webp?v=1723789519&width=375 375w, //sattviko.com/cdn/shop/files/Makhana.webp?v=1723789519&width=550 550w, //sattviko.com/cdn/shop/files/Makhana.webp?v=1723789519&width=750 750w, //sattviko.com/cdn/shop/files/Makhana.webp?v=1723789519&width=1100 1100w, //sattviko.com/cdn/shop/files/Makhana.webp?v=1723789519&width=1500 1500w, //sattviko.com/cdn/shop/files/Makhana.webp?v=1723789519&width=1780 1780w, //sattviko.com/cdn/shop/files/Makhana.webp?v=1723789519&width=2000 2000w, //sattviko.com/cdn/shop/files/Makhana.webp?v=1723789519&width=3000 3000w, //sattviko.com/cdn/shop/files/Makhana.webp?v=1723789519&width=3840 3840w",
      contentPosition: "middle-center",
      textAlignment: "center",
      mobileTextAlignment: "center",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = slides.length;
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to move to the next slide
  const nextSlide = useCallback(() => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % totalSlides);
  }, [totalSlides]);

  // Function to move to the previous slide
  const prevSlide = useCallback(() => {
    setCurrentSlide((prevSlide) => (prevSlide - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Function to go to a specific slide
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Set up autoplay
  useEffect(() => {
    if (autoplay) {
      slideTimerRef.current = setInterval(() => {
        nextSlide();
      }, speed * 1000);
    }

    return () => {
      if (slideTimerRef.current) {
        clearInterval(slideTimerRef.current);
      }
    };
  }, [autoplay, speed, nextSlide]);

  return (
    <section>
      <div
        className={`${styles.slideshow} ${styles.banner} ${styles.bannerAdaptImage} ${styles.grid} ${styles.grid1Col} ${styles.slider} ${styles.sliderEverywhere}`}
        id={sliderId}
        aria-live="polite"
        aria-atomic="true"
        data-autoplay={autoplay.toString()}
        data-speed={speed.toString()}
      >
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;

          return (
            <div
              key={slide.id}
              className={`${styles.slideshowSlide} ${styles.gridItem} ${styles.grid1Col} ${styles.sliderSlide}`}
              id={`Slide-${sliderId}-${slide.id}`}
              role="group"
              aria-roledescription="Slide"
              aria-label={`${index + 1} of ${totalSlides}`}
              aria-hidden={!isActive}
              tabIndex={isActive ? 0 : -1}
              style={{ display: isActive ? "block" : "none" }}
            >
              <div
                className={`${styles.slideshowMedia} ${styles.bannerMedia} ${styles.media}`}
              >
                <img
                  src={slide.imageSrc}
                  alt=""
                  srcSet={slide.imageSrcSet}
                  height={slide.imageHeight}
                  loading="lazy"
                  sizes="100vw"
                />
              </div>

              {/* Banner box div completely removed */}
            </div>
          );
        })}
      </div>

      {/* Minimal Slider Controls */}
      <div className={styles.minimalSliderControls}>
        <button
          type="button"
          className={styles.arrowButton}
          aria-label="Previous slide"
          onClick={prevSlide}
        >
          <span className={styles.leftArrow}>&lt;</span>
        </button>

        <div className={styles.dotsContainer}>
          {slides.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${
                currentSlide === index ? styles.activeDot : ""
              }`}
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => goToSlide(index)}
              aria-current={currentSlide === index}
            />
          ))}
        </div>

        <button
          type="button"
          className={styles.arrowButton}
          aria-label="Next slide"
          onClick={nextSlide}
        >
          <span className={styles.rightArrow}>&gt;</span>
        </button>
      </div>
    </section>
  );
};

export default Slideshow;
