FROM node:20.19.4 AS runtime
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
ENV HOST=0.0.0.0
ENV PORT=443
EXPOSE 443
CMD node ./dist/server/entry.mjs