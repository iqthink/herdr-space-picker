# Integrating Space Picker into Herdr

Investigated 2026-10-30 against desktop app 0.1.9, source commit
[`3e32d75`](https://github.com/herdrdev/herdr-app/tree/3e32d75e7aa2327d7b1f89caf3d5dafd1f44f1b2).
This is a release recommendation and an upstream discussion draft, not an implemented extension API.

## Recommendation

Keep the standalone picker and optional Command-N shortcut as the working mod today.
For the desired button beside Spaces/+ on the original layout, discuss a small change to
Herdr's **shipped `spaces` JavaScript mod** that lets it render optional configured header
actions. The existing shared-state and command APIs can carry the configuration; a new
Rust-core plugin framework is not the first thing to build.

This is a proposal requiring upstream agreement. Installing the picker currently does
not create an inline button. No issue, PR, or public repository has been submitted.

## What the source establishes

| Question | Evidence and conclusion |
| --- | --- |
| Can a new mod dock into original `main`? | [`sync_folders`, src/window.rs](https://github.com/herdrdev/herdr-app/blob/3e32d75e7aa2327d7b1f89caf3d5dafd1f44f1b2/src/window.rs#L3578) explicitly skips first-install docking when the current layout is shipped. `place: top` is not a route into main. |
| Can we insert a node using layout.set? | [The layout.set branch](https://github.com/herdrdev/herdr-app/blob/3e32d75e7aa2327d7b1f89caf3d5dafd1f44f1b2/src/window.rs#L2951) rejects structural changes on shipped layouts. Only supported click/look fields may change. |
| Who draws Spaces and its +? | [`defaults/mods/spaces/main.js`](https://github.com/herdrdev/herdr-app/blob/3e32d75e7aa2327d7b1f89caf3d5dafd1f44f1b2/defaults/mods/spaces/main.js#L355) draws both in one header row. There is no external action list in that implementation. |
| Does mod.json declare sidebar or palette actions? | [`Hint`, src/mods.rs](https://github.com/herdrdev/herdr-app/blob/3e32d75e7aa2327d7b1f89caf3d5dafd1f44f1b2/src/mods.rs#L336) contains place and size. A guessed actions/header field is not a supported registration mechanism. |
| Will a shortcut automatically make a named palette entry? | [`defaults/frame/palette/main.js`](https://github.com/herdrdev/herdr-app/blob/3e32d75e7aa2327d7b1f89caf3d5dafd1f44f1b2/defaults/frame/palette/main.js) builds entries from its named list and app commands, hides generic mod.open, and uses keys to label entries. A keybinding alone does not register a custom picker entry. |
| Can shipped mods coordinate with third-party mods? | [`shared` and `set_shared`, src/mods.rs](https://github.com/herdrdev/herdr-app/blob/3e32d75e7aa2327d7b1f89caf3d5dafd1f44f1b2/src/mods.rs#L427) already persist shared data and rerender consumers. The sidebar already uses shared state for colors. Reading an agreed action configuration would be a shipped-mod change. |
| Can we eliminate Python safely today? | [`read_dir` in gpui-kit](https://github.com/herdrdev/herdr-app/blob/3e32d75e7aa2327d7b1f89caf3d5dafd1f44f1b2/vendor/gpui-kit/crates/shell/src/engine/quickjs/host.rs#L496) uses file_type rather than following directory symlinks; app capabilities in src/mods.rs are home-scoped. Keep the helper for current behavior. |

The upstream issue/PR lists were checked for existing sidebar-action/folder-picker proposals;
none matching this integration was found in the returned lists. This is not a claim that
no related discussion can exist elsewhere.

## Options assessed

| Approach | Distribution and maintenance | Decision |
| --- | --- | --- |
| Standalone dialog + optional shortcut | One mod, no layout copies, works now. Python 3 remains a documented prerequisite. | Keep as the current release baseline. |
| Add folder button by copying sidebar/layout | Inline placement works, but users inherit copies of upstream UI and must maintain them. | Rejected for the default package. |
| Floating kept window | No sidebar copy, but overlays content and is not truly part of the header. | Tried and rejected; removed. |
| Dock a standalone button using mod.json | Only works automatically on personal layouts; occupies a layout block rather than a header slot. | Not suitable for original main. |
| Optional actions in shipped Spaces mod | Inline placement, original layout, empty by default, normal upstream updates. Needs maintainer acceptance and one upstream change. | Preferred proposal. |
| Add a built-in Open folder action using pickFolder | A small shipped-mod change with no third-party runtime dependency. The OS picker provides its own navigation/favorites, but not our custom project search and recents. | A useful narrower fallback to discuss. |

## Proposed scope for an upstream discussion

The sidebar could read an optional namespaced map from shared state, for example:

```js
// Proposed convention only. Herdr 0.1.9 does not read this key.
{
  "space-picker": {
    "label": "New space in folder…",
    "icon": "mods/space-picker/folder.svg",
    "command": "mod.open",
    "args": { "name": "space-picker" }
  }
}
```

The actual key name and schema should be agreed with the maintainer. These are
data descriptors dispatched through run(), not injected source or shell commands.
No action is configured by default, and the existing + keeps its behavior.

Keep the initial scope to the Spaces header, not every toolbar in the app. Decisions
to settle before implementation:

- Small icon buttons with an accessible name and a theme-aware icon; no background polling.
- Deterministic ordering, a bounded number of visible actions, and an explicit compact/overflow behavior when the sidebar is collapsed.
- Validation of malformed descriptors so one bad entry cannot break the sidebar.
- Install/uninstall owns only its namespaced entry and preserves other mods' entries.
- Missing/removed mods must not leave unexplained dead buttons. The first version needs an agreed stale-entry/removal policy; do not assume there is an installed-mod enumeration API.
- Preserve default header layout and + behavior when the configuration is empty.

The installed mod would remain responsible for its picker and local data. Installation
would copy its files, validate them, and explicitly register its one action. Removal
would unregister that action before deleting its files. The registration/setup code
should only be added after the host convention exists, not shipped as unused code now.

## Why discuss before building

Herdr's [contribution guide](https://github.com/herdrdev/herdr-app/blob/3e32d75e7aa2327d7b1f89caf3d5dafd1f44f1b2/CONTRIBUTING.md)
directs ordinary customization to mods/layouts and invites issues for missing capabilities.
Its [AGENTS.md](https://github.com/herdrdev/herdr-app/blob/3e32d75e7aa2327d7b1f89caf3d5dafd1f44f1b2/AGENTS.md)
prefers mod-owned code/shared storage when the core does not need to own the behavior.
Therefore this should start as a narrow shipped-mod extensibility discussion, not a
request to bundle our picker or a speculative change to herdr-core.

The closest precedent is [terminal context-menu customization, issue #6](https://github.com/herdrdev/herdr-app/issues/6).
The maintainer added a targeted replacement mechanism, but merging contributions from
several mods was explicitly left out. That shows a willingness to address a missing
surface, not an assurance that the proposed header-action design will be accepted.

## Draft issue: optional mod actions in the Spaces header

**Problem:** A standalone mod can open a folder picker through mod.open and a shortcut,
but cannot expose a small discoverable action beside Spaces/+ on the shipped main layout.
The current alternatives are a floating window or copying the whole sidebar/layout.
Floating UI overlaps work; copies stop receiving the sidebar's updates.

**Reproduction:** Install a place:none picker mod. It opens through mod.open. Inspecting
Spaces' header shows only the built-in +. mod.json docking skips shipped layouts and
layout.set rejects structural changes on main.

**Question:** Would you accept an optional configured action list in the shipped Spaces
mod, using existing shared()/setShared()/run() and leaving the default header unchanged?
We can contribute a focused patch with validation, compact-layout behavior, installation/
removal guidance, and render tests. If another mod-level convention is preferred, we would
use that rather than grow the Rust core.

**Scope:** No new agent runtime, generic plugin framework, default folder-picker behavior,
or changes to the existing +. The goal is to expose a missing inline integration surface
for otherwise self-contained mods.

## Remaining release work

The shortcut-based package can be reviewed and shared independently of upstream work.
Before claiming broad compatibility, test another macOS installation, make the Python 3
prerequisite explicit, and either test Linux or continue labeling it macOS-tested/POSIX-only.
Windows and remote paths need separate implementation and validation. Public publication
and sending the upstream discussion are separate actions and have not been done.
