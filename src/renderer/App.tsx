import { ipcRenderer, DesktopCapturerSource } from 'electron';
import { useEffect, useRef, useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import testOcr from '../../assets/testocr.png';

import './App.css';

function Hello() {
  // const { ipcRenderer } = window as any;
  // useState
  const [snapshot, setSnapshot] = useState<null | string>(null);
  const [snapshotSource, setSnapshotSource] =
    useState<null | DesktopCapturerSource>(null);
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
  useEffect(() => {
    (window as any).ipcRenderer.on(
      'snapshot:availableSources',
      (event: any) => {
        console.log('snapshot:availableSources', event);
        navigator.mediaDevices
          .getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: (event as DesktopCapturerSource[])[0].id,
                minWidth: 1280,
                minHeight: 720,
                maxFrameRate: 1,
              },
            },
          } as any)
          .then((stream) => {
            // eslint-disable-next-line promise/always-return
            if (videoRef?.current != null) {
              videoRef.current.srcObject = stream;
              videoRef.current.play();
              activeStreamRef.current = stream;
            }
          })
          .catch((err) => {
            console.log(err);
          });
      }
    );
    videoRef.current!.addEventListener('loadedmetadata', () => {
      updateCanvasSize();
    });
  }, []);
  const grabAndPreviewFrame = () => {
    if (canvasRef?.current != null && videoRef?.current != null) {
      const context = canvasRef.current.getContext('2d');
      context?.drawImage(
        videoRef.current,
        0,
        0,
        canvasSize.width,
        canvasSize.height
      );
      const dataURL = canvasRef.current.toDataURL('image/png');
      (window as any).ipcRenderer.send('snapshot:save', dataURL);
    }
  };
  return (
    <div>
      <video ref={videoRef} muted />
      <img width="200" alt="icon" src={testOcr} ref={testImageRef} />
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{ backgroundColor: 'red' }}
      />
      <h1>electron-react-boilerplate</h1>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
        }}
      >
        <div>
          {/* <button
            type="button"
            onClick={() => {
              //
              const context = canvasRef.current?.getContext('2d');
              context?.drawImage(testImageRef.current!, 0, 0);
            }}
          >
            drawToCanvas
          </button> */}
        </div>

        <div>
          {/* <button
            type="button"
            onClick={() => {
              (window as any).ipcRenderer.send('snapshot:getSources');
            }}
          >
            Listen To Screen
          </button> */}
        </div>
        <button
          type="button"
          onClick={() => {
            (window as any).ipcRenderer.send('setMostRecentScreenContent');
          }}
        >
          SetScreenContentFromClipboard
        </button>
        <button
          type="button"
          onClick={() => {
            (window as any).ipcRenderer.send('clearChat');
          }}
        >
          Clear Chat
        </button>
        <div style={{ width: '100%' }}>
          <button
            type="button"
            onClick={() => {
              // save canvas image as data url (jpeg format by default)
              grabAndPreviewFrame();
              const data = canvasRef.current?.toDataURL('image/jpeg');
              (window as any).ipcRenderer.send('ocr', data);
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
