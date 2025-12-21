const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const fs = require("fs").promises;
const path = require("path");

// Store file paths for different storage locations
let filePaths = {
  tasks: null,
  taskNotes: null
};

// Load saved file paths from storage if they exist
const userDataPath = app.getPath('userData');
const filePathsPath = path.join(userDataPath, 'file-paths.json');

async function loadFilePaths() {
  try {
    const data = await fs.readFile(filePathsPath, 'utf8');
    filePaths = JSON.parse(data);
  } catch (error) {
    filePaths = {
      tasks: null,
      taskNotes: null
    };
  }
}

async function saveFilePaths() {
  try {
    await fs.writeFile(filePathsPath, JSON.stringify(filePaths, null, 2));
  } catch (error) {
    console.error('Failed to save file paths:', error);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    },
  });

  win.loadFile("index.html");

  // Set up IPC handlers for file operations
  ipcMain.handle('save-file', async (event, data, defaultPath = 'tasks.json', storageKey = 'tasks') => {
    try {
      let filePath = filePaths[storageKey];

      // If no file path exists, show save dialog
      if (!filePath) {
        const result = await dialog.showSaveDialog(win, {
          defaultPath,
          filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });

        if (result.canceled) {
          return { success: false, canceled: true };
        }

        filePath = result.filePath;
        filePaths[storageKey] = filePath; // Remember the path
        await saveFilePaths(); // Persist the path
      }

      // Add small delay to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 10));
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      await new Promise(resolve => setTimeout(resolve, 10));
      return { success: true, filePath };
    } catch (error) {
      console.error(`Error saving ${storageKey}:`, error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('load-file', async (event, storageKey = 'tasks') => {
    try {
      let filePath = filePaths[storageKey];

      // If no file path exists, try to find tasks.json in current directory first
      if (!filePath) {
        const defaultFilePath = path.join(process.cwd(), 'tasks.json');
        try {
          await fs.access(defaultFilePath);
          filePath = defaultFilePath;
          filePaths[storageKey] = filePath; // Remember the path
          await saveFilePaths(); // Persist the path

        } catch (accessError) {
          // File doesn't exist, proceed to show dialog
        }
      }



      // If still no file path, show open dialog
      if (!filePath) {
        const result = await dialog.showOpenDialog(win, {
          filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
          ],
          properties: ['openFile']
        });

        if (result.canceled) {
          return { success: false, canceled: true };
        }

        filePath = result.filePaths[0];
        filePaths[storageKey] = filePath; // Remember the path
        await saveFilePaths(); // Persist the path
      }

      const content = await fs.readFile(filePath, 'utf8');

      // Handle empty or invalid JSON files
      if (!content || !content.trim()) {
        console.log(`📂 FILE READ: Empty file, returning [] from ${filePath}`);
        return { success: true, data: [], filePath };
      }

      let data;
      try {
        data = JSON.parse(content);
        if (!Array.isArray(data)) {
          console.log(`📂 FILE READ: Data is not array, resetting to [] from ${filePath}`);
          data = [];
        }
      } catch (parseError) {
        console.log(`📂 FILE READ: Parse error, returning [] from ${filePath}: ${parseError.message}`);
        data = [];
      }

      return { success: true, data, filePath };
    } catch (error) {
      console.error(`Error loading ${storageKey}:`, error);
      return { success: false, error: error.message };
    }
  });
}

app.whenReady().then(async () => {
  await loadFilePaths();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
