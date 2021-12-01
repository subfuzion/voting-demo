#
# This Dockerfile is only here to support running tests for the Database package.
#
FROM node:16-alpine

ARG NODE_ENV
ENV NODE_ENV ${NODE_ENV:-development}

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.* ./
RUN npm install
COPY . ./

CMD [ "npm", "test" ]
