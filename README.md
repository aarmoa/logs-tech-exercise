# logs-tech-exercise
Technical exercise

## How to use
In order to create a cron task in webtask use the following command
```
wt cron schedule --name logsCheck --secrets-file=webtaskSecrets.sec --ignore-package-json 1m logsCheck.js
```
The previous command will create a cron job scheduled to run every 1 minute named logsCheck (you can also execute the script registerCroneJob.sh).

### Secrets file
The configuration needed by the logs checker should be provided using secrets. The previous command does that using the --secrets-file parameter. The secrets file will have the following structure:
```
AUDIENCE=https://<auth0_tenant_user>.auth0.com/api/v2/
DOMAIN=<auth0_tenant_user>.auth0.com
CLIENT_ID=<client_id>
CLIENT_SECRET=<client_secret>
GRANT_TYPE=client_credentials
SMTP_HOST=<email_smtp_host>
SMTP_PORT=<email_smtp_port>
SMTP_USER=<email_smtp_user>
SMTP_PASS=<email_smtp_password>
EMAIL_FROM_ADD=<email address you will send the notification from>
EMAIL_TO_ADD=<email address you will send the notification to>
EMAIL_SUBJECT=<email subject>
```
* **AUDIENCE** - This parameter is used to get a token to query the Auth0 Management API
* **DOMAIN** - Tenant account that has the client (application) configured, and which logs are going to be checked
* **GRANT_TYPE** - Leave as *client_credentials* to query for logs
* **CLIENT_ID** and **CLIENT_SECRET** are required by Management API to access logs from a particular application

### Running the task locally
To run the webtask locally run the following command
```
wt serve --hostname localhost --port 9000 --secrets-file webtaskSecrets.sec --storage-file storage.wt logsCheck.js
```
In order to run the task locally we need to specify the secrets file and also a storage file. The storage file will be used by the application to save information in between runs (the logsCheck application uses the storage to save the timestamp of the last execution). Please provide an empty file.
