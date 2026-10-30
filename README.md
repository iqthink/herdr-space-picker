# Herdr Space Picker

Choose a folder before opening a new Herdr space. Search projects, complete paths, and save favorites and recent choices.

![Folder picker favorites](preview.png)

For the **Herdr desktop app**, tested on **0.1.9 on macOS**. Uses POSIX paths and requires **Python 3** on the app's PATH. Windows and remote-folder browsing are not supported in this version. No npm runtime dependencies or network requests.

## Install

Paste this into your coding agent:

```text
Read ~/.config/herdr-app/AGENTS.md, then inspect
https://github.com/jeissonneira/herdr-space-picker and install the mod
using its RECIPE.md. Start with the standalone picker. Offer the optional
+ button integration from docs/plus-button.md if I want clickable access.
Ask before changing an existing shortcut or creating a personal layout.
```

Ask your agent to read this repository's `RECIPE.md` and the installed `~/.config/herdr-app/AGENTS.md`, then copy `mods/space-picker/` to the app's `mods/` directory. Do not overwrite another mod. If the folder is renamed, update the helper path in `main.js` too.

Validate the installed mod:

```sh
herdr-app check ~/.config/herdr-app/mods/space-picker
```

Open it directly:

```sh
herdr-app do mod.open '{"name":"space-picker"}'
```

Optionally merge the `keys.json` snippet into your existing keys. It assigns **⌘N** to this picker, replacing the normal New space shortcut. Choose another shortcut if you want to preserve that binding. Do not replace the whole keys file.

Choose the setup that suits you:

| Setup | What changes |
| --- | --- |
| **Standalone** | Keep the original layout; open the picker with the direct command or an optional shortcut. |
| **[Optional + integration](docs/plus-button.md)** | Create a personal layout/sidebar copy whose local + buttons open the picker. Remote actions remain unchanged. |

The default installation leaves Herdr's + controls unchanged. Personal copies need maintenance when Herdr updates its sidebar. See [the integration investigation](docs/integration.md) for the proposed upstream support.

## Use

- Type a name to search home folders and immediate children of common project roots.
- Type `/…` or `~/…` to complete paths at any depth. Hidden directories appear when the current prefix starts with a dot.
- Use ↑/↓ to select, Tab or › to browse deeper, and Enter to open. PageUp/PageDown or the page buttons move through results.
- A readable typed path opens directly; an incomplete path falls back to the highlighted completion. Selecting with the keyboard takes precedence.
- Click ☆ to favorite a folder and ★ to unpin it. Up to 12 recent creation requests are remembered.
- Browse… opens the system folder browser. Cancel/Escape creates no space.

## Local data and limits

Favorites, recents, and canonical identities live in Herdr shared state under `space-picker.favorites`, `space-picker.recents`, and `space-picker.identities`. User state is not included in this repository.

The Python helper follows directory symlinks, accepts paths outside home, and uses separate arguments rather than shell interpolation. Each scan has a five-second timeout; Herdr also bounds program execution. Recents retain the selected path while canonical identities deduplicate aliases.

Herdr's mod command API does not return terminal-startup confirmation. Recents record validated creation requests; Herdr handles any later terminal-startup error.

## Develop

```sh
npm test
herdr-app check ~/.config/herdr-app/mods/space-picker
```

Development tests need Node and Python 3. The installed mod only needs Python 3.

## Remove

Restore the individual shortcut you changed, then remove `mods/space-picker/` from the app. Saved favorites and recents may remain without affecting other mods.

## Distribution

This repository contains one mod, a recipe, a preview, and an optional keys snippet. Publish to GitHub with topic `herdr-mod` for Herdr's Mods directory. No custom layout is required. The public repository is https://github.com/jeissonneira/herdr-space-picker. Herdr discovers it through the herdr-mod GitHub topic; marketplace indexing is separate from publication. The proposed inline integration is tracked in [herdr-app#106](https://github.com/herdrdev/herdr-app/issues/106).

## License

[MIT](LICENSE).
