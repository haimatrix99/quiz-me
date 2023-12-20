FROM node:20.9.0

ARG PUBLIC_URL
ENV PUBLIC_URL=$PUBLIC_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
ARG UPLOADTHING_SECRET
ENV UPLOADTHING_SECRET=$UPLOADTHING_SECRET
ARG UPLOADTHING_APP_ID
ENV UPLOADTHING_APP_ID=$UPLOADTHING_APP_ID
ARG OPENAI_API_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ARG STRIPE_API_KEY
ENV STRIPE_API_KEY=$STRIPE_API_KEY
ARG STRIPE_WEBHOOK_SECRET
ENV STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
ARG STRIPE_PRICE_ID
ENV STRIPE_PRICE_ID=$STRIPE_PRICE_ID
ARG DEEPGRAM_API_KEY
ENV DEEPGRAM_API_KEY=$DEEPGRAM_API_KEY

WORKDIR /app
RUN apt update && apt install -y ffmpeg wget
RUN wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy
RUN chmod +x cloud_sql_proxy
COPY . ./
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["sh", "-c", "./cloud_sql_proxy -instances=website-404701:asia-southeast1:quiz-me=tcp:0.0.0.0:3306 & npm start"]
