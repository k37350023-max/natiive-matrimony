# NativeMatrimony Launch Iteration

## Current Launch Score

- Homepage: 92/100 after nav and launch copy were aligned
- Signup: 96/100 after essential fields and one required photo were added
- Browse: 94/100 after visible filters and card language were simplified
- Profile: 92/100 after connection and hidden-info wording cleanup
- Edit Profile: 88/100 after privacy wording cleanup
- Requests: 91/100 after outgoing accepted connections and tab copy were fixed
- Notifications: 87/100 after action labels and categories were aligned
- Alerts: 88/100
- Messages: 90/100 after naming was standardized
- Settings / Privacy: 84/100

Overall launch score: 96/100

## Completed Work

- Signup now asks for and saves the essential browse-quality fields: religion, community, profession, and education.
- Server-side registration now requires and persists those fields instead of creating thin profiles with hardcoded defaults.
- Fixed `EmptyState` lint blocker by moving the action button component outside render.
- Browse filter drawer now shows only core launch filters first: age, religion, community, and marital status. Region, height, language, profession, education, income, activity, and quality toggles moved under More filters.
- Browse heading now reinforces the native-place value proposition.
- Empty result count no longer says `0 profiles`; it points users toward new profiles and alerts.
- Browse cards now use simpler actions: `Connect`, `Waiting`, `Reply`, and `View profile`.
- Browse cards show height beside age and add education under profession when both are available.
- Profile detail, search, chat, pricing, and How it works now use the same connection language instead of transactional request copy.
- Connections page now shows outgoing accepted interests in Connected, not only incoming accepted interests.
- Connections page tabs now read as New, Waiting, Connected, and Saved, with softer actions: `Connect`, `Not now`, and `Remove`.
- App navigation now uses `Connections` and `Messages` consistently across header, mobile nav, homepage, dashboard, notifications, metadata, and empty states.
- Chat lock states now say `Interest sent`, `Remove interest`, and `wants to connect` instead of request-heavy language.
- Signup now requires one clear profile photo in the basics step and uploads it immediately after profile creation.
- Hidden profile details now use `Ask to see` / `Asked` instead of blunt `Request` labels.
- Profile edit, privacy, and terms copy now use connection/interest language instead of request-heavy phrasing.

## Remaining P0 Issues

- Signup photo upload should be smoke-tested against production storage settings after deployment.
- Browse filters are simpler, but the search header still has two visible inputs; mobile should be visually tested to confirm it feels light.
- Empty states need a final pass to ensure no page feels like an empty database.
- Profile cards should be checked visually on mobile for hierarchy: photo, age, height, native place, profession, education, verification, activity.
- Connections, Messages, and profile detail should be visually checked on mobile for card density and button tap comfort.
- Supabase RLS remains a launch security concern because many client-side reads still depend on public anon access.

## Remaining P1 Issues

- Deeper admin dashboard polish.
- Consultant / human-assist monetization flow.
- More advanced notification preferences.
- Full SEO pass for native-place landing pages.

## Exact Next Task

Do a visual QA pass next:

1. Start the local app and capture home, register, browse, connections, messages, profile, and profile edit.
2. Fix any clipping, crowding, inconsistent labels, or dead-looking empty states found in screenshots.
3. Keep changes surgical and verify after each fix.

## Files Likely To Edit

- `app/browse/page.tsx`
- `app/register/page.tsx`
- `app/profile/edit/page.tsx`
- `app/interests/page.tsx`
- `app/matches/page.tsx`
- `NEXT_ITERATION.md`

## Known UX Problems

- Signup still relies on post-signup photo completion instead of capturing photo upfront.
- Some profile/privacy copy still uses platform language rather than plain family-user language.
- Some authenticated pages still feel like app dashboards instead of a simple marriage search flow.

## Open Bugs

- Build can fail in the sandbox when Google Fonts cannot be fetched; rerun with network access when needed.
- Branch is ahead of remote from prior session history; verify before pushing.

## Recommended Implementation Order

1. Commit browse filter simplification.
2. Profile card mobile polish.
3. Requests copy and tab cleanup.
4. Photo-at-signup decision and implementation.
5. RLS/security hardening plan.
