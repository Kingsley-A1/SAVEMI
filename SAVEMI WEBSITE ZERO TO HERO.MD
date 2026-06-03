# SAVEMI Website Zero To Hero

Written by Bespoke Technologies  
bespoketech.com.ng  
Motto: Engineering the solutions for this and the next generation.  
Document date: 2026-06-03

## What This Book Gives You

This guide explains how to use, run, protect, and think about the SAVEMI website without needing to be a software engineer. It is written for the owner and ministry operators of Sabbath Vesper Ministry, especially for a team that wants to publish content confidently without touching code.

The website is a digital ministry library and office. The public side serves visitors. The admin side serves the team. The database stores the records. The media store keeps videos, audio, images, book covers, and downloadable assets. Hosting keeps the website online.

SAVEMI's public voice is Seventh-day Sabbath focused. The foundation text to keep in mind is Exodus 20:8, KJV: "Remember the sabbath day, to keep it holy." Use Scripture with care. When a Bible quotation appears on the website, include the reference and the translation.

## The Simple Picture

Think of the website as four connected rooms.

The public library is what visitors see. It contains the home page, About page, messages, books, quotes, and contact form.

The admin office is where approved team members work. It contains the dashboard, message editor, book editor, quote editor, contact inbox, admin users page, platform health page, and audit log.

The records room is the database. It remembers every message, book, quote, contact submission, admin user, and audit record.

The media cabinet is Cloudflare R2. It stores the large files that do not belong inside the database, such as videos, audio files, images, and book covers.

When you publish a sermon, the sermon title and description go into the database. The media file goes into R2. The website joins both pieces together and shows them to visitors.

## Who Should Use Each Area

Visitors use the public website. They do not need an account.

Content admins use the admin office. They can create, edit, publish, archive, export, and manage ministry content.

The owner supervises content quality, ministry voice, access control, launch readiness, and operating discipline.

Engineers maintain hosting, environment variables, database migrations, storage configuration, security fixes, backups, and code changes.

Do not give admin access to a person who does not need to operate the website. Admin access is not a viewing account. It is an operating account.

## Public Website Map

The public website is the part the ministry audience sees.

| Page | Address | What It Does |
| --- | --- | --- |
| Home | `/` | Introduces SAVEMI, shows hero media, featured videos, featured audio, and ministry calls to action |
| About | `/about` | Explains Sabbath Vesper Ministry, the mission, the Sabbath focus, and ministry background |
| Contact | `/contact` | Lets visitors send a message to the ministry |
| Messages | `/messages` | Lists published videos, audios, and image-based messages |
| Message Detail | `/messages/[id]` | Shows one published message with media player and details |
| Books | `/books` | Lists published books and resources |
| Book Detail | `/books/[slug]` | Shows one book/resource with description and download or purchase action |
| Quotes | `/quotes` | Shows published quotes and quote images |
| Quote Detail | `/quotes/[slug]` | Shows one quote with attribution, scripture, and image where available |

Public pages do not show drafts. A record must be published before visitors can see it.

## Public Page Playbook

This section explains each public page as an owner would inspect it before launch. The goal is not to memorize code. The goal is to know what each page is meant to prove to a visitor.

### Home Page

The home page is the front door. It should quickly tell visitors that SAVEMI is Sabbath Vesper Ministry, show the strongest current ministry media, and point people toward messages, books, quotes, and contact.

The home page pulls from published content. It can show hero media, featured videos, featured audio, ministry statements, scripture pillars, Facebook links, and calls to action. If the page feels empty, the first thing to check is whether enough content has been published in the admin office.

Owner review:

```text
[ ] The hero media is approved and current.
[ ] The opening text clearly identifies SAVEMI.
[ ] The Seventh-day Sabbath focus is visible without being forced.
[ ] Featured video and audio content are published records.
[ ] Calls to action lead to real pages.
[ ] The page reads well on a phone.
```

### About Page

The About page is the identity page. It should explain the ministry plainly: what SAVEMI is, what it teaches, where it is based, who leads it, and why the seventh-day Sabbath emphasis matters.

This page is mostly written content, so accuracy is more important than volume. The owner should review names, location, ministry descriptions, Scripture references, and any external links.

Owner review:

```text
[ ] Pastor and ministry names are spelled correctly.
[ ] Calabar, Nigeria context is accurate.
[ ] Sabbath wording is biblical and respectful.
[ ] No placeholder or generic ministry text remains.
[ ] External social links are correct.
```

### Messages Page

The Messages page is the media library. Visitors should be able to scan published videos, audios, and image messages without needing admin knowledge.

Messages appear only after they are published. If a new sermon does not show here, check the message status, type, title, and media fields. A draft message is intentionally hidden.

Owner review:

```text
[ ] Published messages appear.
[ ] Draft messages do not appear.
[ ] Titles are clear and not too long.
[ ] Summaries explain the message in one or two lines.
[ ] Media thumbnails or covers are appropriate.
[ ] Scripture references are accurate where used.
```

### Message Detail Page

The Message Detail page is where a visitor watches, listens, or reads one message. It should carry the complete message context: title, speaker, description, scripture reference, date, and media.

If the media does not play, the issue may be the uploaded file, the external media URL, or the storage configuration. If the page opens but looks incomplete, the admin record probably needs better metadata.

Owner review:

```text
[ ] The media player loads.
[ ] The description gives enough context.
[ ] Speaker and event date are correct when shown.
[ ] Scripture reference matches the teaching.
[ ] Related public navigation remains easy.
```

### Books Page

The Books page is the resource shelf. It should help visitors find approved books, study materials, and ministry resources.

Each book card should make the offer clear. A visitor should know whether the resource is free, paid, downloadable, or linked to an external purchase page.

Owner review:

```text
[ ] Free books have working download/resource links.
[ ] Paid books have working purchase links.
[ ] Book covers are readable and dignified.
[ ] Descriptions match the actual resource.
[ ] Featured books are intentionally selected.
```

### Book Detail Page

The Book Detail page is the resource explanation page. It should tell the visitor what the book is, who wrote it, why it matters, and what action to take next.

Use this page for coherent book descriptions. Since the owner is an author, this page should never feel like a quick product card stretched into a page. It should read like a thoughtful resource note.

Owner review:

```text
[ ] The description is complete and edited.
[ ] The author name is correct.
[ ] The format and page count are correct when used.
[ ] The download or purchase button works.
[ ] The page does not promise a file that is unavailable.
```

### Quotes Page

The Quotes page is the reflection gallery. It should show approved short thoughts, Bible-linked statements, and quote images that support the ministry voice.

Quotes should be easy to read on mobile. If a quote image has small text or weak contrast, replace it before publishing.

Owner review:

```text
[ ] Quote text is readable.
[ ] Attribution is correct.
[ ] Scripture references include book, chapter, and verse.
[ ] Quote images are clear on mobile.
[ ] Featured quotes are intentionally chosen.
```

### Quote Detail Page

The Quote Detail page gives one quote more space. It is useful for sharing, reading, and preserving the source context.

This page should not carry uncertain attribution. If the source is not known, avoid pretending it is known. Use ministry attribution only when the ministry owns the statement.

Owner review:

```text
[ ] The quote is accurate.
[ ] The source is not misleading.
[ ] The image matches the quote.
[ ] The page remains visually calm.
```

### Contact Page

The Contact page is the visitor communication path. It should make it easy for people to reach the ministry without exposing private admin information.

The form stores submissions inside the admin office. It is not a public comment section. Treat submitted messages as private correspondence.

Owner review:

```text
[ ] The form submits successfully.
[ ] The admin office receives the submission.
[ ] The page does not expose private phone numbers or emails accidentally.
[ ] The wording sets clear expectations for ministry contact.
```

## Admin Office Map

The admin office is private.

| Admin Area | Address | What It Does |
| --- | --- | --- |
| Login | `/admin/login` | Lets an approved admin sign in |
| Dashboard | `/admin` | Shows counts and quick actions |
| Messages | `/admin/messages` | Manages videos, audios, images, and hero media |
| New Message | `/admin/messages/new` | Creates a message |
| Edit Message | `/admin/messages/[id]/edit` | Updates an existing message |
| Books | `/admin/books` | Manages books and resources |
| New Book | `/admin/books/new` | Creates a book/resource |
| Edit Book | `/admin/books/[id]/edit` | Updates an existing book/resource |
| Quotes | `/admin/quotes` | Manages quote records and quote images |
| New Quote | `/admin/quotes/new` | Creates a quote |
| Edit Quote | `/admin/quotes/[id]/edit` | Updates an existing quote |
| Contacts | `/admin/contacts` | Reads contact form submissions |
| Admin Users | `/admin/admin-users` | Lets the configured super admin create, update, and remove admin accounts |
| Platform Health | `/admin/health` | Shows database-backed health checks, content counts, admin activity, and launch warnings |
| Guide | `/admin/guide` | Shows the in-app owner operating guide |
| Register Admin | `/admin/register` | Bootstrap path for the first admin; after setup, use Admin Users |
| Audit Log | `/admin/audit-log` | Shows recent admin write actions |

If a public person tries to open admin pages, the website sends them to the login page. If a public person tries to use an admin API directly, the system returns an unauthorized response.

## Admin Page Playbook

This section explains the admin office from the operator's point of view. Admin pages are tools, so the most important qualities are clarity, safety, and repeatable workflow.

### Dashboard

The dashboard is the first admin screen after login. It gives quick counts and shortcuts. Use it to understand the current shape of the platform before making changes.

The dashboard should answer simple questions: how many messages exist, how many are published, how many drafts remain, how many contacts exist, and whether books and quotes are being maintained.

### Messages Admin

The messages admin area is where sermons, Sabbath reflections, audios, image messages, and hero media are managed. Use filters before editing if the list is long.

The owner should treat message publishing as an editorial action, not a typing task. The strongest workflow is draft first, review second, publish third, public check last.

### Books Admin

The books admin area is where resources are managed. It supports free and paid resource flows. A free resource needs a reliable download or resource URL. A paid resource needs a reliable purchase URL.

Books should be reviewed more carefully than short messages because they carry the owner's long-form voice. Avoid publishing a book record with a weak description just because the cover is ready.

### Quotes Admin

The quotes admin area is where short reflections and quote images are managed. Quotes often spread faster than long content, so accuracy matters.

Check attribution, source, scripture reference, image readability, and publish status before making a quote public.

### Contacts Admin

The contacts admin area is an inbox for visitor submissions. It should be checked on a schedule. It should not become a forgotten storage box.

Treat contact messages as private. Exporting or sharing contact messages should happen only when the owner approves it.

### Admin Users

The admin users area controls who can operate the private side of the website. It is not a general signup page and it is not a ministry member directory.

After the first admin exists, only the configured super admin can create, update, or remove admin accounts. Use this page when the ministry adds a trusted operator, changes an admin display name, or removes access after a staff or contractor change. The system will not let the super admin delete their own active account, delete the configured super-admin account, or remove the last remaining admin.

### Platform Health

The platform health page is the launch and operations room. It shows whether the database can be reached, whether expected content records exist, whether the admin ownership is configured, whether audit logs can be read, and whether schema changes still need engineering attention.

Use this page before launch, after deployment, and whenever the admin office behaves strangely. A warning on this page does not always mean visitors are affected, but it does mean the owner should not ignore it.

### Audit Log

The audit log is the change history. It does not replace trust, but it gives the owner evidence.

Use it after content launches, after admin user changes, after deleting records, and after any unexpected public change.

## Login And Admin Access

An admin signs in with an approved email address and the configured six-character admin access code.

The code alone is not enough. The email must also exist in the admin user list. This prevents a public visitor from becoming an admin just because they guessed or received the code.

The first admin can be created during setup. After that, only the configured super admin should manage admin accounts through `/admin/admin-users`.

Admin sessions expire after eight hours. This is intentional. The admin office should not stay open forever on a shared or unattended computer.

Owner rules:

```text
Do not publish the admin code in a chat group.
Do not share the code with temporary helpers.
Do not reuse the code for other accounts.
Change the code when a former admin should no longer have access.
Keep the admin email list small.
Review the audit log after major content work.
```

## Content Statuses

Every message, book, and quote has a status.

| Status | Meaning | Publicly Visible |
| --- | --- | --- |
| Draft | Work in progress | No |
| Published | Approved and live | Yes |
| Archived | Preserved but removed from public view | No |

Use Draft while preparing content. Use Published only after the content has been checked. Use Archived when content should no longer appear publicly but should still be kept for records.

Deleting is stronger than archiving. Delete only when the record was created by mistake or should be permanently removed.

## Form Field Reference

Most admin forms repeat the same ideas. Learning these fields once makes the whole platform easier to operate.

| Field | Plain Meaning | Owner Rule |
| --- | --- | --- |
| Title | The visible name of the content | Make it clear, specific, and not needlessly long |
| Summary | Short preview text | Write the main point in one or two lines |
| Description | Full explanation | Give enough context for a visitor who was not present |
| Status | Draft, published, or archived | Publish only after review |
| Featured | Highlight this item | Use sparingly so it remains meaningful |
| Placement | Standard or hero | Use hero only for the home page lead item |
| Scripture reference | Bible source | Include book, chapter, verse, and translation when quoting |
| External URL | Link outside the website | Use trusted links only and test them |
| Media key | Uploaded file reference | Do not edit manually unless an engineer instructs you |
| Cover image | Preview image | Use readable, respectful, properly owned images |

The website creates the slug automatically from the title. A slug is the clean web address name for a record. Because title changes can change public links, edit titles on published records carefully.

## Messages

Messages are the main media content type. They can be videos, audios, or image-based messages.

A message can include:

```text
title
summary
description
type
placement
status
speaker
scripture reference
event date
duration
cover image
uploaded media
external media URL
category
published date
```

The title is the human-readable name.

The website uses the title to create the clean web address name automatically. A title like `Sabbath Reflection at Eventide` can become a web address ending such as `sabbath-reflection-at-eventide`.

The summary appears in cards and previews.

The description is the fuller body text.

The type tells the website whether the message is video, audio, or image.

The placement decides whether a message is a normal message or hero media.

The status decides whether the public can see it.

The speaker identifies the preacher, teacher, or presenter.

The scripture reference keeps the teaching tied to the Bible text.

The event date records when the message happened.

The cover image is the visual preview.

The uploaded media is a file stored in R2.

The external media URL is useful for YouTube, Facebook, or another trusted direct media link.

## Hero Media

Hero media is the leading visual media shown on the home page.

Only published hero media should appear publicly. When a new published hero is saved, the system demotes other published hero records to standard placement. This keeps the home page from fighting between multiple hero items.

Use hero media for the most important current ministry message, not for every new upload.

Good hero content usually has:

```text
a strong title
a short summary
a clear Sabbath or ministry focus
a good cover image or video
published status
hero placement
```

## Books And Resources

Books are ministry resources. Some may be free downloads. Others may direct visitors to a purchase link.

A book can include:

```text
title
tagline
description
author
cover image
download URL
purchase URL
price label
format
page count
featured flag
availability
status
published date
```

Free books should have a download URL or a trusted resource URL.

Paid books should have a purchase URL and a clear price label, such as `Available on request`, `Free`, or a real price where approved.

The featured flag helps the website highlight important resources.

The owner should approve book descriptions before publishing. Books are a long-form part of the ministry brand, so copy quality matters.

## Quotes

Quotes are short written reflections, statements, or image-based encouragements.

A quote can include:

```text
title
quote text
attribution
source
scripture reference
image
featured flag
status
published date
```

Use accurate attribution. If the quote comes from Scripture, give the reference and translation. If it comes from the ministry, use the correct speaker or source.

Do not publish a quote image that has unclear rights, blurry text, poor contrast, or incorrect Bible wording.

## Contact Submissions

The contact page lets visitors send a message. The system stores the visitor name, email, message, and time.

Admins can read submissions under `/admin/contacts`.

The contact form includes validation and rate limiting to reduce spam. It is still an inbox, not a customer support system. The ministry should decide who reads contact submissions and how often.

Recommended operating rhythm:

```text
Check contacts at least twice weekly.
Reply from the official ministry email or approved communication channel.
Mark internally when a message has been handled.
Do not share private visitor messages outside the approved ministry team.
```

## Audit Log

The audit log records important admin actions.

It can show actions such as:

```text
message.create
message.update
message.delete
book.create
book.update
book.delete
quote.create
quote.update
quote.delete
admin.register
```

The audit log helps answer basic operational questions.

```text
Who created this?
Who updated this?
When did it change?
Which type of record was affected?
Which admin email was used?
```

Review the audit log after a new admin is added, after a launch, after major editing sessions, and whenever content looks wrong.

## Database Explained In Plain Language

The database is the organized memory of the website.

It has tables. A table is like a spreadsheet for one kind of thing. The `Message` table stores messages. The `Book` table stores books. The `Quote` table stores quotes. The `ContactSubmission` table stores contact messages. The `AdminUser` table stores admin users. The `AuditLog` table stores admin actions.

Here is how the database maps to the website.

| Database Table | Website Area | Plain Meaning |
| --- | --- | --- |
| `Message` | Home, Messages, Message Detail, Admin Messages | Sermons, videos, audio teachings, image messages, hero media |
| `Category` | Messages | Message grouping |
| `Book` | Books, Book Detail, Admin Books | Books and ministry resources |
| `Quote` | Quotes, Quote Detail, Admin Quotes | Short reflections and quote images |
| `ContactSubmission` | Contact, Admin Contacts | Visitor messages to the ministry |
| `AdminUser` | Login, Admin Users | Approved operators |
| `AuditLog` | Audit Log | Record of admin actions |

The database does not store large video files inside the message row. It stores the title, description, status, and media key. The real file lives in the media store.

## Media Store Explained In Plain Language

Cloudflare R2 is the storage cabinet for large files.

When an admin uploads a video, the website asks R2 for permission to receive that file. R2 gives a short-lived upload link. The browser sends the file directly to R2. Then the website saves the file key in the database.

This is safer and faster than pushing large files through the website server.

Media file examples:

```text
video recordings
audio recordings
message cover images
book cover images
quote images
downloadable book files
```

If an upload fails, the most common causes are:

```text
the admin session expired
the file is too large
the file type is not allowed
R2 storage settings are missing
the internet connection dropped
```

## Hosting Explained In Plain Language

Vercel hosts the website. It receives the project code, builds it, and serves it on the internet.

The current production deployment URL is:

```text
https://savemi.vercel.app
```

The intended canonical public domain in the website metadata is:

```text
https://savemi.org
```

When the final custom domain is ready, the hosting configuration and metadata should point to the same public address.

## Technical Services Map

The website depends on a few services. The owner does not need to operate them daily, but should know what each one does.

| Service | What It Is | What The Owner Should Know |
| --- | --- | --- |
| Vercel | Website hosting | If Vercel is down or misconfigured, the website may not load |
| CockroachDB | Database | If the database is down, content may disappear or admin saves may fail |
| Prisma | Database bridge used by engineers | Engineers use it for database structure and migrations |
| Cloudflare R2 | Media storage | If R2 is misconfigured, uploads and media display can fail |
| Auth.js | Admin login system | If auth secrets are wrong, admins may not sign in |
| Environment variables | Private settings and secrets | They must not be shared publicly |

The owner should keep account ownership clear. If Bespoke Technologies or another engineer manages a service account, the ministry should still know who has access, where recovery emails go, and how to reach support during an incident.

## Access And Ownership Records

Keep a private record of operational ownership. This record should not be committed to the website code.

The record should include:

```text
hosting account owner
domain registrar account owner
database account owner
media storage account owner
official admin emails
who can approve new admins
who can approve public content
who handles contact submissions
who to call during a website outage
```

Do not store passwords in the handbook. Use a password manager or another approved secure process.

## The Owner's Publishing Workflow

Use this workflow for any message, book, or quote.

First, prepare the content offline. Check spelling, scripture references, title quality, and ministry voice before opening the admin office.

Second, create the record as a draft. Do not publish while still gathering details.

Third, add media. Upload files or paste trusted external links.

Fourth, preview the saved content where the admin screen allows it. If public preview is not available, check the record carefully before changing status.

Fifth, publish only after approval.

Sixth, open the public page and confirm it looks correct on phone and desktop.

Seventh, record any follow-up work, such as adding a better cover image, improving the description, or changing the hero.

## Editorial Approval Workflow

The safest publishing process has four stages.

Draft is where the content is entered. At this stage, incomplete text, missing images, and untested links are acceptable because visitors cannot see the record.

Review is where the owner or approved editor checks the content. Review should include spelling, Bible references, ministry tone, media playback, and link behavior.

Publish is where the status changes to Published. This should happen only when the content is ready for visitors.

Public check is where the owner opens the public page after publishing. This step catches mistakes that are easy to miss inside the admin office.

Use this approval path even when the content is urgent. Urgency does not remove the need to check Scripture references, media links, and public presentation.

## Content Quality Checklist

Use this before publishing any public record.

```text
[ ] The title is clear.
[ ] The title is stable enough for the website to create a good public link.
[ ] The summary is useful.
[ ] The description has enough context.
[ ] Scripture references are correct.
[ ] Direct Bible quotations include translation.
[ ] Images are readable on mobile.
[ ] Media plays or links correctly.
[ ] The status is intentionally set.
[ ] The public page was checked after publishing.
```

## How To Publish A Message

1. Sign in at `/admin/login`.
2. Open `/admin/messages`.
3. Choose New Message.
4. Enter the title.
5. Add the summary.
6. Add the full description.
7. Select the type: video, audio, or image.
8. Choose standard placement unless this should be home hero content.
9. Keep status as Draft while editing.
10. Add speaker, scripture reference, event date, and duration if available.
11. Upload media or paste a trusted external media URL.
12. Upload a cover image if needed.
13. Save the message.
14. Review it.
15. Change status to Published.
16. Open the public messages page and confirm the content appears correctly.

Use standard placement for normal content. Use hero placement only for the main home page media.

## How To Publish A Book

1. Sign in at `/admin/login`.
2. Open `/admin/books`.
3. Choose New Book.
4. Enter the title.
5. Add a short tagline.
6. Add the author name.
7. Write a complete description.
8. Select Free or Paid availability.
9. For free books, add the download or resource URL.
10. For paid books, add the purchase URL and price label.
11. Add format and page count if known.
12. Upload a cover image if available.
13. Mark Featured only when the resource should be highlighted.
14. Save as Draft.
15. Review all details.
16. Change status to Published.
17. Open the public books page and confirm the book appears correctly.

Do not publish a book with an empty or broken download/purchase link.

## How To Publish A Quote

1. Sign in at `/admin/login`.
2. Open `/admin/quotes`.
3. Choose New Quote.
4. Enter the title.
5. Enter the quote text.
6. Add attribution.
7. Add source if known.
8. Add scripture reference if the quote is Scripture-based.
9. Upload an image if the quote has one.
10. Mark Featured only when it should be highlighted.
11. Save as Draft.
12. Review spelling, attribution, and Bible reference.
13. Change status to Published.
14. Open the public quotes page and confirm the quote appears correctly.

Quotes should be short enough for visitors to read comfortably on mobile.

## How To Use Export

The admin lists can export content as CSV. CSV is a spreadsheet-friendly file format.

Use exports before major cleanup work, before deleting records, before migration work, and before launch audits.

Recommended export routine:

```text
Export messages monthly.
Export books monthly.
Export quotes monthly.
Export before any major content reorganization.
Keep exports in a secure owner-controlled folder.
Do not publish exports publicly because they can contain unpublished content.
```

The export tool is a record snapshot. It is not the same as a full database backup.

## How To Use Platform Health

Open `/admin/health` before launch, after deployment, and when something feels wrong. The page gives the owner a plain operating picture without opening the database directly.

Read the page in this order:

```text
1. Confirm the database is reachable.
2. Confirm the configured super admin is present.
3. Confirm content counts look reasonable.
4. Confirm audit trail checks are healthy.
5. Review recent admin activity for unfamiliar actions.
6. Read launch warnings before approving production.
```

The health page uses the database and existing audit records. It can show who changed content, what kind of action happened, where the action happened in the admin system, and when it happened. It does not track visitor page views or marketing analytics because no tracking service, new database, or new analytics table was added for this launch.

If the health page says an audit table or schema field is missing, contact the engineer before final launch approval. That warning usually means database migrations have not fully completed.

## Daily Operations Checklist

Use this when the website is live.

```text
[ ] Check that the home page loads.
[ ] Check that the hero media still looks correct.
[ ] Check Platform Health for warnings after any deployment.
[ ] Check contact submissions if it is an operating day.
[ ] Confirm no unexpected admin action appears in the audit log.
[ ] Review any new content before publishing.
[ ] Confirm the public site still shows only approved content.
```

## Weekly Operations Checklist

Use this once each week.

```text
[ ] Review public pages on mobile.
[ ] Review public pages on desktop.
[ ] Check messages, books, and quotes for broken images or links.
[ ] Export messages, books, and quotes if major edits happened.
[ ] Review contact submissions and follow up.
[ ] Review admin users and confirm access is still appropriate.
[ ] Review platform health warnings.
[ ] Review the audit log for unfamiliar changes.
```

## Monthly Operations Checklist

Use this once each month.

```text
[ ] Confirm the hosting bill and domain status are healthy.
[ ] Confirm database and storage accounts are active.
[ ] Ask the engineer to confirm backups and deployment health.
[ ] Ask the engineer to confirm production migrations are applied.
[ ] Review the oldest drafts and decide whether to publish or archive.
[ ] Review featured and hero content so the home page stays current.
[ ] Check that public ministry wording still matches the approved voice.
```

## Backup And Recordkeeping Rhythm

Backups are not the same as exports. Exports are useful spreadsheets of content records. Backups are technical copies of the database and media store that help engineers recover from serious failure.

The owner should expect three kinds of protection.

Content exports help the owner review and preserve a copy of messages, books, and quotes. They are easy to understand but do not capture everything.

Database backups preserve the structured records. These should be managed by the engineer or hosting/database provider.

Media backups preserve uploaded files. If the ministry uploads large videos, audio files, and quote images, storage recovery matters as much as database recovery.

Owner review:

```text
[ ] Content exports are saved after major editing sessions.
[ ] The engineer can explain where database backups live.
[ ] The engineer can explain how media files are protected.
[ ] At least one restore process has been discussed before launch.
```

## Change Request Rhythm

Not every request should become an emergency code change. Separate requests into content changes, admin operations, and engineering work.

Content changes are handled in the admin office. Examples include editing a title, publishing a message, fixing a quote, or updating a book description.

Admin operations are handled by approved admins. Examples include managing admin users, exporting records, checking contacts, reviewing platform health, and reviewing the audit log.

Engineering work requires a developer. Examples include changing page layout, adding a new field, changing database structure, fixing auth behavior, changing storage settings, or deploying a new version.

This separation protects the owner from paying for code work when a content update is enough, and it protects the website from risky admin-side experiments when engineering work is required.

## Launch Checklist

Use this before a major public launch.

```text
[ ] Home page approved.
[ ] About page approved.
[ ] Contact form tested.
[ ] Messages page tested.
[ ] Books page tested.
[ ] Quotes page tested.
[ ] At least one admin can sign in.
[ ] Anonymous users cannot open admin pages.
[ ] Anonymous users cannot use admin APIs.
[ ] Hero media is correct.
[ ] Draft content does not appear publicly.
[ ] Book links work.
[ ] Quote images are readable.
[ ] Contact submissions reach the admin office.
[ ] Admin users page shows only appropriate operators.
[ ] Platform Health has been reviewed.
[ ] Platform Health shows no unresolved migration warning.
[ ] Audit log records admin actions.
[ ] Production database migrations have been applied successfully.
[ ] Production domain is correct.
[ ] Final owner approval given.
```

## Current Engineering Launch Status

As of 2026-06-03, the previously outstanding database migrations for audit logging and external media URLs have been applied successfully. The engineer confirmed the completed migration rows directly in the database.

One Prisma status check reported that the database schema was up to date, but later status checks showed intermittent Prisma schema-engine errors. This is an engineering connectivity/tooling item, not an owner task. For every future launch, the owner should ask for two confirmations:

```text
[ ] The engineer confirms production migrations completed successfully and migrate status is up to date.
[ ] The Platform Health page shows no unresolved audit or schema warning.
```

If either confirmation is missing in a future release, the platform can still be reviewed, but it should not receive final launch approval.

## What To Do If Something Breaks

If the public website does not open, contact the engineer and report the exact page address, time, and what you saw. Do not keep refreshing for hours without reporting. The issue may be hosting, database, domain, or deployment related.

If admin login fails, check that you are using the approved admin email and the current six-character code. If it still fails, ask the engineer to verify the admin user record and auth environment variables.

If content does not appear publicly, check whether the record is published. Draft and archived records are intentionally hidden. Also check whether the title was saved and whether the public page address changed after a title edit.

If Platform Health shows an audit or schema migration warning, do not approve final launch yet. Ask the engineer to rerun the database migration check, confirm migrate status, and confirm the health page again.

If media does not upload, try a smaller file or a supported file format. If the issue continues, ask the engineer to check R2 configuration.

If a book link is broken, change the book back to Draft until the correct link is ready.

If a quote or Bible reference is wrong, archive or edit it immediately. Scripture mistakes should not remain live.

If an unfamiliar admin action appears in the audit log, change the admin access code and ask the engineer to review admin users.

## Safety Rules For Owners

Do not give admin access casually.

Do not publish a record before checking it on the public page.

Do not delete when archive will do.

Do not run database seed commands in production.

Do not place secrets in public documents.

Do not upload copyrighted media unless the ministry owns it or has permission.

Do not publish Bible quotations without reference and translation.

Do not ignore broken public links.

Do not treat social media links as permanent backups. Keep official records.

## Content Voice Guide

SAVEMI should read as a serious Sabbath-focused ministry, not a generic entertainment page.

Good public copy is clear, reverent, warm, and specific. It should help visitors understand the seventh-day Sabbath focus, the ministry context in Calabar, and the purpose of Reflection at Eventide.

Use plain wording. Avoid long slogans where a clear sentence works better.

Use Scripture accurately. A short quote with a reference is stronger than a long decorative passage with no source.

Example foundation wording:

```text
SAVEMI shares biblical reflections on the seventh-day Sabbath through teaching, worship, and Reflection at Eventide.
```

Example Scripture reference style:

```text
"Remember the sabbath day, to keep it holy." - Exodus 20:8, KJV
```

## Page Quality Standard

Every public page should answer five questions.

```text
Where am I?
What is this page for?
What can I read, watch, download, or do here?
Is this content approved and trustworthy?
What is the next sensible action?
```

Every admin page should answer five different questions.

```text
What am I managing?
What records exist?
What state are they in?
What action can I safely take?
What changed after I saved?
```

If a page does not answer those questions, it needs product or engineering attention.

## Page-By-Page Acceptance Standard

Use this section when reviewing the website before handover, launch, or a major content update. The standard is short on purpose: each page needs a clear pass or fail.

| Page | Pass Standard |
| --- | --- |
| Home | Visitor understands SAVEMI, sees approved hero media, and can reach messages, books, quotes, and contact |
| About | Ministry identity, Sabbath focus, location, and leadership context are correct |
| Contact | Form submits, private data is not exposed, and admins can read the submission |
| Messages | Only published messages appear, with clear titles and working media paths |
| Message Detail | One message loads with correct media, description, speaker, and scripture context |
| Books | Published resources appear with correct free or paid action |
| Book Detail | Resource description is coherent and the download or purchase action works |
| Quotes | Published quotes are readable, accurate, and visually clear |
| Quote Detail | One quote has correct attribution, source, scripture reference, and image where applicable |
| Admin Login | Only registered admins can sign in |
| Admin Dashboard | Counts and quick actions reflect the current content system |
| Admin Messages | Admin can create, edit, publish, archive, filter, and export messages |
| Admin Books | Admin can create, edit, publish, archive, filter, and export books |
| Admin Quotes | Admin can create, edit, publish, archive, filter, and export quotes |
| Admin Contacts | Admin can read visitor submissions |
| Admin Users | Super admin can manage admin accounts, and ordinary admins cannot |
| Platform Health | Database health, audit status, content counts, and launch warnings are visible |
| Admin Guide | Owner can read the operating handbook inside the admin office |
| Audit Log | Recent admin write actions are visible |

If a page fails its standard, record the exact page, the failed expectation, and whether it is a content issue, admin operation, or engineering issue.

## Glossary

Admin means an approved person who can operate the private website office.

Super admin means the configured owner-level admin who can manage other admin accounts.

Archive means remove content from public view without deleting it.

Audit log means the record of admin actions.

Database means the structured memory of the website.

Draft means content saved but not public.

Hero means the main featured media on the home page.

Media key means the stored file name/path used to find an uploaded file in R2.

Platform Health means the admin page that shows database health, content counts, audit status, admin activity, and launch warnings.

Published means approved and visible to visitors.

R2 means Cloudflare R2, the media file storage system.

Generated slug means the clean URL name the website creates from a record title.

Vercel means the hosting platform that keeps the website online.

## Owner Knowledge Triage

Must know by heart:

```text
Draft is private. Published is public. Archived is hidden but preserved.
Admin access is powerful and must be limited.
The database stores records. R2 stores large media files.
The public site should only show approved content.
The audit log helps identify who changed content.
Do not run destructive technical commands in production.
```

Must recognize:

```text
Home, About, Contact, Messages, Books, and Quotes are public pages.
Dashboard, Messages, Books, Quotes, Contacts, Admin Users, Platform Health, Guide, and Audit Log are admin pages.
Generated slugs affect web addresses, but owners do not type them manually.
Hero media controls the first major home page media.
Exports are useful before cleanup work but are not full backups.
```

Lookup-only:

```text
Vercel deployment details.
CockroachDB database management.
Prisma migration commands.
Cloudflare R2 bucket settings.
Auth.js session configuration.
Formal WCAG accessibility audit procedures.
```

## Handover Standard

The owner should be able to operate the platform without becoming a developer. The engineer should still remain responsible for code changes, hosting configuration, database migrations, storage settings, backups, monitoring, and production incident response.

The strongest operating habit is simple: prepare content as a draft, verify it, publish intentionally, and check the public page afterward.

SAVEMI is built to support a ministry voice centered on the seventh-day Sabbath. Keep the content accurate, the admin access controlled, and the publishing rhythm disciplined.
