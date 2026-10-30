# Optional: make the + buttons open Space Picker

This setup gives you clickable access today. It creates a **personal copy** of your
layout and the shipped Spaces sidebar. The local New space + buttons open the picker;
remote-machine buttons keep their original behavior. Your original layout is preserved.

Herdr does not expose a keybinding for a button's click. Command-N can be rebound in
keys.json, but the sidebar calls space.new directly. Redirecting its + requires changing
the sidebar code in a personal copy. These copies do not automatically receive upstream
sidebar/layout updates.

## Install with your agent

After installing the standalone mod, give your agent this instruction:

> Read the installed ~/.config/herdr-app/AGENTS.md and this repository's RECIPE.md and
> docs/plus-button.md. Create a personal copy of my current layout and the Spaces sidebar.
> Connect only the local New space + actions to the installed Space Picker. Preserve remote
> actions and the original layout. Validate the copied mod before switching to the new layout.
> If my layout has no shipped Spaces sidebar, explain that instead of changing unrelated UI.

## Exact integration for Herdr 0.1.9's main layout

Use fresh names if either destination already exists. Never overwrite someone else's layout
or mod. If Space Picker was installed under a different name, use that name in the actions.

1. Clone the sidebar using the app's command:

   ```sh
   herdr-app do mod.clone '{"name":"spaces","as":"space-picker-spaces"}'
   ```

2. Edit only the copied `mods/space-picker-spaces/main.js`. In 0.1.9 there is one local
   `run("space.new")` in the Spaces header. Replace it with:

   ```js
   run("mod.open", { name: "space-picker" })
   ```

   Two machine-group controls use `run("space.new", m ? { machine: m } : {})`.
   Replace those expressions with:

   ```js
   (m
     ? run("space.new", { machine: m })
     : run("mod.open", { name: "space-picker" }))
   ```

   Check the source before applying these changes: future versions may differ. Do not
   replace every space.new call blindly. No tab-bar or menu copy is required for this option.

3. Validate the copied sidebar:

   ```sh
   herdr-app check ~/.config/herdr-app/mods/space-picker-spaces
   ```

4. Duplicate the layout:

   ```sh
   herdr-app do layout.clone '{"name":"main","as":"space-picker-layout"}'
   ```

   This command switches to the new personal layout. In its JSON, change the Spaces block's
   `content.mod` from `spaces` to `space-picker-spaces`. Preserve every other node and setting.
   For a different source layout, use its real name and inspect its structure first.

5. Confirm the new layout has no errors with `herdr-app status`. Click the Spaces header +
   and the local machine +: both should open the picker. A remote-machine + must still create
   work on that machine. Cancel the dialog when checking; no test space needs to be created.

## Switch back or remove

Switch back to the source layout (for the default, `herdr-app do layout.switch '{"name":"main"}'`).
After confirming no active layout uses the copied sidebar, remove only the personal layout
and sidebar created above. The standalone picker and shortcut can stay installed.

## What about right-click or a different button location?

A layout can replace its terminal context menu through terminal_menu, but that requires a
personal layout and replaces the entire menu rather than adding one entry. Spaces' own
menu is owned by the shipped sidebar/menu mods. Header, tab-bar, and footer buttons are also
owned by their respective mods. Those alternatives do not avoid the customization tradeoff.
This package does not replace context menus or add floating controls.

The upstream integration proposal asks for discoverable actions on the original interface
without copied controls. Until that exists, choose between the standalone shortcut and this
optional + integration.
