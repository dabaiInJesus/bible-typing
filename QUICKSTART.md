# 快速开始指南

## 前置要求

- Node.js 18+ 
- npm 或 yarn

## 安装步骤

### 1. 安装依赖

```bash
npm install
```

这将安装所有必要的依赖,包括:
- Vue 3
- Electron
- TailwindCSS
- TypeScript
- Vite 及相关插件

### 2. 开发模式运行

```bash
npm run electron:dev
```

这会同时启动:
- Vite 开发服务器 (http://localhost:5173)
- Electron 应用窗口

应用会自动打开并显示主界面。

### 3. 构建生产版本

```bash
npm run electron:build
```

构建完成后,可执行文件位于 `dist-electron` 目录:
- Windows: `dist-electron/Bible Typing Setup x.x.x.exe`

## 常见问题

### Q: 安装依赖时出错?

A: 尝试清除缓存后重新安装:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Q: 开发模式无法启动?

A: 确保端口 5173 未被占用,或检查控制台错误信息。

### Q: 圣经数据加载失败?

A: 确保 `public/bible-data/` 目录下存在 `bible-zh.json` 和 `bible-en.json` 文件。

### Q: 如何切换语言?

A: 目前默认使用中文圣经。如需使用英文,可以修改 `src/main.ts` 中的语言参数。

## 功能演示

### 阅读模式
1. 左侧选择书卷(如:创世记)
2. 顶部选择章节(如:第1章)
3. 查看经文内容
4. 如果有抄录进度,会显示进度条

### 打字练习模式
1. 切换到"打字练习"标签
2. 选择要练习的经节
3. 在输入框中输入经文
4. 实时查看:
   - 绿色: 正确的字符
   - 红色: 错误的字符
   - 灰色: 未输入的字符
5. 完成后显示准确率和完成状态
6. 可以点击"下一节"继续练习

### 查看统计
在侧边栏底部可以看到:
- 总练习经节数
- 已完成经节数
- 平均准确率
- 清除所有进度按钮

## 数据备份

所有进度数据保存在 localStorage 中,位置取决于操作系统:

**Windows:**
```
C:\Users\[用户名]\AppData\Roaming\bible-typing\Local Storage\
```

如需备份,可以导出 localStorage 数据。

## 自定义配置

### 修改窗口大小

编辑 `electron/main.ts`:
```typescript
mainWindow = new BrowserWindow({
  width: 1200,  // 修改宽度
  height: 800,  // 修改高度
  ...
})
```

### 修改主题颜色

编辑 `tailwind.config.js`,添加自定义颜色:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#aa3bff',
      // ...
    }
  }
}
```

## 技术支持

如有问题,请查看:
- Vue 3 文档: https://vuejs.org/
- Electron 文档: https://www.electronjs.org/
- TailwindCSS 文档: https://tailwindcss.com/
