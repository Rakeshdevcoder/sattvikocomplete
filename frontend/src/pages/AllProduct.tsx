import ProductList2 from "../allproducts/ProductList2";

const AllProduct = () => {
  return (
    <>
      <div style={{ marginLeft: "180.4px", marginRight: "180.4px" }}>
        <ProductList2 fetchAll={true} limit={0} />
      </div>
    </>
  );
};

export default AllProduct;
