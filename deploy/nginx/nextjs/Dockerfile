FROM node:18-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY dist/apps/site ./

RUN npm install @floating-ui/react --force
RUN npm install @emotion/styled --force
RUN npm install @tamagui/next-plugin --force
RUN npm install --frozen-lockfile --production --force

EXPOSE 3000

CMD ["npm", "start"]
