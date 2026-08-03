---
title: 'docs:gen prints non-fatal parser stack traces'
severity: 'minor'
---

## Check existing issues

- [x] I checked there isn't [already an issue](https://github.com/wevm/ox/issues) for the bug I encountered.

## Ox Version

Current main branch.

## Current Behavior

Running `pnpm docs:gen` succeeds but prints repeated `Encountered error while parsing expression` stack traces for known complex type expressions.

## Expected Behavior

Known unsupported expressions should be summarized without full stack traces so real documentation failures remain visible.

## Steps To Reproduce

Run `pnpm docs:gen`.

## Link to Minimal Reproducible Example

Not applicable.

## Anything else?

The command exits successfully despite the diagnostics.
