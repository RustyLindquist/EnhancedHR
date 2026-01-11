#!/bin/bash

# System Validation Hooks for EnhancedHR.ai Agent System
# Run these checks to validate system integrity

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo "=== EnhancedHR Agent System Validation ==="
echo ""

# Check 1: SKILL.md files are under 500 lines
echo "Checking SKILL.md file sizes..."
for skill in .claude/skills/*/SKILL.md; do
    if [ -f "$skill" ]; then
        lines=$(wc -l < "$skill")
        if [ "$lines" -gt 500 ]; then
            echo -e "${RED}ERROR:${NC} $skill has $lines lines (max 500)"
            ERRORS=$((ERRORS + 1))
        elif [ "$lines" -gt 400 ]; then
            echo -e "${YELLOW}WARNING:${NC} $skill has $lines lines (approaching limit)"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
done
echo ""

# Check 2: All agents have safety rules reference
echo "Checking agent safety rules references..."
for agent in .claude/agents/*-agent.md; do
    if [ -f "$agent" ]; then
        if ! grep -q "SAFETY_RULES.md" "$agent"; then
            echo -e "${RED}ERROR:${NC} $agent missing SAFETY_RULES.md reference"
            ERRORS=$((ERRORS + 1))
        fi
    fi
done
echo ""

# Check 3: FEATURE_INDEX.md exists and has content
echo "Checking FEATURE_INDEX.md..."
if [ ! -f "docs/features/FEATURE_INDEX.md" ]; then
    echo -e "${RED}ERROR:${NC} docs/features/FEATURE_INDEX.md not found"
    ERRORS=$((ERRORS + 1))
else
    feature_count=$(grep -c "^\|" docs/features/FEATURE_INDEX.md || true)
    if [ "$feature_count" -lt 5 ]; then
        echo -e "${YELLOW}WARNING:${NC} FEATURE_INDEX.md has only $feature_count entries"
        WARNINGS=$((WARNINGS + 1))
    fi
fi
echo ""

# Check 4: .context directory structure exists
echo "Checking .context directory structure..."
required_dirs=(".context" ".context/optimizations" ".context/checkpoints" ".context/agents")
for dir in "${required_dirs[@]}"; do
    if [ ! -d "$dir" ]; then
        echo -e "${RED}ERROR:${NC} Required directory missing: $dir"
        ERRORS=$((ERRORS + 1))
    fi
done

required_files=(".context/handoff.md" ".context/optimizations/pending.yaml")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}WARNING:${NC} Context file missing: $file"
        WARNINGS=$((WARNINGS + 1))
    fi
done
echo ""

# Check 5: CLAUDE.md is reasonably sized (should be minimal now)
echo "Checking CLAUDE.md size..."
if [ -f "CLAUDE.md" ]; then
    claude_lines=$(wc -l < "CLAUDE.md")
    if [ "$claude_lines" -gt 300 ]; then
        echo -e "${YELLOW}WARNING:${NC} CLAUDE.md has $claude_lines lines (target: <200 for minimal version)"
        WARNINGS=$((WARNINGS + 1))
    fi
fi
echo ""

# Check 6: All spawn commands have cost indicators
echo "Checking spawn command cost indicators..."
for cmd in .claude/commands/spawn-*.md; do
    if [ -f "$cmd" ]; then
        if ! grep -qi "cost" "$cmd"; then
            echo -e "${YELLOW}WARNING:${NC} $cmd missing cost indicator"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
done
echo ""

# Check 7: No forbidden patterns in agent files (outside safety warnings)
echo "Checking for forbidden patterns..."
forbidden_patterns=("supabase db reset" "DROP TABLE" "docker volume rm")
for pattern in "${forbidden_patterns[@]}"; do
    # Should be in safety docs or with NEVER/FORBIDDEN warning - exclude those
    matches=$(grep -ri "$pattern" .claude/agents/ 2>/dev/null | grep -v "SAFETY_RULES.md" | grep -v "AGENT_PROTOCOL.md" | grep -vi "never" | grep -vi "forbidden" | grep -vi "do not" | grep -v "TEMPLATE" || true)
    if [ -n "$matches" ]; then
        echo -e "${YELLOW}WARNING:${NC} Found '$pattern' outside safety context"
        echo "$matches"
        WARNINGS=$((WARNINGS + 1))
    fi
done
echo ""

# Summary
echo "=== Validation Summary ==="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}All checks passed!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}Passed with $WARNINGS warning(s)${NC}"
    exit 0
else
    echo -e "${RED}$ERRORS error(s), $WARNINGS warning(s)${NC}"
    exit 1
fi
