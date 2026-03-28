import React, { useState, useEffect, useRef } from 'react';
import './AnalyzeGame.css';
import AnalyzeNavbar from './AnalyzeNavbar.jsx';
import Footer from './Footer.jsx';

const AnalyzeGame = () => {
  const [selectedPiece, setSelectedPiece] = useState('HAND');
  const [board, setBoard] = useState(Array.from({ length: 8 }, () => Array(8).fill('')));
  const [whiteToMove, setWhiteToMove] = useState('w');
  const [castling, setCastling] = useState({ K: true, Q: true, k: true, q: true });
  const [epTarget, setEpTarget] = useState('-');
  const [halfmove, setHalfmove] = useState(0);
  const [fullmove, setFullmove] = useState(1);
  const [flip, setFlip] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [userRating, setUserRating] = useState('Rating: 0');

  const [analysisSettings, setAnalysisSettings] = useState({
    theme: 'auto',
    bg: 'system',
    pieceSet: 'auto',
    color: 'white'
  });

  const frameRef = useRef(null);
  const ANALYSIS = 'https://lichess.org/embed/analysis';
  const [currentFen, setCurrentFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

  useEffect(() => {
    // Sync the analysis board whenever FEN or settings change
    const url = new URL(ANALYSIS);
    url.searchParams.set('theme', analysisSettings.theme);
    url.searchParams.set('bg', analysisSettings.bg);
    url.searchParams.set('pieceSet', analysisSettings.pieceSet);
    url.searchParams.set('color', analysisSettings.color);
    const fen = currentFen.replace(/ /g, '_');
    url.searchParams.set('fen', fen);

    if (frameRef.current) {
      frameRef.current.src = url.toString();
    }
  }, [currentFen, analysisSettings]);

  const handleSettingChange = (field, value) => {
    setAnalysisSettings(prev => ({ ...prev, [field]: value }));
  };

  const startPositionMatrix = () => {
    const r8 = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    const r7 = Array(8).fill('p');
    const r2 = Array(8).fill('P');
    const r1 = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
    return [r8, r7, Array(8).fill(''), Array(8).fill(''), Array(8).fill(''), Array(8).fill(''), r2, r1];
  };

  const setStart = () => {
    setBoard(startPositionMatrix());
    setWhiteToMove('w');
    setCastling({ K: true, Q: true, k: true, q: true });
    setEpTarget('-');
    setHalfmove(0);
    setFullmove(1);
    setSelectedSquare(null);
  };

  const toGlyph = (p) => {
    const pieces = {
      'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔',
      'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚'
    };
    return pieces[p] || '';
  };

  const movePiece = (from, to) => {
    if (!from || !to || (from.r === to.r && from.c === to.c)) return;

    const newBoard = [...board];
    const piece = newBoard[from.r][from.c];
    newBoard[from.r][from.c] = '';
    newBoard[to.r][to.c] = piece;
    setBoard(newBoard);
  };

  const handleSquareClick = (r, c) => {
    const rr = flip ? 7 - r : r;
    const cc = flip ? 7 - c : c;

    if (selectedPiece === 'X') {
      const newBoard = [...board];
      newBoard[rr][cc] = '';
      setBoard(newBoard);
      setSelectedSquare(null);
    } else if (selectedPiece === 'HAND') {
      if (selectedSquare) {
        movePiece(selectedSquare, { r: rr, c: cc });
        setSelectedSquare(null);
      } else if (board[rr][cc]) {
        setSelectedSquare({ r: rr, c: cc });
      }
    } else {
      const newBoard = [...board];
      newBoard[rr][cc] = selectedPiece;
      setBoard(newBoard);
      setSelectedSquare(null);
    }
  };

  const handleSquareRightClick = (e, r, c) => {
    e.preventDefault();
    const rr = flip ? 7 - r : r;
    const cc = flip ? 7 - c : c;

    const newBoard = [...board];
    newBoard[rr][cc] = '';
    setBoard(newBoard);
    setSelectedSquare(null);
  };

  const handleDragStart = (e, r, c) => {
    if (selectedPiece !== 'HAND' || !board[r][c]) return e.preventDefault();

    const rr = flip ? 7 - r : r;
    const cc = flip ? 7 - c : c;
    e.dataTransfer.setData('text/plain', JSON.stringify({ r: rr, c: cc }));
  };

  const handleDrop = (e, r, c) => {
    if (selectedPiece !== 'HAND') return;

    e.preventDefault();
    try {
      const from = JSON.parse(e.dataTransfer.getData('text/plain'));
      const rr = flip ? 7 - r : r;
      const cc = flip ? 7 - c : c;
      movePiece(from, { r: rr, c: cc });
      setSelectedSquare(null);
    } catch (_) { }
  };

  const toFEN = () => {
    const ranks = [];
    for (let r = 0; r < 8; r++) {
      let line = '', empty = 0;
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) empty++;
        else {
          if (empty) {
            line += empty;
            empty = 0;
          }
          line += piece;
        }
      }
      if (empty) line += empty;
      ranks.push(line || '8');
    }
    const place = ranks.join('/');
    const turn = whiteToMove;
    const castleStr = (castling.K ? 'K' : '') + (castling.Q ? 'Q' : '') +
      (castling.k ? 'k' : '') + (castling.q ? 'q' : '');
    const castle = castleStr || '-';
    const ep = (epTarget && epTarget !== '') ? epTarget : '-';
    return `${place} ${turn} ${castle} ${ep} ${halfmove} ${fullmove}`;
  };

  const handleApply = () => {
    const newFen = toFEN();
    setCurrentFen(newFen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const palettePiecesWhite = [
    { code: 'K', label: '♔' }, { code: 'Q', label: '♕' }, { code: 'R', label: '♖' },
    { code: 'B', label: '♗' }, { code: 'N', label: '♘' }, { code: 'P', label: '♙' }
  ];

  const palettePiecesBlack = [
    { code: 'k', label: '♚' }, { code: 'q', label: '♛' }, { code: 'r', label: '♜' },
    { code: 'b', label: '♝' }, { code: 'n', label: '♞' }, { code: 'p', label: '♟' }
  ];

  const renderPalette = () => {
    return (
      <div className="analyze-editor-toolbar" id="palette">
        {/* Hand & Erase row */}
        <div className="analyze-tool-group">
          <button
            className={`analyze-tool ${selectedPiece === 'HAND' ? 'analyze-tool--active' : ''}`}
            title="Hand (move pieces)"
            onClick={() => setSelectedPiece('HAND')}
          >🖐</button>
          <button
            className={`analyze-tool analyze-tool--erase ${selectedPiece === 'X' ? 'analyze-tool--active' : ''}`}
            title="Erase"
            onClick={() => setSelectedPiece('X')}
          >🗑</button>
        </div>

        {/* White pieces */}
        <div className="analyze-palette-group">
          <span className="analyze-group-title analyze-group-title--white">♔ White</span>
          <div className="analyze-tool-group">
            {palettePiecesWhite.map((it, i) => (
              <button
                key={i}
                className={`analyze-tool analyze-tool--white ${selectedPiece === it.code ? 'analyze-tool--active' : ''}`}
                title={it.code}
                onClick={() => setSelectedPiece(it.code)}
              >{it.label}</button>
            ))}
          </div>
        </div>

        {/* Black pieces */}
        <div className="analyze-palette-group">
          <span className="analyze-group-title analyze-group-title--black">♚ Black</span>
          <div className="analyze-tool-group">
            {palettePiecesBlack.map((it, i) => (
              <button
                key={i}
                className={`analyze-tool analyze-tool--black ${selectedPiece === it.code ? 'analyze-tool--active' : ''}`}
                title={it.code}
                onClick={() => setSelectedPiece(it.code)}
              >{it.label}</button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderBoard = () => {
    const filesToShow = flip ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranksToShow = flip ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];

    return (
      <>
        <div className="analyze-chess-grid-board" id="editGrid">
          {Array.from({ length: 8 }).map((_, r) =>
            Array.from({ length: 8 }).map((_, c) => {
              const rr = flip ? 7 - r : r;
              const cc = flip ? 7 - c : c;
              const isSelected = selectedSquare && selectedSquare.r === rr && selectedSquare.c === cc;
              const glyph = toGlyph(board[rr][cc]);

              return (
                <div
                  key={`${r}-${c}`}
                  className={`analyze-square ${(r + c) % 2 ? 'analyze-square--dark' : 'analyze-square--light'} ${isSelected ? 'analyze-square--selected' : ''}`}
                  onClick={() => handleSquareClick(r, c)}
                  onContextMenu={(e) => handleSquareRightClick(e, r, c)}
                  draggable={selectedPiece === 'HAND' && !!board[rr][cc]}
                  onDragStart={(e) => handleDragStart(e, rr, cc)}
                  onDragOver={(e) => { if (selectedPiece === 'HAND') e.preventDefault(); }}
                  onDrop={(e) => handleDrop(e, r, c)}
                >
                  {glyph && <span className="analyze-piece">{glyph}</span>}
                </div>
              );
            })
          )}
        </div>

        <div className="analyze-coord-files">
          {filesToShow.map((f, i) => <div key={i}>{f}</div>)}
        </div>

        <div className="analyze-coord-ranks">
          {ranksToShow.map((n, i) => <div key={i}>{n}</div>)}
        </div>
      </>
    );
  };

  return (
    <div className="AnalyzeGame-page">
      <AnalyzeNavbar />
      <div className="analyze-dashboard-main">
        <div className="analyze-container">
          <div className="analyze-section-header">
            <h2 className="analyze-section-title">Analysis Board</h2>
          </div>

          <div className="analyze-analysis-grid">
            {/* Board Panel */}
            <div className="analyze-chess-card analyze-chess-card--elevated">
              <div className="analyze-card-header">
                <h3 className="analyze-card-title"><i className="fas fa-chess-board"></i> UCK Engine</h3>
                <div className="analyze-card-actions">
                  <button className="analyze-chess-btn analyze-chess-btn--secondary" style={{ padding: '0.25rem 0.5rem' }}>
                    <i className="fas fa-expand"></i>
                  </button>
                </div>
              </div>
              <div className="analyze-card-content">
                <div className="analyze-board-container">
                  <iframe
                    ref={frameRef}
                    id="boardFrame"
                    title="Analysis Board"
                    src={ANALYSIS}
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>

            {/* Controls Panel */}
            <div className="analyze-chess-card">
              <div className="analyze-card-header">
                <h3 className="analyze-card-title"><i className="fas fa-sliders-h"></i> Board Settings</h3>
              </div>
              <div className="analyze-card-content">
                <div className="analyze-controls-panel">
                  <div className="analyze-control-group">
                    <div className="analyze-control-row">
                      <label htmlFor="side" className="analyze-form-label">Side</label>
                      <select id="side" className="analyze-form-select" value={analysisSettings.color} onChange={(e) => handleSettingChange('color', e.target.value)}>
                        <option value="white">White</option>
                        <option value="black">Black</option>
                      </select>
                    </div>
                  </div>

                  <div className="analyze-control-group">
                    <div className="analyze-control-row">
                      <label htmlFor="theme" className="analyze-form-label">Theme</label>
                      <select id="theme" className="analyze-form-select" value={analysisSettings.theme} onChange={(e) => handleSettingChange('theme', e.target.value)}>
                        <option value="auto">Auto</option>
                        <option value="brown">Brown</option>
                        <option value="blue">Blue</option>
                        <option value="green">Green</option>
                        <option value="purple">Purple</option>
                        <option value="pink">Pink</option>
                        <option value="wood">Wood</option>
                      </select>
                    </div>
                  </div>

                  <div className="analyze-control-group">
                    <div className="analyze-control-row">
                      <label htmlFor="bg" className="analyze-form-label">Background</label>
                      <select id="bg" className="analyze-form-select" value={analysisSettings.bg} onChange={(e) => handleSettingChange('bg', e.target.value)}>
                        <option value="system">System</option>
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                      </select>
                    </div>
                  </div>

                  <div className="analyze-control-group">
                    <div className="analyze-control-row">
                      <label htmlFor="pieces" className="analyze-form-label">Pieces</label>
                      <select id="pieces" className="analyze-form-select" value={analysisSettings.pieceSet} onChange={(e) => handleSettingChange('pieceSet', e.target.value)}>
                        <option value="auto">Auto</option>
                        <option value="alpha">Alpha</option>
                        <option value="california">California</option>
                        <option value="cburnett">CBurnett</option>
                        <option value="merida">Merida</option>
                        <option value="pirouetti">Pirouetti</option>
                        <option value="pixel">Pixel</option>
                        <option value="spatial">Spatial</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Editor Section */}
          <div className="analyze-chess-card analyze-chess-card--elevated" style={{ marginTop: '2rem' }}>
            <div className="analyze-card-header">
              <h3 className="analyze-card-title"><i className="fas fa-edit"></i> Board Editor</h3>
              <div className="analyze-card-actions">
                <button className="analyze-chess-btn analyze-chess-btn--secondary" style={{ padding: '0.25rem 0.5rem' }}>
                  <i className="fas fa-question-circle"></i>
                </button>
              </div>
            </div>
            <div className="analyze-card-content">
              <div className="analyze-editor-container">
                <div className="analyze-board-column">
                  <div className="analyze-action-buttons analyze-action-buttons--top">
                    <button className="analyze-chess-btn analyze-chess-btn--secondary" onClick={setStart}>
                      <i className="fas fa-undo"></i> Start
                    </button>
                    <button className="analyze-chess-btn analyze-chess-btn--danger" onClick={() => { setBoard(Array.from({ length: 8 }, () => Array(8).fill(''))); setSelectedSquare(null); }}>
                      <i className="fas fa-trash"></i> Clear
                    </button>
                    <button className="analyze-chess-btn analyze-chess-btn--secondary" onClick={() => setFlip(!flip)}>
                      <i className="fas fa-sync"></i> Flip
                    </button>
                    <button className="analyze-chess-btn analyze-chess-btn--accent" onClick={handleApply}>
                      <i className="fas fa-play"></i> Analyze
                    </button>
                  </div>
                  <div className="analyze-board-with-coords">
                    {renderBoard()}
                  </div>
                </div>

                <div className="analyze-editor-sidebar">
                  <div className="analyze-palette-sidebar">
                    {renderPalette()}
                  </div>

                  <div className="analyze-field">
                    <label className="analyze-form-label">To move</label>
                    <select
                      id="turnSel"
                      className="analyze-form-select"
                      value={whiteToMove}
                      onChange={(e) => setWhiteToMove(e.target.value)}
                    >
                      <option value="w">White</option>
                      <option value="b">Black</option>
                    </select>
                  </div>

                  <div className="analyze-field">
                    <label className="analyze-form-label">Castling</label>
                    <div className="analyze-field-row">
                      <div className="analyze-checkbox-group">
                        <input
                          type="checkbox"
                          id="K"
                          checked={castling.K}
                          onChange={(e) => setCastling({ ...castling, K: e.target.checked })}
                        />
                        <label htmlFor="K">White O-O</label>
                      </div>
                      <div className="analyze-checkbox-group">
                        <input
                          type="checkbox"
                          id="Q"
                          checked={castling.Q}
                          onChange={(e) => setCastling({ ...castling, Q: e.target.checked })}
                        />
                        <label htmlFor="Q">White O-O-O</label>
                      </div>
                    </div>
                    <div className="analyze-field-row">
                      <div className="analyze-checkbox-group">
                        <input
                          type="checkbox"
                          id="k"
                          checked={castling.k}
                          onChange={(e) => setCastling({ ...castling, k: e.target.checked })}
                        />
                        <label htmlFor="k">Black O-O</label>
                      </div>
                      <div className="analyze-checkbox-group">
                        <input
                          type="checkbox"
                          id="q"
                          checked={castling.q}
                          onChange={(e) => setCastling({ ...castling, q: e.target.checked })}
                        />
                        <label htmlFor="q">Black O-O-O</label>
                      </div>
                    </div>
                  </div>

                  <div className="analyze-field">
                    <label className="analyze-form-label">En passant</label>
                    <input
                      id="ep"
                      className="analyze-form-input"
                      placeholder="- or e3"
                      value={epTarget}
                      onChange={(e) => setEpTarget(e.target.value)}
                    />
                  </div>



                </div>
              </div>

              <p className="analyze-hint-text">
                <i className="fas fa-lightbulb"></i> Tip: Use 🖐 Hand to move (click or drag). Use 🗑 to erase (or right-click a square).
              </p>
            </div>
          </div>
        </div>

      </div>
      <Footer hideQuickLinks={true} />
    </div>
  );
};

export default AnalyzeGame;
