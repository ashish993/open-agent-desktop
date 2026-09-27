ARG BASE_IMAGE=ghcr.io/open-agent-desktop/openagentdesktop:latest
FROM ${BASE_IMAGE}
USER root
ARG ENGINES="@anthropic-ai/claude-code @openai/codex"
RUN if [ -n "$ENGINES" ]; then npm install -g $ENGINES; fi
USER maus
