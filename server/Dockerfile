FROM python:3.11-alpine
WORKDIR /app
COPY . /app
RUN mkdir -p data public && pip install --no-cache-dir -r requirements.txt
EXPOSE 8080
ENV PORT=8080
CMD ["python3", "server.py"]
