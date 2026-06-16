FROM python:3.14.2-alpine
WORKDIR /backend

COPY ./backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./backend .
COPY .env .

EXPOSE 5000
CMD ["python", "main.py"]