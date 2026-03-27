import React, { useState, useEffect } from 'react';
import { getCollection } from '../services/api';
import './TournamentsSection.css';

const TournamentsSection = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showDescription, setShowDescription] = useState(false);

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const data = await getCollection('tournaments');
        setTournaments(data);
      } catch (error) {
        console.error("Failed to load tournaments", error);
      }
    };
    loadTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedTournament]);

  const renderDescription = (text) => {
    if (!text) return null;

    // First, split by Markdown link pattern: [text](url)
    const markdownRegex = /(\[[^\]]+\]\([^)]+\))/g;
    const parts = text.split(markdownRegex);

    return parts.map((part, index) => {
      // Check if this part is a markdown link [abc](xyz)
      const markdownMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (markdownMatch) {
         const [_, linkText, url] = markdownMatch;
         return (
          <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="tournament-link">
            {linkText}
          </a>
         );
      }

      // For normal text parts, auto-detect plain URLs
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const subParts = part.split(urlRegex);

      return subParts.map((subPart, subIndex) => {
        const urlMatch = subPart.match(/^https?:\/\/[^\s]+$/);
        if (urlMatch) {
          return (
            <a key={`${index}-${subIndex}`} href={subPart} target="_blank" rel="noopener noreferrer" className="tournament-link">
              {subPart}
            </a>
          );
        }
        return <span key={`${index}-${subIndex}`}>{subPart}</span>;
      });
    });
  };

  const handleDownload = (pdfUrl, name) => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${name.replace(/\s+/g, '_')}_details.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="tournaments-section" id="tournaments">
      <div className="container">
        <div className="section-header">
          <div className="header-decoration">
            <div className="chess-board-icon">♜</div>
            <h2 className="section-title">Tournaments & Events</h2>
            <div className="chess-board-icon">♜</div>
          </div>
          <p className="section-subtitle">Compete, Learn, and Grow with Uncrowned Kings</p>
        </div>

        <div className="tournaments-container">
          {tournaments.map((tournament, index) => (
            <div
              className="tournament-plate"
              key={index}
              style={{
                '--tournament-color': '#d4af37',
                '--tournament-gradient': tournament.gradient || 'linear-gradient(135deg, #222, #111)'
              }}
            >
              <div className="plate-wrapper">
                {tournament.canvaImage && (
                  <div
                    className="tournament-image-preview"
                    style={{ cursor: 'zoom-in' }}
                    onClick={() => { setSelectedTournament(tournament); setShowDescription(false); }}
                  >
                    <img src={tournament.canvaImage} alt={tournament.name} />
                  </div>
                )}
                <div className="plate-header">
                  <div
                    className="plate-icon-wrapper"
                    style={{ background: tournament.gradient || 'linear-gradient(135deg, #222, #111)' }}
                  >
                    <span className="plate-icon">🏆</span>
                  </div>
                </div>

                <div className="plate-body">
                  <h3 className="tournament-name">{tournament.name}</h3>
                </div>

                <div className="plate-footer" style={{ display: 'flex', gap: '1rem' }}>
                  <button className="view-details-btn" style={{ flex: 1 }} onClick={() => { setSelectedTournament(tournament); setShowDescription(false); }}>
                    View More
                  </button>
                  {tournament.pdfUrl && (
                    <button
                      className="download-pdf-btn"
                      onClick={() => handleDownload(tournament.pdfUrl, tournament.name)}
                    >
                      📄 PDF Details
                    </button>
                  )}
                </div>

                <div className="plate-decoration">
                  <div className="corner-line top-left"></div>
                  <div className="corner-line top-right"></div>
                  <div className="corner-line bottom-left"></div>
                  <div className="corner-line bottom-right"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {selectedTournament && (
        <div className="tournament-modal-overlay" onClick={() => setSelectedTournament(null)}>
          <div className="tournament-modal-content focus-mode" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedTournament(null)}>×</button>

            <div className="modal-focus-view">
              <div className="modal-image-full">
                <img
                  src={selectedTournament.canvaImage}
                  alt={selectedTournament.name}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />

                <div className={`modal-description-overlay ${showDescription ? "active" : ""}`}>
                  <h2 className="modal-tournament-name">{selectedTournament.name}</h2>
                  <div className="modal-description-text">
                    {renderDescription(selectedTournament.description)}
                  </div>
                  {selectedTournament.pdfUrl && (
                    <button
                      className="modal-download-btn"
                      onClick={() => handleDownload(selectedTournament.pdfUrl, selectedTournament.name)}
                    >
                      📄 Download PDF
                    </button>
                  )}
                </div>
              </div>

              <div className="modal-actions-bar">
                <button className="back-to-grid-btn" onClick={() => setSelectedTournament(null)}>
                  ← Back
                </button>
                <button className="toggle-description-btn" onClick={() => setShowDescription(!showDescription)}>
                  {showDescription ? "✕ Hide Details" : "ⓘ Show Details"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TournamentsSection;