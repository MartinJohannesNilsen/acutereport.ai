FROM python:3.12-slim

# Set the working directory
WORKDIR /app

# Copy the backend directory into the working directory
COPY src/backend /app

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port FastAPI runs on
EXPOSE 8080

# Command to run the FastAPI application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--reload"]