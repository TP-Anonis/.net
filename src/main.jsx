import React from 'react';
import ReactDOM from 'react-dom/client'; // Import từ react-dom/client cho React 18/19
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
const root = ReactDOM.createRoot(document.getElementById('root')); // Sửa lỗi chính tả
root.render(

  <React.StrictMode>
    <App />
  </React.StrictMode>
)
  