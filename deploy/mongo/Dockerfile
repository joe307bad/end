FROM mongo:7.0.0

ADD deploy/mongo/run.sh /run.sh
ADD deploy/mongo/set_mongodb_password.sh /set_mongodb_password.sh

RUN mkdir -p /var/lib/mongodb

EXPOSE 27017

CMD ["/run.sh"]
