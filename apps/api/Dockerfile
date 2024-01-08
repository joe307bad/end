FROM docker.io/node:lts-alpine

WORKDIR /api

COPY ./dist/apps/api /api
ENV PORT=80
ENV MONGO_PROD_URL=$MONGO_PROD_URL
ENV MONGO_USER=$MONGO_USER
ENV MONGO_PASSWORD=$MONGO_PASSWORD
RUN yarn install

CMD [ "node", "main.js" ]
EXPOSE 80
