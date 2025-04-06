# Use official Python image
FROM python:3.9

# Set the working directory
WORKDIR /app

# Copy project files
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the application port
EXPOSE 8000

# Command to run the chatbot API
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
