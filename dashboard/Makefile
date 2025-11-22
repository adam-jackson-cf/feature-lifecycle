.PHONY: help lint typecheck test-unit test-integration-fast quality-gates

# Default target
.DEFAULT_GOAL := quality-gates

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

lint: ## Run linting checks
	@echo "$(YELLOW)Running linting checks...$(NC)"
	@bun run lint
	@echo "$(GREEN)✓ Linting passed$(NC)"

typecheck: ## Run TypeScript type checking
	@echo "$(YELLOW)Running TypeScript type checking...$(NC)"
	@bun run typecheck
	@echo "$(GREEN)✓ Type checking passed$(NC)"

test-unit: ## Run unit tests
	@echo "$(YELLOW)Running unit tests...$(NC)"
	@bun run test:unit
	@echo "$(GREEN)✓ Unit tests passed$(NC)"

test-integration-fast: ## Run integration tests (excluding slow tests)
	@echo "$(YELLOW)Running fast integration tests...$(NC)"
	# Note: When slow tests are added, mark them with .skip() or use --testNamePattern to exclude
	# Example: --testNamePattern="^(?!.*slow).*" to exclude tests with "slow" in the name
	@bun run test:integration -- --reporter=verbose
	@echo "$(GREEN)✓ Fast integration tests passed$(NC)"

quality-gates: lint typecheck test-unit test-integration-fast ## Run all quality gates (lint, typecheck, unit tests, fast integration tests)
	@echo ""
	@echo "$(GREEN)========================================$(NC)"
	@echo "$(GREEN)  All quality gates passed! ✓$(NC)"
	@echo "$(GREEN)========================================$(NC)"

