#!/bin/bash

ps cax | grep node > /dev/null
if [ $? -eq 0 ]; then
  echo "CHECK: Process is running."
  ps cax | grep node
else
  echo "Process is not running."
fi
