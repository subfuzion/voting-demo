FROM node:16-alpine

# for healthcheck
RUN apk --no-cache add curl

ARG NODE_ENV
ENV NODE_ENV ${NODE_ENV:-development}

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.* /usr/src/app/
RUN npm install
COPY . /usr/src/app

EXPOSE 8080
ENTRYPOINT [ "node", "server.js" ]
