FROM node:16-alpine

WORKDIR /app
COPY . /app

RUN npm i

ENTRYPOINT [ "npm", "start" ]