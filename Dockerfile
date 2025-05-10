FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files (excluding node_modules)
COPY src ./src
COPY public ./public
COPY next.config.js .
COPY tsconfig.json .
COPY postcss.config.mjs .
COPY eslint.config.mjs .

ENV NEXT_PUBLIC_API_URL=http://localhost:8081/api
ENV NODE_ENV=development

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"] 