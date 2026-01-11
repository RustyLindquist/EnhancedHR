# Checkpoint Index

Checkpoints are saved session states for recovery.

## Naming Convention

```
checkpoint-YYYY-MM-DD-HHMM-[type].md
```

Types:
- `milestone` — After major work completed
- `periodic` — Regular time-based checkpoint
- `pre-risk` — Before attempting uncertain operation
- `quick` — Minimal checkpoint for brief breaks

## Latest Checkpoints

<!-- Updated automatically by /checkpoint -->

No checkpoints yet.

## Recovery

To recover from a checkpoint:

```
/session-start
```

The session-start skill will automatically find and offer the most recent checkpoint.

## Manual Recovery

If automatic recovery fails:

1. List checkpoints: `ls .context/checkpoints/`
2. Read the desired checkpoint
3. Follow the "Resume From Here" section
