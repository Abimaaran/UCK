import React, { useState, useEffect } from 'react';
import { getCollection, updateItem } from '../../services/api';

const StudentReviewManager = () => {
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [reviews, setReviews] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [students, allReviews] = await Promise.all([
          getCollection('students'),
          getCollection('reviews')
        ]);
        
        setApprovedStudents(Array.isArray(students) ? students.filter(s => s.status === 'Approved') : []);
        
        // Transform array to { studentId: reviewObject }
        const reviewsMap = {};
        if (Array.isArray(allReviews)) {
          allReviews.forEach(record => {
            // Store the most recent review for the studentId
            reviewsMap[record.studentId] = record;
          });
        }
        setReviews(reviewsMap);
      } catch (err) {
        console.error("Failed to fetch students or reviews", err);
      }
    };
    fetchData();
  }, []);

  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      const payload = {
          text: reviewText,
          date: new Date().toISOString().split('T')[0]
      };
      await updateItem('reviews', selectedStudent.studentId, payload);
      
      const newReviews = { ...reviews };
      newReviews[selectedStudent.studentId] = payload;
      setReviews(newReviews);
      alert('Review saved successfully!');
    } catch (err) {
      console.error("Failed to save review", err);
      alert("Could not save review.");
    }
  };

  const sendWhatsApp = (student) => {
    const review = reviews[student.studentId]?.text || '';
    if (!review) {
      alert('Please write a review first!');
      return;
    }
    const message = encodeURIComponent(`Royal Chess Academy Feedback for ${student.name}:\n\n${review}`);
    // Using a placeholder phone since we might not have it in approval data, 
    // or we can add it if available.
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const sendEmail = (student) => {
    const review = reviews[student.studentId]?.text || '';
    if (!review) {
      alert('Please write a review first!');
      return;
    }
    const subject = encodeURIComponent(`Performance Review - Uncrowned Kings Chess Academy`);
    const body = encodeURIComponent(`Dear ${student.name},\n\nHere is your performance feedback:\n\n${review}\n\nBest regards,\nAdmin`);
    window.location.href = `mailto:${student.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="manager-container">
      <div className="manager-grid" style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
        {/* Left: Student List */}
        <div className="student-list-card" style={{ background: 'var(--card-bg)', borderRadius: '15px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-gold)' }}>Select Student</h3>
          <div className="student-items" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '500px', overflowY: 'auto' }}>
            {approvedStudents.map(student => (
              <div 
                key={student.studentId}
                className={`student-item ${selectedStudent?.studentId === student.studentId ? 'active' : ''}`}
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  background: selectedStudent?.studentId === student.studentId ? 'rgba(212, 175, 55, 0.1)' : 'var(--bg-primary)',
                  border: `1px solid ${selectedStudent?.studentId === student.studentId ? 'var(--accent-gold)' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => {
                  setSelectedStudent(student);
                  setReviewText(reviews[student.studentId]?.text || '');
                }}
              >
                <div style={{ fontWeight: '600' }}>{student.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#888' }}>ID: #{student.studentId}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Review Editor */}
        <div className="review-editor-card" style={{ background: 'var(--card-bg)', borderRadius: '15px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          {selectedStudent ? (
            <>
              <h3 style={{ marginBottom: '1rem', color: 'var(--accent-gold)' }}>Review for {selectedStudent.name}</h3>
              <form onSubmit={handleSaveReview}>
                <div className="form-group">
                  <label>Personal Feedback</label>
                  <textarea 
                    style={{ minHeight: '200px', width: '100%' }}
                    placeholder="Write your feedback here..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    required
                  ></textarea>
                </div>
                
                <div className="form-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button type="submit" className="add-btn">Save Review</button>
                  <button 
                    type="button" 
                    className="edit-btn" 
                    style={{ background: '#25D366', color: 'white' }}
                    onClick={() => sendWhatsApp(selectedStudent)}
                  >
                    Send to WhatsApp
                  </button>
                  <button 
                    type="button" 
                    className="edit-btn" 
                    style={{ background: '#EA4335', color: 'white' }}
                    onClick={() => sendEmail(selectedStudent)}
                  >
                    Send to Email
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
              <p>Please select a student from the left to write a review.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentReviewManager;
