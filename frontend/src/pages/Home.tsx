import Slideshow from "../components/Slideshow";
import BestSellers from "../components/BestSellers";
import ProductBadges from "../components/ProductBadges";
import PostYogaSnacks from "../components/PostYogaSnacks";
import ImageWithText from "../components/ImageWithText";
import Banner from "../components/Banner";
import AvailableBanner from "../components/AvailableBanner";

const Home = () => {
  return (
    <>
      <Slideshow
        sliderId="Slider-template--24255929319720__slideshow_nicqiM"
        autoplay={false}
        speed={3}
      />
      <div style={{ marginLeft: "200.4px", marginRight: "200.4px" }}>
        <BestSellers />
        <ProductBadges />
        <PostYogaSnacks />
        <ImageWithText />
        <Banner />
        <AvailableBanner />
      </div>
    </>
  );
};

export default Home;
