docker build -t restaurant-finder .
docker run --env-file .env -p 443:443 restaurant-finder

