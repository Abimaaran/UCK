import React, { useState, useEffect } from 'react';
import { getCollection, deleteItem } from '../../services/api';

const UserReviewManager = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const data = await getCollection('user-reviews');
      setReviews(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch user reviews", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      try {
        await deleteItem('user-reviews', id);
        setReviews(reviews.filter(r => r.id !== id));
      } catch (err) {
        alert("Failed to delete review.");
      }
    }
  };

  if (loading) return <div className="loading">Loading feedbacks...</div>;

  return (
    <div className="manager-container">
      <div className="manager-header" style={{ marginBottom: '2rem' }}>
        <p style={{ color: '#888' }}>Feedback and reviews submitted by visitors through the Contact section.</p>
      </div>

      <div className="data-table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>User Info</th>
              <th>Rating</th>
              <th>Review / Feedback</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                  No feedbacks submitted yet.
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr key={review.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{review.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#888' }}>{review.email}</div>
                  </td>
                  <td>
                    <div className="stars-display" style={{ color: '#FFD700' }}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  </td>
                  <td>
                    <div style={{
                      maxHeight: '100px',
                      overflowY: 'auto',
                      fontSize: '0.9rem',
                      lineHeight: '1.4',
                      color: '#ccc',
                      padding: '0.5rem',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '5px'
                    }}>
                      {review.review}
                    </div>
                  </td>
                  <td className="action-btns">
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(review.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserReviewManager;
