FROM node:18-alpine AS runner

ENV NODE_ENV=production

RUN apk add --no-cache curl jq unzip

WORKDIR /app

RUN curl -s https://api.github.com/repos/joe307bad/end/releases/latest | tee latest_release.json && \
    RELEASE_URL=$(jq -r '.assets[0].browser_download_url' latest_release.json) && \
    curl -L $RELEASE_URL -o end-release.zip

COPY ./dist/apps/site ./

RUN unzip -j -o end-release.zip -d ./public/app

RUN npm install @tamagui/next-plugin --force
RUN npm install --frozen-lockfile --production --force

EXPOSE 3000

CMD ["npm", "start"]
