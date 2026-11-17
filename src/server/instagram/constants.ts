import "server-only";

/**
 * Instagram API with Unified Login.
 *
 * Clients sign in with Instagram or Facebook. The app receives a Business Integration System User
 * access token and calls `graph.facebook.com` with the Instagram professional account id. `/me` is
 * the system user, not the Instagram account.
 *
 * Graph API version is pinned to the version in Meta's Unified Login docs (v27.0). Bump deliberately
 * after reading https://developers.facebook.com/docs/graph-api/changelog/versions
 */
export const GRAPH_API_VERSION = "v27.0";
export const GRAPH_HOST = "https://graph.facebook.com";
export const GRAPH_BASE_URL = `${GRAPH_HOST}/${GRAPH_API_VERSION}`;

/** Facebook Login for Business dialog. Permissions come from `config_id`, not a scope list. */
export const FB_AUTHORIZE_URL = "https://www.facebook.com/dialog/oauth";

/**
 * Permissions the Unified Login configuration must include. They are chosen in the App Dashboard
 * configuration, not sent on the login URL.
 */
export const IG_PERMISSIONS = [
  "instagram_basic",
  "instagram_manage_comments",
  "instagram_manage_messages",
] as const;

/** Meta limit for Private Reply / DM text. */
export const DM_MAX_CHARS = 1000;
/** Button template `text` limit (Messenger Platform templates). */
export const BUTTON_TEMPLATE_TEXT_MAX = 640;
/** Button title limit. */
export const BUTTON_TITLE_MAX = 20;
/** Instagram caption/comment limit. */
export const COMMENT_MAX_CHARS = 2200;
