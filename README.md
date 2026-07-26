# PRG Parser Front

Next.js-интерфейс для просмотра документов, собранных `prg-parser`.

## Возможности

- серверная пагинация и поиск по названию или `doc_id`;
- фильтры по статусу и доступности;
- предпросмотр текстового содержимого;
- скачивание HTML, TXT, JSON, PDF и META из `document_outputs`;
- прямое серверное подключение к PostgreSQL через `DATABASE_URL`.

## Локальный запуск

Требуется Node.js 22.13 или новее.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Без `DATABASE_URL` приложение запускается с небольшим демонстрационным набором.

## Railway

Проект рассчитан на развёртывание в том же Railway-проекте, где работают
`prg-parser` и `Postgres`.

1. Создайте сервис из GitHub-репозитория `prg-parser-front`.
2. Добавьте reference variable:

   ```text
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```

3. Сгенерируйте публичный домен для сервиса.

`Dockerfile` собирает standalone-версию Next.js и не передаёт данные подключения
в клиентский JavaScript.
