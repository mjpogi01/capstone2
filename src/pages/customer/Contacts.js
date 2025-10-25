import React from 'react';

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
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
      color: '#ffffff',
      padding: '2rem 0'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem'
      }}>
        {/* Hero Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '4rem',
          padding: '3rem 0'
        }}>
          <h1 className="page-title" style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#00bfff',
            textShadow: '0 0 20px rgba(0, 191, 255, 0.5)',
            marginBottom: '1rem',
            fontFamily: 'Oswald, sans-serif'
          }}>
            Contact Us
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: '#a9d8ff',
            maxWidth: '800px',
            margin: '0 auto',
            lineHeight: '1.6',
            fontFamily: 'Oswald, sans-serif'
          }}>
            Get in touch with us at any of our convenient locations
          </p>
        </div>

        {/* Contact Info Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '2rem',
          marginBottom: '4rem'
        }}>
          {branches.map((branch, index) => (
            <div key={index} style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
              borderRadius: '15px',
              padding: '2rem',
              border: '1px solid #333',
              transition: 'transform 0.3s ease'
            }}>
              <h3 style={{
                color: '#00bfff',
                marginBottom: '1rem',
                fontSize: '1.3rem',
                textShadow: '0 0 10px rgba(0, 191, 255, 0.3)',
                fontFamily: 'Oswald, sans-serif'
              }}>
                {branch.name}
              </h3>
              <div style={{
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ color: '#00bfff', marginTop: '0.2rem' }}>📍</span>
                  <span style={{ color: '#a9d8ff', lineHeight: '1.4', fontFamily: 'Oswald, sans-serif' }}>
                    {branch.address}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ color: '#00bfff' }}>📞</span>
                  <span style={{ color: '#a9d8ff', fontFamily: 'Oswald, sans-serif' }}>{branch.phone}</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ color: '#00bfff' }}>🕒</span>
                  <span style={{ color: '#a9d8ff', fontFamily: 'Oswald, sans-serif' }}>{branch.hours}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
          borderRadius: '15px',
          padding: '3rem',
          border: '1px solid #00bfff',
          boxShadow: '0 10px 30px rgba(0, 191, 255, 0.1)',
          marginBottom: '4rem'
        }}>
          <h2 style={{
            fontSize: '2rem',
            color: '#00bfff',
            textAlign: 'center',
            marginBottom: '2rem',
            textShadow: '0 0 10px rgba(0, 191, 255, 0.3)',
            fontFamily: 'Oswald, sans-serif'
          }}>
            Send us a Message
          </h2>
          <form style={{
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <input
                type="text"
                placeholder="Your Name"
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  background: '#0d0d0d',
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontFamily: 'Oswald, sans-serif'
                }}
              />
              <input
                type="email"
                placeholder="Your Email"
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  background: '#0d0d0d',
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontFamily: 'Oswald, sans-serif'
                }}
              />
            </div>
            <input
              type="text"
              placeholder="Subject"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #333',
                background: '#0d0d0d',
                color: '#ffffff',
                fontSize: '1rem',
                marginBottom: '1rem',
                fontFamily: 'Oswald, sans-serif'
              }}
            />
            <textarea
              placeholder="Your Message"
              rows="5"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #333',
                background: '#0d0d0d',
                color: '#ffffff',
                fontSize: '1rem',
                marginBottom: '1rem',
                resize: 'vertical',
                fontFamily: 'Oswald, sans-serif'
              }}
            />
            <button
              type="submit"
              style={{
                background: '#00bfff',
                color: '#000',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                width: '100%',
                fontFamily: 'Oswald, sans-serif'
              }}
            >
              Send Message
            </button>
          </form>
        </div>

        {/* Map Link */}
        <div style={{
          textAlign: 'center'
        }}>
          <a href="/branches" style={{
            background: 'transparent',
            color: '#00bfff',
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            border: '2px solid #00bfff',
            transition: 'all 0.3s ease',
            display: 'inline-block',
            fontFamily: 'Oswald, sans-serif'
          }}>
            View All Branches on Map
          </a>
        </div>
      </div>
    </div>
  );
};

export default Contacts; 