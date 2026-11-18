# ============================================================
# Frontend Gym-Reservas: HTML + CSS + JS servido por Nginx
# Imagen independiente: el backend se configura por variables de entorno
# ============================================================
FROM nginx:1.27-alpine

# Valores por defecto (se pueden cambiar con -e o en el compose)
ENV API_HOST=gym-api \
    API_PORT=8080

# Plantilla de configuración: nginx la procesa con envsubst al arrancar
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Archivos estáticos
COPY index.html styles.css app.js /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
