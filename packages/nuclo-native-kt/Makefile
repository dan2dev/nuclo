# make run                             pick an example and a target from a menu
# make <target> [EXAMPLE=counter]      build and open an example
# make test-<target> [EXAMPLE=all]     run the scripted test(s) for a target
# make list                            list examples
# targets: web android ios macos linux windows headless (headless: test only)
EXAMPLE ?= counter
TARGETS := web android ios macos linux windows

SHELL := bash

.PHONY: help list unit run $(TARGETS) $(addprefix test-,$(TARGETS) headless)

help:
	@sed -n '1,5p' Makefile | sed 's/^# //'

list:
	@ls examples

run:
	@PS3='Example: '; select e in $$(ls examples); do [ -n "$$e" ] && break; done; \
	PS3='Target: '; select t in $(TARGETS); do [ -n "$$t" ] && break; done; \
	scripts/run.sh $$t $$e

unit:
	./gradlew -q :nuclo:macosArm64Test

$(TARGETS):
	scripts/run.sh $@ $(EXAMPLE)

$(addprefix test-,$(TARGETS) headless):
	scripts/test.sh $(@:test-%=%) $(if $(filter command line,$(origin EXAMPLE)),$(EXAMPLE),all)
