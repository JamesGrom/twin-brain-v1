import { useRef, useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import testOcr from '../../assets/testocr.png';

import './App.css';

function Hello() {
  // const ipcRenderer = (window as any).ipcRenderer;
  // useState
  const [snapshot, setSnapshot] = useState<null | string>(null);
  const [snapshotSource, setSnapshotSource] =
    useState<null | Electron.DesktopCapturerSource>(null);
  // useRef
  const testImageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<null | HTMLVideoElement>(null);
  const activeStreamRef = useRef<null | MediaStream>(null);
  const [canvasSize, setCanvasSize] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });
  const updateCanvasSize = () => {
    if (canvasRef?.current != null && videoRef?.current != null) {
      // set canvas size to video size
      setCanvasSize({
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      });
    }
  };
  return (
    <div>
      <div>
        <video ref={videoRef} muted />
      </div>
      <div className="Hello">
        <img width="200" alt="icon" src={testOcr} ref={testImageRef} />
        <canvas width="200" ref={canvasRef} />
      </div>
      <h1>electron-react-boilerplate</h1>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
        }}
      >
        <div>
          <button
            type="button"
            onClick={() => {
              //
              const context = canvasRef.current?.getContext('2d');
              context?.drawImage(testImageRef.current!, 0, 0);
            }}
          >
            drawToCanvas
          </button>
        </div>

        <div>
          <button
            type="button"
            onClick={() => {
              (window as any).electron.ipcRenderer.sendMessage(
                'snapshot:getSources'
              );
            }}
          >
            Listen To Screen
          </button>
        </div>

        <div style={{ width: '100%' }}>
          <button
            type="button"
            onClick={() => {
              // save canvas image as data url (jpeg format by default)
              const data = canvasRef.current?.toDataURL('image/jpeg');
              (window as any).electron.ipcRenderer.sendMessage('ocr', data);
            }}
          >
            Run OCR
          </button>
        </div>
      </div>
      {/* <div className="Hello"></div> */}
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
