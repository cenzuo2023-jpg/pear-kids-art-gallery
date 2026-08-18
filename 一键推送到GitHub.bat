@echo off
chcp 65001 >nul
title 🍐 想吃梨儿童艺术启蒙 · GitHub 自动推送与部署同步

:: 自动注入便携版 Git 路径
set "PATH=C:\Users\xiang\.gemini\antigravity\mingit\cmd;C:\Users\xiang\.gemini\antigravity\mingit\bin;%PATH%"

echo ========================================================
echo   🍐 正在将最新代码推送到 GitHub 并触发 Netlify 自动上线...
echo ========================================================
echo.

git config user.name "cenzuo2023-jpg" >nul 2>&1
git config user.email "cenzuo2023@gmail.com" >nul 2>&1

git init
git branch -M main
git remote remove origin >nul 2>&1
git remote add origin https://github.com/cenzuo2023-jpg/pear-kids-art-gallery.git
git add .
git commit -m "feat: 完善后台小艺术家名人堂管理、作品档案库编辑功能与数据同步机制" >nul 2>&1

echo 🚀 正在推送到 GitHub，如弹出浏览器登录窗口，请点击授权登录...
git push -u origin main --force

echo.
echo ========================================================
echo   🎉 推送成功！Netlify 正在后台自动完成全球上线！
echo ========================================================
pause
