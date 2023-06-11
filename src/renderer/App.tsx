import { useRef } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import testOcr from '../../assets/testocr.png';

import './App.css';

function Hello() {
  const testImageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  return (
    <div>
      <div className="Hello">
        <img width="200" alt="icon" src={testOcr} ref={testImageRef} />
        <canvas width="200" ref={canvasRef}></canvas>
      </div>
      <h1>electron-react-boilerplate</h1>
      <div className="Hello">
        <button
          onClick={() => {
            //
            const context = canvasRef.current?.getContext('2d');
            context?.drawImage(testImageRef.current!, 0, 0);
          }}
        >
          drawToCanvas
        </button>
        <button
          onClick={() => {
            // const data = testImageRef.current?.toDataURL();
            // save canvas image as data url (jpeg format by default)
            const data = canvasRef.current?.toDataURL('image/jpeg');
            console.log(data);

            (window as any).electron.ipcRenderer.sendMessage('ocr', data);
          }}
        >
          Run OCR
        </button>
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
