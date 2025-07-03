1. Add fixed number of pixel drawn teamwork- profile images (of typical characters in team, with description also added under/to the side) which user can choose and have as avatar.   // Done

2. In user object, - remove: 
- telephone and 
- address variables - theyre not needed. 
Instead add 
- favourite forest animal and 
- favourite sour snack?          //Done

3. Add ability to change password for user? how to do that securely?  //Done

4. When removing friend - make sure all old messages are removed from database as well to optimize database as well/not clank it more than necessary
 - Same goes for all previous reset password tokens (clean up periodically)  //Done

5. Add ability to send 2 selected project idea to friend in friendlist as message - and they can choose to accept or decline?  //Done
    - Also add an event-sending notification to receiving users email (make adding email mandatory on registration?)  //Done

6. Fix mail verification first page after registration - to ensure mail is correct (in case of lost password) // Done (w. workaround!! == add username param to mail link, only way for now..)

******
7. Receive notification mail when there new project idea has entered its inbox on Projektatorn.se? // Should be Done, test
******

8. Fix mail verification when changing mail in user update // Done commented out for now since cant get verification properly work with frontend - locally it works.

9. When sent request to friend request/withdraw appears correct in "All users" list for sending user -
   But for receiving user - user who sent friend request appearing in both "Friend request" and "All users" making it able to send a friend request while have pending request. // Done

10. When clicked "Accept" from friend request the chatlist doesnt become immediately accessible, first after page refresh

11. When selected 2 projects from project-idea-wizard and clicked send make sure notification of "Projects sent!" appears as visual confirmation instead of "Selected Friends" button and after few seconds return to unselected friend again and "Selected Friends" button appear again (not usable until friend select again of course) 

12. When sending project to friend email notification doesnt automatically send

13. In chatcomponent - remove old project-proposal message when it is accepted and stored in project_in_progress //Done

14. Make password requirement stronger  // Done

15. Nice up actual project description sent in mail (tried switching from javamail sender package to mimemessage package instead - supposedly support even further features)

16. Add something to Projects in progress for a project, like what is happening now? 
    - link to github?   // Done
    - link to linkedin? // Done
--------------------------------------------------

17. Friend +
    Chat components are the largest. Try to refactor and break these down into smaller pieces.

18. After started repo on github - able to manually go back to projektatorn and manually add url from github repo there...?

19. After project done/remove button used - use the history endpoint from backend (already present in frontend service now) to save to database. Display in userpage history for viewing like a personal little "history/achievement"-repo.

20. Bug one person changing avatar changes for other in navbar preview even though other value stored to database

21. When pending projects moved to in progress dont get removed from database (its because they generate different id:s becuase theyre in different
    collections in database. Find a fix for this later if feel like it.)