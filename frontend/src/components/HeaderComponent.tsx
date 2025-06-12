// HeaderComponent.tsx
import React, { useState, useEffect, createContext } from "react";
import styles from "../styles/headercomponent.module.css";
import { useShopifyCart } from "../context/ShopifyCartContext";
import { useAuth } from "../context/AuthContext";
import PhoneAuth from "./PhoneAuth/PhoneAuth";

// Import React Icons
import {
  FiSearch,
  FiUser,
  FiMenu,
  FiChevronDown,
  FiX,
  FiShoppingCart,
} from "react-icons/fi";

// Define a type for the bundle product
interface BundleProduct {
  id: string;
  title?: string;
  price?: string;
  images?: {
    main: string;
    hover?: string;
  };
  image?: string;
  weight?: string;
}

// Create a context for bundle selection with proper typing
interface BundleContextType {
  selectedProducts: BundleProduct[];
  remainingItems: number;
  setSelectedProducts: (products: BundleProduct[]) => void;
}

export const BundleContext = createContext<BundleContextType>({
  selectedProducts: [],
  remainingItems: 7,
  setSelectedProducts: () => null,
});

const HeaderComponent: React.FC = () => {
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const [featuresMenuOpen, setFeaturesMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const [mobileFeaturesOpen, setMobileFeaturesOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState("/");
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Get bundle context from localStorage or create empty array
  const [selectedBundleProducts, setSelectedBundleProducts] = useState<
    BundleProduct[]
  >(() => {
    const saved = localStorage.getItem("selectedBundleProducts");
    return saved ? JSON.parse(saved) : [];
  });

  // Calculate remaining items
  const bundleLimit = 7;
  const remainingItems = bundleLimit - selectedBundleProducts.length;

  // Use auth context
  const { user, loading } = useAuth();

  // Get Shopify cart context
  const { cartCount, toggleCart } = useShopifyCart();

  // Listen for auth modal events
  useEffect(() => {
    const handleOpenAuthModal = () => {
      setShowAuthModal(true);
    };

    window.addEventListener("openAuthModal", handleOpenAuthModal);
    return () => {
      window.removeEventListener("openAuthModal", handleOpenAuthModal);
    };
  }, []);

  // Save selected bundle products to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(
      "selectedBundleProducts",
      JSON.stringify(selectedBundleProducts)
    );
  }, [selectedBundleProducts]);

  // Check if mobile view
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener("resize", checkIfMobile);

    // Set active nav based on current path
    setActiveNavItem(window.location.pathname);

    // Clean up
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Handle Shop dropdown toggle
  const toggleShopMenu = () => {
    setShopMenuOpen(!shopMenuOpen);
    if (featuresMenuOpen) {
      setFeaturesMenuOpen(false);
    }
  };

  // Handle Features dropdown toggle
  const toggleFeaturesMenu = () => {
    setFeaturesMenuOpen(!featuresMenuOpen);
    if (shopMenuOpen) {
      setShopMenuOpen(false);
    }
  };

  // Handle mobile Shop dropdown toggle
  const toggleMobileShopMenu = () => {
    setMobileShopOpen(!mobileShopOpen);
    if (mobileFeaturesOpen) {
      setMobileFeaturesOpen(false);
    }
  };

  // Handle mobile Features dropdown toggle
  const toggleMobileFeaturesMenu = () => {
    setMobileFeaturesOpen(!mobileFeaturesOpen);
    if (mobileShopOpen) {
      setMobileShopOpen(false);
    }
  };

  // Close mobile menu
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <BundleContext.Provider
      value={{
        selectedProducts: selectedBundleProducts,
        remainingItems,
        setSelectedProducts: setSelectedBundleProducts,
      }}
    >
      <header className={styles.headerContainer}>
        <div className={styles.headerMain}>
          {/* Left section - Search or Hamburger */}
          <div className={styles.headerIconContainer}>
            {isMobile ? (
              <button
                className={`${styles.iconButton} ${styles.menuToggle}`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <FiMenu className={styles.icon} />
              </button>
            ) : (
              <button className={styles.iconButton}>
                <FiSearch className={styles.icon} />
              </button>
            )}
          </div>

          {/* Logo in center */}
          <div className={styles.headerLogo}>
            <a href="/">
              <img
                src="https://sattviko.com/cdn/shop/files/logo_foodyoga.png?v=1685712767"
                alt="Sattviko"
                width="170"
                height="56"
              />
            </a>
          </div>

          {/* Right section - User (Desktop) / Search (Mobile) & Cart Icon */}
          <div className={styles.headerActions}>
            {/* Cart Icon - Always visible */}
            <button
              className={`${styles.iconButton} ${styles.cartButton}`}
              onClick={toggleCart}
              aria-label="Open cart"
            >
              <FiShoppingCart className={styles.icon} />
              {cartCount > 0 && (
                <span className={styles.cartCount}>{cartCount}</span>
              )}
            </button>

            {isMobile ? (
              <button className={styles.iconButton} aria-label="Search">
                <FiSearch className={styles.icon} />
              </button>
            ) : (
              // Auth components
              <>
                {!loading &&
                  (!user ? (
                    <button
                      className={styles.iconButton}
                      onClick={() => setShowAuthModal(true)}
                      aria-label="Sign in"
                    >
                      <FiUser className={styles.icon} />
                    </button>
                  ) : (
                    <a
                      href="/account"
                      className={styles.iconButton}
                      aria-label="Account"
                    >
                      <FiUser className={styles.icon} />
                    </a>
                  ))}
              </>
            )}
          </div>
        </div>

        {/* Navigation Menu - Desktop */}
        <nav
          className={`${styles.headerNavigation} ${
            isMobile ? styles.hidden : ""
          }`}
        >
          <ul className={styles.navMenu}>
            <li className={styles.navItem}>
              <a
                href="/"
                className={`${styles.navLink} ${
                  activeNavItem === "/" ? styles.active : ""
                }`}
              >
                Home
              </a>
            </li>
            <li className={`${styles.navItem} ${styles.dropdown}`}>
              <button
                className={`${styles.navLink} ${styles.dropdownToggle} ${
                  activeNavItem.includes("/collections/") &&
                  !activeNavItem.includes("features")
                    ? styles.active
                    : ""
                }`}
                onClick={toggleShopMenu}
                aria-expanded={shopMenuOpen}
              >
                Shop
                <FiChevronDown
                  className={`${styles.dropdownArrow} ${
                    shopMenuOpen ? styles.rotate : ""
                  }`}
                />
              </button>
              <ul
                className={`${styles.dropdownMenu} ${
                  shopMenuOpen ? styles.open : ""
                }`}
              >
                <li>
                  <a
                    href="/collections/makhanas"
                    className={
                      activeNavItem === "/collections/makhanas"
                        ? styles.active
                        : ""
                    }
                  >
                    Makhanas
                  </a>
                </li>
                <li>
                  <a
                    href="/collections/millet-puffs"
                    className={
                      activeNavItem === "/collections/millet-puffs"
                        ? styles.active
                        : ""
                    }
                  >
                    Millet Puffs
                  </a>
                </li>
                <li>
                  <a
                    href="/collections/instant-meals"
                    className={
                      activeNavItem === "/collections/instant-meals"
                        ? styles.active
                        : ""
                    }
                  >
                    Instant Meals
                  </a>
                </li>
                <li>
                  <a
                    href="/collections/trail-mix"
                    className={
                      activeNavItem === "/collections/trail-mix"
                        ? styles.active
                        : ""
                    }
                  >
                    Trail Mix
                  </a>
                </li>
                <li>
                  <a
                    href="/collections/nutritious-nuts"
                    className={
                      activeNavItem === "/collections/nutritious-nuts"
                        ? styles.active
                        : ""
                    }
                  >
                    Nutritious Nuts
                  </a>
                </li>
                <li>
                  <a
                    href="/collections/makhana-combo-packs"
                    className={
                      activeNavItem === "/collections/makhana-combo-packs"
                        ? styles.active
                        : ""
                    }
                  >
                    Combo Packs
                  </a>
                </li>
              </ul>
            </li>
            <li className={`${styles.navItem} ${styles.dropdown}`}>
              <button
                className={`${styles.navLink} ${styles.dropdownToggle} ${
                  activeNavItem.includes("features") ? styles.active : ""
                }`}
                onClick={toggleFeaturesMenu}
                aria-expanded={featuresMenuOpen}
              >
                Shop by Features
                <FiChevronDown
                  className={`${styles.dropdownArrow} ${
                    featuresMenuOpen ? styles.rotate : ""
                  }`}
                />
              </button>
              <ul
                className={`${styles.dropdownMenu} ${
                  featuresMenuOpen ? styles.open : ""
                }`}
              >
                <li>
                  <a
                    href="/collections/high-protein"
                    className={
                      activeNavItem === "/collections/high-protein"
                        ? styles.active
                        : ""
                    }
                  >
                    High Protein
                  </a>
                </li>
                <li>
                  <a
                    href="/collections/gluten-free"
                    className={
                      activeNavItem === "/collections/gluten-free"
                        ? styles.active
                        : ""
                    }
                  >
                    Gluten Free
                  </a>
                </li>
                <li>
                  <a
                    href="/collections/high-fibre"
                    className={
                      activeNavItem === "/collections/high-fibre"
                        ? styles.active
                        : ""
                    }
                  >
                    High Fiber
                  </a>
                </li>
                <li>
                  <a
                    href="/collections/probiotics"
                    className={
                      activeNavItem === "/collections/probiotics"
                        ? styles.active
                        : ""
                    }
                  >
                    Good for Gut Health
                  </a>
                </li>
              </ul>
            </li>

            {/* New Bundle Discount Menu Item */}
            <li className={styles.navItem}>
              <a
                href="/collections/bundle"
                className={`${styles.navLink} ${styles.specialBundle} ${
                  activeNavItem === "/collections/bundle" ? styles.active : ""
                }`}
              >
                {selectedBundleProducts.length > 0 ? (
                  <div className={styles.bundleIndicator}>
                    <div className={styles.bundleCircles}>
                      {selectedBundleProducts.map(
                        (product, index) =>
                          index < 3 && (
                            <div
                              key={product.id}
                              className={styles.bundleItemCircle}
                            >
                              <img
                                src={
                                  product.images?.main || product.image || ""
                                }
                                alt=""
                                className={styles.bundleItemImage}
                              />
                            </div>
                          )
                      )}
                      {selectedBundleProducts.length > 3 && (
                        <div className={styles.bundleItemMore}>
                          +{selectedBundleProducts.length - 3}
                        </div>
                      )}
                    </div>
                    {remainingItems > 0 ? (
                      <span className={styles.bundleRemainingText}>
                        Need {remainingItems} more
                      </span>
                    ) : (
                      <span className={styles.bundleCompleteText}>
                        Complete Bundle
                      </span>
                    )}
                  </div>
                ) : (
                  "Buy any 7 at 499"
                )}
              </a>
            </li>

            <li className={styles.navItem}>
              <a
                href="/collections/all"
                className={`${styles.navLink} ${
                  activeNavItem === "/collections/all" ? styles.active : ""
                }`}
              >
                All Snacks
              </a>
            </li>

            <li className={styles.navItem}>
              <a href="https://foodyoga.shop/" className={styles.navLink}>
                USA Website
              </a>
            </li>
          </ul>
        </nav>

        {/* Mobile Menu */}
        {isMobile && (
          <div
            className={`${styles.mobileMenu} ${
              mobileMenuOpen ? styles.mobileMenuOpen : ""
            }`}
          >
            {/* Mobile menu header with close button */}
            <div className={styles.mobileMenuHeader}>
              <button
                className={styles.closeMenuButton}
                onClick={closeMobileMenu}
                aria-label="Close menu"
              >
                <FiX className={styles.icon} />
              </button>
            </div>

            <nav className={styles.mobileNavigation}>
              <ul className={styles.mobileNavMenu}>
                <li className={styles.mobileNavItem}>
                  <a
                    href="/"
                    className={`${styles.mobileNavLink} ${
                      activeNavItem === "/" ? styles.active : ""
                    }`}
                  >
                    Home
                  </a>
                </li>

                {/* Mobile Shop Dropdown */}
                <li
                  className={`${styles.mobileNavItem} ${styles.mobileDropdown}`}
                >
                  <button
                    className={styles.mobileDropdownToggle}
                    onClick={toggleMobileShopMenu}
                    aria-expanded={mobileShopOpen}
                  >
                    Shop
                    <FiChevronDown
                      className={`${styles.mobileDropdownArrow} ${
                        mobileShopOpen ? styles.rotate : ""
                      }`}
                    />
                  </button>
                  <ul
                    className={`${styles.mobileDropdownMenu} ${
                      mobileShopOpen ? styles.mobileDropdownMenuOpen : ""
                    }`}
                  >
                    <li>
                      <a
                        href="/collections/makhanas"
                        className={
                          activeNavItem === "/collections/makhanas"
                            ? styles.active
                            : ""
                        }
                      >
                        Makhanas
                      </a>
                    </li>
                    <li>
                      <a
                        href="/collections/millet-puffs"
                        className={
                          activeNavItem === "/collections/millet-puffs"
                            ? styles.active
                            : ""
                        }
                      >
                        Millet Puffs
                      </a>
                    </li>
                    <li>
                      <a
                        href="/collections/instant-meals"
                        className={
                          activeNavItem === "/collections/instant-meals"
                            ? styles.active
                            : ""
                        }
                      >
                        Instant Meals
                      </a>
                    </li>
                    <li>
                      <a
                        href="/collections/trail-mix"
                        className={
                          activeNavItem === "/collections/trail-mix"
                            ? styles.active
                            : ""
                        }
                      >
                        Trail Mix
                      </a>
                    </li>
                    <li>
                      <a
                        href="/collections/nutritious-nuts"
                        className={
                          activeNavItem === "/collections/nutritious-nuts"
                            ? styles.active
                            : ""
                        }
                      >
                        Nutritious Nuts
                      </a>
                    </li>
                    <li>
                      <a
                        href="/collections/makhana-combo-packs"
                        className={
                          activeNavItem === "/collections/makhana-combo-packs"
                            ? styles.active
                            : ""
                        }
                      >
                        Combo Packs
                      </a>
                    </li>
                  </ul>
                </li>

                {/* Mobile Features Dropdown */}
                <li
                  className={`${styles.mobileNavItem} ${styles.mobileDropdown}`}
                >
                  <button
                    className={styles.mobileDropdownToggle}
                    onClick={toggleMobileFeaturesMenu}
                    aria-expanded={mobileFeaturesOpen}
                  >
                    Shop by Features
                    <FiChevronDown
                      className={`${styles.mobileDropdownArrow} ${
                        mobileFeaturesOpen ? styles.rotate : ""
                      }`}
                    />
                  </button>
                  <ul
                    className={`${styles.mobileDropdownMenu} ${
                      mobileFeaturesOpen ? styles.mobileDropdownMenuOpen : ""
                    }`}
                  >
                    <li>
                      <a
                        href="/collections/high-protein"
                        className={
                          activeNavItem === "/collections/high-protein"
                            ? styles.active
                            : ""
                        }
                      >
                        High Protein
                      </a>
                    </li>
                    <li>
                      <a
                        href="/collections/gluten-free"
                        className={
                          activeNavItem === "/collections/gluten-free"
                            ? styles.active
                            : ""
                        }
                      >
                        Gluten Free
                      </a>
                    </li>
                    <li>
                      <a
                        href="/collections/high-fibre"
                        className={
                          activeNavItem === "/collections/high-fibre"
                            ? styles.active
                            : ""
                        }
                      >
                        High Fiber
                      </a>
                    </li>
                    <li>
                      <a
                        href="/collections/probiotics"
                        className={
                          activeNavItem === "/collections/probiotics"
                            ? styles.active
                            : ""
                        }
                      >
                        Good for Gut Health
                      </a>
                    </li>
                  </ul>
                </li>

                {/* Mobile Bundle Menu Item */}
                <li className={styles.mobileNavItem}>
                  <a
                    href="/collections/bundle"
                    className={`${styles.mobileNavLink} ${
                      styles.specialBundle
                    } ${
                      activeNavItem === "/collections/bundle"
                        ? styles.active
                        : ""
                    }`}
                  >
                    {selectedBundleProducts.length > 0 ? (
                      <div className={styles.mobileBundleIndicator}>
                        <div className={styles.mobileBundleCircles}>
                          {selectedBundleProducts.map(
                            (product, index) =>
                              index < 2 && (
                                <div
                                  key={product.id}
                                  className={styles.mobileBundleItemCircle}
                                >
                                  <img
                                    src={
                                      product.images?.main ||
                                      product.image ||
                                      ""
                                    }
                                    alt=""
                                    className={styles.mobileBundleItemImage}
                                  />
                                </div>
                              )
                          )}
                          {selectedBundleProducts.length > 2 && (
                            <div className={styles.mobileBundleItemMore}>
                              +{selectedBundleProducts.length - 2}
                            </div>
                          )}
                        </div>
                        {remainingItems > 0 ? (
                          <span className={styles.mobileBundleRemainingText}>
                            Need {remainingItems} more
                          </span>
                        ) : (
                          <span className={styles.mobileBundleCompleteText}>
                            Complete Bundle
                          </span>
                        )}
                      </div>
                    ) : (
                      "Buy any 7 at 499"
                    )}
                  </a>
                </li>

                <li className={styles.mobileNavItem}>
                  <a
                    href="/collections/all"
                    className={`${styles.mobileNavLink} ${
                      activeNavItem === "/collections/all" ? styles.active : ""
                    }`}
                  >
                    All Snacks
                  </a>
                </li>

                <li className={styles.mobileNavItem}>
                  <a
                    href="https://foodyoga.shop/"
                    className={styles.mobileNavLink}
                  >
                    USA Website
                  </a>
                </li>

                {/* Cart button in mobile menu */}
                <li className={styles.mobileNavItem}>
                  <button
                    className={`${styles.mobileNavLink} ${styles.mobileCartButton}`}
                    onClick={() => {
                      toggleCart();
                      closeMobileMenu();
                    }}
                  >
                    <FiShoppingCart className={styles.icon} />
                    <span>Cart</span>
                    {cartCount > 0 && (
                      <span className={styles.mobileCartCount}>
                        {cartCount}
                      </span>
                    )}
                  </button>
                </li>

                {/* Mobile account menu */}
                <li className={`${styles.mobileNavItem} ${styles.accountLink}`}>
                  {!loading && !user ? (
                    <button
                      className={`${styles.mobileNavLink} ${styles.mobileAuthButton}`}
                      onClick={() => {
                        setShowAuthModal(true);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <FiUser className={styles.icon} />
                      Sign In / Register
                    </button>
                  ) : (
                    <a href="/account" className={styles.mobileNavLink}>
                      <FiUser className={styles.icon} />
                      My Account
                    </a>
                  )}
                </li>
              </ul>
            </nav>
          </div>
        )}

        {/* Phone Auth Modal */}
        {showAuthModal && <PhoneAuth onClose={() => setShowAuthModal(false)} />}
      </header>
    </BundleContext.Provider>
  );
};

export default HeaderComponent;
