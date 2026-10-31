# ==========================================
# ISRO CMS — Database Dockerfile (Rocky Linux 9 + MySQL 8.0)
# ==========================================
FROM rockylinux:9

# Install MySQL 8.0 server from standard Rocky Linux 9 AppStream repository
RUN dnf install -y mysql-server && \
    dnf clean all

# Copy database initialization entrypoint script
COPY entrypoint.sh /entrypoint.sh

# Normalize CRLF line endings (safeguard for Windows hosts) and make executable
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

# MySQL default port
EXPOSE 3306

VOLUME ["/var/lib/mysql"]

ENTRYPOINT ["/entrypoint.sh"]

CMD ["--character-set-server=utf8mb4", "--collation-server=utf8mb4_unicode_ci", "--sql_mode=STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION", "--bind-address=0.0.0.0"]
