const stylelint = require("stylelint");
const request = require("./request");

const {
  GITHUB_EVENT_PATH, GITHUB_SHA, GITHUB_TOKEN, GITHUB_WORKSPACE, RUN_DIR,
} = process.env;
const filesToLint = process.argv.slice(2);

const event = require(GITHUB_EVENT_PATH); /* eslint-disable-line import/no-dynamic-require */
const { repository } = event;
const { owner: { login: owner } } = repository;
const { name: repo } = repository;

const checkName = "Stylelint check";

const headers = {
  Accept: "application/vnd.github.antiope-preview+json",
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  "Content-Type": "application/json",
  "User-Agent": "stylelint-action",
};

const levels = {
  error: "failure",
  warning: "warning",
};

// change the working directory if we're not running in the root of the repo
if (RUN_DIR) {
  process.chdir(RUN_DIR);
}

async function createCheck() {
  const body = {
    head_sha: GITHUB_SHA,
    name: checkName,
    started_at: new Date(),
    status: "in_progress",
  };

  const { data } = await request(`https://api.github.com/repos/${owner}/${repo}/check-runs`, {
    body,
    headers,
    method: "POST",
  });

  return data.id;
}

async function runStylelint() {
  const report = await stylelint.lint({
    files: filesToLint,
  });

  const { results } = report;

  const annotations = [];
  let errorCount = 0;
  let warningCount = 0;

  results.forEach((file) => {
    const { source, warnings } = file;

    warnings.forEach((warning) => {
      const {
        severity, rule, line, column, text,
      } = warning;

      severity === "error" ? errorCount++ : warningCount++;

      annotations.push({
        annotation_level: levels[severity],
        end_column: column,
        end_line: line,
        message: `[${rule}] ${text}`,
        path: source.substring(GITHUB_WORKSPACE.length + 1),
        start_column: column,
        start_line: line,
      });
    });
  });

  return {
    conclusion: errorCount ? "failure" : "success",
    output: {
      annotations,
      summary: `${errorCount} error(s), ${warningCount} warning(s) found`,
      title: checkName,
    },
  };
}

async function updateCheck(id, conclusion, output) {
  const body = {
    completed_at: new Date(),
    conclusion,
    head_sha: GITHUB_SHA,
    name: checkName,
    output,
    status: "completed",
  };

  await request(`https://api.github.com/repos/${owner}/${repo}/check-runs/${id}`, {
    body,
    headers,
    method: "PATCH",
  });
}

function exitWithError(err) {
  console.error("Error", err.stack);

  if (err.data) {
    console.error(err.data);
  }

  process.exit(1);
}

async function run() {
  const id = await createCheck();

  try {
    const { conclusion, output } = await runStylelint();
    console.info(output.summary);

    await updateCheck(id, conclusion, output);

    if (conclusion === "failure") {
      process.exit(78);
    }
  } catch (err) {
    await updateCheck(id, "failure");

    exitWithError(err);
  }
}

run().catch(exitWithError);
