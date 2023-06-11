import { useRef } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import testOcr from '../../assets/testocr.png';

import './App.css';

function Hello() {
  const testImageRef = useRef<HTMLImageElement | null>(null);
  return (
    <div>
      <div className="Hello">
        <img width="200" alt="icon" src={testOcr} ref={testImageRef} />
      </div>
      <h1>electron-react-boilerplate</h1>
      <div className="Hello">
        {/* <button
          onClick={() => {
            // const data = testImageRef.current?.toDataURL();

            (window as any).electron.ipcRenderer.sendMessage(
              'ocr',
              `${testOcr}`
            );
          }}
        >
          Run OCR
        </button> */}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
