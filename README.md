# Accountant bot

The open-source version of the points bot for Eco's Discord channel.

## Setup

1. Create a MySQL database for the bot. Inside the `mysql` command line client:

```
CREATE DATABASE accountant;
```

2. Select the database and generate the tables using the `db.sql` file:

```
USE accountant
source db.sql
```

3. Rename the `.env.sample` file in the root folder to `.env` and fill it with your bot token and database details.

4. To add the bot to servers, go to the [Discord Developer Portal](https://discord.com/developers/applications), open your bot, click on `OAuth2` > `URL Generator` in the sidebar, enable the `bot` scope, enable the `Send Messages` and `Manage Messages` permissions, then use the generated URL.

   The `Manage Messages` permission is required for deleting commands that were used in the wrong channel.

   After that you can click on `Bot` in the sidebar, and enable `Public Bot` if you want to allow anyone to add the bot to their own servers.

5. In your Discord server, create four channels; one named `#check-your-points` for users to check their points, one named `#points-log` for logging all point transactions from all servers, one named `#grants-log` for logging grants only, and one named `#eco-server-points-log` for logging transfers made inside your server only. These names can be customized by editing `constants.ts`.

6. Create an emote for displaying point amounts.

7. (Optionally) create roles for point milestones (e.g. "0-50 points", "50-250 points")

8. (Optionally) create a Slack webhook for logging grants: https://api.slack.com/messaging/webhooks

9. Rename the `config_sample.ts` file in the `src` folder to `config.ts` then use the ID of your server in `MAIN_GUILD` and fill the rest using the IDs of the emote and roles as well as the Slack webhook created in steps 5, 6 and 7.

10. Install dependencies:

```
npm install
```

10. Compile TypeScript:

```
npm run build
```

11. And finally, run the bot:

```
npm run start
```

## Testing locally

Do the setup instructions above, then create a test database using steps 1 and 2, and add its name to `.env`:

```
DB_DATABASE_TEST="test_db_name"
```

Use this command to run the tests:

```
npm run test
```
