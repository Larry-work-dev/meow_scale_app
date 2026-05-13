# 階段 1: Build (打包前端資源)
FROM node:20-alpine AS build-stage
WORKDIR /app

# 先複製 package.json 以利用快取
COPY ./web/package*.json ./
RUN npm install
# 關鍵修正：Vite 5+ 需要手動安裝 terser 才能進行壓縮編譯
RUN npm install -D terser

# 複製原始碼並打包
COPY ./web .
RUN npm run build

# 階段 2: Production (Nginx 伺服器)
FROM nginx:alpine
# 複製編譯後的檔案到 Nginx 預設路徑
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
