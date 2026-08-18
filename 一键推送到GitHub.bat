@echo off
chcp 65001 >nul
title 🍐 想吃梨儿童艺术启蒙 · GitHub 自动推送与部署同步
echo ========================================================
echo   🍐 正在将最新代码推送到 GitHub 并触发 Netlify 自动上线...
echo ========================================================
echo.

git init
git branch -M main
git remote remove origin >nul 2>&1
git remote add origin https://github.com/cenzuo2023-jpg/pear-kids-art-gallery.git
git add .
git commit -m "update: 🍐 想吃梨儿童艺术启蒙全栈系统更新 (%date% %time%)"
git push -u origin main

echo.
echo ========================================================
echo   🎉 推送成功！Netlify 正在后台自动完成全球上线！
echo ========================================================
pause
