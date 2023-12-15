FROM node:latest 
WORKDIR /app
RUN apt update && apt install -y ffmpeg
COPY ./package.json ./
RUN npm install
COPY . .
RUN npm run build
CMD [ "npm", "start" ]
EXPOSE 3000
