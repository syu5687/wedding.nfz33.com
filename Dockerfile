FROM php:8.1-apache

ENV PORT=8080
ENV APACHE_RUN_USER=www-data
ENV APACHE_RUN_GROUP=www-data

# Apache modules
RUN a2enmod rewrite headers expires deflate

# Listen port を 8080 に変更
COPY apache/ports.conf /etc/apache2/ports.conf
COPY apache/000-default.conf /etc/apache2/sites-enabled/000-default.conf

# Document root のセットアップ
COPY public/ /var/www/html/

# 権限調整
RUN chown -R www-data:www-data /var/www/html \
    && find /var/www/html -type d -exec chmod 755 {} \; \
    && find /var/www/html -type f -exec chmod 644 {} \;

EXPOSE 8080

CMD ["apache2-foreground"]
