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


7. When selected 2 projects from project-idea-wizard and clicked send make sure notification of "Projects sent!" appears as visual confirmation instead of "Selected Friends" button and after few seconds return to unselected friend again and "Selected Friends" button appear again (not usable until friend select again of course) 
- //Done for receiver/friend
--------------------------------------------------
8. But not for sender/owner still doesnt work
9. Fix mail verification when changing mail in user update (untested yet)
10. When sent request to friend request/withdraw appears correct in "All users" list for sending user -
   But for receiving user - user who sent friend request appearing in both "Friend request" and "All users" making it able to send a friend request while have pending request.
11. Receive notification mail when there new project idea has entered its inbox on Projektatorn.se? // Done in backend but not front