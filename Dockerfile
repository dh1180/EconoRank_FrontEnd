FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG API_BASE_URL=http://backend:8080
ARG SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_GA_ID=
ENV API_BASE_URL=$API_BASE_URL SITE_URL=$SITE_URL NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID NEXT_TELEMETRY_DISABLED=1 NEXT_STANDALONE=true
RUN npm run build
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node","server.js"]
