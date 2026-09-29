# Security policy

## Scope

This repository publishes a static website. There is no backend, no database,
no authentication and no user data storage. Nothing about a visitor is sent
anywhere: no analytics, no trackers, no third party scripts. The only network
requests the pages make are to their own origin and to Google Fonts.

The contact block does not submit anything to a server. It offers three links:
a LinkedIn profile, a GitHub profile and a `mailto:` address that opens the
visitor's own email client.

Two preferences are stored in the visitor's browser through `localStorage`:
the chosen language (`lang`) and the colour theme. Both are interface settings
only. They identify nobody, leave the machine, and can be cleared like any
other site data.

## Hardening in place

- A restrictive Content Security Policy is declared in every page:
  `default-src 'none'` is the starting point, so anything not listed is
  refused rather than allowed by omission.
- `script-src 'self'` — scripts only from this origin, with no `unsafe-inline`,
  and no inline scripts or event handlers anywhere in the markup.
- `style-src` allows this origin plus Google Fonts' stylesheet; `font-src`
  allows only the font files Google serves. Everything else — images, objects,
  connections, frames — is restricted to `self` or `data:` for images.
- `connect-src 'none'` and `frame-src 'none'`: the pages open no connections
  of their own and frame nothing. `form-action 'none'` means nothing can be
  posted anywhere, since there is no form.
- `404.html` is served as a standalone fallback and carries its own, equally
  narrow policy (`style-src 'unsafe-inline'` for its single inline style block).
- No third party analytics, trackers or advertising scripts.
- External links use `rel="noopener noreferrer"`, and the referrer policy is
  `strict-origin-when-cross-origin`.
- HTTPS is enforced by GitHub Pages.
- Workflows run with `permissions: contents: read` by default. Only the
  deployment job is granted `pages: write` and `id-token: write`, and it
  authenticates with a short lived OIDC token rather than a stored secret.
- Deployments are serialised through a `concurrency` group, so two runs can
  never publish at the same time.
- Dependabot keeps GitHub Actions pinned to maintained versions.

## What is deliberately not claimed

A published web page is readable by anyone who opens it, so its markup, styles
and images can always be saved locally. The licence, not a technical control,
is what governs reuse. Write access to this repository is limited to its owner;
copies made elsewhere are a licence matter and are handled as one.

## Reporting

If you find a problem with this site, please report it by email to
tuliozr1@gmail.com rather than by opening a public issue.
