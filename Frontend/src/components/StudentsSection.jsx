// src/components/StudentsSection.jsx
import React from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { initialAchievements } from '../data/mockData';
import './StudentsSection.css';

const StudentsSection = () => {
  const [dbAchievements] = useLocalStorage('uck_achievements', initialAchievements);

  // Map the DB achievements to the display format if needed, or use them directly
  // For now, let's keep the core 3 summary stats but make them potentially dynamic if needed
  // In a real app, these sums would be calculated from the dbAchievements list.
  const displayAchievements = [
    { 
      title: 'Youth Selectors', 
      count: '12+', 
      description: 'Students who won provincial level tournaments',
      icon: '👑',
      gradient: 'linear-gradient(135deg, #FFD700, #FFED4E)'
    },
    { 
      title: 'Rated Players', 
      count: '10+', 
      description: 'Students who earned official FIDE ratings',
      icon: '⭐',
      gradient: 'linear-gradient(135deg, #4A90E2, #2A70D2)'
    },
    { 
      title: 'Latest Wins', 
      count: dbAchievements.length, 
      description: dbAchievements.length > 0 ? dbAchievements[0].title : 'Victories in national-level competitions',
      icon: '🏆',
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
        
        <div className="students-cta">
          <p className="cta-text">Join our winning team and start your journey to chess mastery</p>
          <button className="cta-button">Start Your Journey</button>
        </div>
      </div>
    </section>
  );
};

export default StudentsSection;