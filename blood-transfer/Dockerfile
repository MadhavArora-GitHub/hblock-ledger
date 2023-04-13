FROM node:16

WORKDIR /usr/src/app

COPY . /usr/src/app
COPY docker/entrypoint.sh /usr/src/app/entrypoint.sh
RUN npm install && chmod +x entrypoint.sh

EXPOSE 9999

ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
