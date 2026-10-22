# Container scanning demo: EOL Node 16 on Debian 10 "buster" (EOL) -> many OS-level CVEs
FROM node:16-buster

# Running as root, no USER directive (flagged by IaC/Dockerfile checks)
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .

ENV NODE_ENV=production
# Baked-in secret (fake) in image layer
ENV STRIPE_API_KEY=sk_demo_51HxAcmeFakeKeyDoNotUse000000000000
EXPOSE 3000
CMD ["node", "src/server.js"]
