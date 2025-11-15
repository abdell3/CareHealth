## CareHealth Backend Enhancements

### Configuration
- Copy `.env.exemple` to `.env` and fill in MongoDB, JWT, Redis, MinIO/S3, and SMTP variables.
- Secrets must only live in environment variables. `config/config.json` now only carries non-sensitive defaults.
- MinIO/S3 usage requires `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, and `S3_BUCKET_NAME`. The API will refuse uploads if these are missing.

### Running the API
```
npm install
npm run dev
```

### Running the Reminder Worker
```
node worker/emailWorker.js
```
The worker consumes Redis queue `queues:appointment-reminders`, sends reminder emails 24h before appointments, and retries up to three times on failure.

### Tests
```
npm test
```
The suite uses `mongodb-memory-server`, stubs S3 interactions, validates refresh-token rotation, appointment conflict locking, Redis queueing, and document upload/presigned flows.

### CI
GitHub Actions (`.github/workflows/ci.yml`) installs dependencies and runs the same `npm test` command on Node 20.



maintenant tu me donne un fichier json exact et detailler qui contient la collection des requettes du rest api pour l'integrer dans postman pour tester tous les endpoints, et bien sur ils sont gerer par les roles, cvd folder d'admin qui a ces autorisations ou ce qu'il peut faire dans la platform gerer par des folders comme la gestion des patients ..etc et ces folders nécessiste une access token qui est gerer dans le script de post-response, par exemple le login d'admin le script capt son access token par exemple admin_access et admin_refresh_token et comme ca il sont stocker dans leur variable, biensur la meme chose que doctor, nurse ...etc et ils ont logout comment et refreshtoken et reset password ...etc et tout ca appliquer sur les autres roles