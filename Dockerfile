# OWASP Juice Shop - An intentionally insecure JavaScript Web Application
FROM            node:8-alpine
MAINTAINER      Bjoern Kimminich <bjoern.kimminich@owasp.org>

RUN apk update && apk add git

COPY . /juice-shop
WORKDIR /juice-shop
RUN npm install --production --unsafe-perm

FROM    node:8-alpine
ARG BUILD_DATE
ARG VCS_REF
LABEL shop.owasp-juice.version = "6.2.0-SNAPSHOT" \
      org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.vcs-url="https://github.com/bkimminich/juice-shop.git" \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.schema-version="1.0.0-rc1"
WORKDIR /juice-shop
COPY --from=0 /juice-shop .
EXPOSE  3000
CMD ["npm", "start"]