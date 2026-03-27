import React, { useState, useEffect } from 'react';
import { getCollection, createItem } from '../../services/api';

const StudentReviewManager = () => {
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [reviews, setReviews] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Students
      try {
        const studentData = await getCollection('students');
        setApprovedStudents(Array.isArray(studentData) ? studentData.filter(s => s.status === 'Approved') : []);
      } catch (err) {
        console.warn("Failed to fetch students:", err.message);
        setApprovedStudents([]);
      }

      // 2. Fetch Reviews
      try {
        const allReviews = await getCollection('reviews');
        const reviewsMap = {};
        if (Array.isArray(allReviews)) {
          allReviews.forEach(record => {
            reviewsMap[record.studentId] = record;
          });
        }
        setReviews(reviewsMap);
      } catch (err) {
        console.warn("Failed to fetch reviews:", err.message);
        setReviews({});
      }
    };
    fetchData();
  }, []);


  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      const now = new Date();
      const payload = {
        studentId: selectedStudent.studentId,
        text: reviewText,
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: now.toISOString()
      };
      await createItem('reviews', payload);

      const newReviews = { ...reviews };
      newReviews[selectedStudent.studentId] = payload;
      setReviews(newReviews);
      alert('Review sent successfully to Student History!');
    } catch (err) {
      console.error("Failed to send review", err);
      alert("Could not send review.");
    }
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
                  background: selectedStudent?.studentId === student.studentId ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${selectedStudent?.studentId === student.studentId ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.1)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onClick={() => {
                  setSelectedStudent(student);
                  setReviewText(reviews[student.studentId]?.text || '');
                }}
              >
                <span style={{ 
                  background: 'rgba(212, 175, 55, 0.1)', 
                  color: 'var(--accent-gold)', 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  fontSize: '0.8rem', 
                  fontWeight: '700',
                  minWidth: '65px',
                  textAlign: 'center'
                }}>
                  #{student.studentId || 'ID?'}
                </span>
                <div style={{ fontWeight: '600', color: '#fff' }}>
                  {student.studentName || student.name || student.fullName || 'Unnamed Student'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Review Editor */}
        <div className="review-editor-card" style={{ background: 'var(--card-bg)', borderRadius: '15px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          {selectedStudent ? (
            <>
              <h3 style={{ marginBottom: '1rem', color: 'var(--accent-gold)' }}>
                Review for: <span style={{ color: '#fff' }}>{selectedStudent.studentName || selectedStudent.name || 'Student'}</span> 
                <span style={{ marginLeft: '10px', fontSize: '0.9rem', opacity: 0.8 }}>(#{selectedStudent.studentId})</span>
              </h3>
              <form onSubmit={handleSaveReview}>
                <div className="form-group">
                  <label>Type Review / Performance Feedback</label>
                  <textarea
                    style={{ minHeight: '250px', width: '100%' }}
                    placeholder="Enter the performance review for the student here..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                  <button type="submit" className="add-btn" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
                    Send Review to Student Portal
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
              <p>Please select a student from the left to write and send a review.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentReviewManager;
