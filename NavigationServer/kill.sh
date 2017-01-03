#!/bin/bash

echo "Killing All Processes with 'meteor' in name"

# Alternate method killing process by PID saved in file
#
#if [ ! -f "meteor_save_pid.txt" ]; then
#    echo "Err: gada/meteor_save_pid.txt not found"
#    exit
#fi

#kill -9 `cat ./gada/meteor_save_pid.txt`

pkill -f node
