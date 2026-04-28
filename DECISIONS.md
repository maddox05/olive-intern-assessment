# DECISIONS.md

A short log of the product and technical decisions you made while building Text-to-Quiz. Keep it honest — tradeoffs and "I'd do this differently with more time" are as valuable as wins.

Overall: I went for speed and simplicity.

---

## Quiz spec schema

<!-- What shape does a generated quiz take? Why those fields? What did you deliberately leave out? -->

A quiz is output as json, then translated to supabase tables (4 tables, quiz , questions in the quiz, options in the question, results in the quiz)
thier are 3 quiz types, I went with Card Quiz, Scoring Quiz, and Tags Quiz.
these allow for pretty abstracted results, without the quiz json being to abstract where the ai makes mistakes consitently
it allows for results based on tags and a score, where tags define user traits, and a score defines some sort of rating, which im assuiming all quizzes have

Build me a quiz that helps someone figure out if they're eating too much ultra-processed food. -> "UPF eater vs crunchy mom" scoring with tags like "Shelf Aware" "newbie" "momma bear"

Fun 5-question quiz: 'What kind of eater are you?' with silly personality-style answers. -> again a scoring scale similar to "UPF eater vs crunchy mom" with tags similar to above

- where for this one above the score determines the card they recieve (Food Color Lover -> On A Path To Food Freedom -> Momma Bear Crunchy mom)

Im not sure if their is an exact item i left out here, but I think the shortfalling here is it isnt abtracted enough that meaning you want a generalized onboarding creator that can adapt to the user, and while this is adaptable, that is only when we add new quiz types for example. but that is a tradeoff I took and listed at the end!

## LLM choice

<!-- Which provider and model did you use? Why? Cost-per-quiz estimate? -->

I went with anthropic as im familiar, and you all use claude code (my assumption is you guys use anthropic).(although it makes switching harder as they dont fully support openai api).

I went with sonnet 4.6 as it's cheaper than the thinking models, and in my usage of it, it has been super great for daily tasks, and sticks to the schema and makes genuinely good quizzes.

see cost per quiz estimate in the cost section

## Question type vocabulary

<!-- Which question types does your system support? Which did you skip and why? -->

I went with slider, MCQ, select multiple and yes/no and did not do free text or image based
my schema has scores and tags only each question has a score it gives and tags it gives you.
while free text would be pretty easily to implement with my system (user writes text and ai takes that into a score/tags) I have not added it due to time, but this is something that would be an easy additon
for image based, given I have some freedom with what to add, I think its cool in theory, but most people wouldnt be at a place to take images of what food they eat for example. and again i have time constraint.

## Scoring & results logic

<!-- How does scoring work? Weighting? Branching? Multiple result dimensions? What's in vs. out of scope? -->

I went for simplicity here, while abstracting a bit, but not too much where the ai gets confused. I went with Card Quiz, Scoring Quiz, and Tags Quiz.
2 Of which use scoring, 1 uses tagging (user is a crunchy mom who also cares about EMF radiation).
questions can be weighted based on the AI choices as scoring is simply a min and maximum.
As a result of my schema results give you a score (quizzez assume a good to bad score rating, UPF eating vs crunchy mom) and tags you with certain traits.
As such whats in scope is only these quiz types and any different types would require simple, but anyhow changes.
You could use the tags to enable or disable certain features or views, and a score to start the user out at a certain location / feature set.

## Edit loop

<!-- After the first generation, how does a user iterate? Full regeneration, spec patching, or direct editing? Why? -->

the admin can iterate the same way the ai can, by editing the schema directly. The admin who i am assuming is sligthly technical gets access to the json and they can edit it directly, while the ai does a costly regeneration, editing what it needs to edit.

I choose these as if the admin has something easy to change, then let them do it without ai, and if they want to change something, lets make it easy for the ai to make such changes (hopefully it doesnt change other parts haha), and also easier for me to develop (a time tradeoff). I am assuming low amounts of edits. spec patching would be the best in my opinion, just most time consuming to develop.

## Prompt reliability

<!-- How do you validate LLM output? Retries? Fallbacks? What happens when it returns garbage? -->

I have the ai fail instantly on a failed zod validation. I use anthropics api which locks pretty well the ai into the schema and when it doesnt it fails
I do this as the only ppeople generating will be others employees, as such id rather make it clear something went wrong, and if it keeps going wrong we can quickly fix it, instead of slowing things down or falling back.
When it returns garbage it fails with a js alert, and the admin can retry.

## Data model

<!-- How are quizzes and responses stored? What does the quiz-creator dashboard actually show? -->

I touched on how quizzes are store a bit at the start

- 4 tables, quiz , questions in the quiz, options in the question, results in the quiz
  responses are store via another 3 tables, first I track sessions as I need to be able to tell if they started and stoped mid way and what time they did that, I also track questions answered as they go, to be able to tell when they drop and to recreate what they answered, and then at the end I created another table for if they clicked the CTA at the end, to track that.

for the quiz creator dashboard,
main thing I assumed the creator would want to see is a funnel. who dropped off and where?
we can also see some other basics as answer distrobution, averages, what tags people collected the most
whats also nice, as the user is taking the quiz they develop tags, so we can see for example which user with a given tag is most likely to stop taking the quiz, or not click the cta for example.

I think funnel is most important, to really see when users drop

final note, users can go back on questions but as I don't use users going back on question data, i have it only look at the lastest answer. this of course could cause issues if for example a user gets to the end then goes all the way back increasing time per question etc.

## Cost

<!-- Approximate $ per generated quiz. Show your math. -->

Model: Sonnet 4.6 — **$3 / MTok input, $15 / MTok output** (no caching).

**Formula**

```
cost = (system_prompt + user_message_or_current_JSON + output_schema) * $3/MTok
     + (generated_parsed_JSON)                                       * $15/MTok
```

**Token estimates** (eyeballed from `lib/ai/prompts.ts` + `lib/ai/schemas.ts`, output is an educated guess for a typical 6-question quiz with 3–4 options and 4 result tiers), i am not off by a factor of 10.

**Create:** 1,650 × $3/MTok + 2,200 × $15/MTok = $0.0050 + $0.0330 ≈ **$0.038 / call**

**Edit:** 3,800 × $3/MTok + 2,300 × $15/MTok = $0.0114 + $0.0345 ≈ **$0.046 / call**

**~4¢ per create, ~5¢ per edit.** Output dominates (~85% of cost)

## What I'd do differently with more time

I would have abstracted the schema more, as the goal is to create this onboarding generator, so we can switch up onboarding all the time and AB test till we find the perfect one, this schema is more locked in, and was done for time purposes, as the more it's abstracted the harder it is for the ai.

free text would be pretty easily to implement with my system (user writes text and ai takes that into a score/tags) I have not added it due to time, but this is something that would be an easy additon

For editing, having ai use spec editing would have been the best (easiest for user, most cost effective, and very good control), but this would have taken the most time to get right, as such I went with a blend of full control and full AI redo.

With more time, I would also and i think this is most important planned each part fully. With AI coding what I like to do is be the artictect, defining main functions components, the flow, everything, for example what exact stat lines I want to see on the graph

- while I did do that, i left some other parts in the air, while I believe the ai did well on these parts, I want to code fast while also understanding the code and making sure its maintainable, which is why I like being the artictect. the ai found a few problems in my plan, which i believe with more time I would have thought of, although sometimes its good of thinking of things I didn't.

Some things the ai did not abstract and did not code well, as a result as of the above.

Badges: i think the badges are lackluster looking and

## From Maddox

here are some extras I think are important

- some things I went a certain way as I dont have a full picture and I feel like the point is to get it done, not that everything is perfect (for example the CTA always goes to the olive home page, or using anthropic api over openai, I could have asked what you guys already use, but dont want y'all to take the time)
