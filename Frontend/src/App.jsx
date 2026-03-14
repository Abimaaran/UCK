// src/App.js
import React from 'react';
import './App.css';
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import Footer from './components/Footer';

// Import new sections
import AboutSection from './components/AboutSection';
import StudentsSection from './components/StudentsSection';
import TournamentsSection from './components/TournamentsSection';
import CoachesSection from './components/CoachesSection';
import ContactSection from './components/ContactSection';
import LoginSection from './components/LoginSection';
import TimetableSection from './components/TimetableSection';


function App() {
  return (
    <div className="App">
      <Navigation />
      
      {/* Hero/Home Section */}
      <section id="home">
        <HeroSection />
      </section>
      
      {/* About Us Section */}
      <section id="about">
        <AboutSection />
      </section>
      
      {/* Students Section */}
      <section id="students">
        <StudentsSection />
      </section>
      
      {/* Tournaments Section */}
      <section id="tournaments">
        <TournamentsSection />
      </section>
      
      {/* Timetable Section */}
      <section id="timetable">
        <TimetableSection />
      </section>
      
      {/* Coaches Section */}
      <section id="coaches">
        <CoachesSection />
      </section>
      
      {/* Contact Us Section */}
      <section id="contact">
        <ContactSection />
      </section>
      
      
      
     
      
      {/* Login Section */}
      <section id="login">
        <LoginSection />
      </section>
      
      
      <Footer />
    </div>
  );
}

export default App;