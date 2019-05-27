workflow "Push actions" {
  on = "push"
  resolves = ["Run ESLint"]
}

action "Run ESLint" {
  uses = "gimenete/eslint-action@master"
  secrets = ["GITHUB_TOKEN"]
}
