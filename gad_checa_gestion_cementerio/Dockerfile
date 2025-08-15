# Consulte https://aka.ms/customizecontainer para aprender a personalizar su contenedor de depuración y cómo Visual Studio usa este Dockerfile para compilar sus imágenes para una depuración más rápida.

# Esta fase se usa cuando se ejecuta desde VS en modo rápido (valor predeterminado para la configuración de depuración)
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER root
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Instalar dependencias necesarias para QuestPDF y wkhtmltopdf
RUN apt-get update && \
    apt-get install -y wget fontconfig libfreetype6 libx11-6 libxext6 libxrender1 \
    libfontconfig1 libxss1 libgconf-2-4 libnss3 libxrandr2 libasound2 libpangocairo-1.0-0 \
    libatk1.0-0 libcairo-gobject2 libgtk-3-0 libgdk-pixbuf2.0-0 && \
    apt-get install -y wkhtmltopdf && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    which wkhtmltopdf && \
    ls -l $(which wkhtmltopdf)

# Crear directorios necesarios y establecer permisos
RUN mkdir -p /app/keys && \
    mkdir -p /app/wwwroot/Rotativa && \
    mkdir -p /app/wwwroot/documentos && \
    mkdir -p /app/wwwroot/images && \
    mkdir -p /app/data-protection-keys && \
    chmod -R 755 /app/keys && \
    chmod -R 755 /app/wwwroot && \
    chmod -R 777 /app/wwwroot/documentos && \
    chmod -R 755 /app/wwwroot/images && \
    chmod -R 755 /app/data-protection-keys

# Copiar wkhtmltopdf a la carpeta Rotativa
RUN cp $(which wkhtmltopdf) /app/wwwroot/Rotativa/ && \
    chmod +x /app/wwwroot/Rotativa/wkhtmltopdf

# Esta fase se usa para compilar el proyecto de servicio
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release

WORKDIR /src
COPY ["gad_checa_gestion_cementerio/gad_checa_gestion_cementerio.csproj", "gad_checa_gestion_cementerio/"]
RUN dotnet restore "./gad_checa_gestion_cementerio/gad_checa_gestion_cementerio.csproj"
COPY . .

# Verificar y mostrar archivos Excel disponibles
RUN echo "🔍 Verificando archivos Excel disponibles:" && \
    find /src -name "*.xlsx" -type f 2>/dev/null || echo "No se encontraron archivos .xlsx" && \
    ls -la /src/ | grep -E "\.(xlsx|XLSX)" || echo "No hay archivos Excel en /src/"

WORKDIR "/src/gad_checa_gestion_cementerio"
RUN dotnet build "./gad_checa_gestion_cementerio.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Esta fase se usa para publicar el proyecto de servicio que se copiará en la fase final.
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./gad_checa_gestion_cementerio.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Copiar archivo Excel a la carpeta de publicación si existe
RUN echo "🔍 Buscando CATASTRO_FINAL.xlsx para copiar a publish:" && \
    find /src -name "CATASTRO_FINAL.xlsx" -type f -exec cp {} /app/publish/ \; -print || \
    echo "⚠️ CATASTRO_FINAL.xlsx no encontrado para copiar a publish"

# Esta fase se usa en producción o cuando se ejecuta desde VS en modo normal (valor predeterminado cuando no se usa la configuración de depuración)
FROM base AS final
USER root
WORKDIR /app
COPY --from=publish /app/publish .

# Asegurar que los directorios críticos existan y tengan permisos correctos en la imagen final
RUN mkdir -p /app/wwwroot/documentos && \
    mkdir -p /app/wwwroot/images && \
    mkdir -p /app/keys && \
    mkdir -p /app/data-protection-keys && \
    chmod -R 755 /app && \
    chmod -R 777 /app/wwwroot/documentos && \
    chmod -R 755 /app/keys && \
    chmod -R 755 /app/data-protection-keys

# Crear un usuario de aplicación con permisos específicos
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app && \
    chown -R appuser:appuser /app/wwwroot/documentos && \
    echo "Permisos configurados para usuario appuser"

# Verificar configuración antes de cambiar usuario
RUN echo "=== Verificación final de permisos ===" && \
    ls -la /app/wwwroot/ && \
    ls -la /app/wwwroot/documentos/ && \
    echo "=== Fin verificación ==="

USER appuser

ENTRYPOINT ["dotnet", "gad_checa_gestion_cementerio.dll"]