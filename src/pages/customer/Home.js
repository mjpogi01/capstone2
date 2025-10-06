import React, { useState } from 'react';
import Hero from '../../components/customer/Hero';
import ProductCategories from '../../components/customer/ProductCategories';
import CustomDesign from '../../components/customer/CustomDesign';
import Newsletter from '../../components/customer/Newsletter';

const Home = () => {
  const [activeCategory, setActiveCategory] = useState('jerseys');

  return (
    <>
      <Hero />
      <ProductCategories activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
      <CustomDesign />
      <Newsletter />
    </>
  );
};

export default Home; 