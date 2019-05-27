FROM node:10-alpine

LABEL "name"="stylelint-action"
LABEL "version"="1.0.0"

# Labels for GitHub to read the action
LABEL "com.github.actions.name"="Stylelint action with annotations"
LABEL "com.github.actions.description"="An action that runs Stylelint and creates annotations for errors and warnings"
LABEL "com.github.actions.icon"="award"
LABEL "com.github.actions.color"="green"

# Labels for GitHub to publish the action
LABEL "repository"="https://github.com/xt0rted/stylelint-action"
LABEL "homepage"="https://github.com/xt0rted/stylelint-action"
LABEL "maintainer"="Brian Surowiec"

# Copy the action's code
COPY *.js /
COPY entrypoint.sh /entrypoint.sh

# Set execute permissions
RUN chmod +x /entrypoint.sh

# Run `entrypoint.sh`
ENTRYPOINT ["/entrypoint.sh"]
