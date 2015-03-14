FROM kyma/docker-nginx

RUN rm /etc/nginx/sites-enabled/default
COPY ./website.conf /etc/nginx/sites-enabled/default

ADD dist/ /var/www

CMD 'nginx'