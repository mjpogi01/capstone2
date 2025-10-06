import React from 'react';
import './CustomDesign.css';

const CustomDesign = () => {
  return (
    <section className="custom-design">
      <div className="container">
        <div className="custom-design-content">
          <h2 className="custom-title">You Want To Order Your Own Design?</h2>
          <p className="custom-description">
            Want a jersey that's 100% yours? Fill out the form, upload your design, 
            and let's bring your vision to life!
          </p>
          <button className="upload-btn">UPLOAD YOUR DREAM DESIGN</button>
        </div>
      </div>
    </section>
  );
};

export default CustomDesign; 