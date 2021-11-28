FROM node:16-alpine

ARG NODE_ENV
ENV NODE_ENV ${NODE_ENV:-development}

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.* /usr/src/app/
RUN npm install
COPY . /usr/src/app

EXPOSE 3000
ENTRYPOINT [ "node", "server.js" ]
