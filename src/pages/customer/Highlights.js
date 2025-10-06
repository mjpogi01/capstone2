import React, { useState, useEffect } from 'react';
import './Highlight.css';

const Highlights = () => {
  const [showAll, setShowAll] = useState(false);
  const [buyerImages, setBuyerImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Image file list
    const imageFiles = [
      { id: 1, filename: '1.png' },
      { id: 2, filename: '2.png' },
      { id: 3, filename: '3.png' },
      { id: 4, filename: '4.png' },
      { id: 5, filename: '5.png' },
      { id: 6, filename: '6.png' },
      { id: 7, filename: '7.png' },
      { id: 8, filename: '8.png' },
      { id: 9, filename: '9.png' },
      { id: 10, filename: '10.png' },
      { id: 11, filename: '11.png' },
      { id: 12, filename: '12.jpg' },
      { id: 13, filename: '13.jpg' },
      { id: 14, filename: '14.jpg' },
      { id: 15, filename: '15.jpg' },
      { id: 16, filename: '16.jpg' },
      { id: 17, filename: '17.jpg' },
      { id: 18, filename: '18.jpg' },
      { id: 19, filename: '19.jpg' },
      { id: 20, filename: '20.jpg' },
      { id: 21, filename: '21.jpg' },
      { id: 22, filename: '22.jpg' },
      { id: 23, filename: '23.jpg' },
      { id: 24, filename: 'image.png' }
    ];

    const images = imageFiles.map((file) => ({
      id: file.id,
      image: `/image_highlights/${file.filename}`,
    }));

    setBuyerImages(images);
  }, []);

  const visibleImages = showAll ? buyerImages : buyerImages.slice(0, 8);

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImageIndex(null);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const showPrev = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : buyerImages.length - 1
    );
  };

  const showNext = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex < buyerImages.length - 1 ? prevIndex + 1 : 0
    );
  };

  return (
    <div className="highlights">
      <div className="container">
        {/* Title Section */}
        <div className="title-section">
          <h1>Highlights</h1>
          <p>Discover our featured products and latest collections</p>
        </div>

        {/* Buyers Album Section */}
        <div className="buyers-album">
          <div className="buyers-grid">
            {visibleImages.map((item, index) => (
              <div
                key={item.id}
                className="buyer-item"
                onClick={() => handleImageClick(index)}
              >
                <img src={item.image} alt={`Buyer ${item.id}`} />
              </div>
            ))}
          </div>

          <div className="button-container">
            {!showAll ? (
              <button className="view-more" onClick={() => setShowAll(true)}>
                View More
              </button>
            ) : (
              <button className="show-less" onClick={() => setShowAll(false)}>
                Show Less
              </button>
            )}
          </div>
        </div>

        {/* Call to Action */}
        <div className="cta-section">
          <h2>Explore Our Collection</h2>
          <p>Visit our branches to see our full range of products</p>
          <a href="/branches" className="cta-button">
            Find Our Branches
          </a>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedImageIndex !== null && (
        <div className="image-modal" onClick={handleBackdropClick}>
          <div className="modal-content">
            <button className="close-button" onClick={closeModal}>
              &times;
            </button>

            <button className="nav-button prev" onClick={showPrev}>
              &#10094;
            </button>

            <img
              src={buyerImages[selectedImageIndex].image}
              alt={`Buyer ${buyerImages[selectedImageIndex].id}`}
              className="modal-image"
            />

            <button className="nav-button next" onClick={showNext}>
              &#10095;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Highlights;
