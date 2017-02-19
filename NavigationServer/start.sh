#!/bin/bash

#nohup DEBUG=navigationserver:* npm start > navigationserver_nohup.log 2>&1&

ps cax | grep node > /dev/null
if [ $? -eq 0 ]; then
  echo "START: ERROR node process already running."
  exit 0
fi

echo "START: npm start called with nohup"
nohup npm start > navigationserver_nohup.log 2>&1&
