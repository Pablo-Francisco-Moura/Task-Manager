FROM node:20-alpine

WORKDIR /app

ARG LOCAL_UID=1000
ARG LOCAL_GID=1000

ENV HOME=/home/app

RUN mkdir -p /app/.next /home/app \
	&& chown ${LOCAL_UID}:${LOCAL_GID} /app /app/.next /home/app

USER ${LOCAL_UID}:${LOCAL_GID}

COPY package.json package-lock.json ./

RUN echo "Installing npm dependencies..." \
	&& npm ci --no-audit --no-fund \
	&& echo "npm dependencies installed."

COPY prisma ./prisma

RUN echo "Generating Prisma Client..." \
	&& npx prisma generate \
	&& echo "Prisma Client generated."

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev:docker"]
