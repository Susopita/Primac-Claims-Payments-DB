FROM python:3.11-slim
WORKDIR /app
COPY seed.py .
RUN pip install cassandra-driver faker tqdm
CMD ["python", "seed.py"]
