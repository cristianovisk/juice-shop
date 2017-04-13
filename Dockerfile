# OWASP Juice Shop - An intentionally insecure Javascript Web Application
FROM            node:6
MAINTAINER      Bjoern Kimminich <bjoern.kimminich@owasp.org>
LABEL version = "2.26.0-SNAPSHOT"

COPY . /juice-shop
WORKDIR /juice-shop

RUN npm install --production --unsafe-perm

EXPOSE  3000
CMD ["npm", "start"]
