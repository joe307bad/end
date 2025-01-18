FROM node:18-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

COPY ./dist/apps/site ./
COPY ./dist/apps/web ./public/app

RUN npm install --frozen-lockfile --production

EXPOSE 3000

CMD ["npm", "start"]
