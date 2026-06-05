const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function getCommandOutput(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch (error) {
    return "";
  }
}

function main() {
  // 1. Get current tag name from args or env (fall back to git tags)
  let currentTag = process.argv[2] || process.env.GITHUB_REF_NAME;
  if (!currentTag) {
    currentTag = getCommandOutput("git describe --tags --abbrev=0");
  }
  if (!currentTag) {
    console.error("Error: Could not determine current tag.");
    process.exit(1);
  }

  // 2. Get repository name from env or git remote
  let repoName = process.env.GITHUB_REPOSITORY;
  if (!repoName) {
    const remoteUrl = getCommandOutput("git remote get-url origin");
    const match = remoteUrl.match(/github\.com[/:]([^/]+\/[^/.]+)/);
    repoName = match ? match[1] : "mentalblank/orthrus";
  }
  // Sanitize repoName in case of trailing .git
  if (repoName.endsWith(".git")) {
    repoName = repoName.slice(0, -4);
  }

  // 3. Find the previous tag to get the commit range
  // Pick the version tag immediately preceding the current one so the range is
  // strictly current..previous (ignores non-version tags and other lineages).
  let prevTag = null;
  const versionTags = getCommandOutput(
    'git tag --list "v*" --sort=-version:refname'
  )
    .split(/\r?\n/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  const currentIndex = versionTags.indexOf(currentTag);
  if (currentIndex !== -1 && currentIndex + 1 < versionTags.length) {
    prevTag = versionTags[currentIndex + 1];
  } else {
    // Fall back to the nearest version tag reachable from the parent commit.
    const describePrev = getCommandOutput(
      `git describe --tags --abbrev=0 --match "v*" "${currentTag}^"`
    );
    if (describePrev) prevTag = describePrev;
  }

  // 4. Retrieve commits strictly within the previous..current range
  let gitLogCmd = `git log "${currentTag}" --pretty=format:%s`;
  if (prevTag) {
    gitLogCmd = `git log "${prevTag}..${currentTag}" --pretty=format:%s`;
  }

  const logOutput = getCommandOutput(gitLogCmd);
  const lines = logOutput.split(/\r?\n/);

  const formattedCommits = [];
  const conventionalCommitRegex = /^([a-zA-Z0-9_-]+(?:\([^)]+\))?:)\s*(.*)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^merge /i.test(trimmed)) continue; // ignore merge commits

    const match = trimmed.match(conventionalCommitRegex);
    if (match) {
      formattedCommits.push(` - **${match[1]}** ${match[2]}`);
    } else {
      formattedCommits.push(` - ${trimmed}`);
    }
  }

  // 5. Construct the release notes content
  const changelogLink = prevTag
    ? `[Full Changelog: ${prevTag}...${currentTag}](https://github.com/${repoName}/compare/${prevTag}...${currentTag})`
    : `[https://github.com/${repoName}/commits/${currentTag}](https://github.com/${repoName}/commits/${currentTag})`;

  const notes = [
    "## Full Changelog:",
    ...formattedCommits,
    "",
    changelogLink
  ].join("\n");

  console.log("--- Generated Release Notes ---");
  console.log(notes);
  console.log("-------------------------------");

  // 6. Write to output file if provided
  const outputPath = process.argv[3];
  if (outputPath) {
    const resolvedPath = path.resolve(outputPath);
    fs.writeFileSync(resolvedPath, notes, "utf8");
    console.log(`Release notes written to ${resolvedPath}`);
  }
}

main();
