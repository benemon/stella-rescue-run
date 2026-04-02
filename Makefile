# Makefile for Stella's Rescue Run

.PHONY: help dev build run deploy clean fonts

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

dev: ## Run local development server
	@echo "Starting development server on http://localhost:8080"
	cd app && python3 -m http.server 8080

fonts: ## Instructions for downloading fonts
	@echo "Download fonts from https://gwfh.mranftl.com/fonts"
	@echo ""
	@echo "Required fonts:"
	@echo "  - Baloo 2 (Regular/400)"
	@echo "  - Nunito (Regular/400)"
	@echo ""
	@echo "Download as .woff2 and save to app/assets/fonts/"
	@echo ""
	@echo "Expected files:"
	@echo "  - app/assets/fonts/baloo-2-v23-latin-regular.woff2 (version may vary)"
	@echo "  - app/assets/fonts/nunito-v32-latin-regular.woff2 (version may vary)"
	@echo ""
	@echo "See FONTS.md for detailed instructions"

build: ## Build container image
	podman build -t stella-rescue:latest -f Containerfile .

run: ## Run container locally
	podman run -p 8080:8080 stella-rescue:latest

deploy: ## Deploy to OpenShift (requires oc CLI)
	@echo "Applying Kubernetes manifests..."
	oc apply -f k8s/deployment.yaml
	oc apply -f k8s/service.yaml
	oc apply -f k8s/route.yaml
	@echo ""
	@echo "Getting route URL..."
	oc get route stella-rescue

clean: ## Remove build artifacts
	@echo "Cleaning up..."
	rm -f *.tar

test: ## Run a quick syntax check
	@echo "Checking JavaScript syntax..."
	@for file in app/js/*.js app/sw.js; do \
		node --check $$file 2>/dev/null && echo "✓ $$file" || echo "✗ $$file"; \
	done
