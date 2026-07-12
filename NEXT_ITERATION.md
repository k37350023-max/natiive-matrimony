# NativeMatrimony Launch Iteration

## Current Launch Score

- Homepage: 90/100
- Signup: 88/100 before this iteration, target 93/100 after essential fields are saved
- Browse: 88/100
- Profile: 86/100
- Edit Profile: 84/100
- Requests: 86/100
- Notifications: 84/100
- Alerts: 88/100
- Chats: 86/100
- Settings / Privacy: 84/100

Overall launch score: 88/100

## Completed Work

- Signup now asks for and saves the essential browse-quality fields: religion, community, profession, and education.
- Server-side registration now requires and persists those fields instead of creating thin profiles with hardcoded defaults.
- Fixed `EmptyState` lint blocker by moving the action button component outside render.

## Remaining P0 Issues

- Profile photo is still not captured during signup; browse nudges for photo after signup, but launch prompt requires photo as an essential field.
- Browse filters still expose more complexity than a first-time family user needs.
- Empty states need a final pass to ensure no page feels like an empty database.
- Profile cards should be checked visually on mobile for hierarchy: photo, age, height, native place, profession, education, verification, activity.
- Request flow copy should avoid “send request” wherever it feels transactional or rude.
- Supabase RLS remains a launch security concern because many client-side reads still depend on public anon access.

## Remaining P1 Issues

- Deeper admin dashboard polish.
- Consultant / human-assist monetization flow.
- More advanced notification preferences.
- Full SEO pass for native-place landing pages.

## Exact Next Task

Make the first signed-in browse experience clearer and more native-place-first:

1. Reduce visible filters to native place, age, religion, community, marital status.
2. Move the rest behind More Filters.
3. Rewrite browse heading and empty states around “find people from your native place.”
4. Verify mobile layout.

## Files Likely To Edit

- `app/browse/page.tsx`
- `app/components/EmptyState.tsx`
- `app/globals.css`
- `NEXT_ITERATION.md`

## Known UX Problems

- Signup still relies on post-signup photo completion instead of capturing photo upfront.
- Some profile/privacy copy still uses platform language rather than plain family-user language.
- Some authenticated pages still feel like app dashboards instead of a simple marriage search flow.

## Open Bugs

- Build can fail in the sandbox when Google Fonts cannot be fetched; rerun with network access when needed.
- Branch is ahead of remote from prior session history; verify before pushing.

## Recommended Implementation Order

1. Complete current signup essential-fields iteration and commit.
2. Browse filter simplification.
3. Profile card mobile polish.
4. Requests copy and tab cleanup.
5. Photo-at-signup decision and implementation.
