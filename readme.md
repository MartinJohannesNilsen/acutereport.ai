# AcuteReport.ai

An AI-driven solution for generating acute medical reports. This repository contains the React.js Vite application, backend API, and deployment configurations.



## Tech Stack 🛠️

- **Frontene**: React.js Vite
- **Backend**: FastAPI
- **AI/ML**: vLLM running LLama3.3
- **Database**: MongoDB
- **Deployment**: Docker Compose



## Deployment 🚀

All services are containerized with Docker, and can simply be run with the following command:

```
docker compose up -d
```

The application is served on port `:4173`, and FastAPI is available on port `:8080` with a Swagger Ui available at `/docs`.

