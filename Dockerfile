FROM kyma/docker-nginx

RUN rm /etc/nginx/sites-enabled/default
ADD website.conf /etc/nginx/sites-enabled/default

ADD dist/ /var/www

CMD 'nginx'