FROM node:20-alpine

# On installe explicitement pnpm globalement dans le conteneur Linux
RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Le volume node_modules est séparé du code monté depuis l’hôte.
CMD pnpm install --frozen-lockfile && pnpm exec vite --host 0.0.0.0 --port 3000
