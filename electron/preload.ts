import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  // 加载圣经数据
  loadBibleData: (filename: string) => {
    return ipcRenderer.invoke('load-bible-data', filename)
  }
})
