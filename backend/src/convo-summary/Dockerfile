FROM python:3.12

WORKDIR /app
COPY requirements.txt .
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py main.py
RUN export TF_ENABLE_ONEDNN_OPTS=0
ENV CUDA_VISIBLE_DEVICES=-1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
