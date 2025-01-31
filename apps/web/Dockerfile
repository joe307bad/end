FROM nginx:alpine

COPY ./apps/web/default.conf /etc/nginx/conf.d/default.conf
COPY dist/apps/web /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
