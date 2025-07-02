1. Add fixed number of pixel drawn teamwork- profile images (of typical characters in team, with description also added under/to the side) which user can choose and have as avatar.   // Done


2. In user object, - remove: 
- telephone and 
- address variables - theyre not needed. 
Instead add 
- favourite forest animal and 
- favourite sour snack?          //Done


3. Add ability to change password for user? how to do that securely?  //Done

------------------------------------------------------------------------------------

4. When removing friend - make sure all old messages are removed from database as well to optimize database as well/not clank it more than necessary
 - Same goes for all previous reset password tokens (clean up periodically)  //Done



5. Add ability to send 2 selected project idea to friend in friendlist as message - and they can choose to accept or decline?  //Done
    - Also add an event-sending notification to receiving users email (make adding email mandatory on registration?)  //Done 
    - so they receive a notification there when a new project idea has entered its inbox on Projektatorn.se?  //Done

--------------------------------------------------

6. When selected 2 projects from project-idea-wizard and clicked send make sure notification of "Projects sent!" appears as visual confirmation instead of "Selected Friends" button and after 3 seconds return to unselected friend again and "Selected Friends" button appear again (not usable until friend select again of course)

7. Fix mail confirmation first page after registration - to ensure mail is correct (in case of lost password)
    - should also apply when changing mail

8. When sent request to friend request/withdraw appears correct in "All users" list for sending user -
   But for receiving user - user who sent friend request appearing in both "Friend request" and "All users" making it able to send a friend request while have pending request.