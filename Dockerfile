FROM node:20-alpine
WORKDIR /app

# Bağımlılıkları yükle
COPY package*.json ./
RUN npm install --production

# Tüm proje dosyalarını kopyala
COPY . .

# Port ve Çalıştırma Komutu
EXPOSE 3000
CMD ["node", "server.js"]