FROM node:22-alpine
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN mkdir -p public
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3003
ENV HOSTNAME="0.0.0.0"
EXPOSE 3003

CMD ["npm", "start"]
