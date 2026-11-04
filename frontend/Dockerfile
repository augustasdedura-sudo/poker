# Single-stage build: install, build, then serve with `next start`.
FROM node:20-alpine

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies first for better layer caching. `npm install` (not `npm ci`)
# re-resolves platform-specific optional deps, which keeps the image build robust.
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Application source (node_modules/.next excluded via .dockerignore).
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
