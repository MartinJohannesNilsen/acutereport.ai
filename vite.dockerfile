FROM node:23.7.0

# Set the working directory
WORKDIR /app

# Copy the frontend directory into the working directory
COPY src/frontend /app

# Install the dependencies
RUN npm install

# Run dev with hosting
# CMD ["npm", "run", "dev-host"]

# Run dev with preview
RUN npm run build
CMD ["npm", "run", "preview-host"]