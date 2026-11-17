# Meta (Instagram) setup guide

This guide connects your own Instagram account to your own AutoDM deployment. It takes about
15 minutes and costs nothing. You create **your own Meta app** (nobody else's credentials are shared),
so you stay in full control of your data.

> **Verification status.** Written October 2026 from Meta's developer documentation and secondary
> sources. The Meta developer site could not be fetched directly while writing, so items marked
> **⚠ verify** come from search snippets or third parties. Meta changes its dashboard often; if a
> label differs slightly, look for the closest match and please [open an issue](https://github.com/ilramdhan/auto-dm/issues).

## What you need first

- An **Instagram Professional account** (Business or Creator). Switch in the Instagram app:
  _Settings → Account type and tools → Switch to professional account_.
- In the Instagram app: _Settings → Messages and story replies → Message controls → Connected tools →
  Allow access to messages_ **ON**. Without it every DM fails.
- A **Facebook account** to log in to developers.facebook.com. A Facebook Page is **not** required.
  The app uses **Instagram API with Unified Login**: you sign in with Instagram or Facebook and choose
  a business portfolio. The Meta app itself must be owned by a business portfolio.
- Your app deployed and reachable over **HTTPS** (see [deployment.md](deployment.md)). Meta cannot call
  `localhost`; for local testing use a tunnel such as `cloudflared` or `ngrok`.
- You have logged in to the app and changed the default password.

Throughout, `{APP_URL}` is your public URL, e.g. `https://my-replies.vercel.app` (no trailing slash).

| Value                                                        | You will paste it into                   |
| ------------------------------------------------------------ | ---------------------------------------- |
| OAuth redirect URI: `{APP_URL}/api/instagram/oauth/callback` | Unified Login configuration → Redirect URL |
| Webhook callback URL: `{APP_URL}/api/webhooks/instagram`     | Webhooks → Instagram object              |
| Verify token (shown in **Settings → Instagram**)             | Webhooks → Instagram object              |
| Meta App ID and App Secret (App settings → Basic)           | **Settings → Instagram** in the app      |
| Configuration ID (`config_id`)                               | **Settings → Instagram** in the app      |

The app shows the callback URL and the verify token with copy buttons so you do not have to type them.

## Part 1 - Create the Meta app

1. Go to <https://developers.facebook.com/apps> and log in. If asked, register as a Meta developer
   (accept the terms, verify phone/email).
2. Click **Create app**.
3. Enter an **App name** (anything, e.g. "My Comment Replies") and a contact email. Click **Next**.
4. When asked for a use case, choose **Other** (or the option about "Manage messaging & content on
   Instagram" if shown - ⚠ verify, Meta renames use cases regularly). Then choose the app type
   **Business**. Click **Next**, then **Create app**.
5. The app must be owned by a **business portfolio**. Use case: **Manage messaging & content on
   Instagram**. Open **Use cases → Manage messaging & content on Instagram → Customize → API setup
   with Unified login**. Newly created apps cannot use API setup with Instagram login.

## Part 2 - Configuration and permissions

On **API setup with Unified login**, create a configuration. It is a Facebook Login for Business
configuration. Its id is the `config_id`.

Edit permissions so the configuration includes these three. Do not rely on the old
`instagram_business_*` names:

| Permission                   | Used for                                            |
| ---------------------------- | --------------------------------------------------- |
| `instagram_basic`            | Read your profile and your media list (post picker) |
| `instagram_manage_comments`  | Read comments, post public replies                  |
| `instagram_manage_messages`  | Send the private reply (DM)                         |

`instagram_basic` and `instagram_manage_messages` are required by the configuration. Ads permissions
are optional; this app does not use them. Choose a **system-user access token**. Leave it set to not
expire. An ad account is optional and can be skipped at login.

Under **Redirect URL**, paste `{APP_URL}/api/instagram/oauth/callback` exactly and save. Copy the
configuration ID.

## Part 3 - Enter the app credentials in the app

1. In the Meta dashboard open **App settings → Basic**. Copy the **App ID** and click **Show** next to
   **App Secret**. Use these Meta app credentials, not an Instagram app ID or secret.
2. In AutoDM go to **Settings → Instagram**. Paste **Meta App ID**, **Meta App Secret**, and
   **Configuration ID**, then save. The secret is encrypted at rest and never shown again.

## Part 4 - OAuth redirect URI

The redirect URI is saved on the Unified Login configuration in Part 2. It must match
`{APP_URL}/api/instagram/oauth/callback` character for character (https, no trailing slash).

## Part 5 - Add your Instagram account as a tester (Development mode)

New apps start in **Development mode**: only people with a role on the app can use it.

1. Dashboard → **App roles → Roles → Add People**, choose **Instagram Testers**, enter your Instagram
   username, and submit. (If your account owns the Meta developer login via Facebook, also add it as
   Administrator.)
2. Open the Instagram app (or instagram.com) with that account: _Settings → Website permissions
   (or "Apps and websites") → Tester invites_ → **Accept**.
3. Back in the dashboard, the tester should now show as accepted.

## Part 6 - Connect Instagram

1. In AutoDM: **Settings → Instagram → Connect Instagram**.
2. Sign in with Instagram or Facebook. Choose the business portfolio and the Instagram account to
   share, then allow the permissions.
3. You return to the app and see your username. The app exchanges the code for a Business Integration
   System User access token, reads the Instagram account from `/me/assigned_instagram_accounts`,
   encrypts the token, and subscribes that account
   (`POST graph.facebook.com/{ig-user-id}/subscribed_apps`).

## Part 7 - Webhook setup

1. In the Meta dashboard open **Webhooks**, select the **Instagram** object. Unified Login does not
   use the callback saved under API setup with Instagram login. The same page is also **Configure
   webhooks** on **API setup with Unified login**.
2. **Callback URL**: `{APP_URL}/api/webhooks/instagram`
   **Verify token**: copy it from **Settings → Instagram** in the app.
3. Click **Verify and save**. Meta sends a `GET` with `hub.challenge`; the app answers if the token
   matches. If it fails, see [troubleshooting.md](troubleshooting.md).
4. In the webhook fields list, **subscribe to `comments`** and **`messaging_postbacks`** (toggle both on).
   `messaging_postbacks` is only needed for the follow gate button (Part 9).
5. Your account must also be subscribed to the app. The **Connect Instagram** step does this; the
   dashboard shows "Webhook subscriptions" per account on the same page. In the app, **Settings →
   Instagram → Webhook diagnostics** shows the last subscription result, a **Re-subscribe webhooks**
   button, and every recent request Meta sent (verified, accepted or rejected, and why).
6. Test by commenting from a **second account** (in Development mode: an accepted Instagram Tester).
   Comments by the connected account itself are always skipped. See
   [My test comment did nothing](troubleshooting.md#my-test-comment-did-nothing).

Using n8n as relay instead? Point Meta at your n8n webhook URL and follow [n8n.md](n8n.md).

## Part 8 - Development vs Live mode (important)

|                                      | Development mode                                              | Live mode                                         |
| ------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------- |
| Who can trigger webhooks / be served | Accounts with a role on the app (admins, developers, testers) | Everyone, subject to your permission access level |
| Comments from random followers       | **Not delivered** (⚠ verify - widely reported)                | Delivered if permissions allow (see below)        |
| Needs Privacy Policy URL             | No                                                            | **Yes** (App settings → Basic)                    |

To go Live, Meta needs a privacy policy and a way for users to have their data deleted. The app
serves both; **Settings → Instagram → Meta app review** lists all four URLs with copy buttons.

1. In AutoDM open **Settings → Account → Public contact** and enter your name (or business
   name) and a contact email. They are shown on the public privacy policy and data deletion pages
   (until you do, the pages use generic wording like "the operator of this site"). The privacy
   policy also states how long comment records are kept; set it in **Settings → Processing → Data
   retention** (default 365 days; old records are deleted daily by the cron job).
2. Meta dashboard → **App settings → Basic**:
   - **Privacy Policy URL**: `{APP_URL}/privacy`
   - **Terms of Service URL** (optional, recommended): `{APP_URL}/terms`
   - **User data deletion**: choose **Data deletion instructions URL** and paste
     `{APP_URL}/data-deletion`
   - also set a **Category** and an app icon (1024x1024), then save.
3. Meta dashboard → **Facebook Login for Business → Settings** (deauthorize and data deletion
   callbacks):
   - **Deauthorize callback URL**: `{APP_URL}/api/instagram/deauthorize` - called when someone
     removes your app; if it's the connected account, its token is wiped and it is disconnected.
   - **Data deletion request URL**: `{APP_URL}/api/instagram/data-deletion` - called when someone
     asks Meta to delete their data; the app deletes their comment records (and, for the connected
     account, its token and profile details) right away and answers with a confirmation code. The
     person can check the status at `{APP_URL}/data-deletion?code=...`.
   - Save. Both callbacks verify Meta's `signed_request` with your App Secret, so save the App Secret
     in **Settings → Instagram** first.
4. Use the **toggle at the top of the dashboard** ("App mode: Development → Live").

**Handling a commenter's email request.** People who only commented on your posts never log in to
the app, so Meta never sends a deletion callback for them; the public `/data-deletion` page asks them
to email you instead. To act on such an email, open **Activity** and use the trash icon on one of
their rows ("Delete @username's data"), or enter their username in **Settings → Account → Delete a
commenter's data**. After you confirm, every stored comment record for that commenter is deleted
(matched by Instagram user id, or by username case-insensitively), the connected account is not
touched, and you get a confirmation code. Reply with the status link
`{APP_URL}/data-deletion?code=...` so they can check it themselves.

### Standard vs Advanced Access - do I need App Review?

Meta's rule (from the Instagram Platform App Review docs): **Standard Access** is for apps that only
serve Instagram professional accounts **you own or manage** (accounts that have a role on the app).
**Advanced Access** - which requires **App Review and Business Verification** - is required when the app
serves accounts you do not own (a SaaS for other people).

For a self-hosted tool used on **your own account**, Standard Access is the intended path and App Review
is not required. The open question is whether, in Live mode with Standard Access, comments from the
general public (non-testers) reach your webhook:

- Meta's webhook documentation says apps need **Advanced Access** on the relevant permission to
  receive webhook notifications, and development mode only notifies for users with an app role.
  (⚠ verify - this wording comes from the older Facebook-Login-based docs and community reports.)
- In practice many self-hosters report that **Live mode + Standard Access + your own account** works
  for comments by anyone. Other reports say Meta requires Advanced Access for `comments` webhooks.
  **We could not confirm either from primary sources.** Test it: switch to Live, comment from a
  second account that is _not_ a tester, and check **Activity** in the app.
- If webhooks do not arrive, request Advanced Access for `instagram_manage_comments` and
  `instagram_manage_messages`: dashboard → **App Review → Permissions and features**. Expect to
  provide a screencast, a privacy policy and (for Advanced Access) **Business Verification**
  (Business settings → Security centre). Reviews can take days to weeks.

Apps migrating from Facebook Login may be granted Advanced Access automatically; that does not apply
to a brand-new app.

## Part 9 - Private Reply rules (what limits your DMs)

Verified against Meta's Private Replies documentation and secondary sources:

- **One private reply per comment.** You cannot send a second DM using the same `comment_id`.
- **Within 7 days** of the comment's creation. (Instagram Live comments: only while the broadcast is live.)
- The private reply is sent with `POST /{ig-user-id}/messages` and `recipient: { "comment_id": "..." }`.
- The message includes a link to the commented post (Meta adds it).
- **Follow-ups:** after the private reply, you may send further messages only if the user **replies**,
  which opens the standard **24-hour** messaging window.
- **Text length:** the app caps DM text at **1000 characters** (Meta's Messaging API text limit is
  commonly cited as 1000 bytes/characters - ⚠ verify exact unit; keep messages short and avoid long emoji runs).
- **Buttons:** a link button requires the _generic template_ message format. ⚠ verify that generic
  templates/buttons are accepted in a _private reply_ to a comment; if Meta rejects it the app falls
  back to a plain-text DM with the URL included in the text (see `docs/troubleshooting.md`).
- **Follow gate (optional, per rule):** the first Private Reply carries the gate text and a _postback_
  button ("I've followed" by default) instead of the link. When the commenter taps it, Meta sends a
  `messaging_postbacks` webhook and the tap **opens the 24-hour messaging window**, so the follow-up
  is sent with `recipient: { id }` (IGSID). The app calls `GET /{IGSID}?fields=is_user_follow_business`:
  if they follow you it sends the rule's normal DM (text + link button); if not, it resends the
  editable "not following yet" text with the same button. If that API call fails (Meta error or
  timeout) it **fails open** and sends the link, logging a redacted summary. Each delivery unlocks only
  once; repeat taps are ignored. Accounts connected before this feature must click **Settings →
  Instagram → Re-subscribe webhooks** once to add `messaging_postbacks`; until then everything except
  the gate button keeps working.
- **Rate limits** (⚠ verify, from secondary sources): about **750 calls/hour per account** for private
  replies on posts/reels (100/second for Live). General Graph API call limits also apply. A typical
  creator account never gets near these, but a viral post can; the app logs failures in **Activity**.
- **Public comment replies** use `POST /{comment-id}/replies`. Don't reply to your own comments; the app
  ignores them to prevent loops. Instagram may hide spammy repeated replies - use several variants.

## Part 10 - Tokens

- The connect button returns a **Business Integration System User access token**. It belongs to the
  business portfolio, not the person who logged in. Leave the configuration set so the token does
  not expire. It stops working if the app is removed from that portfolio or the Instagram account
  moves to another portfolio; connect again in that case.
- The daily cron still deletes old comment records. It does not refresh this token. The old
  `graph.instagram.com/refresh_access_token` call does not apply.
- API host: `graph.facebook.com` version **v27.0**. `/me` is the system user. Media, messages, and
  webhook subscription use the Instagram professional account id.

## Is it free and unlimited?

**The software: yes.** MIT licensed, no per-contact fee, no per-message fee, no "contact limit", no
paywalled features. Hosting runs on the free tiers of Vercel Hobby and Supabase Free.

**The platform: limits come from Meta, not from this project.**

- Meta's APIs are free to use; there is no charge per comment or DM.
- Rate limits apply (see Part 9) and Meta can throttle or restrict an account that sends spam-like
  content. Don't send unsolicited promotions; only DM people who commented a keyword you asked for.
- Private replies: one per comment, within 7 days, no follow-ups unless the user answers.
- Live mode and (possibly) App Review / Business Verification are required to serve the public.
- Free-tier hosting has its own quotas (Vercel Hobby is for non-commercial use per Vercel's terms -
  ⚠ check if you run this for a business; Supabase Free pauses inactive projects after a week - the daily
  cron keeps it active).
- "Unlimited keywords / posts / campaigns" is true of the app: there is no artificial cap.

## Quick checklist

- [ ] Professional IG account
- [ ] Meta app (Business type) with Instagram product
- [ ] Meta App ID, App Secret, and configuration ID saved in **Settings → Instagram**
- [ ] Redirect URI `{APP_URL}/api/instagram/oauth/callback` whitelisted
- [ ] IG account added as Instagram Tester and invite accepted
- [ ] **Connect Instagram** done
- [ ] Webhook callback `{APP_URL}/api/webhooks/instagram` + verify token verified, `comments` and `messaging_postbacks` subscribed
- [ ] Using the follow gate on an account connected earlier? Clicked **Re-subscribe webhooks** once
- [ ] Name + contact email saved in **Settings → Account → Public contact**
- [ ] App settings → Basic: Privacy Policy URL `{APP_URL}/privacy`, data deletion instructions URL
      `{APP_URL}/data-deletion`
- [ ] Business login settings: deauthorize callback `{APP_URL}/api/instagram/deauthorize`, data
      deletion request URL `{APP_URL}/api/instagram/data-deletion`
- [ ] App switched to **Live**
- [ ] Test comment from a _second_ account produces a row in **Activity**

## Sources

- Private Replies: <https://developers.facebook.com/docs/instagram-platform/private-replies/>
- App Review for Instagram API: <https://developers.facebook.com/docs/instagram-platform/app-review>
- Instagram Platform overview: <https://developers.facebook.com/docs/instagram-platform/overview>
- Webhooks for Instagram: <https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-instagram>
- Secondary: <https://postproxy.dev/how-to/instagram-comment-to-dm-private-reply/>, <https://www.postmcpai.com/instagram-messaging-api>
