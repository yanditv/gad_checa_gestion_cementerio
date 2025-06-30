#!/bin/bash

# Script para verificar permisos en el contenedor Docker
# Este script se puede ejecutar dentro del contenedor para verificar configuraciones

echo "=== Verificación de Permisos en Contenedor ==="

# Verificar directorios críticos
DIRECTORIES=(
    "/app/wwwroot/documentos"
    "/app/wwwroot/images"
    "/app/keys"
    "/app/data-protection-keys"
    "/app/wwwroot/Rotativa"
)

echo "1. Verificando existencia y permisos de directorios:"
for dir in "${DIRECTORIES[@]}"; do
    if [ -d "$dir" ]; then
        echo "✓ $dir existe"
        ls -ld "$dir"
    else
        echo "✗ $dir NO EXISTE"
    fi
done

echo ""
echo "2. Verificando usuario actual:"
whoami
id

echo ""
echo "3. Verificando permisos de escritura:"
for dir in "${DIRECTORIES[@]}"; do
    if [ -d "$dir" ]; then
        test_file="$dir/.test_write_$(date +%s)"
        if touch "$test_file" 2>/dev/null; then
            echo "✓ Escritura OK en $dir"
            rm -f "$test_file"
        else
            echo "✗ Sin permisos de escritura en $dir"
        fi
    fi
done

echo ""
echo "4. Verificando wkhtmltopdf:"
if [ -f "/app/wwwroot/Rotativa/wkhtmltopdf" ]; then
    echo "✓ wkhtmltopdf encontrado en Rotativa"
    ls -l "/app/wwwroot/Rotativa/wkhtmltopdf"
    if [ -x "/app/wwwroot/Rotativa/wkhtmltopdf" ]; then
        echo "✓ wkhtmltopdf es ejecutable"
    else
        echo "✗ wkhtmltopdf NO es ejecutable"
    fi
else
    echo "✗ wkhtmltopdf NO encontrado en Rotativa"
fi

echo ""
echo "5. Verificando variables de entorno críticas:"
echo "APP_ENV: ${APP_ENV:-'No definida'}"
echo "DB_CONNECTION_STRING: ${DB_CONNECTION_STRING:-'No definida'}"

echo ""
echo "=== Fin de verificación ==="
