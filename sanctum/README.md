# Emberlight Sanctum v3.1

A Netlify-ready immersive Sanctum archive for SoftEmberTales.

## What is included

- Immersive entrance with video/fallback background
- Optional audio ambience
- Admin panel at `/admin.html`
- Backend-first shared Netlify persistence using Netlify Blobs
- Cloudinary upload support from admin
- Manual record creation/editing
- Scout Ledger JSON importer
- Gilded/Sterling-only import rule
- Veiled ignored; missing decree ignored; Flicker/Ash ignored during Scout import
- Automatic decree seal assignment
- Per-record field visibility toggles
- Scrollable book detail modal
- Search/filter/sort/load-more archive tools
- Contact Chamber with Netlify Forms collection and MailerLite subscriber capture

## Deployment steps

1. Upload this folder to GitHub.
2. Create a new Netlify site from the GitHub repo.
3. In Netlify, go to **Site configuration → Environment variables**.
4. Add:

```text
ADMIN_KEY=your-private-admin-passphrase
```

5. Deploy.
6. Open:

```text
https://your-site.netlify.app/admin.html
```

7. Enter the same `ADMIN_KEY` to unlock admin.

## Important sync behavior

Admin changes sync across devices only after clicking:

**Save Changes to Site**

This saves to Netlify Blobs. After saving, changes appear on laptop, phone, and other browsers.

## Cloudinary uploads

To upload media from the admin panel:

1. Create a free Cloudinary account.
2. Find your **cloud name**.
3. Create an **unsigned upload preset**.
4. Enter both in **Admin → Media**.
5. Upload image/video/audio.
6. Copy or assign the returned URL.

You can also paste any external URL or local path without Cloudinary.

Examples:

```text
assets/media/sanctum-bg.mp4
assets/audio/ambient.mp3
https://example.com/cover.jpg
```

## Scout Ledger import

Use **Admin → Scout Import**.

Rules:

- Imports only `Gilded` and `Sterling`
- Ignores missing decree
- Ignores `Flicker`, `Ash`, and obsolete `Veiled`
- Uses as many matching fields as possible
- Imported records become independent Sanctum records
- Duplicates are detected by normalized title + author

## Decree seals

Default seal paths:

```text
assets/seals/gilded.png
assets/seals/sterling.png
assets/seals/flicker.png
assets/seals/ash.png
```

Seal is assigned automatically based on decree. A record can also use a custom seal override.

## Contact / email with MailerLite

The contact chamber now does three things:

1. Stores contact submissions in Netlify Blobs.
2. Posts the same submission to Netlify Forms, so you can use Netlify's form dashboard/notifications.
3. If the visitor checks the updates consent box, adds/updates them in MailerLite under **Sanctum Updates**.

Set these Netlify environment variables:

```text
ADMIN_KEY=your-private-admin-passphrase
MAILERLITE_API_KEY=your-mailerlite-api-key
MAILERLITE_GROUP_NAME=Sanctum Updates
```

Optional, but recommended once you find the group ID in MailerLite:

```text
MAILERLITE_GROUP_ID=your-mailerlite-group-id
```

If `MAILERLITE_GROUP_ID` is not set, the function tries to find a group named `Sanctum Updates`; if it cannot find one, it will attempt to create it.

Important: MailerLite is used for subscriber capture and welcome/update automations. Direct owner notifications are handled through Netlify Forms notifications unless you add a separate transactional email service later.

## Notes

- Keep background videos optimized, ideally under 10–20 MB.
- Use Cloudinary optimized image URLs for large cover libraries.
- Export JSON backups regularly from admin.
