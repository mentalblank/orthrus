<div align="center">

[<img src="https://raw.githubusercontent.com/mentalblank/hydra/refs/heads/main/resources/icon.png" width="144"/>](https://github.com/mentalblank/hydra)

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

## Why this fork?

This fork runs fully **local-only**. It keeps everything that makes Hydra useful for managing your library while removing the parts that phone home, so your data stays yours:

- **Privacy first** — no telemetry. Sentry crash reporting and third-party SDKs are stripped, so nothing about how you use the app is sent anywhere.
- **No account required** — a local profile is created automatically and stored on your machine. No login, no JWT, no remote sync.
- **Offline-friendly** — your library, achievements, and play stats live on disk and work without an account.
- **You own your saves** — game save backups are created locally with Ludusavi (and can be exported); no cloud uploads and no subscription paywall.
- **Lighter** — friends, presence, chat, reviews, comments, and cloud features are removed, leaving a leaner app.
- **Catalogue retained** — game search, suggestions, and repacks still use the central Hydra API, so discovery keeps working.

## Build from source and contributing

For environment setup and build steps, the upstream getting-started guide still applies: [docs.hydralauncher.gg](https://docs.hydralauncher.gg/getting-started).

### Local development requirements

- Node.js + Yarn
- Python 3.9+ with `pip install -r requirements.txt`
- Rust toolchain (for `hydra-native`)

After installing dependencies, `postinstall` now builds the Rust native addon automatically (`hydra-native/hydra-native.node`).

Packaging scripts (`yarn build:win`, `yarn build:mac`, `yarn build:linux`, `yarn build:unpack`) now run `yarn build:python-rpc` automatically.

## Acknowledgements

This fork only exists because of the excellent work by the [Hydra Launcher team](https://github.com/hydralauncher/hydra). All credit for the original application, its catalogue, and ongoing development goes to them.

If you enjoy this fork, please consider supporting the upstream project — visit [hydralauncher.gg](https://hydralauncher.gg), star the [original repository](https://github.com/hydralauncher/hydra), and contribute back where you can. A healthy upstream benefits everyone, this fork included, since it continues to power the shared game catalogue.

## License

Hydra is licensed under the [MIT License](LICENSE).
