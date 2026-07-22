FROM python:3.11-alpine
WORKDIR /app
COPY index.html styles.css app.js ./
EXPOSE 8080
CMD ["python", "-m", "http.server", "8080"]
