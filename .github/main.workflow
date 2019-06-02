workflow "Push actions" {
  on = "push"
  resolves = [
    "Install dependencies",
    "Run ESLint"
  ]
}

action "Install dependencies" {
  uses = "docker://node:12-alpine"
  runs = "npm ci"
}

action "Run ESLint" {
  uses = "xt0rted/eslint-action@master"
  needs = ["Install dependencies"]
  secrets = ["GITHUB_TOKEN"]
}
