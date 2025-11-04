import React from 'react';
import './Contacts.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMapMarkerAlt, 
  faPhone, 
  faClock, 
  faEnvelope,
  faUser,
  faPaperPlane,
  faMap
} from '@fortawesome/free-solid-svg-icons';

const Contacts = () => {
  const branches = [
    {
      name: 'SAN PASCUAL (MAIN BRANCH)',
      address: 'Villa Maria Subdivision Sambat, San Pascual, 4204 Batangas',
      phone: '(043) 123-4567',
      hours: 'Mon-Sat: 8:00 AM - 6:00 PM'
    },
    {
      name: 'CALAPAN BRANCH',
      address: 'Unit 2, Ground Floor Basa Bldg., Infantado Street, Brgy. San Vicente West Calapan City, 5200 Oriental Mindoro',
      phone: '(043) 234-5678',
      hours: 'Mon-Sat: 8:00 AM - 6:00 PM'
    },
    {
      name: 'MUZON BRANCH',
      address: 'Barangay Muzon, San Luis, 4226 Batangas',
      phone: '(043) 345-6789',
      hours: 'Mon-Sat: 8:00 AM - 6:00 PM'
    },
    {
      name: 'LEMERY BRANCH',
      address: 'Miranda Bldg, Illustre Ave., Brgy. District III 4209 Lemery Batangas',
      phone: '(043) 456-7890',
      hours: 'Mon-Sat: 8:00 AM - 6:00 PM'
    },
    {
      name: 'BATANGAS CITY BRANCH',
      address: 'Unit 1 Casa Buena Building, P.Burgos ST. EXT Calicanto, 4200 Batangas',
      phone: '(043) 567-8901',
      hours: 'Mon-Sat: 8:00 AM - 6:00 PM'
    },
    {
      name: 'BAUAN BRANCH',
      address: 'J.P Rizal St. Poblacion, Bauan Batangas',
      phone: '(043) 678-9012',
      hours: 'Mon-Sat: 8:00 AM - 6:00 PM'
    },
    {
      name: 'CALACA BRANCH',
      address: 'Block D-8 Calaca Public Market, Poblacion 4, Calaca City, Philippines',
      phone: '(043) 789-0123',
      hours: 'Mon-Sat: 8:00 AM - 6:00 PM'
    },
    {
      name: 'PINAMALAYAN BRANCH',
      address: 'Mabini St. Brgy. Marfrancisco, Pinamalayan, Oriental Mindoro, Philippines',
      phone: '0917 139 5661',
      hours: 'Mon-Sat: 8:00 AM - 6:00 PM'
    },
    {
      name: 'ROSARIO BRANCH',
      address: 'Brgy. D, Rosario, Batangas, Rosario, Philippines',
      phone: '(043) 890-1234',
      hours: 'Mon-Sat: 8:00 AM - 6:00 PM'
    }
  ];

  return (
    <div className="contacts-container">
      <div className="contacts-wrapper">
        {/* Hero Section */}
        <div className="contacts-hero">
          <h1 className="contacts-title page-title">
            Contact Us
          </h1>
          <p className="contacts-subtitle">
            Get in touch with us at any of our convenient locations
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="contacts-branches-grid">
          {branches.map((branch, index) => (
            <div key={index} className="contacts-branch-card">
              <h3 className="contacts-branch-name">
                {branch.name}
              </h3>
              <div className="contacts-branch-details">
                <div className="contacts-branch-detail-row">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="contacts-branch-icon" />
                  <span className="contacts-branch-text">
                    {branch.address}
                  </span>
                </div>
                <div className="contacts-branch-detail-row">
                  <FontAwesomeIcon icon={faPhone} className="contacts-branch-icon" />
                  <span className="contacts-branch-text">{branch.phone}</span>
                </div>
                <div className="contacts-branch-detail-row">
                  <FontAwesomeIcon icon={faClock} className="contacts-branch-icon" />
                  <span className="contacts-branch-text">{branch.hours}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="contacts-form-section">
          <h2 className="contacts-form-title">
            Send us a Message
          </h2>
          <form className="contacts-form">
            <div className="contacts-form-row">
              <input
                type="text"
                placeholder="Your Name"
                className="contacts-form-input"
              />
              <input
                type="email"
                placeholder="Your Email"
                className="contacts-form-input"
              />
            </div>
            <input
              type="text"
              placeholder="Subject"
              className="contacts-form-input contacts-form-input-full"
            />
            <textarea
              placeholder="Your Message"
              rows="5"
              className="contacts-form-textarea"
            />
            <button
              type="submit"
              className="contacts-form-button"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="contacts-form-icon" />
              Send Message
            </button>
          </form>
        </div>

        {/* Map Link */}
        <div className="contacts-map-link-section">
          <a href="/branches" className="contacts-map-link">
            <FontAwesomeIcon icon={faMap} className="contacts-map-icon" />
            View All Branches on Map
          </a>
        </div>
      </div>
    </div>
  );
};

export default Contacts; 