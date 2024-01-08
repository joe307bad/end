FROM docker.io/node:lts-alpine

WORKDIR /api

COPY ./dist/apps/api /api
COPY ./.env /api
ENV PORT=80
RUN yarn install

CMD [ "node", "main.js" ]
EXPOSE 80
