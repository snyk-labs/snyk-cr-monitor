FROM node:13.13-alpine

WORKDIR /app

COPY package.json /app
RUN npm install 
COPY . /app

RUN npm install -g snyk

RUN apk update && apk add wget && rm -rf /var/cache/apk/*
RUN apk add docker

CMD node lib/index.js
