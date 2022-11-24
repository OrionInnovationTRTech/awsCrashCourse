FROM node:16-alpine

RUN apk update && apk add curl zip groff jq bc

RUN apk add bash
RUN apk add --no-cache aws-cli

RUN npm i -g typescript
RUN npm i -g aws-cdk
RUN npm i -g aws-cdk-lib
RUN npm i -g esbuild