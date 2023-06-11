/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import {
  Configuration,
  OpenAIApi,
  CreateChatCompletionResponseChoicesInner,
} from 'openai';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  desktopCapturer,
  clipboard,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import Tesseract from 'tesseract.js';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

const config = new Configuration({
  organization: 'org-tZlICar1huZLXg3CUp5twh0C',
  apiKey: '',
});
const openAi = new OpenAIApi(config);

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
ipcMain.on('ocr', (event, data: any) => {
  Tesseract.recognize(data, 'eng')
    .then(({ data: { text } }) => {
      console.log('-------new-snapshot-----');
      console.log(text);
      // event.reply('ocr', text);
    })
    .catch((err) => {
      console.log('err from ocr', err);
      event.reply('ocr', err);
    });
});
ipcMain.on('snapshot:getSources', () => {
  desktopCapturer
    .getSources({ types: ['screen'] })
    .then((sources) => {
      // console.log('sources', sources);
      mainWindow?.webContents?.send('snapshot:availableSources', sources);
    })
    .catch((err) => {
      console.log('err from snapshot:getSources', err);
    });
});

let messages: CreateChatCompletionResponseChoicesInner['message'][] = [];
let mostRecentScreenContent: string | null = null;
ipcMain.on('clearChat', () => {
  messages = [];
});

const distpatchScreenContentToGPT = () => {
  const newMessage: CreateChatCompletionResponseChoicesInner['message'] = {
    role: 'user',
    content: `The following content is displayed on the user's screen: \n ${mostRecentScreenContent}`,
  };
  messages.push(newMessage);
  openAi
    .createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: messages as any,
    })
    .then((response) => {
      if (response.data.choices[0].message != null) {
        console.log(
          `responseFrom GPT - ${response.data.choices[0].message?.content}`
        );
        messages.push(response.data.choices[0].message);
      }
    })
    .catch((err) => {
      console.log('error from chatGPT', err);
    });
};
ipcMain.on('setMostRecentScreenContent', () => {
  mostRecentScreenContent = clipboard.readText();
  distpatchScreenContentToGPT();
});
app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
