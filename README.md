<div align="center">

[<img src="https://raw.githubusercontent.com/mentalblank/hydra/refs/heads/main/resources/icon.png" width="144"/>](https://help.hydralauncher.gg)

  <h1 align="center">Hydra Launcher</h1>
  <p align="center">
    <strong>This project is a fork of the original <a href="https://github.com/hydralauncher/hydra">hydralauncher</a>.</strong>
  </p>

  <p align="center">
    <strong>Hydra Launcher is an open-source gaming platform created to be the single tool that you need in order to manage your gaming library. Hydra is written in Node.js (Electron, React, Typescript), Python, and Rust.</strong>
  </p>

[![release](https://img.shields.io/github/actions/workflow/status/mentalblank/hydra/release.yml)](https://github.com/mentalblank/hydra/actions)
[![release](https://img.shields.io/github/package-json/v/mentalblank/hydra)](https://github.com/mentalblank/hydra/releases)
[![chocolatey](https://img.shields.io/chocolatey/v/hydralauncher.svg)](https://community.chocolatey.org/packages/hydralauncher)

![Hydra Launcher Home Page](./docs/screenshot.png)

</div>

## Features

- Add games that you own to your library
- Track your achievements and play stats locally on a dedicated Achievements & Stats page
- Back up your save games locally
- Unlock achievements
- Navigate through a rich catalogue with a powerful suggestion algorithm
- Discover new games that you haven't played before

## Fork differences

This fork runs fully **local-only** — no account, login, or remote profile is required:

- **No accounts/login** — a local profile is created automatically and stored on your machine.
- **No cloud sync** — save backups stay on disk (Ludusavi); no S3 uploads or subscriptions.
- **No social** — friends, presence, chat, reviews, and user comments are removed.
- **No telemetry** — Sentry crash reporting and third-party SDKs are stripped.
- **Catalogue retained** — game search, suggestions, and repacks still use the central Hydra API.

## Build from source and contributing

Please, refer to our Documentation pages: [docs.hydralauncher.gg](https://docs.hydralauncher.gg/getting-started)

### Local development requirements

- Node.js + Yarn
- Python 3.9+ with `pip install -r requirements.txt`
- Rust toolchain (for `hydra-native`)

After installing dependencies, `postinstall` now builds the Rust native addon automatically (`hydra-native/hydra-native.node`).

Packaging scripts (`yarn build:win`, `yarn build:mac`, `yarn build:linux`, `yarn build:unpack`) now run `yarn build:python-rpc` automatically.

## License

Hydra is licensed under the [MIT License](LICENSE).
