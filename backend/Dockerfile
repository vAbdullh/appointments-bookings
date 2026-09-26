FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --legacy-peer-deps --fetch-timeout=600000 --fetch-retries=5

COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
