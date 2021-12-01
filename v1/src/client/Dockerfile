FROM node:14.17.5-alpine3.14

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app

ENTRYPOINT [ "node", "main.js" ]