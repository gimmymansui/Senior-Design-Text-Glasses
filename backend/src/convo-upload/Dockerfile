
FROM python:3.12

# Set the working directory
WORKDIR /app
# Copy files
COPY requirements.txt requirements.txt
COPY main.py main.py
# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt
# Expose FastAPI port
EXPOSE 8080
# Run FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
