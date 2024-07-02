FROM mongo:4.2.6

ENV AUTH yes
ENV STORAGE_ENGINE wiredTiger
ENV JOURNALING yes

ADD deploy/mongo/run.sh /run.sh
ADD deploy/mongo/set_mongodb_password.sh /set_mongodb_password.sh
COPY deploy/mongo/mongod.conf /etc/mongod.conf

RUN mkdir -p /var/lib/mongodb

EXPOSE 27017

CMD ["/run.sh"]
