# DevOps-Powered Chatbot

This project implements an AI-driven chatbot using DevOps best practices. It features:

- A FastAPI-based chatbot API integrated with OpenAI.
- Containerization with Docker.
- Orchestration and auto-scaling using Kubernetes.
- Infrastructure as Code using Terraform.
- CI/CD automation with GitHub Actions.
- Monitoring, logging, and alerting using Prometheus, Grafana, and ELK.
- Load testing with K6.

## Getting Started

### Running Locally
1. Navigate to the **src/** folder.
2. Install dependencies:
```bash
pip install -r requirements.txt
```
3. Run the API:
```bash
uvicorn main:app --reload
```

### Docker
Build and run the Docker container:
```bash
docker build -t chatbot-api ./src
docker run -d -p 8000:8000 chatbot-api
```

### Kubernetes Deployment
Apply the manifests in the **k8s/** folder:
```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

### Infrastructure Deployment
In the **infra/** folder, initialize and apply Terraform:
```bash
terraform init
terraform apply -auto-approve
```

### CI/CD
The GitHub Actions workflow in **ci-cd/** will run on pushes to the main branch, building and deploying the chatbot.

### Monitoring & Load Testing
- Deploy monitoring manifests from the **monitoring/** folder.
- Run load tests with:
```bash
k6 run load-testing/load-test.js
```

---

This project encapsulates all the implementations into a unified, version-controlled project folder. You can adjust configurations (such as Docker Hub usernames, AWS AMIs, and webhook URLs) to suit your environment.
