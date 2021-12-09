# Discord Accountant Bot

The Accountant manages _Points_ in Discord servers. In the [Eco](https://eco.com) Discord, Points are "for research purposes only," as we often say — but they have become the lifeblood of our community. We grant Points to members, and then anyone can send those Points to each other. They’ve become an incredible, vibrant transactional layer. Points can represent anything you and your community want them to — a reward, a thank you, a reputation layer, a place in line... anything that can be represented by a number.

_(Note: We’ve intentionally added friction to getting into the Eco community, but here’s a hint: having everyone’s favorite 🦊 unlocks a different signup flow on [our site](https://eco.com). Or you can just answer the riddle correctly. Or there might be other ways to get in, too...)_

## Options for using The Accountant

There are two ways to use The Accountant:

1. Deploy The Accountant into your own server, with your own Points, separate from Eco Points. If you do this, you'll be able to grant Points freely — as many as you want. But they won't have any link to Eco Points. To do this, follow the instructions lower in this README under "Set up your own Accountant."

2. Perhaps even cooler: [invite The Accountant into your server _using Eco Points_](https://eco.com/discord/accountant). If you do this, members of the Eco Discord can (and will) come over and already have Points in your server. And you can request grants of Eco Points from the Eco community for you to re-distribute to your own community. The Points will persist _across every server that has invited The Accountant._

_To request grants of Eco Points to distribute to your community, hop into [this Discord channel](https://eco.com/discord/ecollaborator) and introduce yourself. You'll need to apply and be approved by the Eco Community._

Being a part of the Eco network is powerful. We're building a coalition of projects, all allowing the same Points to move across different servers and serve as a pro-social transactional layer. We’ll have embassies between different Discord communities, cross-community collaboration, and more.

[Here’s a brief explanation about why we’re giving away Points to other communities in the first place.](https://echo.mirror.xyz/TBxn2Xz6TS0FOtUsYDAqdkqL3AdSD1RhLPHwM8fXJ6c)

If you’re even vaguely interested in the idea of adding Eco Points to your server, getting grants of Points, and enabling that cross-community interaction and transaction layer, [here’s a link to join a Discord channel](https://eco.com/discord/ecollaborator) where you can chat with us (and we can give you access to the rest of the Eco Discord). We’d love to discuss.

Again, [here’s the link](https://eco.com/discord/accountant) to add The Accountant to your server and use Eco Points.

## For more

For more about The Accountant Bot and all the rest of the bots open-sourced by the Eco Community, check out [this post](https://eco.com). There's a member management dashboard, a bot to manage role assignment based on invite links, bots that let you stake and enter sweepstakes with points, and much more.

## Set up your own Accountant

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

6. Create an emoji for displaying point amounts.

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

## Questions? Need help?

Hop into [this Discord channel](https://eco.com/discord/ecollaborator) and introduce yourself and we can help out (and give you access to the rest of the Eco Discord).
