import { DataHelpers } from '../data/studentSchema';

const STORAGE_KEYS = {
  STUDENTS: 'chess_academy_students',
  PAYMENTS: 'chess_academy_payments',
  SETTINGS: 'chess_academy_settings'
};

class StudentService {
  constructor() {
    this.initializeStorage();
  }
  
  initializeStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
      const initialStudents = this.getInitialStudents();
      this.saveStudents(initialStudents);
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
      this.savePayments({});
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.saveSettings({
        academyName: 'Uncrowned Kings Chess Academy',
        monthlyFeeDefaults: {
          Beginner: 1500,
          Intermediate: 2000,
          Advanced: 2500
        },
        paymentDueDay: 10,
        currency: 'INR'
      });
    }
  }
  
  getStudents() {
    const students = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
    return students;
  }
  
  getStudent(id) {
    const students = this.getStudents();
    return students.find(student => student.id === id);
  }
  
  saveStudent(student) {
    const students = this.getStudents();
    const errors = DataHelpers.validateData(student, 'student');
    
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    
    if (student.id) {
      const index = students.findIndex(s => s.id === student.id);
      if (index !== -1) {
        students[index] = student;
      }
    } else {
      student.id = DataHelpers.generateNextId(students);
      student.createdAt = new Date().toISOString();
      students.push(student);
    }
    
    student.updatedAt = new Date().toISOString();
    this.saveStudents(students);
    return student;
  }
  
  deleteStudent(id) {
    const students = this.getStudents();
    const filteredStudents = students.filter(student => student.id !== id);
    this.saveStudents(filteredStudents);
    
    this.deleteStudentPayments(id);
    
    return true;
  }
  
  saveStudents(students) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }
  
  getPayments() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PAYMENTS) || '{}');
  }
  
  getStudentPayments(studentId) {
    const payments = this.getPayments();
    return payments[studentId] || [];
  }
  
  savePayment(payment) {
    const errors = DataHelpers.validateData(payment, 'payment');
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    
    const payments = this.getPayments();
    if (!payments[payment.studentId]) {
      payments[payment.studentId] = [];
    }
    
    const existingIndex = payments[payment.studentId].findIndex(
      p => p.month === payment.month && p.year === payment.year
    );
    
    if (existingIndex !== -1) {
      payments[payment.studentId][existingIndex] = payment;
    } else {
      payments[payment.studentId].push(payment);
    }
    
    this.savePayments(payments);
    
    this.updateStudentPaymentStatus(payment.studentId, payment);
    
    return payment;
  }
  
  updateStudentPaymentStatus(studentId, payment) {
    const student = this.getStudent(studentId);
    if (!student) return;
    
    if (!student.paymentStatus[payment.year]) {
      student.paymentStatus[payment.year] = {};
    }
    
    student.paymentStatus[payment.year][payment.month] = {
      paid: payment.paid,
      amount: payment.amount,
      date: payment.paymentDate,
      method: payment.paymentMethod,
      dueDate: payment.dueDate
    };
    
    this.saveStudent(student);
  }
  
  deleteStudentPayments(studentId) {
    const payments = this.getPayments();
    delete payments[studentId];
    this.savePayments(payments);
  }
  
  savePayments(payments) {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }
  
  getSettings() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
  }
  
  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }
  
  getStatistics(year = new Date().getFullYear()) {
    const students = this.getStudents();
    const payments = this.getPayments();
    const months = DataHelpers.getMonths();
    
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.status === 'Active').length;
    
    let totalMonthlyRevenue = 0;
    let totalCollected = 0;
    let totalPending = 0;
    
    students.forEach(student => {
      totalMonthlyRevenue += student.monthlyFee;
      
      const studentPayments = payments[student.id] || [];
      const yearPayments = studentPayments.filter(p => p.year === year);
      
      yearPayments.forEach(payment => {
        if (payment.paid) {
          totalCollected += payment.amount;
        } else {
          totalPending += payment.amount;
        }
      });
    });
    
    const monthlyStatus = {};
    months.forEach(month => {
      let paidCount = 0;
      let pendingCount = 0;
      
      students.forEach(student => {
        const studentPayments = payments[student.id] || [];
        const payment = studentPayments.find(p => p.month === month && p.year === year);
        
        if (payment) {
          if (payment.paid) {
            paidCount++;
          } else {
            pendingCount++;
          }
        } else {
          pendingCount++;
        }
      });
      
      monthlyStatus[month] = {
        paid: paidCount,
        pending: pendingCount,
        total: students.length,
        collectionRate: students.length > 0 ? (paidCount / students.length) * 100 : 0
      };
    });
    
    return {
      totalStudents,
      activeStudents,
      totalMonthlyRevenue,
      totalCollected,
      totalPending,
      monthlyStatus,
      averageRating: students.length > 0 
        ? Math.round(students.reduce((sum, s) => sum + s.rating, 0) / students.length)
        : 0,
      levelDistribution: {
        Beginner: students.filter(s => s.level === 'Beginner').length,
        Intermediate: students.filter(s => s.level === 'Intermediate').length,
        Advanced: students.filter(s => s.level === 'Advanced').length
      }
    };
  }
  
  getInitialStudents() {
    const months = DataHelpers.getMonths();
    const currentYear = new Date().getFullYear();
    
    return [
      {
        id: 1001,
        name: "Rahul Kumar",
        age: 14,
        dob: "2010-03-15",
        rating: 1200,
        level: "Beginner",
        fideId: "IND123456",
        phone: "+91 9876543210",
        attendance: "95%",
        status: "Active",
        joinedDate: "2023-01-15",
        classesPerWeek: 3,
        totalClasses: 120,
        completedClasses: 114,
        email: "rahul.kumar@email.com",
        parentName: "Mr. Kumar",
        parentPhone: "+91 9876543290",
        address: "123 Main Street, Chennai",
        monthlyFee: 1500,
        paymentMethod: "Bank Transfer",
        paymentStatus: this.generatePaymentStatus(1500, currentYear, months),
        createdAt: "2023-01-15T10:00:00Z",
        updatedAt: "2023-01-15T10:00:00Z"
      },
      {
        id: 1002,
        name: "Priya Sharma",
        age: 16,
        dob: "2008-06-22",
        rating: 1720,
        level: "Intermediate",
        fideId: "IND123457",
        phone: "+91 9876543211",
        attendance: "92%",
        status: "Active",
        joinedDate: "2023-02-20",
        classesPerWeek: 4,
        totalClasses: 160,
        completedClasses: 147,
        email: "priya.sharma@email.com",
        parentName: "Mrs. Sharma",
        parentPhone: "+91 9876543291",
        address: "456 Park Avenue, Mumbai",
        monthlyFee: 2000,
        paymentMethod: "Cash",
        paymentStatus: this.generatePaymentStatus(2000, currentYear, months),
        createdAt: "2023-02-20T10:00:00Z",
        updatedAt: "2023-02-20T10:00:00Z"
      },
      {
        id: 1003,
        name: "Karan Patel",
        age: 15,
        dob: "2009-01-10",
        rating: 1850,
        level: "Advanced",
        fideId: "IND123458",
        phone: "+91 9876543212",
        attendance: "98%",
        status: "Active",
        joinedDate: "2023-03-10",
        classesPerWeek: 5,
        totalClasses: 200,
        completedClasses: 196,
        email: "karan.patel@email.com",
        parentName: "Mr. Patel",
        parentPhone: "+91 9876543292",
        address: "789 Lake View, Delhi",
        monthlyFee: 2500,
        paymentMethod: "UPI",
        paymentStatus: this.generatePaymentStatus(2500, currentYear, months),
        createdAt: "2023-03-10T10:00:00Z",
        updatedAt: "2023-03-10T10:00:00Z"
      },
      {
        id: 1004,
        name: "Anita Rao",
        age: 13,
        dob: "2011-08-05",
        rating: 950,
        level: "Beginner",
        fideId: "IND123459",
        phone: "+91 9876543213",
        attendance: "88%",
        status: "Active",
        joinedDate: "2023-04-05",
        classesPerWeek: 2,
        totalClasses: 80,
        completedClasses: 70,
        email: "anita.rao@email.com",
        parentName: "Mr. Rao",
        parentPhone: "+91 9876543293",
        address: "101 Garden Road, Bangalore",
        monthlyFee: 1200,
        paymentMethod: "Bank Transfer",
        paymentStatus: this.generatePaymentStatus(1200, currentYear, months),
        createdAt: "2023-04-05T10:00:00Z",
        updatedAt: "2023-04-05T10:00:00Z"
      }
    ];
  }
  
  generatePaymentStatus(monthlyFee, year, months) {
    const paymentStatus = {};
    paymentStatus[year] = {};
    
    months.forEach(month => {
      const monthIndex = months.indexOf(month) + 1;
      const isPaid = Math.random() > 0.3;
      paymentStatus[year][month] = {
        paid: isPaid,
        amount: monthlyFee,
        date: isPaid ? `${year}-${String(monthIndex).padStart(2, '0')}-05` : '',
        method: "Bank Transfer",
        dueDate: `${year}-${String(monthIndex).padStart(2, '0')}-10`
      };
    });
    
    return paymentStatus;
  }
  
  searchStudents(query, filters = {}) {
    let students = this.getStudents();
    
    if (query) {
      const searchTerm = query.toLowerCase();
      students = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm) ||
        student.phone.includes(query) ||
        student.id.toString().includes(query) ||
        (student.fideId && student.fideId.toLowerCase().includes(searchTerm))
      );
    }
    
    if (filters.status && filters.status !== 'All') {
      students = students.filter(student => student.status === filters.status);
    }
    
    if (filters.level && filters.level !== 'All') {
      students = students.filter(student => student.level === filters.level);
    }
    
    if (filters.paymentStatus) {
      const currentYear = new Date().getFullYear();
      const months = DataHelpers.getMonths();
      const currentMonth = months[new Date().getMonth()];
      
      students = students.filter(student => {
        const payment = student.paymentStatus?.[currentYear]?.[currentMonth];
        if (filters.paymentStatus === 'paid') {
          return payment?.paid === true;
        } else if (filters.paymentStatus === 'pending') {
          return !payment || payment.paid === false;
        }
        return true;
      });
    }
    
    return students;
  }
  
  exportData() {
    return {
      students: this.getStudents(),
      payments: this.getPayments(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  }
  
  importData(data) {
    if (data.students) this.saveStudents(data.students);
    if (data.payments) this.savePayments(data.payments);
    if (data.settings) this.saveSettings(data.settings);
    return true;
  }
}

const studentService = new StudentService();
export default studentService;
