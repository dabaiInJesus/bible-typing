import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null

async function createWindow() {
  console.log('Creating window...')
  console.log('__dirname:', __dirname)
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true, // 自动隐藏菜单栏
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // 加载应用 - 开发模式使用 Vite 服务器
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
  
  if (isDev) {
    // 等待 Vite 服务器启动
    const url = 'http://localhost:5173'
    console.log('Loading dev URL:', url)
    
    // 尝试多个可能的端口
    const ports = [5173, 5174, 5175]
    let loaded = false
    
    for (const port of ports) {
      try {
        const testUrl = `http://localhost:${port}`
        await mainWindow.loadURL(testUrl)
        console.log('Successfully loaded:', testUrl)
        loaded = true
        break
      } catch (error) {
        console.log(`Failed to load http://localhost:${port}, trying next port...`)
      }
    }
    
    if (!loaded) {
      console.error('Failed to load any development server')
      mainWindow.loadURL(url)
    }
    
    // 开发模式下自动打开开发者工具（已禁用）
    // mainWindow.webContents.openDevTools()
  } else {
    const filePath = path.join(__dirname, '../dist/index.html')
    console.log('Loading file:', filePath)
    mainWindow.loadFile(filePath)
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
  
  // 添加快捷键支持
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // F12 或 Ctrl+Shift+I 打开/关闭开发者工具
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      if (mainWindow?.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools()
      } else {
        mainWindow?.webContents.openDevTools()
      }
      event.preventDefault()
    }
  })
  
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
  })
}

app.whenReady().then(() => {
  console.log('App is ready')
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  console.log('All windows closed')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('quit', () => {
  console.log('App quit')
})

// IPC 处理：加载圣经数据文件内容
ipcMain.handle('load-bible-data', async (event, filename: string) => {
  try {
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
    let filePath: string
    
    if (isDev) {
      // 开发模式：从 src/assets 目录读取
      const projectRoot = path.join(__dirname, '..')
      filePath = path.join(projectRoot, 'src/assets/bible-data', filename)
      console.log('Dev mode bible data path:', filePath)
    } else {
      // 生产模式：尝试多个可能的路径
      const exeDir = path.dirname(app.getPath('exe'))
      const appPath = app.getAppPath()
      
      console.log('=== Bible Data Path Debug ===')
      console.log('exeDir:', exeDir)
      console.log('appPath:', appPath)
      console.log('isPackaged:', app.isPackaged)
      
      // 路径1: resources/bible-data/ (extraResources 直接解压的位置)
      const resourcesPath = path.join(exeDir, 'resources', 'bible-data', filename)
      console.log('Checking resources path:', resourcesPath)
      
      // 路径2: app.asar.unpacked/bible-data/
      const unpackedPath = path.join(exeDir, 'resources', 'app.asar.unpacked', 'bible-data', filename)
      console.log('Checking unpacked path:', unpackedPath)
      
      // 路径3: 直接在 appPath 下（某些打包方式）
      const directPath = path.join(appPath, 'bible-data', filename)
      console.log('Checking direct path:', directPath)
      
      // 检查哪个路径存在
      if (fs.existsSync(resourcesPath)) {
        filePath = resourcesPath
        console.log('✓ Using resources path')
      } else if (fs.existsSync(unpackedPath)) {
        filePath = unpackedPath
        console.log('✓ Using unpacked path')
      } else if (fs.existsSync(directPath)) {
        filePath = directPath
        console.log('✓ Using direct path')
      } else {
        // 列出 resources 目录内容以便调试
        const resourcesDir = path.join(exeDir, 'resources')
        if (fs.existsSync(resourcesDir)) {
          const files = fs.readdirSync(resourcesDir)
          console.log('Files in resources dir:', files)
        }
        throw new Error(`File not found. Tried:\n1. ${resourcesPath}\n2. ${unpackedPath}\n3. ${directPath}`)
      }
    }
    
    // 再次确认文件存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`)
    }
    
    // 读取文件内容
    console.log('Reading file:', filePath)
    const stats = fs.statSync(filePath)
    console.log('File size:', stats.size, 'bytes')
    
    const content = fs.readFileSync(filePath, 'utf-8')
    console.log('Content length:', content.length, 'characters')
    
    const data = JSON.parse(content)
    console.log('✓ Successfully loaded Bible data')
    console.log('Version:', data.version)
    console.log('Total books:', data.totalBooks)
    console.log('=========================')
    
    return data
  } catch (error) {
    console.error('✗ Failed to load Bible data:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    throw error
  }
})
