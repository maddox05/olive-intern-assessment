Tables / Schema

Firstly the quiz creator will select the type of quiz: score, card, or tags

Score where each answer gives a score and it gets total for a final results shown to the user

Each option has a score rating and in results, they will get attached some outcome based on their score. Score component shows a score, card shows a cool little badge the user would want to share, and a tag is similar to score/badge where the user gets assigned a type based on their answers (tags in options), allowing a developer later down the line to use this outcome to personalize an experience. The result screen for tags will simply be what tags the user attained and how many 1x 2x 3x etc

Quiz
id|type|text|desc

Question (many questions to one quiz) (questions will be ordered in quiz by created at time)
id|quiz_id|text|type (multiple choice/slider/ select multiple)

Option (many options to one question)
id|question_id|text|score|tags (string arr) (if slider, one option should exist, with score being the sliders Max and 0 being the min.)

Results (many results to one quiz)
id|quiz_id|title_text|desc|cta_text|cta_url|range (array of 2 nums ex[0,5])

Storing results table

session
id|start_time|end_time|quiz_id

questions_answered (many questions_answered to one session)
id|session_id|question_id|option_chosen_id|answered_at (we can use this data to see what result then the user got.)

result_screen_clicked
id|session_id|.......

Each table above should have also a created_at (default now) and updated_at so we can track very well these creations asnd edit (your edit func will need to update these)

Actual taking of the quiz (user view)

Each quiz will have an id and can be taken on page /quiz/:id

A user can go on the quiz click start then it starts asking questions, their is a progress indication (bar that gets filled in)
Answers must get stored as a user goes so we can see when and where they drop.
At the end, depending on quiz type we will show a end screen (separate 3 components again depending on quiz type)

The 3 components for the end screen will match the quiz type choices

Thier will also be 3 diff component for the option types (slider etc)

Their will also be component for start screen

Data storage and results (admin view)
On the main page we see a list of quizzes and at the top some gerneral stats

- total quizzes created
- total quizzes taken
- completion rate of quizzes
- quiz with highest incompletion rate (warning label so user can go and edit it.) TODO COME BACK TO THIS

If clicking on a quiz in list of quizzes, if clicking one we go in and see a funnel like flow, seeing where they dropped off, we can also see numbers like average time to complete, average outcome / score
Also the admin can see

- How many people started the quiz
- How many completed it
- Distribution of results (how many got each outcome)
- Individual responses if needed
- which users with certain tags drop off the most?
  If wanted we can select an individual session then all data will only be about that sessions (averages will just be about this one so would look odd)

Overall I want to get things like what question is the user dropping off what's the text, what's the type, what's the quiz type

Track average time spent per question (Do this by looking at created_at time between questions in order (ordered by created at always)) while their are edge cases think of 3rd and 4th question. 3rd gets created_at in questions answers and user goes to 4th and then gets created at, so the time spent on question 4 was 4_created_at - 3_created_at
Track answer distribution for every question so admin can see which options users pick most and whether some answers are never selected.
Track quiz performance by device type and traffic source, what device, what browser
Track click rate on final CTA result screen and show

quiz creation & edit view (admin view)
This will be on the same admin page as above, at the start of list of quizzes we can create one, if create one a prompmbox appears, user prompts and quiz completed, on complete we are taken to quiz edit page. (user can also get to quiz edit page on list of quizzes, where user on the quiz card can choose stats or edit)

On the edit page user will have the ability to edit the json directly and on the edit page it should explain the schema and how to edit it correctly (especially with question types and options and results.)
They will also have another prompt box where they can use the ai to edit the quiz

- as a note to the editor please let them know for editing, editing would mean I need to take snapshots as depending on how you store data you may be looking at old answer for a edited question. We don't take snapshots so be careful when editing. Or make a new quiz.

Once the quiz is created, the url is retuned to the creator, and the url can be seen on the stats page as well for ease of going to it (ill talk about routing later)

Admin page looks:
At the top are some overall stats I mentioned above
Then a list of quizzes, first one is a plus card rest are quizzes that are created.

extras:
The ai used with be anthropic with zod. Structured output mode means it MUST return the correct output.
You'll have 2 functions for the ai, creation and editing
If the ai fails, notify the user using alert (js)
For these 2 creation and editing functions they should verify things like, this question has no options (fail) -> results range doesn't cover all scores -> fail

Create 3 cool badges that are gold and have a olive on them for random selection (svgs) (will be done by another ai)

You'll want to create a quiz tables to json and json to quiz tables functions that take the ai json to the correct rows in the correct tables and vice versa for ease of use.

- other functions will of course be needed. Abstract where needed.

we will want 3 different data displays when looking at the quizzes for the 3 types, they will share components however. we will look more into this after your first run.

colors:

Background 255 255 255
Accent 244 250 245
Another accent 232 244 234
Darker background 47 93 53
Another darker still kinda light background 253 250 231

TODO take olive onboarding ss

Statings of my own: (not for ai)

I feel like a onboarding that learns itself could 100% be its own company.
Talk about why I choose what I did for ordering
