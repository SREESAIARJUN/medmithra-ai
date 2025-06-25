import React from 'react';

const App = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Clinical Insight Assistant</h1>
      <p>Application is loading...</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h2>Debug Information:</h2>
        <p>React is working!</p>
        <p>Current time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default App;
