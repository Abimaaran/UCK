export const initialCoaches = [
  { 
    id: 1,
    name: 'K. Sulaxan', 
    title: 'Intermediate Coach', 
    experience: '5+ years', 
    specialization: 'Strategy & Tactics',
    fideId: 'FIDE 450021',
    rating: '2100',
    bio: 'National level chess player with expertise in strategic planning and complex middlegame positions.',
    achievements: ['National Champion 2022', '5+ International Tournaments'],
    chessPiece: '♔',
    colorGradient: 'linear-gradient(135deg, #00BFFF, #0A74DA)'
  },
  { 
    id: 2,
    name: 'T. Sujinth', 
    title: 'Beginner\'s Coach', 
    experience: '5+ years', 
    specialization: 'Opening Theory',
    fideId: 'FIDE 450022',
    rating: '1950',
    bio: 'Specialized in teaching chess fundamentals and opening repertoire to beginner players.',
    achievements: ['Opening Theory Expert', 'Youth Coach Award 2023'],
    chessPiece: '♕',
    colorGradient: 'linear-gradient(135deg, #FF6B6B, #FF5252)'
  }
];

export const initialTournaments = [
  { 
    id: 1,
    name: 'International Rated Tournaments', 
    status: 'Upcoming',
    date: 'March 2025',
    participants: '100+ Players',
    icon: '🌍',
    gradient: 'linear-gradient(135deg, #FF6B6B, #FF5252)'
  },
  { 
    id: 2,
    name: 'Inter-School Chess Tournaments', 
    status: 'Upcoming',
    date: 'February 2025',
    participants: '50+ Schools',
    icon: '🏫',
    gradient: 'linear-gradient(135deg, #4A90E2, #2A70D2)'
  }
];

export const initialAchievements = [
  {
    id: 1,
    studentName: "Rahul Kumar",
    title: "March Academy Championship",
    position: "1st",
    date: "2024-03-15",
    description: "Won 1st place in Beginner category"
  },
  {
    id: 2,
    studentName: "Priya Sharma",
    title: "State Level Under-18",
    position: "3rd",
    date: "2024-01-20",
    description: "Secured 3rd place in strong field"
  }
];

export const initialTimetable = [
  {
    id: 1,
    day: 'Monday',
    time: '5:00 PM - 6:30 PM',
    level: 'Beginner',
    coach: 'T. Sujinth'
  },
  {
    id: 2,
    day: 'Tuesday',
    time: '5:30 PM - 7:00 PM',
    level: 'Intermediate',
    coach: 'K. Sulaxan'
  }
];

export const initialPendingStudents = [
  {
    id: 1,
    name: 'Arjun Das',
    email: 'arjun.das@example.com',
    dob: '2010-05-14',
    appliedDate: '2025-01-10',
    level: 'Beginner'
  },
  {
    id: 2,
    name: 'Sneha Reddy',
    email: 'sneha.reddy@example.com',
    dob: '2009-11-22',
    appliedDate: '2025-01-11',
    level: 'Intermediate'
  }
];
export const initialAboutFeatures = [
  {
    icon: '👑',
    title: 'Experienced Coaches',
    description: 'Learn from 5+ years experienced coaches and FIDE rated proven tournament success.',
    color: '#FFD700',
    gradient: 'linear-gradient(135deg, #FFD700, #FFED4E)'
  },
  {
    icon: '📚',
    title: 'Structured Curriculum',
    description: 'Progressive learning path from beginner to advanced levels with personalized coaching.',
    color: '#4A90E2',
    gradient: 'linear-gradient(135deg, #4A90E2, #2A70D2)'
  },
  {
    icon: '🏆',
    title: 'Tournament Training',
    description: 'Prepare for competitive play with simulated tournaments and strategy sessions.',
    color: '#FF6B6B',
    gradient: 'linear-gradient(135deg, #FF6B6B, #FF5252)'
  },
  {
    icon: '💻',
    title: 'Live Online Classes',
    description: 'Interactive live sessions with real-time feedback and Q&A opportunities.',
    color: '#20C997',
    gradient: 'linear-gradient(135deg, #20C997, #0BA360)'
  },
  {
    icon: '📊',
    title: 'Progress Tracking',
    description: 'Detailed analytics and performance reports to monitor improvement.',
    color: '#9C27B0',
    gradient: 'linear-gradient(135deg, #9C27B0, #7B1FA2)'
  },
  {
    icon: '👥',
    title: 'Community Support',
    description: 'Join a community of chess enthusiasts for practice games and discussions.',
    color: '#FF9800',
    gradient: 'linear-gradient(135deg, #FF9800, #F57C00)'
  }
];
export const initialAttendance = {};
export const initialFees = {};
export const initialReviews = {};
