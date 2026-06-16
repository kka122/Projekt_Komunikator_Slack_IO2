# Szponcik - Slack like communication platform

Szponcik is a Slack-like communication platform designed to facilitate team collaboration and communication.
It provides features such as channels, direct messaging, file sharing, and more, all within a user-friendly interface.

## How to run

Make sure you have [Docker](https://www.docker.com/) installed on your machine.

Create a `.env` file in the root directory of the project with the following content:

```env
GOOGLE_AUTH_CLIENT_ID=[your_google_auth_client_id]
STRIPE_PUBLISHABLE_KEY=[your_stripe_publishable_key]
STRIPE_SECRET_KEY=[your_stripe_secret_key]
JWT_SECRET_KEY=[your_jwt_secret_key]
```

### Production

To run the application in production mode, use the following command:

```bash
docker compose up --build -d
```

App will be available at http://localhost:8080/.

Generated documentation will be available at http://localhost:8081/.

### Development

To run Kafka and PostgreSQL, use the following command:

```bash
docker compose -f compose.db.yml up --build -d
```

Then for backend open a new terminal for /backend directory and run:

```bash
# to install dependencies
pip install -r requirements.txt
```

```bash
# to run the application
./run.sh
```

For frontend, open a new terminal for /app directory and run:

```bash 
# to install dependencies
npm install
```

```bash
# to run the application
npm run dev
```

App will be available at http://localhost:5173/.

## Tech stack

### Frontend:

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Vitest](https://vitest.dev/)

### Backend:

- [Python](https://www.python.org/)
- [Flask](https://flask.palletsprojects.com/)
- [SQLAlchemy](https://www.sqlalchemy.org/)
- [Pytest](https://docs.pytest.org/)

### API specification:

- [OpenAPI](https://www.openapis.org/)
- [Orval](https://orval.dev/)

### Database:

- [PostgreSQL](https://www.postgresql.org/)

### Deployment:

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Nginx](https://www.nginx.com/)
- [Gunicorn](https://gunicorn.org/)
- [GitHub Actions](https://github.com/features/actions)

## More information

Information about the project parts can be found in the following
readme files:

- [Frontend](./app/README.md)
- [Backend](./backend/README.md)
- [Database](./backend/db/README.md)