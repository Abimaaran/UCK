// src/components/StudentsSection.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCollection } from '../services/api';
import './StudentsSection.css';

const LazyImage = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <>
      {!loaded && <div className="win-photo-skeleton"></div>}
      <img 
        src={src} 
        alt={alt} 
        className={`${className} ${loaded ? 'loaded' : 'loading'}`} 
        loading="lazy" 
        decoding="async"
        onLoad={() => setLoaded(true)}
      />
    </>
  );
};

const StudentsSection = () => {
  const navigate = useNavigate();
  const [dbAchievements, setDbAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const data = await getCollection('achievements');
        setDbAchievements(data);
      } catch (error) {
        console.error("Failed to load achievements", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAchievements();
  }, []);

  // Dynamically compute summary stats from database achievements
  const totalVictories = dbAchievements.length;
  const recentChampion = totalVictories > 0 ? dbAchievements[0].studentName : 'Rising Stars';
  const recentAchievement = totalVictories > 0 ? dbAchievements[0].title : 'National Level';

  const displayAchievements = [
    {
      title: 'Total Victories',
      count: totalVictories > 0 ? `${totalVictories}+` : '10+',
      description: 'Official tournament victories and medals secured globally',
      icon: '🏆',
      gradient: 'linear-gradient(135deg, #FFD700, #FFED4E)'
    },
    {
      title: 'Recent Champion',
      count: '1st',
      description: `Latest Gold: ${recentChampion}`,
      icon: '👑',
      gradient: 'linear-gradient(135deg, #4A90E2, #2A70D2)'
    },
    {
      title: 'Top Honor',
      count: '🥇',
      description: recentAchievement,
      icon: '⭐',
      gradient: 'linear-gradient(135deg, #FF6B6B, #FF5252)'
    }
  ];

  return (
    <section className="students-section" id="students">
      <div className="container">
        <div className="section-header">
          <div className="header-decoration">
            <div className="trophy-icon">🏆</div>
            <h2 className="section-title">Our Students' Achievements</h2>
            <div className="trophy-icon">🏆</div>
          </div>
          <p className="section-subtitle">Building Champions Since 2025</p>
        </div>

        <div className="achievements-container">
          {displayAchievements.map((achievement, index) => (
            <div
              className="achievement-plate"
              key={index}
              style={{ '--plate-color': achievement.gradient }}
            >
              <div className="plate-content">
                <div className="plate-header">
                  <div
                    className="plate-icon-wrapper"
                    style={{ background: achievement.gradient }}
                  >
                    <span className="plate-icon">{achievement.icon}</span>
                  </div>
                  <div className="plate-count">
                    <span className="count-number">{achievement.count}</span>
                    <span className="count-plus">+</span>
                  </div>
                </div>

                <div className="plate-body">
                  <h3 className="plate-title">{achievement.title}</h3>
                  <p className="plate-description">{achievement.description}</p>
                </div>

                <div className="plate-decoration">
                  <div className="plate-corner top-left"></div>
                  <div className="plate-corner top-right"></div>
                  <div className="plate-corner bottom-left"></div>
                  <div className="plate-corner bottom-right"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(isLoading || dbAchievements.length > 0) && (
          <div className="wins-section">
            <h3 className="wins-title">Recent Hall of Fame</h3>
            <div className="wins-grid">
              {isLoading ? (
                /* Skeleton Loader Cards */
                [1, 2, 3].map((dummy) => (
                  <div key={dummy} className="win-card" style={{ pointerEvents: 'none' }}>
                    <div className="win-photo-wrapper">
                      <div className="win-photo-skeleton"></div>
                    </div>
                    <div className="win-info" style={{ gap: '1.2rem', padding: '2.5rem' }}>
                      <div style={{ height: '30px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', width: '70%', margin: '0 auto', animation: 'shimmer 1.5s infinite' }}></div>
                      <div style={{ height: '20px', background: 'rgba(212,175,55,0.2)', borderRadius: '4px', width: '50%', margin: '0 auto', animation: 'shimmer 1.5s infinite' }}></div>
                      <div style={{ height: '50px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', width: '90%', margin: '10px auto 0', animation: 'shimmer 1.5s infinite' }}></div>
                    </div>
                  </div>
                ))
              ) : (
                /* Actual Achievement Cards */
                dbAchievements.map((win, index) => (
                  <div key={win.id || index} className="win-card">
                    <div className="win-photo-wrapper">
                      {win.photo ? (
                        <LazyImage src={win.photo} alt={win.studentName} className="win-photo" />
                      ) : (
                        <div className="win-photo-placeholder">🏆</div>
                      )}
                      <div className="win-badge">Recent Win</div>
                    </div>
                    <div className="win-info">
                      <h4 className="win-student">{win.studentName}</h4>
                      <p className="win-achievement">{win.title}</p>
                      {win.description && <p className="win-desc">{win.description}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="students-cta">
          <p className="cta-text">Join our winning team and start your journey to chess mastery</p>
          <button className="cta-button" onClick={() => {
            console.log("Start Your Journey clicked!");
            window.dispatchEvent(new Event('showRegisterModal'));
          }}>Start Your Journey</button>
        </div>
      </div>
    </section>
  );
};

export default StudentsSection;