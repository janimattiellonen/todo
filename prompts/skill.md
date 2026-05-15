# Skill

Help me create a skill that allows me to progressively create a quality project plan with an initial prompt.

Example initial prompt:

""""
TODO web app aimed for one-person / small team businesses with an easy to use Kanban board styled UI that allows the user to quickly create, edit, delete and move tasks on the board. The columns must be configurable with the possibility to add new ones.

The web app must be able to send notifications initially by e-mail but maybe using other external services / APIs as well.

Initially the web app doesn't need a very sophisticated sign in; a simple e-mail magic link works nicely.

Users should be able to be invited by e-mail.

A very simple user management admin tool is need so that new users may be created with ease. A very rudimentary user data is needed at the moment:
- first name
- last name
- e-mail address
- role (user or admin)

""""

The initial prompt may be very vague or very detailed. Using the prompt as a starting point, the skill should start by analyzing the initial project plan and identify possible issues and gaps in the plan and help the user to progressively update the plan with more details. The new skill should use the existing "/grill-me" skill to ask questions until the user's and Claude's ideas are aligned or if the user has had enough questions at that point. 

When asking questions, be honest and don't "suck up", but understand that the initial prompt may intentionallt by short; the user may expect you to provide him with a first version that has a solid structure that the user can continue improving with or without Claude.

During the "/grill-me" session, you should follow all requested features and document possible issues, errors and places for improvements. Don't assume anything. Ask relevant questions that answers things that you find uncertain.

A project plan generally contains certain parts. Create a project plan template that will be used as a base for the project plan returned to the user. 

After the "/grill-me" session, we should have a project plan with a non-technical plan that provides a solid foundation for the next phases (technical specs, implementation etc).


