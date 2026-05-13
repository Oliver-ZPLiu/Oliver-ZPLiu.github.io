---
title: "Token Complexity Is Starting to Measure Everything"
collection: blogs
date: 2026-05-13
permalink: /blog/token-complexity-en/
author_profile: false
show_in_blog_index: false
blog_label: "English Edition"
language_label: "English"
translation_hint: "Read the original in"
translation_label: "中文"
translation_url: /blog/token-complexity/
---

In the past, when we tried to judge how difficult something was, we usually looked at time, labor, funding, compute, data volume, and domain expertise.

But in the era of large models and agents, a new unit of judgment is emerging:

> To complete a goal, how many tokens does it really take?

<!--more-->

I call this **Token Complexity**.

I am not the first person to use the phrase. Recent work in the context of Chain-of-Thought compression has already used [token complexity](https://arxiv.org/abs/2503.01141) to describe the minimum number of reasoning tokens required to successfully solve a problem. What I want to do is push the idea one step further: it should not be limited to CoT length, but expanded into a broader lens for understanding task complexity itself.

Here, Token Complexity is not about how much a model talks. It is about how much information must be searched, compressed, reasoned over, validated, and finally turned into a trustworthy conclusion once a goal enters the model's world.

## 1. Why can we talk about Token Complexity now?

Because more and more tasks are being tokenized.

In the past, many difficult tasks happened inside the minds of human experts. Experts read materials, extracted signals, drew on experience, formed judgments, and revised plans. That process mattered enormously, but much of it was implicit. It was hard to record and even harder to measure.

Now things are different.

Large-model and agent systems are unfolding these processes into observable token trajectories: task descriptions, background materials, search results, tool outputs, intermediate reasoning, human feedback, and even final outputs all enter the system in token form.

That means tokens are no longer just a billing unit. They are becoming a new way to record productive activity.

As more tasks are expressed, executed, and verified through model-based systems, we can begin asking:

> Roughly what scale of token consumption is needed for different goals to be completed reliably?

That is the practical foundation for token complexity.

A simple example is academic literature review.

In the past, if a new graduate student wanted to produce a competent survey of a field, we would usually say: this may take weeks or even months. They need to read papers, understand the structure of the problem, compare methods, organize technical routes, and eventually form their own judgment.

Today, however, we can ask the same thing in another language: how many tokens does it take to complete this task well?

This question does not deny the importance of time, labor, or training. It simply offers a new observational frame: once a task enters a model-driven system, part of its complexity may begin to show up as token consumption.

## 2. Tokens are not only text

If tokens referred only to written text, then the imagination space of token complexity would remain narrow.

But today's model systems are no longer purely textual. Through tokenization, images can become visual tokens, video can become spatiotemporal tokens, audio can become acoustic tokens, and robotic actions can become action tokens. Experimental data, sensor signals, and tool feedback can also be transformed into token-like representations inside a model system.

So token complexity should not be understood narrowly as "writing complexity" or "text length."

It is closer to this:

> The complexity of information processing required for a goal to be represented, explored, executed, and verified inside a model system.

This is also why the idea may travel across text, vision, science, engineering, art, and business.

## 3. The most interesting targets are high-value goals

The most interesting use of token complexity is not to measure an ordinary report, a customer-service exchange, or a routine writing task.

The real questions are more like:

> What is the token complexity of writing a truly high-quality field survey?  
> What is the token complexity of publishing in *Nature*, *Science*, or *Cell*?  
> What is the token complexity of proposing a breakthrough on the scale of relativity?  
> What is the token complexity of taking a frontier technology all the way into real industry deployment?  
> What is the token complexity of creating a product direction that changes an industry, or even an era?

The final output of these goals may not be long.

A top-tier paper may end up being only a few thousand words. A decisive experiment design may fit on one page. A genuinely effective technical route may ultimately reduce to a few architectural diagrams and a set of engineering choices. A great product direction may one day be summarized in a single sentence.

And yet the token complexity behind them can be enormous.

Because the hard part is not writing the final result down. The hard part is finding a result that deserves to be written, deserves to be built, and can actually survive verification.

Publishing a top paper is not difficult mainly because writing is hard. It is difficult because one must judge which question is worth attacking, where current work truly stops, whether the evidence is sufficiently new and sufficiently strong, and whether peers can be convinced that the result genuinely matters.

Technology deployment is similar. The hard part is often not reproducing a demo, but judging whether the technology can survive real constraints: is the cost acceptable, is the latency controllable, is the system stable enough, how are edge cases handled, who takes responsibility when something fails, and is the new approach truly better than the old one?

Product work is not about inventing a catchy slogan. A genuinely strong product direction usually emerges only when user demand, technical capability, business model, organizational resources, and market timing all line up at a narrow but powerful point of leverage.

Film, games, and design are similar. They are not just about having a "good idea." They also require style, rhythm, emotion, medium, and audience response to lock into a stable creative chemistry.

So these goals are not complex because their outputs are long. They are complex because behind them lie larger search spaces, stronger verification chains, more realistic external constraints, and denser judgment.

## 4. Human experts may become a dynamic harness

Someone might say: these high-value goals cannot be achieved without human participation, and agents simply are not capable of doing them alone. For now, that judgment is broadly correct. We still cannot measure the token complexity of these goals with precision, and we certainly cannot yet remove human experts from the loop.

But I want to suggest another perspective. From a human-centered view, experts are the ones completing the task. From a model- or agent-centered view, however, the role of the expert may be changing.

Experts are not always the direct executor. In many settings, they may become a **dynamic harness**.

That is: humans intervene at key points to provide goals, constraints, judgment, feedback, and correction.

The same target, organized by an expert around a model, and organized by a non-expert around a model, may consume very different amounts of tokens in practice.

Experts know which background must be preserved and which information can be omitted. They know which conclusions require verification, which errors are most dangerous, when exploration should continue, and when it should stop.

So the better the harness provided by the expert, the fewer detours the model takes, the fewer useless tokens it wastes, and the closer it may get to the theoretical lower bound of the target's token complexity.

Professional competence in the future may therefore be measured not only by:

> I can complete this task myself.

But also by:

> I can enable a model to complete this goal at lower token complexity.

## 5. Observed token cost is not the same as theoretical complexity

The tokens consumed by current systems usually contain two parts:

```text
Observed Token Cost
= Intrinsic Token Complexity
+ System Inefficiency
```

A task being expensive in tokens today does not necessarily mean the task itself is intrinsically hard.

It may simply mean the prompt is unclear, the context is bloated, retrieval is weak, tools are poorly designed, the model keeps trial-and-erroring, or the quality of human feedback is low.

So the real question is not "how many tokens did we spend today?" but rather:

> Under a better model, better tools, better memory, better workflow, and better human harness, what is the minimum effective token budget required to complete this goal?

That is token complexity in the theoretical sense.

Progress in models, tools, memory, and agent harnesses is, at its core, progress toward one thing:

> Let observed token cost move closer and closer to intrinsic token complexity.

## 6. Conclusion

The phrase Token Complexity has not yet settled into a shared consensus, but it points toward a real trend.

As more goals are expressed, explored, executed, and verified through model systems, token consumption will stop being merely a cost question. It will become a judgment scale.

In the future, when we evaluate a system, we cannot ask only:

> Can it complete the task?

We should also ask:

> How many tokens did it use?  
> Which tokens were necessary?  
> Which tokens were waste?  
> How close did it get to the theoretical lower bound?

In the future, when we evaluate a person, we may also care not only whether they can do the task directly, but whether they can construct a better dynamic harness that enables models to reach the target more effectively.

Today, many industry tasks still require human experts to provide goals, constraints, judgment, and correction in real time. But in the future, those harnesses may gradually settle into workflows, validators, reward signals, or agent policies, becoming part of the model system itself. It is not hard to imagine that, during this transition, many individuals will experience the pain of professional value being repriced.

This also implies that the point of human intervention will continue to move upward: from directly executing the task, to designing the harness, and then to defining the goals, values, and boundary conditions.

That is why Token Complexity may become one of the foundational scales of the AI era.

It may help us measure goals, judge systems, and rethink the place of humans in a model-shaped world.

---

*Original essay. Redistribution by permission.*
