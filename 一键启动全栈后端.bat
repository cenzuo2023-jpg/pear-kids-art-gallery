@echo off
chcp 65001 >nul
title 🍐 想吃梨儿童艺术启蒙 · 全栈服务启动器
echo ========================================================
echo   🍐 想吃梨儿童艺术启蒙 · 正在启动全栈后端服务与数据库...
echo ========================================================
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] 正在使用默认环境运行...
)

echo [1/2] 正在启动后端服务 (端口: 3000)...
start http://localhost:3000
node local-server/server.js

pause
