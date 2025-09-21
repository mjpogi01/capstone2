import React from 'react';

const About = () => {
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
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#00bfff',
            textShadow: '0 0 20px rgba(0, 191, 255, 0.5)',
            marginBottom: '1rem'
          }}>
            About Yohann's Sportswear House
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: '#a9d8ff',
            maxWidth: '800px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Your premier destination for high-quality sportswear, custom jerseys, and athletic apparel
          </p>
        </div>

        {/* Story Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '3rem',
          marginBottom: '4rem',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{
              fontSize: '2rem',
              color: '#00bfff',
              marginBottom: '1.5rem',
              textShadow: '0 0 10px rgba(0, 191, 255, 0.3)'
            }}>
              Our Story
            </h2>
            <p style={{
              fontSize: '1.1rem',
              lineHeight: '1.7',
              color: '#e0e0e0',
              marginBottom: '1rem'
            }}>
              Founded with a passion for sports and quality craftsmanship, Yohann's Sportswear House 
              has been serving athletes and sports enthusiasts across the Philippines since our inception. 
              We believe that every athlete deserves premium sportswear that enhances their performance 
              and reflects their dedication to the game.
            </p>
            <p style={{
              fontSize: '1.1rem',
              lineHeight: '1.7',
              color: '#e0e0e0'
            }}>
              From our humble beginnings to becoming a trusted name in sportswear, we've maintained 
              our commitment to excellence, innovation, and customer satisfaction.
            </p>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
            borderRadius: '15px',
            padding: '2rem',
            border: '1px solid #00bfff',
            boxShadow: '0 10px 30px rgba(0, 191, 255, 0.1)'
          }}>
            <h3 style={{
              color: '#00bfff',
              marginBottom: '1rem',
              fontSize: '1.3rem'
            }}>
              Why Choose Us?
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0
            }}>
              <li style={{
                marginBottom: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ color: '#00bfff' }}>✓</span>
                Premium Quality Materials
              </li>
              <li style={{
                marginBottom: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ color: '#00bfff' }}>✓</span>
                Custom Design Services
              </li>
              <li style={{
                marginBottom: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ color: '#00bfff' }}>✓</span>
                Multiple Branch Locations
              </li>
              <li style={{
                marginBottom: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ color: '#00bfff' }}>✓</span>
                Expert Craftsmanship
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ color: '#00bfff' }}>✓</span>
                Affordable Pricing
              </li>
            </ul>
          </div>
        </div>

      
        <div style={{
          marginBottom: '4rem'
        }}>
          <h2 style={{
            fontSize: '2rem',
            color: '#00bfff',
            textAlign: 'center',
            marginBottom: '2rem',
            textShadow: '0 0 10px rgba(0, 191, 255, 0.3)'
          }}>
            Our Services
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
              borderRadius: '12px',
              padding: '2rem',
              border: '1px solid #333',
              textAlign: 'center',
              transition: 'transform 0.3s ease'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem'
              }}>👕</div>
              <h3 style={{
                color: '#00bfff',
                marginBottom: '1rem',
                fontSize: '1.3rem'
              }}>
                Custom Jerseys
              </h3>
              <p style={{
                color: '#a9d8ff',
                lineHeight: '1.6'
              }}>
                Personalized jerseys for teams, schools, and organizations with your custom designs and colors.
              </p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
              borderRadius: '12px',
              padding: '2rem',
              border: '1px solid #333',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem'
              }}>🎨</div>
              <h3 style={{
                color: '#00bfff',
                marginBottom: '1rem',
                fontSize: '1.3rem'
              }}>
                Design Services
              </h3>
              <p style={{
                color: '#a9d8ff',
                lineHeight: '1.6'
              }}>
                Professional design assistance to bring your sportswear vision to life.
              </p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
              borderRadius: '12px',
              padding: '2rem',
              border: '1px solid #333',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem'
              }}>🏪</div>
              <h3 style={{
                color: '#00bfff',
                marginBottom: '1rem',
                fontSize: '1.3rem'
              }}>
                Multiple Locations
              </h3>
              <p style={{
                color: '#a9d8ff',
                lineHeight: '1.6'
              }}>
                Seven convenient branch locations across Batangas and Oriental Mindoro.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
          borderRadius: '15px',
          padding: '3rem',
          border: '1px solid #00bfff',
          boxShadow: '0 10px 30px rgba(0, 191, 255, 0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '2rem',
            color: '#00bfff',
            marginBottom: '1rem',
            textShadow: '0 0 10px rgba(0, 191, 255, 0.3)'
          }}>
            Get In Touch
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: '#a9d8ff',
            marginBottom: '2rem',
            maxWidth: '600px',
            margin: '0 auto 2rem auto'
          }}>
            Ready to create your perfect sportswear? Visit one of our branches or contact us today!
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            flexWrap: 'wrap'
          }}>
            <a href="/branches" style={{
              background: '#00bfff',
              color: '#000',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}>
              Find Our Branches
            </a>
            <a href="#contacts" style={{
              background: 'transparent',
              color: '#00bfff',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              border: '2px solid #00bfff',
              transition: 'all 0.3s ease'
            }}>
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About; 