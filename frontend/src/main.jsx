import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import Portal from './Portal.jsx';

const path = window.location.pathname;
const isPortal = path.startsWith('/portal/');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isPortal ? <Portal /> : <App />}
  </React.StrictMode>
);
