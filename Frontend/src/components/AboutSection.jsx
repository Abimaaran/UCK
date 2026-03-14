import useLocalStorage from '../hooks/useLocalStorage';
import { initialAboutFeatures } from '../data/mockData';
import './AboutSection.css';

const AboutSection = () => {
  const [features] = useLocalStorage('uck_about_features', initialAboutFeatures);

  return (
    <section className="about-section" id="about">
      <div className="container">
        <div className="section-header">
          <div className="header-decoration">
            <div className="chess-icon">♔</div>
            <h2 className="section-title">Why Choose Uncrowned Kings?</h2>
            <div className="chess-icon">♔</div>
          </div>
          <p className="section-subtitle">
            Complete chess education for steady improvement and competitive growth
          </p>
        </div>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              className="feature-card" 
              key={index}
              style={{ '--feature-color': feature.color }}
            >
              <div className="feature-card-inner">
                <div 
                  className="feature-icon-wrapper"
                  style={{ background: feature.gradient }}
                >
                  <span className="feature-icon">{feature.icon}</span>
                </div>
                
                <div className="feature-content">
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
                
                <div className="feature-decoration">
                  <div className="corner-decor top-left"></div>
                  <div className="corner-decor top-right"></div>
                  <div className="corner-decor bottom-left"></div>
                  <div className="corner-decor bottom-right"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;