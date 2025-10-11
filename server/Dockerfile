# Utiliza una imagen base de Node.js
FROM node:18

# Establece el directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copia el archivo package.json y package-lock.json del servidor
COPY server/package*.json ./

# Instala las dependencias del proyecto
RUN npm install

# Copia el resto de los archivos del servidor
COPY server/ .

# Copia los archivos del cliente
COPY client/ ./client

# Expone el puerto que la aplicación utilizará
EXPOSE 3000

# Comando para iniciar la aplicación
CMD [ "node", "index.js" ]
