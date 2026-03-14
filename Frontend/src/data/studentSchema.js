export const StudentSchema = {
  student: {
    id: { type: 'number', required: true, autoIncrement: true },
    name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    age: { type: 'number', required: true, min: 5, max: 100 },
    dob: { type: 'string', required: true, format: 'date' },
    email: { type: 'string', required: true, format: 'email' },
    phone: { type: 'string', required: true, pattern: /^[\d\s\+\-\(\)]{10,}$/ },
    address: { type: 'string', required: true },
    rating: { type: 'number', required: true, min: 0, max: 3000 },
    level: { 
      type: 'string', 
      required: true, 
      enum: ['Beginner', 'Intermediate', 'Advanced'] 
    },
    fideId: { type: 'string', pattern: /^[A-Z]{3}\d{6}$/ },
    classesPerWeek: { type: 'number', min: 1, max: 7 },
    totalClasses: { type: 'number', min: 0 },
    completedClasses: { type: 'number', min: 0 },
    attendance: { type: 'string', pattern: /^\d+%$/ },
    monthlyFee: { type: 'number', required: true, min: 0 },
    paymentMethod: { 
      type: 'string', 
      enum: ['Bank Transfer', 'Cash', 'UPI', 'Credit Card', 'Debit Card'] 
    },
    parentName: { type: 'string', required: true },
    parentPhone: { type: 'string', required: true },
    status: { type: 'string', enum: ['Active', 'Inactive', 'Suspended'] },
    joinedDate: { type: 'string', format: 'date' },
    paymentStatus: {
      type: 'object',
      default: () => ({})
    }
  },
  
  payment: {
    studentId: { type: 'number', required: true },
    month: { type: 'string', required: true },
    year: { type: 'number', required: true },
    amount: { type: 'number', required: true, min: 0 },
    paid: { type: 'boolean', default: false },
    paymentDate: { type: 'string', format: 'date' },
    paymentMethod: { type: 'string' },
    dueDate: { type: 'string', format: 'date' },
    transactionId: { type: 'string' },
    notes: { type: 'string' }
  }
};

export const DataHelpers = {
  createNewStudent: (data = {}) => {
    const currentYear = new Date().getFullYear();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const paymentStatus = {};
    months.forEach(month => {
      if (!paymentStatus[currentYear]) {
        paymentStatus[currentYear] = {};
      }
      paymentStatus[currentYear][month] = {
        paid: false,
        amount: data.monthlyFee || 1500,
        dueDate: `${currentYear}-${String(months.indexOf(month) + 1).padStart(2, '0')}-10`
      };
    });
    
    return {
      id: 0,
      name: '',
      age: '',
      dob: new Date().toISOString().split('T')[0],
      rating: 1200,
      level: 'Beginner',
      fideId: '',
      phone: '',
      attendance: '0%',
      status: 'Active',
      joinedDate: new Date().toISOString().split('T')[0],
      classesPerWeek: 0,
      totalClasses: 0,
      completedClasses: 0,
      email: '',
      parentName: '',
      parentPhone: '',
      address: '',
      monthlyFee: 1500,
      paymentMethod: 'Bank Transfer',
      paymentStatus,
      ...data
    };
  },
  
  createNewPayment: (studentId, month, year, amount) => ({
    studentId,
    month,
    year,
    amount,
    paid: false,
    paymentDate: '',
    paymentMethod: 'Bank Transfer',
    dueDate: `${year}-${String(new Date(`${month} 1, ${year}`).getMonth() + 1).padStart(2, '0')}-10`,
    transactionId: '',
    notes: ''
  }),
  
  validateData: (data, schemaName) => {
    const schema = StudentSchema[schemaName];
    const errors = [];
    
    if (!schema) {
      errors.push(`Schema "${schemaName}" not found`);
      return errors;
    }
    
    Object.keys(schema).forEach(key => {
      const fieldSchema = schema[key];
      const value = data[key];
      
      if (fieldSchema.required && (value === undefined || value === null || value === '')) {
        errors.push(`${key} is required`);
        return;
      }
      
      if (value === undefined || value === null) return;
      
      if (fieldSchema.type && typeof value !== fieldSchema.type) {
        errors.push(`${key} should be type ${fieldSchema.type}`);
      }
      
      if (fieldSchema.type === 'number') {
        if (fieldSchema.min !== undefined && value < fieldSchema.min) {
          errors.push(`${key} should be at least ${fieldSchema.min}`);
        }
        if (fieldSchema.max !== undefined && value > fieldSchema.max) {
          errors.push(`${key} should not exceed ${fieldSchema.max}`);
        }
      }
      
      if (fieldSchema.type === 'string') {
        if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
          errors.push(`${key} should be at least ${fieldSchema.minLength} characters`);
        }
        if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
          errors.push(`${key} should not exceed ${fieldSchema.maxLength} characters`);
        }
        if (fieldSchema.pattern && !fieldSchema.pattern.test(value)) {
          errors.push(`${key} format is invalid`);
        }
      }
      
      if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
        errors.push(`${key} should be one of: ${fieldSchema.enum.join(', ')}`);
      }
    });
    
    return errors;
  },
  
  generateNextId: (items) => {
    if (!items || items.length === 0) return 1;
    return Math.max(...items.map(item => item.id || 0)) + 1;
  },
  
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  },
  
  getMonths: () => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  
  getYears: () => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
  }
};
