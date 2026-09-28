# Inside Grey Room v12.18 playtest repair

- Browser game sessions are isolated per tab/window so multiple players can use one computer without overwriting each other.
- Foreground sync heartbeat is reduced from 300 ms to 900 ms to stay comfortably under shared room rate limits while action-triggered sync remains immediate.
- Cycle debrief submissions are independent for Enquêteur and Analyste; the phase has no automatic timeout and advances when both have submitted or when the host skips it.
- Fixed the `igr_v4_emit_trame` ambiguous `tr` SQL error that rolled back the second debrief submission.
- Managed Cloudflare TURN credentials are preferred for WebRTC, with the existing public relay retained only as fallback.
- Cloudflare Worker exposes short-lived TURN credentials without exposing the long-lived TURN key to clients.
