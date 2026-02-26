FROM node:24-alpine

#set the working directory
WORKDIR /app
# Copy project for build
COPY . /app
# Update apk index and install latest CA certificates
RUN apk update && apk add --no-cache ca-certificates && update-ca-certificates
#npm setup
RUN npm install -g pnpm
RUN pnpm i
RUN pnpm build
#Define the env variable for port(default is 5000)
ENV port=5000
#Expose application port
EXPOSE ${port}
#Start the application
CMD ["pnpm", "exec", "tsx", "server/index.ts"]