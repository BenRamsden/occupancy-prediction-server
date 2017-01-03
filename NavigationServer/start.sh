#!/bin/bash

echo "###"
echo "NavigationServer now running as background process"
echo "Use ./log.sh for up to date status on its activity"
echo "Use ./kill.sh to stop meteor running"
echo "Use ./check.sh to check if process is killed"
echo "###"

#nohup DEBUG=navigationserver:* npm start > navigationserver_nohup.log 2>&1&

nohup npm start > navigationserver_nohup.log 2>&1&
