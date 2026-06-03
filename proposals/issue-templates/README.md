# Proposed GitHub issue templates

These are **proposals for the XCSteward tool repo** (`acyment/XCSteward`), not for
this website repo. They are kept here because this site's "Report a failure mode"
CTAs point at `acyment/XCSteward/issues/new`.

## Why they live here (for now)

The website already pre-fills a structured issue body via a URL (`?title=…&body=…`),
so reporting works **today** even without these templates installed. Installing
them just gives reporters GitHub's nicer form UI.

## How to install

Copy the contents of this folder into the **tool repo**:

```text
acyment/XCSteward/.github/ISSUE_TEMPLATE/failure-mode.yml
acyment/XCSteward/.github/ISSUE_TEMPLATE/config.yml
```

Then, if you want the site to use the form UI instead of a pre-filled body,
update `buildReportIssueUrl()` in `src/lib/report.ts` to add
`params.set('template', 'failure-mode.yml')`. Leave it as-is to keep the
body-prefill behavior (which works whether or not the template exists).

## Keep them in sync

The fields here mirror `REPORT_FIELDS` in
[`src/lib/report.ts`](../../src/lib/report.ts). If you change one, change both.
