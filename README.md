# Szponcik - Slack like communication platform

Szponcik is a Slack-like communication platform designed to facilitate team collaboration and communication.
It provides features such as channels, direct messaging, file sharing, and more, all within a user-friendly interface.

## How to run

Make sure you have [Docker](https://www.docker.com/) installed on your machine.

Create a `.env` file in the `/app` directory with the
following content:

```env
VITE_GOOGLE_CLIENT_ID=[your_google_client_id]
```

Then open terminal, in the root directory of the project.

Run the production version of the application:

```bash
docker compose -f compose.yml -f compose.prod.yml up --build
```

Or run the development version of the application:

```bash
docker compose -f compose.yml -f compose.dev.yml up --build
```

After docker finishes building the images and starting the containers,
you can access the application by navigating to `http://localhost:8080`
for the production version or `http://localhost:5173` for the development
version in your web browser.

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
- [AsyncAPI](https://www.asyncapi.com/)

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