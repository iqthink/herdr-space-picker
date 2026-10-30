# Herdr Space Picker

One standalone folder-picker mod for the new Herdr desktop app, tested on macOS app 0.1.9. The user wants the original main layout and Command-N. The default setup has no floating launcher or copied controls. An optional user-chosen + integration may clone only the layout and Spaces sidebar, as documented.

## Source and validation

- Source: `mods/space-picker/`. Keep its installed copy in `~/.config/herdr-app/mods/space-picker/` synchronized after changes.
- Read the installed app's AGENTS.md and type declarations before changing APIs. Never edit shipped app files or generated declarations.
- Run `npm test`, `herdr-app check` on the installed mod, and inspect live app errors when changing it.
- Save learnings here or in project docs, never hidden agent memory.
- No attribution/co-author trailers. Use squash merges for PRs.

## Implementation constraints

- Python 3 through exec with separate argv is intentional: Herdr 0.1.9 fs/promises is home-scoped and its isDirectory ignores symlinked directories. Confirmed against app source, not just inferred.
- Paths keep . and .. until OS traversal; store friendly chosen paths and canonical identities separately.
- Discovery is bounded. Async completion ignores stale responses; creation captures targets before await. run() returns null, not startup confirmation.
- VirtualListScrollHandle.new() panicked in the 0.1.9 checker. Use ordinary overflow_y_scrollbar scrolling; echo keyboard selection in the footer. Do not restore pagination.
- Herdr 0.1.9 interrupts render/layout after 50 ms (events/tasks: 500 ms). Search must run when inputs change and cache rows; render and selection handlers read the cached list. Keep ranking bounded to 60 matches and avoid localeCompare in bulk matching. A native checker stress probe with 20,000 fuzzy matches verified this fix.
- Name indexing is bounded, cached locally for one minute, skips hidden/dependency dirs, and defers archives. Generic omitted-letter matching lives in paths.js; do not add folder-specific exceptions.
- The helper path contains the mod folder name; update it if renaming the mod.

## Distribution and integration

Ship only mods/space-picker/, RECIPE.md, preview.png, and optional keys.json. Existing Command-N now opens the picker; built-in + buttons keep their original action. Do not overwrite another user's keys file or silently replace a conflicting shortcut. App-managed user data stays out of the repository.

The user wants an inline folder action inside the Spaces header, beside +. Source investigation and a proposed upstream discussion are in docs/integration.md. No inline extension exists in 0.1.9. Docking explicitly skips shipped layouts. Upstream scope should favor a small shipped-mod change using existing shared()/setShared()/run() over a new Rust-core extension framework. The upstream discussion is https://github.com/herdrdev/herdr-app/issues/106. The public repository is https://github.com/iqthink/herdr-space-picker and has the herdr-mod topic. Confirmed in https://assets.herdr.dev/mods/index.json on 2026-10-30. No submission form: Herdr crawls topic-tagged public repositories; updates are documented to appear within an hour, previews after screening with at least a 24-hour wait.

Optional + integration is documented in docs/plus-button.md. It uses fresh layout/sidebar clones generated from each user's installed version, not bundled copies. Only create these when the user explicitly chooses that option. Never rewrite remote-machine actions or alter their stock layouts. Right-click replacement is not a default: it replaces a whole menu and still needs a personal layout.

Public distribution uses a clean source snapshot so discarded prototypes and private workstation notes are not published. MIT licensed. Do not push local experiment-history branches.
