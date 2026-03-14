// src/components/RegistrationForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegistrationForm.css';
import BackButton from './BackButton';
import api from '../services/api';


const RegistrationForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studentName: '',
    dateOfBirth: '',
    email: '',
    gender: '',
    fideRating: '',
    fideId: '',
    age: '',
    ageCategory: '',
    whatsappNo: '',
    phoneNumber: '',
    school: '',
    address: '',
    classType: 'online',
    parentName: '',
    parentOccupation: '',
    emergencyContact: '',
    chessExperience: '',
    preferredTimings: '',
    termsAccepted: false
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }

    // Auto-calculate age if date of birth is entered
    if (name === 'dateOfBirth' && value) {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setFormData(prev => ({
        ...prev,
        age: age.toString(),
        ageCategory: getAgeCategory(age)
      }));
    }
  };

  const getAgeCategory = (age) => {
    if (age <= 8) return 'Under 8';
    if (age <= 10) return 'Under 10';
    if (age <= 12) return 'Under 12';
    if (age <= 14) return 'Under 14';
    if (age <= 16) return 'Under 16';
    if (age <= 18) return 'Under 18';
    return 'Above 18';
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.studentName.trim()) newErrors.studentName = 'Student name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.whatsappNo) newErrors.whatsappNo = 'WhatsApp number is required';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.school.trim()) newErrors.school = 'School name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.parentName.trim()) newErrors.parentName = "Parent's name is required";
    if (!formData.termsAccepted) newErrors.termsAccepted = 'You must accept the terms and conditions';

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await api.post('/students/register', formData);
      alert('Registration successful! Your application is pending admin approval.');
      navigate('/');
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Error submitting registration. Please try again.');
    }
  };

  const ageCategories = [
    'Under 8', 'Under 10', 'Under 12', 'Under 14', 
    'Under 16', 'Under 18', 'Above 18'
  ];

  const chessExperienceOptions = [
    'Beginner (0-6 months)',
    'Intermediate (6 months - 2 years)',
    'Advanced (2-5 years)',
    'Tournament Player (5+ years)'
  ];

  const timeSlots = [
    'Morning (8 AM - 11 AM)',
    'Afternoon (2 PM - 5 PM)',
    'Evening (5 PM - 8 PM)',
    'Weekends Only'
  ];

  return (
    <div className="registration-container">
      <div className="registration-header">
        <h1>Student Registration Form</h1>
        <p>Join Uncrowned Kings Chess Academy - Fill in your details below</p>
        <div className="registration-container">
        <BackButton />
  {/* ... rest of the code ... */}
</div>
      </div>

      <form onSubmit={handleSubmit} className="registration-form">
        <div className="form-section">
          <h2>Personal Information</h2>
          
          <div className="form-group">
            <label htmlFor="studentName">Student Name *</label>
            <input
              type="text"
              id="studentName"
              name="studentName"
              value={formData.studentName}
              onChange={handleChange}
              placeholder="Enter full name"
              className={errors.studentName ? 'error' : ''}
            />
            {errors.studentName && <span className="error-message">{errors.studentName}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth *</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={errors.dateOfBirth ? 'error' : ''}
              />
              {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Auto-calculated"
                readOnly
              />
            </div>

            <div className="form-group">
              <label htmlFor="ageCategory">Age Category</label>
              <select
                id="ageCategory"
                name="ageCategory"
                value={formData.ageCategory}
                onChange={handleChange}
              >
                <option value="">Select Category</option>
                {ageCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gender">Gender *</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={errors.gender ? 'error' : ''}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <span className="error-message">{errors.gender}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="student@example.com"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Chess Background</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fideRating">FIDE Rating (if any)</label>
              <input
                type="number"
                id="fideRating"
                name="fideRating"
                value={formData.fideRating}
                onChange={handleChange}
                placeholder="Enter FIDE rating"
                min="0"
                max="3000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="fideId">FIDE ID (if any)</label>
              <input
                type="text"
                id="fideId"
                name="fideId"
                value={formData.fideId}
                onChange={handleChange}
                placeholder="Enter FIDE ID"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="chessExperience">Chess Experience Level</label>
            <select
              id="chessExperience"
              name="chessExperience"
              value={formData.chessExperience}
              onChange={handleChange}
            >
              <option value="">Select Experience Level</option>
              {chessExperienceOptions.map(exp => (
                <option key={exp} value={exp}>{exp}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h2>Contact Information</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="whatsappNo">WhatsApp Number *</label>
              <input
                type="tel"
                id="whatsappNo"
                name="whatsappNo"
                value={formData.whatsappNo}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className={errors.whatsappNo ? 'error' : ''}
              />
              {errors.whatsappNo && <span className="error-message">{errors.whatsappNo}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number *</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className={errors.phoneNumber ? 'error' : ''}
              />
              {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="emergencyContact">Emergency Contact Number</label>
            <input
              type="tel"
              id="emergencyContact"
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleChange}
              placeholder="Emergency contact number"
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Educational & Residential Details</h2>
          
          <div className="form-group">
            <label htmlFor="school">School/College Name *</label>
            <input
              type="text"
              id="school"
              name="school"
              value={formData.school}
              onChange={handleChange}
              placeholder="Enter school/college name"
              className={errors.school ? 'error' : ''}
            />
            {errors.school && <span className="error-message">{errors.school}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="address">Full Address *</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter complete address with city and PIN code"
              rows="3"
              className={errors.address ? 'error' : ''}
            />
            {errors.address && <span className="error-message">{errors.address}</span>}
          </div>
        </div>

        <div className="form-section">
          <h2>Parent/Guardian Information</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="parentName">Parent/Guardian Name *</label>
              <input
                type="text"
                id="parentName"
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                placeholder="Enter parent/guardian name"
                className={errors.parentName ? 'error' : ''}
              />
              {errors.parentName && <span className="error-message">{errors.parentName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="parentOccupation">Parent Occupation</label>
              <input
                type="text"
                id="parentOccupation"
                name="parentOccupation"
                value={formData.parentOccupation}
                onChange={handleChange}
                placeholder="Enter occupation"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Class Preferences</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Class Type *</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="classType"
                    value="online"
                    checked={formData.classType === 'online'}
                    onChange={handleChange}
                  />
                  <span>Online Class</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="classType"
                    value="physical"
                    checked={formData.classType === 'physical'}
                    onChange={handleChange}
                  />
                  <span>Physical Class (Mumbai)</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="preferredTimings">Preferred Timings</label>
              <select
                id="preferredTimings"
                name="preferredTimings"
                value={formData.preferredTimings}
                onChange={handleChange}
              >
                <option value="">Select Preferred Time</option>
                {timeSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section terms-section">
          <div className="form-group checkbox-group">
            <label className="checkbox-option">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleChange}
                className={errors.termsAccepted ? 'error' : ''}
              />
              <span>I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms and Conditions</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> of Uncrowned Kings Chess Academy *</span>
            </label>
            {errors.termsAccepted && <span className="error-message">{errors.termsAccepted}</span>}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Submit Registration
          </button>
        </div>
      </form>
    </div>
    
  );
};

export default RegistrationForm;