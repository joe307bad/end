FROM node:18-alpine AS runner

ENV NODE_ENV=production

RUN apk add --no-cache curl jq unzip

WORKDIR /app

RUN curl -s https://api.github.com/repos/joe307bad/end/releases/latest | tee latest_release.json && \
    RELEASE_URL=$(jq -r '.assets[0].browser_download_url' latest_release.json) && \
    END_COMMIT_SHA=$(jq -r '.target_commitish' latest_release.json) && \
    END_VERSION=$(jq -r '.name' latest_release.json) && \
    curl -L $RELEASE_URL -o end-release.zip && \
    echo "END_COMMIT_SHA=$END_COMMIT_SHA" && \
    echo "END_VERSION=$END_VERSION"

COPY ./dist/apps/site ./
RUN unzip end-release.zip -d ./public/app

RUN npm install @tamagui/next-plugin
RUN npm install --frozen-lockfile --production

ARG END_COMMIT_SHA
ARG END_VERSION
ENV END_COMMIT_SHA=${END_COMMIT_SHA}
ENV END_VERSION=${END_VERSION}

EXPOSE 3000

CMD ["npm", "start"]
