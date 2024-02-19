FROM docker.io/node:lts-alpine

WORKDIR /nest

COPY ./dist/apps/nest /nest
COPY ./.env /nest
ENV PORT=80
RUN yarn install

CMD [ "node", "main.js" ]
EXPOSE 80
