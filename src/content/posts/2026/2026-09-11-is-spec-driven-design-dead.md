---
title: "Is Spec-Driven Design Dead?"
date: 2026-09-11
categories:
  - AI
tags:
  - agentic-coding
---

I spend a lot of my time with agentic coding harnesses like [OpenCode].  I was also a big fan of [spec-driven development](/posts/2026/2026-04-07-agentic-engineer-1.html).  Spec-driven design frameworks like [Spec Kit] and [OpenSpec] all share a broad ambition: capture the requirements, turn them into a plan, break the plan into tasks, and let an agent do as much of the implementation as possible.  This framework made sense when coding agents were capable but unreliable, requiring constant reminders to stay on task.  A carefully staged workflow compensated for limited planning and weak content management.

![The evolution of Spec-Driven Design](/assets/images/2026/Sep11-banner.jpg)

The best coding agents today can inspect an unfamiliar repository, ask useful questions, propose an architecture, implement across several files, run tests, diagnose failures, and revise their work.  Current agentic harnesses like [OpenAI Codex], [OpenCode], and [Pi] all do a good job at all this.  Reusable AI skills, such as those collected in [Addy Osmani's agent-skills project][agent-skills], can give an agent structured practices for test-driven development, API design, debugging, security review, and code quality.

If an agent already knows how to plan and build responsibly, do we still need spec-driven development frameworks?

## Better agents reduce the need for process scaffolding

Some of the ceremony associated with early spec-driven development is already becoming unnecessary. A capable agent does not need five separate prompts to discover that it should understand a problem, examine the codebase, plan a change, implement it, and verify the result. Nor does a developer necessarily need to approve a generated specification, a generated plan, a generated task list, and every generated task in sequence.  My current working method starts prompting for a plan.  I expect the agent to work out what needs to be done and generate a plan and phased task list.  I can then tell the agent to build the entire project using sub-agents for each phase.

In that world, spec-driven design workflows can create the appearance of control without delivering any actual value.  It just burns more tokens.  An agent can generate a polished product requirements document from a thin prompt, then derive an equally polished design and task list from its own assumptions. The artifacts agree with one another, but only because they share the same unexamined mistake. More Markdown does not automatically mean more clarity.

Rigid processes also impose the same cost on radically different kinds of work. A small styling correction, a routine dependency update, and a redesign of an authentication system should not pass through identical gates. When the change is obvious, local, well-tested, and easy to reverse, a full specification workflow can cost more than it saves.

## The hard problem is no longer producing code

Code generation is cheap.  Judgement - deciding what the code should and should not do - is not.

An engineering skill can teach an agent to validate input at a system boundary. It cannot decide whether the business is permitted to retain that input. A frontend skill can teach the agent to meet accessibility standards, but it cannot know whether accessibility is a release blocker for this product. A test-driven development skill can insist on writing a failing test first, but it cannot determine which behavior represents the correct business outcome.

Those are questions of intent, policy, and judgment. They depend on information that may not exist in the repository and should not be guessed from common practice. The more independently an agent can work, the more important it becomes to state those decisions clearly.

This is why agent skills and spec-driven development are complements rather than substitutes. Skills describe how the agent should work: investigate before changing, prefer small vertical slices, write tests, consider security boundaries, measure performance, and verify before claiming success. A specification describes what this particular change is meant to accomplish, why it matters, which trade-offs have been accepted, what must not change, and how we will recognize success.

Tests (and I'm a big fan of test-driven development in the agentic world) provide a third layer. They turn some of that intent into executable evidence. Code is the implementation of the current understanding. None of these layers can fully replace the others.

## Specifications are becoming shared memory

Conversation history is a fragile place to keep a software decision. Context windows end. Agents are switched. Developers join and leave. A feature that began in one repository may require changes in three others. Six months later, the code usually reveals what was implemented, but not why one option was selected over another or which constraint ruled out the apparent alternative.

A checked-in, change-scoped specification solves a different problem from a clever prompt. It becomes shared memory for humans and agents. A new agent can reconstruct the approved intent without replaying an old conversation. A reviewer can compare the implementation with the promised behavior. A team can see which assumptions were deliberate and which questions remain unresolved.

This is where the current generation of spec frameworks is most useful. [Spec Kit] provides a comprehensive lifecycle around project principles, specifications, plans, tasks, analysis, implementation, and convergence. [OpenSpec] takes a lighter, change-oriented approach built around proposals, requirement scenarios, designs, task lists, implementation, and archival. [Kiro] integrates a similar idea more directly into the development environment. Multi-agent systems add coordination and specialized roles.

The important distinction is not which sequence of commands they use. It is whether they create concise, durable, reviewable artifacts that survive beyond one model invocation. Their long-term value lies less in prompting an agent through a workflow and more in managing state across people, agents, sessions, and repositories.

> **Best Practice**
>
> Get your build agent to create a `MEMORY.md` file that you check in with an append-only discussion of
> what was done and why.  Ensure your `AGENTS.md` tells the agent to refer to `MEMORY.md` as the official
> discussion of the "why" when reviewing code.

## Autonomy makes clear intent more valuable

It is tempting to define progress as reducing developer input to zero. That is the wrong objective. We should reduce repeated explanation, mechanical coordination, and routine implementation.  Human judgement is still the necessary part of the process.

An autonomous agent can implement a mistaken assumption faster and more consistently than a human developer. It can propagate that assumption through the database schema, API, user interface, tests, and documentation before anyone notices. Greater implementation capability increases the blast radius of ambiguous requirements.

The right human checkpoints are therefore not every mechanical phase of development. They are decision boundaries: product semantics, security and privacy policy, architectural commitments, compatibility promises, migrations, operational risk, and irreversible actions. Once those decisions are captured, agents should be free to perform most of the translation into designs, tasks, code, tests, and deployment evidence.

## Use proportional ceremony

I have used the same axiom throughout my career: "Reduce ceremony to the minimum required to get the job done."

The strongest version of spec-driven development is adaptive. It does not require every pull request to produce a miniature requirements library. It asks how much uncertainty, coordination, and risk the change contains, then applies enough structure to control it.

For a trivial and reversible change, the specification may be three lines: the intent, the acceptance criteria, and the verification method. For an ordinary feature, it may add the problem, desired outcomes, non-goals, scenarios, and constraints. A change to an API, data model, or system boundary deserves a design proposal that records alternatives, contracts, migration, rollback, security, and observability. High-risk or cross-team work may require traceability, named decision owners, formal approvals, and production success criteria.

The agent can draft nearly all of these artifacts. The human contribution should concentrate on the few details the agent cannot infer safely. This changes specifications from documents people laboriously write for agents into structured conversations that agents help people complete.

It also suggests several practical rules. 

- Keep project-wide principles small and stable. 
- Prefer change-scoped specifications over giant permanent PRDs.
- Express requirements as concrete scenarios wherever possible.
- Generate tests from those scenarios, not from the code.
- Record non-goals so that an ambitious agent knows where to stop.
- Preserve the reasons behind architectural decisions, but keep the current specification concise.
- Continuously reconcile the specification, tests, and implementation.

Specifications are living documents.  Never treat the spec as finished the moment coding begins.

## From development framework to control plane

There is still a place for [Spec Kit], [OpenSpec], [Kiro], and related approaches. That place is simply becoming clearer. For small, obvious, low-risk work, a good issue, a capable agent, the right engineering skills, and solid tests may be enough. For long-lived, consequential, cross-team, or multi-agent work, a durable specification layer is increasingly valuable. It tells autonomous systems what they are optimizing for and gives humans a reviewable record of what they authorized.

Specifications hold intent, skills provide engineering behavior, agents perform the work, tests provide evidence, humans make the decisions that should not be guessed, and guardrails enforce those decisions.

## Final thoughts

Spec-driven development is not dead.  It is evolving.  Decent coding harnesses combined with skills and test-driven development can get you a long way towards effective development methods with AI agents.

My own setup consists of [OpenCode] with my own agent definitions for code review, spec production, combined with a curated set of skills which includes [Addy Osmani's agent-skills project][agent-skills].  You need to be comfortable with your setup, so take the time to test out and curate the agent definitions, skills, and capabilities you need for the way you work.

<!-- Links -->

[Codex]: https://openai.com/codex/
[Pi]: https://pi.dev/
[OpenCode]: https://opencode.ai
[Spec Kit]: https://github.com/github/spec-kit
[OpenSpec]: https://github.com/Fission-AI/OpenSpec
[Kiro]: https://kiro.dev/
[agent-skills]: https://github.com/addyosmani/agent-skills
