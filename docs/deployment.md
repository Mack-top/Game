# 游戏开发平台部署指南

本文档提供了游戏开发平台前端和后端服务的部署和访问指南。


线下载数据库管理web版本：http://localhost:5173/login
# 同一个端口，用URL 路径区分：
玩家端页面：例如 
http://localhost:5173/home
http://localhost:5173/games

管理端页面：都带有 /admin 前缀，
例如 http://localhost:5173/admin/overview
http://localhost:5173/admin/project/1/assets

导航菜单：在 src/components/layout.tsx 中，我们已经根据 URL 路径动态显示玩家端或管理端的导航菜单，避免了混淆。




## 1. 前端应用

### 1.1 玩家端前端

玩家端前端是用户访问游戏库、个人中心等功能的界面。

*   **访问地址**: `http://localhost:5173` (默认Vite开发服务器端口)
*   **部署说明**:
    1.  进入前端项目根目录：`d:/0_AI_Game/赛博/game-dev-platform`
    2.  安装依赖：`npm install`
    3.  启动开发服务器：`npm run dev`
    4.  构建生产版本：`npm run build` (构建产物在 `dist` 目录)

### 1.2 管理端前端

管理端前端是开发者管理项目、资产、玩法和数据库的界面。

*   **访问地址**: `http://localhost:5173` (默认Vite开发服务器端口)
*   **部署说明**:
    1.  进入前端项目根目录：`d:/0_AI_Game/赛博/game-dev-platform`
    2.  安装依赖：`npm install`
    3.  启动开发服务器：`npm run dev`
    4.  构建生产版本：`npm run build` (构建产物在 `dist` 目录)
    *注意：玩家端和管理端前端目前共享同一个Vite开发服务器和构建产物。通过路由进行区分。*

## 2. 后端服务

后端服务分为玩家端API和管理端API，分别运行在不同的端口。

### 2.1 玩家端后端 API

玩家端后端API提供游戏信息、用户数据等服务。

*   **访问地址**: `http://localhost:3001`
*   **部署说明**:
    1.  进入后端项目目录：`d:/0_AI_Game/赛博/game-dev-platform/server`
    2.  安装依赖：`npm install`
    3.  启动玩家端服务器：`npm run start:player`

### 2.2 管理端后端 API

管理端后端API提供项目、资产、玩法和数据库管理等服务。

*   **访问地址**: `http://localhost:3002`
*   **部署说明**:
    1.  进入后端项目目录：`d:/0_AI_Game/赛博/game-dev-platform/server`
    2.  安装依赖：`npm install`
    3.  启动管理端服务器：`npm run start:admin`

### 2.3 统一启动脚本

可以通过 `server/index.js` 统一启动两个后端服务。

*   **部署说明**:
    1.  进入后端项目目录：`d:/0_AI_Game/赛博/game-dev-platform/server`
    2.  安装依赖：`npm install`
    3.  启动所有后端服务：`node index.js`

## 3. 数据库

项目使用 SQLite 数据库，数据库文件位于 `d:/0_AI_Game/赛博/game-dev-platform/server/platform.db`。无需额外配置数据库服务。

## 4. 注意事项

*   请确保您的系统已安装 Node.js 和 npm。
*   如果端口被占用，请检查并关闭占用该端口的进程，或修改 `server/player-server.js` 和 `server/admin-server.js` 中的端口号。
*   前端和后端服务需要同时运行才能保证应用完整功能。