Snooze
======

Snooze is a periodic todo handler. This differs from a regular todo handler
like *Reminders* in that items are never really completed. Instead, when an
items is created an interval is set (every month, every two weeks, ...) and
when an item is completed it is scheduled for completion again one interval
into the future.

This is also different from a common repeating todo item where you specify that
you want a reminder at 9 am every tuesday, for example. *Snooze* doesn't care
about when or what day of the week an item is completed, only how long it was
since last time. Every time an item is completed, it's pushed forward by the
set interval.

Upon starting *Snooze* you're presented with an ordered list of items, with due
items at the top and items that are due further in the future further and
further down. If you want to get ahead of your schedule, you can complete the
items that aren't really due yet as well.

Use cases
---------

Anything that you want done on a repeating schedule with a certain amount of
flexibility. For example;

 - Watering the flowers. Should be done roughly every week, but doesn't need to
   be done a specific time or day of the week.

 - Go running, do push-ups, practice with the punching bag, ... Any physical
   activity you might want a periodic reminder for.

 - Anything you might want to rehearse periodically. This could apply to
   martial arts for example, where you might have any number of routines that
   should be rehearsed every month, say.

Environment
-----------

*Snooze* is a HTML5 web app that uses HTML5 local storage to store your items
and the application cache to enable off line usage. This means it'll run just
fine in any modern browser. However it's optimized for smart phone form factor
and looks quite crappy on a desktop browser at fill width. It looks gorgeous on
an iPhone or Android device though.

