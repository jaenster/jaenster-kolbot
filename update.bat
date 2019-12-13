@echo off
REM -- Store your changes
git stash push -m Updating

REM -- Just simply loading the stuff online
git pull
git fetch origin
git rebase origin/master

REM -- put your changes back
git stash pop
pause