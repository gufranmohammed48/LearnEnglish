# GitHub Actions workflows (to upload by hand)

The saved GitHub token can't push files into `.github/workflows`, so these are kept here.
To turn them on, open https://github.com/gufranmohammed48/LearnEnglish/upload/main/.github/workflows
and upload both files (or ask Claude to do it with Claude in Chrome).

- `android.yml` builds a debug APK on every push to `main` (download it from the run's Artifacts).
- `ios-check.yml` builds the iPhone app on a cloud Mac when you start it from the Actions tab (no signing).
