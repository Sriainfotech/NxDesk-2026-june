import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Provider } from 'react-redux';
import store from './store/store.js';
import App from './App.jsx';
import { BrowserRouter, BrowserRouter as Router } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor } from './store/store';



const container = document.getElementById('root');

const root = createRoot(container);
root.render(
  <BrowserRouter>

    <React.StrictMode>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <App />
        </PersistGate>
      </Provider>
    </React.StrictMode>
  </BrowserRouter>

);

reportWebVitals();