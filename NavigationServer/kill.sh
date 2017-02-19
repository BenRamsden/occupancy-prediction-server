#!/bin/bash

ps cax | grep node > /dev/null
if [ $? -eq 0 ]; then
  pkill -f node
  echo "KILL: node was running, killed"
else
  echo "KILL: node is not running."
fi

