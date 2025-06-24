# Sample Data for Clinical Insight Assistant

This directory contains sample data to help you test and demonstrate the Clinical Insight Assistant application.

## Files Included

### 1. `sample_cases.json`
Contains 5 realistic patient case summaries with different medical scenarios:
- Chest pain/cardiac evaluation
- Systemic symptoms (possible malignancy)
- COPD exacerbation
- Acute appendicitis
- Diabetic follow-up

Each case includes:
- Patient demographics (ID, name, age, gender)
- Clinical summary
- Doctor information

### 2. `sample_lab_report.csv`
A comprehensive lab report including:
- Complete Blood Count (CBC) with differential
- Basic Metabolic Panel (BMP)
- Lipid panel
- Values with reference ranges and abnormal flags

## How to Use Sample Data

### 1. Testing Case Creation
Use the patient summaries from `sample_cases.json` to create test cases in your application.

### 2. Testing File Upload
Upload the `sample_lab_report.csv` file when creating cases to test the multimodal analysis capabilities.

### 3. Testing Queries
Try these natural language queries after creating cases:
- "Show yesterday's cases"
- "Find patient 12345"
- "Show CBC results for patient 12349"
- "What are the lab findings for today?"

### 4. Loading Sample Data Programmatically

You can use this Python script to load sample data:

```python
import json
import requests

# Load sample cases
with open('sample_cases.json', 'r') as f:
    cases = json.load(f)

# Create cases via API
for case in cases:
    response = requests.post(
        'http://localhost:8000/api/cases',
        json=case
    )
    print(f"Created case: {response.json()['id']}")
```

## Expected Analysis Results

When you upload the sample lab report, the AI should identify:

### Abnormal Values
- **Low Hemoglobin (8.5 g/dL)**: Suggests anemia
- **High WBC (12,500)**: Possible infection or inflammation
- **High Glucose (165 mg/dL)**: Diabetes/hyperglycemia
- **High Creatinine (1.8 mg/dL)**: Kidney dysfunction
- **High Cholesterol**: Cardiovascular risk

### Clinical Significance
The AI should recognize patterns suggesting:
- Chronic kidney disease
- Diabetes mellitus
- Anemia (possibly related to CKD)
- Dyslipidemia
- Possible acute illness (elevated WBC)

### Recommendations
Expected AI suggestions:
- Nephrology consultation
- Diabetes management review
- Anemia workup
- Lipid management
- Infection evaluation

## Performance Testing

Use this data to test:
1. **Case Creation**: All 5 cases should create successfully
2. **File Analysis**: Lab report should be analyzed and interpreted
3. **Search Functionality**: Test various query patterns
4. **Export Features**: Generate PDF reports
5. **Feedback System**: Rate AI performance

## Customization

Feel free to modify the sample data:
- Add more patient cases
- Include different types of lab reports
- Add imaging reports (as text files)
- Create edge cases for testing

This sample data provides a solid foundation for testing all features of the Clinical Insight Assistant application.