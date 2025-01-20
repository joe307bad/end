FROM node:18-alpine AS runner

ENV NODE_ENV=production

RUN apk add --no-cache curl jq unzip

WORKDIR /app

RUN curl -s https://api.github.com/repos/joe307bad/end/releases/latest | \
    jq -r '.assets[0].browser_download_url' | \
    xargs curl -L -o end-release.zip

COPY ./dist/apps/site ./
RUN unzip end-release.zip -d ./public/app

RUN npm install @tamagui/next-plugin
RUN npm install --frozen-lockfile --production

EXPOSE 3000

CMD ["npm", "start"]
