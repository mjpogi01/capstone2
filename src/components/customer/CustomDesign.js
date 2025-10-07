import React, { useState } from 'react';
import './CustomDesign.css';

const CustomDesign = () => {
  const [clickedImage, setClickedImage] = useState(null);

  const handleImageClick = (imageType) => {
    setClickedImage(imageType);
    // Reset the clicked state after animation completes
    setTimeout(() => {
      setClickedImage(null);
    }, 600);
  };

  return (
    <section className="custom-design">
      <div className="container">
        {/* Basketball Player Image - Top Left */}
        <div 
          className={`player-image basketball-player ${clickedImage === 'basketball' ? 'clicked' : ''}`}
          onClick={() => handleImageClick('basketball')}
        >
          <img 
            src="/image_highlights/basketball.png" 
            alt="Basketball Player" 
            className="player-img"
          />
        </div>
        
        {/* Basketball1 Player Image - Top Right */}
        <div 
          className={`player-image basketball1-player ${clickedImage === 'basketball1' ? 'clicked' : ''}`}
          onClick={() => handleImageClick('basketball1')}
        >
          <img 
            src="/image_highlights/basketball1.png" 
            alt="Basketball Player 1" 
            className="player-img"
          />
        </div>

        {/* Volleyball Player Image - Bottom Left */}
        <div 
          className={`player-image volleyball-player ${clickedImage === 'volleyball' ? 'clicked' : ''}`}
          onClick={() => handleImageClick('volleyball')}
        >
          <img 
            src="/image_highlights/volleyball.png" 
            alt="Volleyball Player" 
            className="player-img"
          />
        </div>

        {/* Football Player Image - Bottom Right */}
        <div 
          className={`player-image football-player ${clickedImage === 'football' ? 'clicked' : ''}`}
          onClick={() => handleImageClick('football')}
        >
          <img 
            src="/image_highlights/football.png" 
            alt="Football Player" 
            className="player-img"
          />
        </div>
        
        {/* Center Content */}
        <div className="custom-design-content">
          <h2 className="custom-title">YOU WANT TO ORDER YOUR OWN DESIGN?</h2>
          <p className="custom-subtitle">Want a jersey that's 100% yours?</p>
          <p className="custom-description">
            Fill out the form, upload your design, and let's bring your vision to life!
          </p>
          <button className="upload-btn">UPLOAD YOUR DREAM DESIGN</button>
        </div>
      </div>
    </section>
  );
};

export default CustomDesign; 