// MongoDB initialization script
db = db.getSiblingDB('clinical_assistant');

// Create collections
db.createCollection('clinical_cases');
db.createCollection('users');
db.createCollection('feedback');
db.createCollection('audit_logs');

// Create indexes for better performance
db.clinical_cases.createIndex({ "doctor_id": 1, "created_at": -1 });
db.clinical_cases.createIndex({ "patient_id": 1 });
db.clinical_cases.createIndex({ "patient_summary": "text" });

db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "doctor_id": 1 }, { unique: true });

db.feedback.createIndex({ "case_id": 1 });
db.feedback.createIndex({ "doctor_id": 1, "created_at": -1 });

db.audit_logs.createIndex({ "user_id": 1, "timestamp": -1 });
db.audit_logs.createIndex({ "action": 1, "timestamp": -1 });

print('Database initialization completed!');